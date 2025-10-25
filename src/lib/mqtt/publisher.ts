/**
 * MQTT Publisher
 * High-level abstraction for publishing messages to MQTT brokers
 * Includes:
 * - Topic templating with variable substitution
 * - Message formatting
 * - Connection management
 * - Retry logic
 */

import { MqttClientWrapper, MqttClientConfig, MqttPublishOptions, PublishResult } from './client';
import { HttpTemplateEngine, TemplateContext } from '../httpTemplateEngine';
import { encryptSecret, decryptSecret } from '../cryptoHelper';

export type MessageFormat = 'JSON' | 'TEXT' | 'XML';

export interface MqttPublisherConfig extends MqttClientConfig {
    topic: string; // Topic with optional variable placeholders
    qos?: 0 | 1 | 2;
    retain?: boolean;
    payloadFormat?: MessageFormat;
    maxRetries?: number;
    retryDelayMs?: number;
}

export interface PublishRequest {
    topic?: string; // Override default topic
    payload: unknown;
    templateContext?: Record<string, any>;
    options?: MqttPublishOptions;
}

export interface PublishResponse extends PublishResult {
    topic: string;
    payloadSize: number;
}

/**
 * MQTT Publisher
 */
export class MqttPublisher {
    private client?: MqttClientWrapper;
    private config: MqttPublisherConfig;
    private isInitialized: boolean = false;

    constructor(config: MqttPublisherConfig) {
        // Validate config
        this.validateConfig(config);

        this.config = {
            qos: 1,
            retain: false,
            payloadFormat: 'JSON',
            maxRetries: 3,
            retryDelayMs: 1000,
            ...config,
        };
    }

    /**
     * Initialize publisher
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        this.client = new MqttClientWrapper({
            broker: this.config.broker,
            username: this.config.username,
            password: this.config.password,
            clientId: this.config.clientId,
            reconnectPeriod: this.config.reconnectPeriod,
            connectTimeout: this.config.connectTimeout,
            keepalive: this.config.keepalive,
        });

        await this.client.connect();
        this.isInitialized = true;
    }

    /**
     * Publish message
     */
    async publish(request: PublishRequest): Promise<PublishResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Publisher not initialized');
        }

        // Resolve topic (apply template substitution)
        const topic = await this.resolveTopic(
            request.topic || this.config.topic,
            request.templateContext
        );

        // Format payload
        const payloadString = this.formatPayload(
            request.payload,
            this.config.payloadFormat || 'JSON'
        );

        // Publish with retry
        const result = await this.publishWithRetry(
            topic,
            payloadString,
            request.options
        );

        return {
            ...result,
            topic,
            payloadSize: Buffer.byteLength(payloadString, 'utf8'),
        };
    }

    /**
     * Publish with retry logic
     */
    private async publishWithRetry(
        topic: string,
        payload: string,
        options?: MqttPublishOptions,
        attempt: number = 0
    ): Promise<PublishResult> {
        try {
            if (!this.client) {
                throw new Error('Client not initialized');
            }

            const result = await this.client.publish(topic, payload, {
                qos: options?.qos ?? this.config.qos,
                retain: options?.retain ?? this.config.retain,
            });

            if (result.success || attempt >= (this.config.maxRetries || 3)) {
                return result;
            }

            // Retry on failure
            await new Promise((resolve) =>
                setTimeout(resolve, this.config.retryDelayMs || 1000)
            );

            return this.publishWithRetry(topic, payload, options, attempt + 1);
        } catch (error) {
            const result: PublishResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: 0,
                timestamp: new Date().toISOString(),
            };

            if (attempt < (this.config.maxRetries || 3)) {
                await new Promise((resolve) =>
                    setTimeout(resolve, this.config.retryDelayMs || 1000)
                );
                return this.publishWithRetry(topic, payload, options, attempt + 1);
            }

            return result;
        }
    }

    /**
     * Resolve topic with variable substitution
     */
    private async resolveTopic(
        topic: string,
        context?: Record<string, any>
    ): Promise<string> {
        const templateContext: TemplateContext = {
            callback_id: context?.callback_id,
            timestamp: context?.timestamp || new Date().toISOString(),
            uuid: context?.uuid,
            date: context?.date || new Date().toISOString().split('T')[0],
            ...context,
        };

        // For basic string replacement in topic
        let resolvedTopic = topic;

        // Replace {key} patterns
        for (const [key, value] of Object.entries(context || {})) {
            if (value !== null && value !== undefined) {
                resolvedTopic = resolvedTopic.replace(new RegExp(`{${key}}`, 'g'), String(value));
            }
        }

        // Validate resolved topic
        const validation = MqttClientWrapper.validateTopic(resolvedTopic);
        if (!validation.valid) {
            throw new Error(`Invalid MQTT topic: ${validation.error}`);
        }

        return resolvedTopic;
    }

    /**
     * Format payload based on format type
     */
    private formatPayload(payload: unknown, format: MessageFormat): string {
        switch (format) {
            case 'JSON':
                if (typeof payload === 'string') {
                    // Validate JSON
                    try {
                        JSON.parse(payload);
                        return payload;
                    } catch {
                        // Invalid JSON string, encode it
                        return JSON.stringify(payload);
                    }
                }
                return JSON.stringify(payload);

            case 'TEXT':
                if (typeof payload === 'string') {
                    return payload;
                }
                if (typeof payload === 'object') {
                    return JSON.stringify(payload);
                }
                return String(payload);

            case 'XML':
                // Very basic XML wrapping - in production, use a proper XML library
                return this.toXml(payload);

            default:
                return JSON.stringify(payload);
        }
    }

    /**
     * Convert payload to XML (basic implementation)
     */
    private toXml(payload: unknown): string {
        if (typeof payload === 'string') {
            return `<message>${this.escapeXml(payload)}</message>`;
        }

        if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
            let xml = '<payload>';

            for (const [key, value] of Object.entries(payload)) {
                xml += `<${key}>${this.escapeXml(String(value))}</${key}>`;
            }

            xml += '</payload>';
            return xml;
        }

        return `<message>${this.escapeXml(String(payload))}</message>`;
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
     * Disconnect publisher
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.isInitialized = false;
        }
    }

    /**
     * Get publisher status
     */
    getStatus(): {
        initialized: boolean;
        connected: boolean;
        broker: string;
        topic: string;
    } {
        return {
            initialized: this.isInitialized,
            connected: this.client?.getConnected() ?? false,
            broker: this.config.broker,
            topic: this.config.topic,
        };
    }

    /**
     * Validate config
     */
    private validateConfig(config: MqttPublisherConfig): void {
        const errors: string[] = [];

        // Validate broker
        const brokerValidation = MqttClientWrapper.validateBrokerUrl(config.broker);
        if (!brokerValidation.valid) {
            errors.push(`Broker validation failed: ${brokerValidation.error}`);
        }

        // Validate topic
        const topicValidation = MqttClientWrapper.validateTopic(config.topic);
        if (!topicValidation.valid) {
            errors.push(`Topic validation failed: ${topicValidation.error}`);
        }

        // Validate QoS
        if (config.qos !== undefined) {
            const qosValidation = MqttClientWrapper.validateQos(config.qos);
            if (!qosValidation.valid) {
                errors.push(`QoS validation failed: ${qosValidation.error}`);
            }
        }

        if (errors.length > 0) {
            throw new Error(`Config validation failed: ${errors.join('; ')}`);
        }
    }

    /**
     * Create publisher with encrypted credentials
     */
    static createWithEncrypted(
        config: Omit<MqttPublisherConfig, 'password'> & { encryptedPassword?: string }
    ): MqttPublisher {
        let password = undefined;

        if (config.encryptedPassword) {
            try {
                password = decryptSecret(config.encryptedPassword);
            } catch (error) {
                throw new Error(
                    `Failed to decrypt password: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        return new MqttPublisher({
            ...config,
            password,
        } as MqttPublisherConfig);
    }

    /**
     * Encrypt password for storage
     */
    static encryptPassword(password: string): string {
        return encryptSecret(password);
    }
}

/**
 * Utility function for quick publishing
 */
export async function publishToMqtt(
    config: MqttPublisherConfig,
    payload: unknown,
    templateContext?: Record<string, any>
): Promise<PublishResponse> {
    const publisher = new MqttPublisher(config);

    try {
        return await publisher.publish({
            payload,
            templateContext,
        });
    } finally {
        await publisher.disconnect();
    }
}
