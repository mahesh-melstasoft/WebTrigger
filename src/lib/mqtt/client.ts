/**
 * MQTT Client Wrapper
 * Handles connection management and publishing to MQTT brokers
 * 
 * Supports:
 * - Connection pooling
 * - Auto-reconnect
 * - QoS levels (0, 1, 2)
 * - Topic templating with variables
 * - Message formatting (JSON, TEXT, XML)
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';

export type MqttQos = 0 | 1 | 2;
export type MessageFormat = 'JSON' | 'TEXT' | 'XML';

export interface MqttClientConfig {
    broker: string; // mqtt://broker.example.com:1883 or mqtts://...
    username?: string;
    password?: string;
    clientId?: string;
    reconnectPeriod?: number; // ms
    connectTimeout?: number; // ms
    keepalive?: number; // seconds
}

export interface MqttPublishOptions {
    qos?: MqttQos;
    retain?: boolean;
    dup?: boolean;
}

export interface PublishResult {
    success: boolean;
    messageId?: string;
    error?: string;
    duration: number;
    timestamp: string;
}

/**
 * MQTT Client Wrapper
 */
export class MqttClientWrapper extends EventEmitter {
    private client?: MqttClient;
    private config: MqttClientConfig;
    private isConnecting: boolean = false;
    private isConnected: boolean = false;
    private connectionPromise?: Promise<void>;
    private subscriptions: Set<string> = new Set();

    constructor(config: MqttClientConfig) {
        super();
        this.config = {
            reconnectPeriod: 5000,
            connectTimeout: 10000,
            keepalive: 30,
            ...config,
        };
    }

    /**
     * Connect to MQTT broker
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            return; // Already connected
        }

        if (this.isConnecting) {
            return this.connectionPromise; // Wait for existing connection
        }

        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                const options: IClientOptions = {
                    reconnectPeriod: this.config.reconnectPeriod,
                    connectTimeout: this.config.connectTimeout,
                    keepalive: this.config.keepalive,
                    clientId: this.config.clientId || `webtrigger-${Date.now()}`,
                    clean: true,
                    resubscribe: true,
                };

                if (this.config.username) {
                    options.username = this.config.username;
                }
                if (this.config.password) {
                    options.password = this.config.password;
                }

                this.client = mqtt.connect(this.config.broker, options);

                this.client.once('connect', () => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.emit('connected');
                    resolve();
                });

                this.client.once('error', (error: Error) => {
                    this.isConnecting = false;
                    this.emit('error', error);
                    reject(error);
                });

                this.client.on('disconnect', () => {
                    this.isConnected = false;
                    this.emit('disconnected');
                });

                this.client.on('message', (topic: string, payload: Buffer) => {
                    this.emit('message', { topic, payload });
                });

                this.client.on('error', (error: Error) => {
                    this.emit('error', error);
                });
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    /**
     * Disconnect from broker
     */
    async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                resolve();
                return;
            }

            this.client.end((error: Error | undefined) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    /**
     * Publish message to topic
     */
    async publish(
        topic: string,
        message: string | Buffer | object,
        options?: MqttPublishOptions
    ): Promise<PublishResult> {
        const startTime = Date.now();
        const result: PublishResult = {
            success: false,
            duration: 0,
            timestamp: new Date().toISOString(),
        };

        try {
            // Ensure connected
            if (!this.isConnected) {
                await this.connect();
            }

            if (!this.client) {
                throw new Error('MQTT client not initialized');
            }

            // Format message
            let payload: string | Buffer;
            if (typeof message === 'object' && !Buffer.isBuffer(message)) {
                payload = JSON.stringify(message);
            } else if (typeof message === 'string') {
                payload = message;
            } else {
                payload = message;
            }

            // Publish
            return new Promise((resolve) => {
                this.client!.publish(
                    topic,
                    payload,
                    {
                        qos: options?.qos ?? 1,
                        retain: options?.retain ?? false,
                        dup: options?.dup ?? false,
                    },
                    (error: Error | undefined) => {
                        result.duration = Date.now() - startTime;

                        if (error) {
                            result.success = false;
                            result.error = error.message;
                        } else {
                            result.success = true;
                        }

                        resolve(result);
                    }
                );
            });
        } catch (error) {
            result.duration = Date.now() - startTime;
            result.success = false;
            result.error = error instanceof Error ? error.message : String(error);
            return result;
        }
    }

    /**
     * Subscribe to topic
     */
    async subscribe(topic: string | string[]): Promise<void> {
        if (!this.isConnected) {
            await this.connect();
        }

        if (!this.client) {
            throw new Error('MQTT client not initialized');
        }

        return new Promise((resolve, reject) => {
            this.client!.subscribe(topic, (error: Error | null) => {
                if (error) reject(error);
                else {
                    if (Array.isArray(topic)) {
                        topic.forEach((t) => this.subscriptions.add(t));
                    } else {
                        this.subscriptions.add(topic);
                    }
                    resolve();
                }
            });
        });
    }

    /**
     * Unsubscribe from topic
     */
    async unsubscribe(topic: string | string[]): Promise<void> {
        if (!this.client) {
            throw new Error('MQTT client not initialized');
        }

        return new Promise((resolve, reject) => {
            this.client!.unsubscribe(topic, (error: Error | undefined) => {
                if (error) reject(error);
                else {
                    if (Array.isArray(topic)) {
                        topic.forEach((t) => this.subscriptions.delete(t));
                    } else {
                        this.subscriptions.delete(topic);
                    }
                    resolve();
                }
            });
        });
    }

    /**
     * Check if connected
     */
    getConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Get subscribed topics
     */
    getSubscriptions(): string[] {
        return Array.from(this.subscriptions);
    }

    /**
     * Get client config
     */
    getConfig(): MqttClientConfig {
        return { ...this.config };
    }

    /**
     * Validate broker URL
     */
    static validateBrokerUrl(url: string): { valid: boolean; error?: string } {
        try {
            if (!url || typeof url !== 'string') {
                return { valid: false, error: 'Broker URL must be a non-empty string' };
            }

            // Basic URL validation
            if (
                !url.startsWith('mqtt://') &&
                !url.startsWith('mqtts://') &&
                !url.startsWith('ws://') &&
                !url.startsWith('wss://')
            ) {
                return {
                    valid: false,
                    error: 'Broker URL must start with mqtt://, mqtts://, ws://, or wss://',
                };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Invalid broker URL',
            };
        }
    }

    /**
     * Validate topic
     */
    static validateTopic(topic: string): { valid: boolean; error?: string } {
        if (!topic || typeof topic !== 'string') {
            return { valid: false, error: 'Topic must be a non-empty string' };
        }

        // MQTT topic rules:
        // - Can contain 0-65535 bytes
        // - Cannot start with $SYS/
        // - Can contain forward slashes (/)
        // - Can contain wildcards (+, #) only in subscribe, not publish

        if (topic.startsWith('$SYS/')) {
            return { valid: false, error: 'Topic cannot start with $SYS/' };
        }

        if (topic.length === 0 || topic.length > 65535) {
            return { valid: false, error: 'Topic must be between 1 and 65535 characters' };
        }

        return { valid: true };
    }

    /**
     * Validate QoS level
     */
    static validateQos(qos: number): { valid: boolean; error?: string } {
        if (![0, 1, 2].includes(qos)) {
            return { valid: false, error: 'QoS must be 0, 1, or 2' };
        }
        return { valid: true };
    }
}

/**
 * Connection Pool for MQTT clients
 */
export class MqttConnectionPool {
    private connections: Map<string, MqttClientWrapper> = new Map();
    private maxConnections: number = 10;

    constructor(maxConnections: number = 10) {
        this.maxConnections = maxConnections;
    }

    /**
     * Get or create connection
     */
    async getConnection(config: MqttClientConfig): Promise<MqttClientWrapper> {
        const key = this.getConnectionKey(config);

        // Return existing connection if available
        if (this.connections.has(key)) {
            const conn = this.connections.get(key)!;
            if (conn.getConnected()) {
                return conn;
            }
            // Connection dead, remove it
            this.connections.delete(key);
        }

        // Check pool size
        if (this.connections.size >= this.maxConnections) {
            throw new Error(
                `Connection pool limit (${this.maxConnections}) reached`
            );
        }

        // Create new connection
        const conn = new MqttClientWrapper(config);
        await conn.connect();

        this.connections.set(key, conn);
        return conn;
    }

    /**
     * Close all connections
     */
    async closeAll(): Promise<void> {
        const promises = Array.from(this.connections.values()).map((conn) =>
            conn.disconnect()
        );
        await Promise.all(promises);
        this.connections.clear();
    }

    /**
     * Get connection count
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Get connection key for deduplication
     */
    private getConnectionKey(config: MqttClientConfig): string {
        return `${config.broker}::${config.username || 'default'}`;
    }
}

/**
 * Global connection pool
 */
let globalPool: MqttConnectionPool | undefined;

/**
 * Get global MQTT connection pool
 */
export function getGlobalMqttPool(): MqttConnectionPool {
    if (!globalPool) {
        globalPool = new MqttConnectionPool();
    }
    return globalPool;
}

/**
 * Close global pool
 */
export async function closeGlobalMqttPool(): Promise<void> {
    if (globalPool) {
        await globalPool.closeAll();
        globalPool = undefined;
    }
}
