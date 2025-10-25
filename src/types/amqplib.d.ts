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
            options?: any
        ): Promise<Exchange>;
        assertQueue(queue: string, options?: any): Promise<Queue>;
        bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
        publish(
            exchange: string,
            routingKey: string,
            content: Buffer,
            options?: any
        ): boolean;
        consume(
            queue: string,
            onMessage: (msg: ConsumeMessage | null) => void,
            options?: any
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
            options?: any,
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
            headers?: any;
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
        url: string | any,
        socketOptions?: any
    ): Promise<Connection>;
}
