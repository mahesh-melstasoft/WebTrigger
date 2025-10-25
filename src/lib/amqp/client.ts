import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { EventEmitter } from 'events';

/**
 * AMQP Connection Status
 */
export enum AmqpConnectionStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

/**
 * AMQP Message Handler callback type
 */
export type AmqpMessageHandler = (message: ConsumeMessage | null) => void;

/**
 * AMQP Error Handler callback type
 */
export type AmqpErrorHandler = (error: Error | undefined) => void;

/**
 * Wrapper class for AMQP client with connection management
 * Extends EventEmitter for pub/sub capabilities
 */
export class AmqpClientWrapper extends EventEmitter {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private status: AmqpConnectionStatus = AmqpConnectionStatus.DISCONNECTED;
    private brokerUrl: string = '';
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelayMs: number = 1000;

    constructor() {
        super();
    }

    /**
     * Connect to AMQP broker
     * @param brokerUrl Connection string (e.g., amqp://localhost:5672 or amqp://user:pass@host:5672)
     * @param socketOptions Optional connection options
     */
    async connect(
        brokerUrl: string,
        socketOptions?: Record<string, unknown>
    ): Promise<void> {
        if (this.status === AmqpConnectionStatus.CONNECTED) {
            this.emit('debug', 'Already connected to AMQP broker');
            return;
        }

        this.status = AmqpConnectionStatus.CONNECTING;
        this.brokerUrl = brokerUrl;
        this.emit('connecting', { broker: brokerUrl });

        try {
            const options = socketOptions || {
                connectionTimeout: 10000,
                heartbeat: 60,
                frameMax: 0x1000000, // 16MB
            };

            this.connection = await amqp.connect(brokerUrl, options);
            this.channel = await this.connection.createChannel();

            if (this.connection) {
                this.connection.on('error', (error: Error | undefined) => {
                    this.emit('error', error);
                    this.handleConnectionError(error);
                });

                this.connection.on('close', () => {
                    this.emit('close', 'Connection closed');
                    this.status = AmqpConnectionStatus.DISCONNECTED;
                });
            }

            // Channel error handling (if Channel supports EventEmitter)
            if (this.channel && typeof (this.channel as unknown as { on?: unknown }).on === 'function') {
                (this.channel as unknown as { on: (event: string, handler: (error: Error | undefined) => void) => void }).on('error', (error: Error | undefined) => {
                    this.emit('error', error);
                });
            }

            this.status = AmqpConnectionStatus.CONNECTED;
            this.reconnectAttempts = 0;
            this.emit('connected', { broker: brokerUrl });
        } catch (error) {
            this.status = AmqpConnectionStatus.ERROR;
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            await this.attemptReconnect();
            throw error;
        }
    }

    /**
     * Declare an exchange
     * @param exchange Exchange name
     * @param type Exchange type (direct, topic, fanout, headers)
     * @param options Exchange options
     */
    async declareExchange(
        exchange: string,
        type: 'direct' | 'topic' | 'fanout' | 'headers',
        options?: Record<string, unknown>
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        const opts = options || {
            durable: true,
            autoDelete: false,
        };

        try {
            await this.channel.assertExchange(exchange, type, opts);
            this.emit('debug', `Exchange declared: ${exchange} (${type})`);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Declare a queue
     * @param queue Queue name
     * @param options Queue options
     */
    async declareQueue(
        queue: string,
        options?: Record<string, unknown>
    ): Promise<{ queue: string; messageCount: number; consumerCount: number }> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        const opts = options || {
            durable: true,
            autoDelete: false,
        };

        try {
            const result = await this.channel.assertQueue(queue, opts);
            this.emit('debug', `Queue declared: ${queue}`);
            return result;
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Bind a queue to an exchange
     * @param queue Queue name
     * @param exchange Exchange name
     * @param routingKey Routing key pattern
     */
    async bindQueue(
        queue: string,
        exchange: string,
        routingKey: string
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        try {
            await this.channel.bindQueue(queue, exchange, routingKey);
            this.emit('debug', `Queue bound: ${queue} to ${exchange} with key: ${routingKey}`);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Publish a message to an exchange
     * @param exchange Exchange name
     * @param routingKey Routing key
     * @param message Message content (Buffer or string)
     * @param options Message options
     */
    async publish(
        exchange: string,
        routingKey: string,
        message: Buffer | string,
        options?: Record<string, unknown>
    ): Promise<boolean> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        const content = typeof message === 'string' ? Buffer.from(message) : message;
        const publishOptions = options || {
            persistent: true,
            contentType: 'application/json',
        };

        try {
            const success = this.channel.publish(exchange, routingKey, content, publishOptions);
            this.emit('message_published', {
                exchange,
                routingKey,
                size: content.length,
                timestamp: Date.now(),
            });
            return success;
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Consume messages from a queue
     * @param queue Queue name
     * @param handler Message handler callback
     * @param options Consume options
     */
    async consume(
        queue: string,
        handler: AmqpMessageHandler,
        options?: Record<string, unknown>
    ): Promise<{ consumerTag: string }> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        const consumeOptions = options || {
            noAck: false,
        };

        try {
            const result = await this.channel.consume(queue, handler, consumeOptions);
            this.emit('debug', `Consuming from queue: ${queue}`);
            return result;
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Acknowledge a message
     * @param message The message to acknowledge
     */
    ack(message: ConsumeMessage | null): void {
        if (!this.channel || !message) {
            return;
        }

        try {
            this.channel.ack(message);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Negative acknowledge a message (nack)
     * @param message The message to nack
     * @param allUpTo If true, nacks all messages up to this one
     * @param requeue If true, requeue the message
     */
    nack(message: ConsumeMessage | null, allUpTo: boolean = false, requeue: boolean = true): void {
        if (!this.channel || !message) {
            return;
        }

        try {
            this.channel.nack(message, allUpTo, requeue);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Cancel a consumer
     * @param consumerTag Consumer tag to cancel
     */
    async cancelConsumer(consumerTag: string): Promise<void> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        try {
            await this.channel.cancel(consumerTag);
            this.emit('debug', `Consumer cancelled: ${consumerTag}`);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Purge a queue
     * @param queue Queue name
     */
    async purgeQueue(queue: string): Promise<void> {
        if (!this.channel) {
            throw new Error('Not connected to AMQP broker');
        }

        try {
            await this.channel.purgeQueue(queue);
            this.emit('debug', `Queue purged: ${queue}`);
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Disconnect from AMQP broker
     */
    async disconnect(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            this.status = AmqpConnectionStatus.DISCONNECTED;
            this.emit('disconnected', 'Gracefully disconnected from AMQP broker');
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Get current connection status
     */
    getStatus(): AmqpConnectionStatus {
        return this.status;
    }

    /**
     * Get the current channel (advanced usage)
     */
    getChannel(): Channel | null {
        return this.channel;
    }

    /**
     * Private: Handle connection errors
     */
    private handleConnectionError(error: Error | undefined): void {
        if (error) {
            this.emit('connection_error', error);
        }
    }

    /**
     * Private: Attempt to reconnect with exponential backoff
     */
    private async attemptReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('error', new Error('Max reconnection attempts reached'));
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);

        this.emit('debug', `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.brokerUrl) {
                this.connect(this.brokerUrl).catch((error) => {
                    this.emit('error', error);
                });
            }
        }, delay);
    }
}

/**
 * Connection pool for managing multiple AMQP connections
 */
export class AmqpConnectionPool {
    private connections: Map<string, AmqpClientWrapper> = new Map();
    private maxConnections: number;
    private connectionCount: number = 0;

    constructor(maxConnections: number = 10) {
        this.maxConnections = maxConnections;
    }

    /**
     * Acquire or create a connection from the pool
     * @param brokerId Unique identifier for the broker
     * @param brokerUrl AMQP connection string
     */
    async acquire(brokerId: string, brokerUrl: string): Promise<AmqpClientWrapper> {
        let client = this.connections.get(brokerId);

        if (client && client.getStatus() === AmqpConnectionStatus.CONNECTED) {
            return client;
        }

        if (this.connectionCount >= this.maxConnections) {
            throw new Error(`Connection pool limit reached (${this.maxConnections})`);
        }

        client = new AmqpClientWrapper();
        await client.connect(brokerUrl);
        this.connections.set(brokerId, client);
        this.connectionCount++;

        return client;
    }

    /**
     * Release a connection back to the pool
     * @param brokerId Broker identifier
     */
    async release(brokerId: string): Promise<void> {
        const client = this.connections.get(brokerId);
        if (client) {
            await client.disconnect();
            this.connections.delete(brokerId);
            this.connectionCount--;
        }
    }

    /**
     * Get a connection from the pool without acquiring
     * @param brokerId Broker identifier
     */
    getConnection(brokerId: string): AmqpClientWrapper | null {
        return this.connections.get(brokerId) || null;
    }

    /**
     * Get all connections in the pool
     */
    getAllConnections(): Map<string, AmqpClientWrapper> {
        return new Map(this.connections);
    }

    /**
     * Close all connections in the pool
     */
    async closeAll(): Promise<void> {
        const promises = Array.from(this.connections.values()).map((client) =>
            client.disconnect().catch((error) => {
                console.error('Error closing AMQP connection:', error);
            })
        );

        await Promise.all(promises);
        this.connections.clear();
        this.connectionCount = 0;
    }

    /**
     * Get pool statistics
     */
    getStats(): { active: number; max: number; available: number } {
        return {
            active: this.connectionCount,
            max: this.maxConnections,
            available: this.maxConnections - this.connectionCount,
        };
    }
}

// Global AMQP connection pool instance
let globalAmqpPool: AmqpConnectionPool | null = null;

/**
 * Get the global AMQP connection pool
 */
export function getGlobalAmqpPool(): AmqpConnectionPool {
    if (!globalAmqpPool) {
        globalAmqpPool = new AmqpConnectionPool(10);
    }
    return globalAmqpPool;
}

/**
 * Close the global AMQP connection pool
 */
export async function closeGlobalAmqpPool(): Promise<void> {
    if (globalAmqpPool) {
        await globalAmqpPool.closeAll();
        globalAmqpPool = null;
    }
}

/**
 * Utility function: Validate AMQP broker URL
 * @param url AMQP connection string
 */
export function validateBrokerUrl(url: string): boolean {
    try {
        const pattern = /^amqp(s)?:\/\//;
        return pattern.test(url);
    } catch {
        return false;
    }
}

/**
 * Utility function: Validate exchange name
 * @param exchange Exchange name
 */
export function validateExchange(exchange: string): boolean {
    return exchange.length > 0 && exchange.length <= 255;
}

/**
 * Utility function: Validate routing key
 * @param routingKey Routing key pattern
 */
export function validateRoutingKey(routingKey: string): boolean {
    return routingKey.length > 0 && routingKey.length <= 255;
}

/**
 * Utility function: Validate queue name
 * @param queue Queue name
 */
export function validateQueueName(queue: string): boolean {
    return queue.length > 0 && queue.length <= 255;
}
