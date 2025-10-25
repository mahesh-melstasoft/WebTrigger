/**
 * AMQP Module - Message Queue Integration
 * Exports client wrapper, publisher, and utilities for AMQP messaging
 */

export { AmqpClientWrapper, AmqpConnectionPool, AmqpConnectionStatus } from './client';
export { AmqpPublisher, publishToAmqp, MessageFormat } from './publisher';

export type {
    AmqpMessageHandler,
    AmqpErrorHandler,
} from './client';

export type {
    AmqpPublishOptions,
    AmqpCredentials,
    AmqpPublishResult,
} from './publisher';

export {
    validateBrokerUrl,
    validateExchange,
    validateRoutingKey,
    validateQueueName,
    getGlobalAmqpPool,
    closeGlobalAmqpPool,
} from './client';
