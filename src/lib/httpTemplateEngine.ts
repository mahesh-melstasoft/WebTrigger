/**
 * HTTP Template Engine
 * 
 * Handles variable substitution in HTTP headers, body, and query parameters.
 * Supports:
 * - Built-in variables: {timestamp}, {uuid}, {callback_id}, {date}
 * - Environment variables: {env:VARIABLE_NAME}
 * - Service secrets: {secret:CREDENTIAL_NAME}
 * - Custom variables: {custom:key}
 */

import { v4 as uuidv4 } from 'uuid';

export interface TemplateContext {
    callback_id?: string;
    timestamp?: string;
    uuid?: string;
    date?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface SecretResolver {
    resolveSecret(name: string): Promise<string | null>;
}

export class HttpTemplateEngine {
    private secretResolver?: SecretResolver;

    constructor(secretResolver?: SecretResolver) {
        this.secretResolver = secretResolver;
    }

    /**
     * Resolve all variables in a template string
     * Returns resolved string or null if any required secret is missing
     */
    async resolveTemplate(
        template: string,
        context: TemplateContext
    ): Promise<string | null> {
        if (!template) return template;

        let result = template;

        // Replace built-in variables
        result = this.replaceBuiltInVariables(result, context);

        // Replace custom context variables
        result = this.replaceContextVariables(result, context);

        // Replace environment variables (requires {env:NAME} format)
        result = this.replaceEnvironmentVariables(result);

        // Replace secret references (requires secret resolver)
        if (this.secretResolver) {
            result = await this.replaceSecrets(result);
        }

        return result;
    }

    /**
     * Resolve variables in JSON object (headers, body, query params)
     */
    async resolveJsonTemplate(
        json: unknown,
        context: TemplateContext
    ): Promise<unknown> {
        if (json === null || json === undefined) {
            return json;
        }

        if (typeof json === 'string') {
            return this.resolveTemplate(json, context);
        }

        if (Array.isArray(json)) {
            return Promise.all(
                json.map((item) => this.resolveJsonTemplate(item, context))
            );
        }

        if (typeof json === 'object') {
            const resolved: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(json)) {
                resolved[key] = await this.resolveJsonTemplate(value, context);
            }
            return resolved;
        }

        return json;
    }

    /**
     * Build template context from callback and trigger data
     */
    static buildContext(
        callbackId: string,
        customData: Record<string, unknown> = {}
    ): TemplateContext {
        return {
            callback_id: callbackId,
            timestamp: new Date().toISOString(),
            uuid: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            ...customData,
        };
    }

    /**
     * Replace built-in variables: {timestamp}, {uuid}, {callback_id}, {date}
     */
    private replaceBuiltInVariables(
        template: string,
        context: TemplateContext
    ): string {
        let result = template;

        result = result.replace(/{timestamp}/g, context.timestamp || '');
        result = result.replace(/{uuid}/g, context.uuid || '');
        result = result.replace(/{callback_id}/g, context.callback_id || '');
        result = result.replace(/{date}/g, context.date || '');

        return result;
    }

    /**
     * Replace custom context variables: {custom_key}
     */
    private replaceContextVariables(
        template: string,
        context: TemplateContext
    ): string {
        let result = template;

        for (const [key, value] of Object.entries(context)) {
            if (value === undefined || value === null) continue;

            // Skip built-in variables (already replaced)
            if (
                ['callback_id', 'timestamp', 'uuid', 'date'].includes(key)
            ) {
                continue;
            }

            const placeholder = new RegExp(`{${key}}`, 'g');
            result = result.replace(placeholder, String(value));
        }

        return result;
    }

    /**
     * Replace environment variables: {env:VARIABLE_NAME}
     */
    private replaceEnvironmentVariables(template: string): string {
        let result = template;

        const envPattern = /{env:([A-Z_]+)}/g;
        let match;

        while ((match = envPattern.exec(template)) !== null) {
            const varName = match[1];
            const value = process.env[varName] || '';
            result = result.replace(`{env:${varName}}`, value);
        }

        return result;
    }

    /**
     * Replace secret references: {secret:CREDENTIAL_NAME}
     * This requires a secret resolver to be configured
     */
    private async replaceSecrets(template: string): Promise<string> {
        if (!this.secretResolver) {
            return template;
        }

        let result = template;
        const secretPattern = /{secret:([a-zA-Z0-9_-]+)}/g;
        const matches = [...template.matchAll(secretPattern)];

        for (const match of matches) {
            const secretName = match[1];
            const secretValue = await this.secretResolver.resolveSecret(secretName);

            if (secretValue) {
                result = result.replace(`{secret:${secretName}}`, secretValue);
            }
        }

        return result;
    }

    /**
     * Extract all variable placeholders from a template
     * Useful for validation and documentation
     */
    static extractVariables(template: string): {
        builtIn: string[];
        environment: string[];
        secrets: string[];
        custom: string[];
    } {
        const builtIn = ['timestamp', 'uuid', 'callback_id', 'date'].filter(
            (v) => template.includes(`{${v}}`)
        );

        const environmentMatches = [...template.matchAll(/{env:([A-Z_]+)}/g)];
        const environment = environmentMatches.map((m) => m[1]);

        const secretMatches = [...template.matchAll(/{secret:([a-zA-Z0-9_-]+)}/g)];
        const secrets = secretMatches.map((m) => m[1]);

        const customMatches = [
            ...template.matchAll(/{([a-zA-Z_][a-zA-Z0-9_]*)}/g),
        ];
        const custom = customMatches
            .map((m) => m[1])
            .filter(
                (v) =>
                    ![...builtIn, ...environment, ...secrets].includes(v)
            );

        return {
            builtIn,
            environment,
            secrets,
            custom: [...new Set(custom)],
        };
    }

    /**
     * Validate that all required variables are available in context
     */
    static validateTemplate(
        template: string,
        context: TemplateContext
    ): { valid: boolean; missing: string[] } {
        const variables = this.extractVariables(template);
        const missing: string[] = [];

        // Check custom variables
        for (const varName of variables.custom) {
            if (!(varName in context)) {
                missing.push(varName);
            }
        }

        return {
            valid: missing.length === 0,
            missing,
        };
    }
}

/**
 * Helper function: format JSON to string for body
 */
export function formatJsonBody(body: unknown): string {
    if (body === null || body === undefined) {
        return '';
    }

    if (typeof body === 'string') {
        return body;
    }

    return JSON.stringify(body);
}

/**
 * Helper function: parse query string to object
 */
export function parseQueryString(
    queryString: string
): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
        result[key] = value;
    }

    return result;
}

/**
 * Helper function: build query string from object
 */
export function buildQueryString(params: Record<string, unknown>): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            query.append(key, String(value));
        }
    }

    return query.toString();
}
