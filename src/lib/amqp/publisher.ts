import { getGlobalAmqpPool, AmqpClientWrapper, AmqpConnectionStatus } from './client';
// encryptSecret/decryptSecret intentionally imported for future use in credential handling
import { decryptSecret, encryptSecret } from '../cryptoHelper';
import { v4 as uuidv4 } from 'uuid';

/**
 * AMQP Message Format options
 */
export enum MessageFormat {
    JSON = 'json',
    XML = 'xml',
    TEXT = 'text'
}

/**
 * AMQP Publisher Options
 */
export interface AmqpPublishOptions {
    exchange: string;
    routingKey: string;
    messageFormat?: MessageFormat;
    variables?: Record<string, unknown>;
    priority?: number;
    persistent?: boolean;
    contentType?: string;
    messageExpiry?: number; // milliseconds
    credentials?: AmqpCredentials;
    maxRetries?: number;
    retryDelayMs?: number;
}

/**
 * AMQP Credentials
 */
export interface AmqpCredentials {
    username?: string;
    password?: string;
}

/**
 * AMQP Publish Result
 */
export interface AmqpPublishResult {
    success: boolean;
    exchange: string;
    routingKey: string;
    message: string;
    timestamp: number;
    duration: number;
    error?: string;
    retries?: number;
}

/**
 * High-level AMQP Publisher with templating and retry logic
 */
export class AmqpPublisher {
    private client: AmqpClientWrapper | null = null;
    private brokerUrl: string = '';
    private brokerId: string = '';

    /**
     * Initialize publisher with broker connection
     * @param brokerUrl AMQP broker URL (e.g., amqp://user:pass@host:5672)
     * @param options Optional connection options
     */
    async initialize(
        brokerUrl: string,
        _options?: Record<string, unknown>
    ): Promise<void> {
        if (!brokerUrl.startsWith('amqp://') && !brokerUrl.startsWith('amqps://')) {
            throw new Error('Invalid AMQP broker URL. Must start with amqp:// or amqps://');
        }

        this.brokerUrl = brokerUrl;
        this.brokerId = `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // mark crypto helpers as used (no-op) to satisfy lint until they are required
        void decryptSecret;
        void encryptSecret;
        // acknowledge unused _options to satisfy linter when options are intentionally unused
        void _options;

        try {
            const pool = getGlobalAmqpPool();
            this.client = await pool.acquire(this.brokerId, brokerUrl);
        } catch (error) {
            throw new Error(`Failed to initialize AMQP publisher: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Resolve variables in exchange name, routing key, and message template
     * @param template Template string with {variable} placeholders
     * @param variables Variable values
     * @param context Context object (user data, env vars, etc)
     */
    private resolveTemplate(
        template: string,
        variables: Record<string, unknown> = {},
        context: Record<string, unknown> = {}
    ): string {
        let resolved = template;

        // Replace {variable} patterns
        Object.keys(variables).forEach((key) => {
            const value = variables[key];
            const regex = new RegExp(`{${key}}`, 'g');
            resolved = resolved.replace(regex, String(value));
        });

        // Replace {env:VAR} patterns
        resolved = resolved.replace(/{env:([A-Za-z_][A-Za-z0-9_]*)}/g, (match, varName) => {
            return process.env[varName] || '';
        });

        // Replace {context:field} patterns
        resolved = resolved.replace(/{context:([A-Za-z_][A-Za-z0-9_.]*)}/g, (match, path) => {
            const value = path.split('.').reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], context);
            return String(value || '');
        });

        // Replace {timestamp}
        resolved = resolved.replace(/{timestamp}/g, String(Date.now()));

        // Replace {uuid}
        resolved = resolved.replace(/{uuid}/g, () => {
            return uuidv4();
        });

        return resolved;
    }

    /**
     * Format message based on format type
     * @param message Message content
     * @param format Message format (JSON, XML, TEXT)
     */
    private formatMessage(message: unknown, format: MessageFormat = MessageFormat.JSON): string {
        switch (format) {
            case MessageFormat.JSON:
                return typeof message === 'string' ? message : JSON.stringify(message);

            case MessageFormat.XML:
                if (typeof message === 'string') {
                    // Try to parse as JSON and convert to XML
                    try {
                        const obj = JSON.parse(message);
                        return this.jsonToXml(obj);
                    } catch {
                        return message;
                    }
                }
                return this.jsonToXml(message);

            case MessageFormat.TEXT:
                return typeof message === 'string' ? message : JSON.stringify(message);

            default:
                return typeof message === 'string' ? message : JSON.stringify(message);
        }
    }

    /**
     * Convert JSON object to XML string
     */
    private jsonToXml(obj: unknown, rootName: string = 'root'): string {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

        const toXml = (obj: unknown, nodeName: string): string => {
            if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
                return `<${nodeName}>${this.escapeXml(String(obj))}</${nodeName}>`;
            }

            if (Array.isArray(obj)) {
                return obj
                    .map((item) => toXml(item, nodeName.replace(/s$/, ''))) // Singularize
                    .join('');
            }

            if (typeof obj === 'object' && obj !== null) {
                let xml = `<${nodeName}>`;
                Object.keys(obj).forEach((key) => {
                    xml += toXml((obj as Record<string, unknown>)[key], key);
                });
                xml += `</${nodeName}>`;
                return xml;
            }

            return '';
        };

        return `${xmlHeader}${toXml(obj, rootName)}`;
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Publish message to AMQP exchange
     * @param message Message content (string or object)
     * @param options Publish options
     */
    async publish(
        message: string | object,
        options: AmqpPublishOptions
    ): Promise<AmqpPublishResult> {
        if (!this.client || this.client.getStatus() !== AmqpConnectionStatus.CONNECTED) {
            throw new Error('AMQP publisher is not connected');
        }

        const startTime = Date.now();
        const currentMessage = message;
        let retryCount = 0;
        const maxRetries = options.maxRetries || 3;
        const retryDelayMs = options.retryDelayMs || 1000;

        // Resolve exchange name and routing key with variables
        const resolvedExchange = this.resolveTemplate(
            options.exchange,
            options.variables,
            {}
        );
        const resolvedRoutingKey = this.resolveTemplate(
            options.routingKey,
            options.variables,
            {}
        );

        // Format message
        const formattedMessage = this.formatMessage(currentMessage, options.messageFormat);

        // Retry logic with exponential backoff
        while (retryCount <= maxRetries) {
            try {
                // Declare exchange
                const exchangeType: 'direct' | 'topic' | 'fanout' | 'headers' =
                    options.exchange.includes('fanout')
                        ? 'fanout'
                        : options.exchange.includes('direct')
                            ? 'direct'
                            : 'topic';

                await this.client.declareExchange(resolvedExchange, exchangeType, {
                    durable: true,
                    autoDelete: false,
                });

                // Publish message
                const publishOptions = {
                    persistent: options.persistent !== false,
                    contentType: options.contentType || 'application/json',
                    priority: options.priority || 5,
                    ...(options.messageExpiry && { expiration: String(options.messageExpiry) }),
                };

                await this.client.publish(
                    resolvedExchange,
                    resolvedRoutingKey,
                    formattedMessage,
                    publishOptions
                );

                const duration = Date.now() - startTime;

                return {
                    success: true,
                    exchange: resolvedExchange,
                    routingKey: resolvedRoutingKey,
                    message: formattedMessage.substring(0, 5000), // First 5KB
                    timestamp: startTime,
                    duration,
                    retries: retryCount,
                };
            } catch (error) {
                retryCount++;

                if (retryCount > maxRetries) {
                    const duration = Date.now() - startTime;
                    return {
                        success: false,
                        exchange: resolvedExchange,
                        routingKey: resolvedRoutingKey,
                        message: formattedMessage.substring(0, 5000),
                        timestamp: startTime,
                        duration,
                        error: error instanceof Error ? error.message : String(error),
                        retries: retryCount - 1,
                    };
                }

                // Exponential backoff
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, retryCount - 1)));
            }
        }

        const duration = Date.now() - startTime;
        return {
            success: false,
            exchange: resolvedExchange,
            routingKey: resolvedRoutingKey,
            message: formattedMessage.substring(0, 5000),
            timestamp: startTime,
            duration,
            error: 'Max retries exceeded',
            retries: retryCount,
        };
    }

    /**
     * Disconnect publisher
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }

    /**
     * Get publisher status
     */
    getStatus(): AmqpConnectionStatus | null {
        return this.client?.getStatus() ?? null;
    }
}

/**
 * Helper function: Publish message to AMQP (one-off publish)
 * @param brokerUrl AMQP broker URL
 * @param exchange Exchange name
 * @param routingKey Routing key
 * @param message Message content
 * @param options Optional publish options
 */
export async function publishToAmqp(
    brokerUrl: string,
    exchange: string,
    routingKey: string,
    message: string | object,
    options?: Partial<AmqpPublishOptions>
): Promise<AmqpPublishResult> {
    const publisher = new AmqpPublisher();

    try {
        await publisher.initialize(brokerUrl);

        const result = await publisher.publish(message, {
            exchange,
            routingKey,
            ...options,
        });

        return result;
    } finally {
        await publisher.disconnect();
    }
}
