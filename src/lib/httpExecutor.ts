/**
 * HTTP Executor
 * Handles sending HTTP requests with support for all standard methods
 * GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpAuthHandler, AuthConfig } from './httpAuth';
import { HttpTemplateEngine } from './httpTemplateEngine';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

export interface HttpRequestConfig {
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    body?: unknown;
    auth?: AuthConfig;
    timeout?: number;
    followRedirects?: boolean;
    maxRedirects?: number;
    validateStatus?: boolean; // if true, don't throw on any status code
}

export interface HttpRequestDetails {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: string;
    timestamp: string;
    size?: number;
}

export interface HttpResponseDetails {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    body?: string;
    bodySize?: number;
    duration: number;
    timestamp: string;
}

export interface HttpExecutionResult {
    success: boolean;
    request: HttpRequestDetails;
    response?: HttpResponseDetails;
    error?: string;
    duration: number;
}

/**
 * HTTP Executor
 */
export class HttpExecutor {
    /**
     * Execute HTTP request with all method support
     */
    static async execute(config: HttpRequestConfig): Promise<HttpExecutionResult> {
        const startTime = Date.now();
        const result: HttpExecutionResult = {
            success: false,
            request: {
                method: config.method,
                url: config.url,
                headers: config.headers || {},
                query: config.query ? Object.fromEntries(
                    Object.entries(config.query).map(([k, v]) => [k, String(v)])
                ) : undefined,
                timestamp: new Date().toISOString(),
            },
            duration: 0,
        };

        try {
            // Validate method
            if (!this.isValidMethod(config.method)) {
                throw new Error(`Invalid HTTP method: ${config.method}`);
            }

            // Generate authentication headers if needed
            let headers = { ...(config.headers || {}) };
            if (config.auth) {
                const authHeaders = await HttpAuthHandler.generateHeaders(config.auth);
                headers = { ...headers, ...authHeaders };
            }

            // Add common headers
            headers['User-Agent'] = headers['User-Agent'] || 'WebTrigger-HttpExecutor/1.0';
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';

            // Build URL with query parameters
            let url = config.url;
            if (config.query && Object.keys(config.query).length > 0) {
                const queryString = new URLSearchParams();
                for (const [key, value] of Object.entries(config.query)) {
                    queryString.append(key, String(value));
                }
                url = `${config.url}?${queryString.toString()}`;
            }

            result.request.url = url;
            result.request.headers = this.sanitizeHeadersForLogging(headers);

            // Prepare request body
            let requestBody: string | undefined;
            if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
                requestBody = typeof config.body === 'string'
                    ? config.body
                    : JSON.stringify(config.body);
                result.request.body = this.truncateBody(requestBody);
                result.request.size = Buffer.byteLength(requestBody, 'utf8');
            }

            // Build Axios config
            const axiosConfig: AxiosRequestConfig = {
                method: config.method.toLowerCase() as any,
                url,
                headers,
                timeout: config.timeout || 30000,
                maxRedirects: config.maxRedirects ?? 5,
                validateStatus: () => true, // Don't throw on any status
            };

            if (requestBody) {
                axiosConfig.data = requestBody;
            }

            // Execute request
            const response = await axios(axiosConfig);

            // Log response
            let responseBody: string | undefined;
            if (response.data) {
                responseBody = typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data);
            }

            result.response = {
                status: response.status,
                statusText: response.statusText,
                headers: this.sanitizeHeadersForLogging(response.headers as Record<string, string>),
                body: this.truncateBody(responseBody),
                bodySize: responseBody ? Buffer.byteLength(responseBody, 'utf8') : 0,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            };

            // Determine success based on status code
            result.success = response.status >= 200 && response.status < 300;

            if (!result.success && !config.validateStatus) {
                result.error = `HTTP ${response.status} ${response.statusText}`;
            }

            result.duration = Date.now() - startTime;
            return result;
        } catch (error) {
            result.duration = Date.now() - startTime;
            result.error = error instanceof Error ? error.message : String(error);
            return result;
        }
    }

    /**
     * Execute request with template substitution
     */
    static async executeWithTemplate(
        config: HttpRequestConfig,
        templateContext: Record<string, any> = {}
    ): Promise<HttpExecutionResult> {
        // Apply template substitution to headers and body
        const processedHeaders = await this.processTemplateObject(
            config.headers || {},
            templateContext
        );
        const processedBody = await this.processTemplate(
            config.body,
            templateContext
        );
        const processedQuery = await this.processTemplateObject(
            config.query || {},
            templateContext
        );

        return this.execute({
            ...config,
            headers: processedHeaders as Record<string, string>,
            body: processedBody,
            query: processedQuery as Record<string, string>,
        });
    }

    /**
     * GET request helper
     */
    static async get(
        url: string,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'GET',
            url,
            ...config,
        });
    }

    /**
     * POST request helper
     */
    static async post(
        url: string,
        body?: unknown,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'POST',
            url,
            body,
            ...config,
        });
    }

    /**
     * PUT request helper
     */
    static async put(
        url: string,
        body?: unknown,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'PUT',
            url,
            body,
            ...config,
        });
    }

    /**
     * DELETE request helper
     */
    static async delete(
        url: string,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'DELETE',
            url,
            ...config,
        });
    }

    /**
     * HEAD request helper
     */
    static async head(
        url: string,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'HEAD',
            url,
            ...config,
        });
    }

    /**
     * OPTIONS request helper
     */
    static async options(
        url: string,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'OPTIONS',
            url,
            ...config,
        });
    }

    /**
     * PATCH request helper
     */
    static async patch(
        url: string,
        body?: unknown,
        config?: Partial<HttpRequestConfig>
    ): Promise<HttpExecutionResult> {
        return this.execute({
            method: 'PATCH',
            url,
            body,
            ...config,
        });
    }

    /**
     * Validate HTTP method
     */
    private static isValidMethod(method: HttpMethod): boolean {
        const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
        return validMethods.includes(method);
    }

    /**
     * Remove sensitive headers from logged output
     */
    private static sanitizeHeadersForLogging(headers: Record<string, string | string[]>): Record<string, string> {
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'x-auth-token',
            'x-access-token',
        ];

        const sanitized: Record<string, string> = {};

        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();

            if (sensitiveHeaders.includes(lowerKey)) {
                // Keep only last 4 chars
                const valueStr = Array.isArray(value) ? value[0] : value;
                sanitized[key] = '***' + valueStr.slice(-4);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.join(', ');
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Truncate response body for logging (max 5KB)
     */
    private static truncateBody(body?: string, maxSize: number = 5120): string | undefined {
        if (!body) return undefined;
        if (body.length <= maxSize) return body;
        return body.substring(0, maxSize) + `... (truncated, total: ${body.length} bytes)`;
    }

    /**
     * Process template substitution on object
     */
    private static async processTemplateObject(
        obj: Record<string, any>,
        context: Record<string, any>
    ): Promise<Record<string, any>> {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = await this.processTemplate(value, context);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Process template substitution
     */
    private static async processTemplate(
        value: any,
        context: Record<string, any>
    ): Promise<any> {
        if (typeof value !== 'string') {
            return value;
        }

        // For now, use simple string replacement
        // Can be enhanced to use HttpTemplateEngine
        let result = value;

        // Replace {key} patterns
        for (const [key, val] of Object.entries(context)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), String(val));
        }

        return result;
    }

    /**
     * Get HTTP method information
     */
    static getMethodInfo(method: HttpMethod): {
        method: HttpMethod;
        hasBody: boolean;
        safe: boolean;
        idempotent: boolean;
    } {
        const methodInfo: Record<HttpMethod, {
            method: HttpMethod;
            hasBody: boolean;
            safe: boolean;
            idempotent: boolean;
        }> = {
            GET: { method: 'GET', hasBody: false, safe: true, idempotent: true },
            POST: { method: 'POST', hasBody: true, safe: false, idempotent: false },
            PUT: { method: 'PUT', hasBody: true, safe: false, idempotent: true },
            DELETE: { method: 'DELETE', hasBody: false, safe: false, idempotent: true },
            HEAD: { method: 'HEAD', hasBody: false, safe: true, idempotent: true },
            OPTIONS: { method: 'OPTIONS', hasBody: false, safe: true, idempotent: true },
            PATCH: { method: 'PATCH', hasBody: true, safe: false, idempotent: false },
        };

        return methodInfo[method];
    }

    /**
     * Retry execution with exponential backoff
     */
    static async executeWithRetry(
        config: HttpRequestConfig,
        maxRetries: number = 3,
        baseDelay: number = 1000,
        backoffMultiplier: number = 2
    ): Promise<HttpExecutionResult> {
        let lastError: Error | undefined;
        let delay = baseDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.execute(config);

                // Retry on network errors or 5xx status codes
                if (
                    result.success ||
                    (result.response && result.response.status < 500)
                ) {
                    return result;
                }

                // 5xx error, will retry
                lastError = new Error(`HTTP ${result.response?.status}`);

                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= backoffMultiplier;
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= backoffMultiplier;
                }
            }
        }

        // All retries exhausted
        return {
            success: false,
            request: {
                method: config.method,
                url: config.url,
                headers: config.headers || {},
                timestamp: new Date().toISOString(),
            },
            error: lastError?.message || 'Max retries exceeded',
            duration: 0,
        };
    }
}

/**
 * Export helper for quick usage
 */
export const httpExecutor = HttpExecutor;
