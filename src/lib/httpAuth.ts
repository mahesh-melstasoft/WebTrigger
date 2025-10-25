/**
 * HTTP Authentication Handler
 * Supports multiple authentication types: Basic, Bearer, API Key, OAuth2
 * Generates appropriate headers based on auth configuration
 */

import { encryptSecret, decryptSecret } from './cryptoHelper';

export type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2' | 'DIGEST';

export interface AuthConfig {
    type: AuthType;
    basic?: {
        username: string;
        password: string;
    };
    bearer?: {
        token: string;
    };
    apiKey?: {
        key: string;
        header: string; // e.g., "X-API-Key", "Authorization"
        prefix?: string; // e.g., "Bearer", "Token"
    };
    oauth2?: {
        clientId: string;
        clientSecret: string;
        tokenUrl: string;
        grantType: 'client_credentials' | 'password';
        scopes?: string[];
        accessToken?: string; // cached token
        tokenExpires?: number; // unix timestamp
    };
    digest?: {
        username: string;
        password: string;
    };
    custom?: {
        [key: string]: string | number | boolean;
    };
}

/**
 * HTTP Authentication Handler
 */
export class HttpAuthHandler {
    /**
     * Validate authentication configuration
     */
    static validate(config: AuthConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.type || !config.type.length) {
            errors.push('Authentication type is required');
            return { valid: false, errors };
        }

        switch (config.type) {
            case 'BASIC':
                if (!config.basic?.username || !config.basic?.password) {
                    errors.push('Basic auth requires username and password');
                }
                break;

            case 'BEARER':
                if (!config.bearer?.token) {
                    errors.push('Bearer auth requires token');
                }
                break;

            case 'API_KEY':
                if (!config.apiKey?.key || !config.apiKey?.header) {
                    errors.push('API Key auth requires key and header name');
                }
                break;

            case 'OAUTH2':
                if (
                    !config.oauth2?.clientId ||
                    !config.oauth2?.clientSecret ||
                    !config.oauth2?.tokenUrl
                ) {
                    errors.push(
                        'OAuth2 requires clientId, clientSecret, and tokenUrl'
                    );
                }
                break;

            case 'DIGEST':
                if (!config.digest?.username || !config.digest?.password) {
                    errors.push('Digest auth requires username and password');
                }
                break;

            case 'NONE':
                // No auth required
                break;

            default:
                errors.push(`Unknown authentication type: ${config.type}`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Generate authorization headers
     */
    static async generateHeaders(
        config: AuthConfig
    ): Promise<Record<string, string>> {
        const validation = this.validate(config);
        if (!validation.valid) {
            throw new Error(`Invalid auth config: ${validation.errors.join(', ')}`);
        }

        const headers: Record<string, string> = {};

        switch (config.type) {
            case 'BASIC':
                headers['Authorization'] = this.generateBasicAuth(config);
                break;

            case 'BEARER':
                headers['Authorization'] = this.generateBearerAuth(config);
                break;

            case 'API_KEY':
                headers[config.apiKey!.header] = this.generateApiKeyAuth(config);
                break;

            case 'OAUTH2':
                const token = await this.generateOAuth2Token(config);
                headers['Authorization'] = `Bearer ${token}`;
                break;

            case 'DIGEST':
                // Digest auth is typically handled per-request with challenge-response
                // This is a simplified version - production should use proper Digest implementation
                headers['X-Digest-Auth'] = 'configured';
                break;

            case 'NONE':
                // No headers needed
                break;
        }

        return headers;
    }

    /**
     * Generate Basic Authentication header
     * Format: Authorization: Basic base64(username:password)
     */
    private static generateBasicAuth(config: AuthConfig): string {
        const credentials = `${config.basic!.username}:${config.basic!.password}`;
        const encoded = Buffer.from(credentials).toString('base64');
        return `Basic ${encoded}`;
    }

    /**
     * Generate Bearer Token header
     * Format: Authorization: Bearer <token>
     */
    private static generateBearerAuth(config: AuthConfig): string {
        return `Bearer ${config.bearer!.token}`;
    }

    /**
     * Generate API Key header
     * Format: <header>: <prefix> <key> or <header>: <key>
     */
    private static generateApiKeyAuth(config: AuthConfig): string {
        const apiKey = config.apiKey!;
        if (apiKey.prefix) {
            return `${apiKey.prefix} ${apiKey.key}`;
        }
        return apiKey.key;
    }

    /**
     * Generate or retrieve OAuth2 access token
     * Implements Client Credentials flow
     */
    private static async generateOAuth2Token(config: AuthConfig): Promise<string> {
        const oauth2 = config.oauth2!;

        // Return cached token if still valid (with 5 min buffer)
        if (
            oauth2.accessToken &&
            oauth2.tokenExpires &&
            oauth2.tokenExpires > Date.now() + 5 * 60 * 1000
        ) {
            return oauth2.accessToken;
        }

        try {
            // Request new token
            const params = new URLSearchParams({
                grant_type: oauth2.grantType || 'client_credentials',
                client_id: oauth2.clientId,
                client_secret: oauth2.clientSecret,
            });

            if (oauth2.scopes) {
                params.append('scope', oauth2.scopes.join(' '));
            }

            const response = await fetch(oauth2.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                throw new Error(`OAuth2 token request failed: ${response.statusText}`);
            }

            const data = await response.json() as {
                access_token: string;
                expires_in: number;
                token_type?: string;
            };

            // Cache token with expiration
            oauth2.accessToken = data.access_token;
            oauth2.tokenExpires = Date.now() + (data.expires_in * 1000);

            return data.access_token;
        } catch (error) {
            throw new Error(
                `OAuth2 token generation failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Encrypt auth config for storage (especially passwords and secrets)
     */
    static encryptConfig(config: AuthConfig, key?: string): string {
        const configJson = JSON.stringify(config);
        return encryptSecret(configJson);
    }

    /**
     * Decrypt auth config from storage
     */
    static decryptConfig(encrypted: string, key?: string): AuthConfig {
        const configJson = decryptSecret(encrypted);
        return JSON.parse(configJson) as AuthConfig;
    }

    /**
     * Mask sensitive auth data for logging/display
     */
    static maskConfig(config: AuthConfig): Partial<AuthConfig> {
        const masked: Partial<AuthConfig> = {
            type: config.type,
        };

        switch (config.type) {
            case 'BASIC':
                masked.basic = {
                    username: config.basic!.username,
                    password: '***' + config.basic!.password.slice(-2),
                };
                break;

            case 'BEARER':
                masked.bearer = {
                    token: '***' + config.bearer!.token.slice(-8),
                };
                break;

            case 'API_KEY':
                masked.apiKey = {
                    key: '***' + config.apiKey!.key.slice(-4),
                    header: config.apiKey!.header,
                    prefix: config.apiKey!.prefix,
                };
                break;

            case 'OAUTH2':
                masked.oauth2 = {
                    clientId: config.oauth2!.clientId,
                    clientSecret: '***' + config.oauth2!.clientSecret.slice(-2),
                    tokenUrl: config.oauth2!.tokenUrl,
                    grantType: config.oauth2!.grantType,
                    scopes: config.oauth2!.scopes,
                };
                break;

            case 'DIGEST':
                masked.digest = {
                    username: config.digest!.username,
                    password: '***' + config.digest!.password.slice(-2),
                };
                break;
        }

        return masked;
    }

    /**
     * Check if config has sensitive data that should be encrypted
     */
    static hasSensitiveData(config: AuthConfig): boolean {
        switch (config.type) {
            case 'BASIC':
            case 'BEARER':
            case 'API_KEY':
            case 'OAUTH2':
            case 'DIGEST':
                return true;
            case 'NONE':
            default:
                return false;
        }
    }

    /**
     * Create a safe config for logging (all sensitive data masked)
     */
    static toSafeConfig(config: AuthConfig): object {
        return {
            type: config.type,
            masked: this.maskConfig(config),
            requiresEncryption: this.hasSensitiveData(config),
        };
    }
}

/**
 * Helper: create Basic auth config
 */
export function createBasicAuth(
    username: string,
    password: string
): AuthConfig {
    return {
        type: 'BASIC',
        basic: { username, password },
    };
}

/**
 * Helper: create Bearer token auth config
 */
export function createBearerAuth(token: string): AuthConfig {
    return {
        type: 'BEARER',
        bearer: { token },
    };
}

/**
 * Helper: create API Key auth config
 */
export function createApiKeyAuth(
    key: string,
    header: string,
    prefix?: string
): AuthConfig {
    return {
        type: 'API_KEY',
        apiKey: { key, header, prefix },
    };
}

/**
 * Helper: create OAuth2 config
 */
export function createOAuth2Auth(
    clientId: string,
    clientSecret: string,
    tokenUrl: string,
    grantType: 'client_credentials' | 'password' = 'client_credentials'
): AuthConfig {
    return {
        type: 'OAUTH2',
        oauth2: { clientId, clientSecret, tokenUrl, grantType },
    };
}

/**
 * Helper: create no auth config
 */
export function createNoAuth(): AuthConfig {
    return { type: 'NONE' };
}
