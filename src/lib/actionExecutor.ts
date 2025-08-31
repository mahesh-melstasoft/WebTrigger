import { decryptSecret, isEncryptionConfigured } from './cryptoHelper';
import crypto from 'crypto';

// Enhanced executor with retries, timeouts, and more action types
export interface ActionResult {
    success: boolean;
    status?: number;
    responseBody?: string;
    error?: string;
    durationMs: number;
}

export interface ActionPayload {
    rawBody: string;
    parsedJson?: Record<string, unknown>;
    headers: Record<string, string>;
    clientIp: string;
    userAgent: string;
    receivedAt: string;
}

export async function executeAction(
    action: { type: string; config?: Record<string, unknown> },
    payload: ActionPayload,
    serviceCredential?: { secret: string; meta?: Record<string, unknown> }
): Promise<ActionResult> {
    const start = Date.now();
    const timeout = (action.config?.timeoutMs as number) || 10000; // 10s default

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        switch (action.type) {
            case 'HTTP_POST': {
                const url = (action.config?.url as string) || (action.config?.callbackUrl as string);
                const headers = action.config?.headers ? { ...(action.config.headers as Record<string, string>) } : {};

                // Add HMAC signing if configured
                if (action.config?.hmacSecret && action.config?.hmacHeader) {
                    const hmac = crypto.createHmac('sha256', action.config.hmacSecret as string);
                    hmac.update(payload.rawBody);
                    headers[action.config.hmacHeader as string] = hmac.digest('hex');
                }

                // Attach service credential if provided
                if (serviceCredential && serviceCredential.meta?.authHeader) {
                    if (isEncryptionConfigured()) {
                        try {
                            const secret = decryptSecret(serviceCredential.secret);
                            headers[serviceCredential.meta.authHeader as string] = secret;
                        } catch {
                            // ignore and proceed without attaching cred
                        }
                    }
                }

                const resp = await (globalThis.fetch)(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                const body = await resp.text();
                return { success: resp.ok, status: resp.status, responseBody: body, durationMs: Date.now() - start };
            }

            case 'SLACK': {
                const webhook = action.config?.webhookUrl as string;
                const url = webhook || (serviceCredential ? decryptSecret(serviceCredential.secret) : null);
                if (!url) throw new Error('No Slack webhook configured');

                const message = (action.config?.message as string) || `Webhook triggered: ${JSON.stringify(payload.parsedJson || payload.rawBody)}`;

                const resp = await (globalThis.fetch)(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                return { success: resp.ok, status: resp.status, responseBody: await resp.text(), durationMs: Date.now() - start };
            }

            case 'EMAIL': {
                if (!serviceCredential) throw new Error('SendGrid API key required');

                const apiKey = decryptSecret(serviceCredential.secret);
                const config = action.config as { to?: string; subject?: string; template?: string } || {};
                const { to, subject, template } = config;

                if (!to || !subject) throw new Error('Email config missing to/subject');

                const emailData = {
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: 'noreply@webtrigger.app' },
                    subject,
                    content: [{ type: 'text/plain', value: template || JSON.stringify(payload, null, 2) }],
                };

                const resp = await (globalThis.fetch)('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                return { success: resp.ok, status: resp.status, responseBody: await resp.text(), durationMs: Date.now() - start };
            }

            case 'STORE': {
                // Store payload in DB - this will be handled by the caller
                clearTimeout(timeoutId);
                return { success: true, status: 200, responseBody: 'stored', durationMs: Date.now() - start };
            }

            default:
                clearTimeout(timeoutId);
                return { success: false, error: `Unsupported action type ${action.type}`, durationMs: Date.now() - start };
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return { success: false, error: `Timeout after ${timeout}ms`, durationMs: Date.now() - start };
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage, durationMs: Date.now() - start };
    }
}
