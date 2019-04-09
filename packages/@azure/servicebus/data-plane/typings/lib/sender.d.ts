import * as Long from "long";
import { SendableMessageInfo } from "./serviceBusMessage";
/**
 * The Sender class can be used to send messages, schedule messages to be sent at a later time
 * and cancel such scheduled messages.
 * Use the `getSender` function on the QueueClient or TopicClient to instantiate a Sender.
 * The Sender class is an abstraction over the underlying AMQP sender link.
 * @class Sender
 */
export declare class Sender {
    /**
     * @property {ClientEntityContext} _context Describes the amqp connection context for the Client.
     */
    private _context;
    private _isClosed;
    /**
     * @property {boolean} [isClosed] Denotes if close() was called on this sender.
     * @readonly
     */
    readonly isClosed: boolean;
    /**
     * Sends the given message after creating an AMQP Sender link if it doesnt already exists.
     *
     * To send a message to a `session` and/or `partition` enabled Queue/Topic, set the `sessionId`
     * and/or `partitionKey` properties respectively on the message.
     *
     * @param message - Message to send.
     * @returns Promise<void>
     */
    send(message: SendableMessageInfo): Promise<void>;
    /**
     * Sends the given messages in a batch i.e. in a single AMQP message after creating an AMQP Sender
     * link if it doesnt already exists.
     *
     * To send messages to a `session` and/or `partition` enabled Queue/Topic, set the `sessionId`
     * and/or `partitionKey` properties respectively on the messages. When doing so, all
     * messages in the batch should have the same `sessionId` (if using sessions) and the same
     * `parititionKey` (if using paritions).
     *
     * @param messages - An array of SendableMessageInfo objects to be sent in a Batch message.
     * @return Promise<void>
     */
    sendBatch(messages: SendableMessageInfo[]): Promise<void>;
    /**
     * Schedules given message to appear on Service Bus Queue/Subscription at a later time.
     *
     * @param scheduledEnqueueTimeUtc - The UTC time at which the message should be enqueued.
     * @param message - The message that needs to be scheduled.
     * @returns Promise<Long> - The sequence number of the message that was scheduled.
     * You will need the sequence number if you intend to cancel the scheduling of the message.
     * Save the `Long` type as-is in your application without converting to number. Since JavaScript
     * only supports 53 bit numbers, converting the `Long` to number will cause loss in precision.
     */
    scheduleMessage(scheduledEnqueueTimeUtc: Date, message: SendableMessageInfo): Promise<Long>;
    /**
     * Schedules given messages to appear on Service Bus Queue/Subscription at a later time.
     *
     * @param scheduledEnqueueTimeUtc - The UTC time at which the messages should be enqueued.
     * @param messages - Array of Messages that need to be scheduled.
     * @returns Promise<Long[]> - The sequence numbers of messages that were scheduled.
     * You will need the sequence number if you intend to cancel the scheduling of the messages.
     * Save the `Long` type as-is in your application without converting to number. Since JavaScript
     * only supports 53 bit numbers, converting the `Long` to number will cause loss in precision.
     */
    scheduleMessages(scheduledEnqueueTimeUtc: Date, messages: SendableMessageInfo[]): Promise<Long[]>;
    /**
     * Cancels a message that was scheduled to appear on a ServiceBus Queue/Subscription.
     * @param sequenceNumber - The sequence number of the message to be cancelled.
     * @returns Promise<void>
     */
    cancelScheduledMessage(sequenceNumber: Long): Promise<void>;
    /**
     * Cancels an array of messages that were scheduled to appear on a ServiceBus Queue/Subscription.
     * @param sequenceNumbers - An Array of sequence numbers of the message to be cancelled.
     * @returns Promise<void>
     */
    cancelScheduledMessages(sequenceNumbers: Long[]): Promise<void>;
    /**
     * Closes the underlying AMQP sender link.
     * Once closed, the sender cannot be used for any further operations.
     * Use the `getSender` function on the QueueClient or TopicClient to instantiate a new Sender
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    private throwIfSenderOrConnectionClosed;
}
//# sourceMappingURL=sender.d.ts.map