// Type declarations for amqplib
declare module 'amqplib' {
    import { EventEmitter } from 'events';

    interface Connection extends EventEmitter {
        createChannel(): Promise<Channel>;
        createConfirmChannel(): Promise<ConfirmChannel>;
        close(): Promise<void>;
    }

    interface Channel {
        assertExchange(
            exchange: string,
            type: 'direct' | 'topic' | 'fanout' | 'headers',
            options?: Record<string, unknown>
        ): Promise<Exchange>;
        assertQueue(queue: string, options?: Record<string, unknown>): Promise<Queue>;
        bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
        publish(
            exchange: string,
            routingKey: string,
            content: Buffer,
            options?: Record<string, unknown>
        ): boolean;
        consume(
            queue: string,
            onMessage: (msg: ConsumeMessage | null) => void,
            options?: Record<string, unknown>
        ): Promise<Consume>;
        ack(message: ConsumeMessage): void;
        nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
        cancel(consumerTag: string): Promise<void>;
        purgeQueue(queue: string): Promise<void>;
        close(): Promise<void>;
    }

    interface ConfirmChannel extends Channel {
        publish(
            exchange: string,
            routingKey: string,
            content: Buffer,
            options?: Record<string, unknown>,
            callback?: (err: Error | null, ok?: Confirm) => void
        ): boolean;
    }

    interface Exchange {
        exchange: string;
    }

    interface Queue {
        queue: string;
        messageCount: number;
        consumerCount: number;
    }

    interface ConsumeMessage {
        content: Buffer;
        fields: {
            consumerTag: string;
            deliveryTag: number;
            redelivered: boolean;
            exchange: string;
            routingKey: string;
        };
        properties: {
            contentType?: string;
            contentEncoding?: string;
            headers?: Record<string, unknown>;
            delivery_mode?: number;
            priority?: number;
            correlation_id?: string;
            reply_to?: string;
            expiration?: string;
            message_id?: string;
            timestamp?: number;
            type?: string;
            user_id?: string;
            app_id?: string;
        };
    }

    interface Consume {
        consumerTag: string;
    }

    interface Confirm {
        ok: boolean;
    }

    function connect(
        url: string | Record<string, unknown>,
        socketOptions?: Record<string, unknown>
    ): Promise<Connection>;
}
