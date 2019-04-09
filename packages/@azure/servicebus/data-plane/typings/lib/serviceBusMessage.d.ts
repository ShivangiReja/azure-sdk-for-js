/// <reference types="node" />
import Long from "long";
import { Delivery } from "rhea-promise";
import { AmqpMessage } from "@azure/amqp-common";
/**
 * The mode in which messages should be received
 */
export declare enum ReceiveMode {
    /**
     * Peek the message and lock it until it is settled or times out.
     * @type {Number}
     */
    peekLock = 1,
    /**
     * Remove the message from the service bus upon delivery.
     * @type {Number}
     */
    receiveAndDelete = 2
}
/**
 * Describes the reason and error description for dead lettering a message.
 * @interface DeadLetterOptions
 */
export interface DeadLetterOptions {
    /**
     * @property {string} [deadletterReason] The reason for deadlettering the message.
     */
    deadletterReason: string;
    /**
     * @property {string} [deadLetterErrorDescription] The error description for deadlettering the message.
     */
    deadLetterErrorDescription: string;
}
/**
 * Describes the message to be sent to ServiceBus.
 * @interface SendableMessageInfo.
 */
export interface SendableMessageInfo {
    /**
     * @property {any} body - The message body that needs to be sent or is received.
     */
    body: any;
    /**
     * @property {string | number | Buffer} [messageId] The message identifier is an
     * application-defined value that uniquely identifies the message and its payload.
     *
     * Note: Numbers that are not whole integers are not allowed.
     */
    messageId?: string | number | Buffer;
    /**
     * @property {string} [contentType] The content type of the message. Optionally describes
     * the payload of the message, with a descriptor following the format of RFC2045, Section 5, for
     * example "application/json".
     */
    contentType?: string;
    /**
     * @property {string | number | Buffer} [correlationId] The correlation identifier that allows an
     * application to specify a context for the message for the purposes of correlation, for example
     * reflecting the MessageId of a message that is being replied to.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    correlationId?: string | number | Buffer;
    /**
     * @property {string} [partitionKey] The partition key for sending a message to a
     * partitioned entity. Maximum length is 128 characters. For {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-partitioning partitioned entities},
     * etting this value enables assigning related messages to the same internal partition,
     * so that submission sequence order is correctly recorded. The partition is chosen by a hash
     * function over this value and cannot be chosen directly. For session-aware entities,
     * the `sessionId` property overrides this value.
     */
    partitionKey?: string;
    /**
     * @property {string} [viaPartitionKey] The partition key for sending a message into an entity
     * via a partitioned transfer queue. Maximum length is 128 characters. If a message is sent via a
     * transfer queue in the scope of a transaction, this value selects the transfer queue partition:
     * This is functionally equivalent to `partitionKey` property and ensures that messages are kept
     * together and in order as they are transferred.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-transactions#transfers-and-send-via Transfers and Send Via}.
     */
    viaPartitionKey?: string;
    /**
     * @property {string} [sessionId] The session identifier for a session-aware entity. Maximum
     * length is 128 characters. For session-aware entities, this application-defined value specifies
     * the session affiliation of the message. Messages with the same session identifier are subject
     * to summary locking and enable exact in-order processing and demultiplexing. For
     * session-unaware entities, this value is ignored.
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/message-sessions Message Sessions}.
     */
    sessionId?: string;
    /**
     * @property {string} [replyToSessionId] The session identifier augmenting the `replyTo` address.
     * Maximum length is 128 characters. This value augments the ReplyTo information and specifies
     * which SessionId should be set for the reply when sent to the reply entity.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    replyToSessionId?: string;
    /**
     * @property {number} [timeToLive] The message’s time to live value. This value is the relative
     * duration after which the message expires, starting from the instant the message has been
     * accepted and stored by the broker, as captured in `enqueuedTimeUtc`. When not set explicitly,
     * the assumed value is the DefaultTimeToLive for the respective queue or topic. A message-level
     * `timeToLive` value cannot be longer than the entity's DefaultTimeToLive setting and it is
     * silently adjusted if it does. See
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/message-expiration Expiration}.
     */
    timeToLive?: number;
    /**
     * @property {string} [label] The application specific label. This property enables the
     * application to indicate the purpose of the message to the receiver in a standardized. fashion,
     * similar to an email subject line. The mapped AMQP property is "subject".
     */
    label?: string;
    /**
     * @property {string} [to] The "to" address. This property is reserved for future use in routing
     * scenarios and presently ignored by the broker itself. Applications can use this value in
     * rule-driven {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-auto-forwarding auto-forward chaining}
     * scenarios to indicate the intended logical destination of the message.
     */
    to?: string;
    /**
     * @property {string} [replyTo] The address of an entity to send replies to. This optional and
     * application-defined value is a standard way to express a reply path to the receiver of the
     * message. When a sender expects a reply, it sets the value to the absolute or relative path of
     * the queue or topic it expects the reply to be sent to. See
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    replyTo?: string;
    /**
     * @property {Date} [scheduledEnqueueTimeUtc] The date and time in UTC at which the message will
     * be enqueued. This property returns the time in UTC; when setting the property, the
     * supplied DateTime value must also be in UTC. This value is for delayed message sending.
     * It is utilized to delay messages sending to a specific time in the future. Message enqueuing
     * time does not mean that the message will be sent at the same time. It will get enqueued,
     * but the actual sending time depends on the queue's workload and its state.
     */
    scheduledEnqueueTimeUtc?: Date;
    /**
     * @property {{ [key: string]: any }} [userProperties] The application specific properties which can be
     * used for custom message metadata.
     */
    userProperties?: {
        [key: string]: any;
    };
}
/**
 * Describes the message to be sent to ServiceBus.
 */
export declare module SendableMessageInfo {
    /**
     * @ignore
     */
    function validate(msg: SendableMessageInfo): void;
    /**
     * @ignore
     * Converts given SendableMessageInfo to AmqpMessage
     */
    function toAmqpMessage(msg: SendableMessageInfo): AmqpMessage;
    /**
     * @ignore
     * Converts given AmqpMessage to SendableMessageInfo
     */
    function fromAmqpMessage(msg: AmqpMessage): SendableMessageInfo;
}
/**
 * Describes the message received from ServiceBus.
 * @class ReceivedSBMessage
 */
export interface ReceivedMessageInfo extends SendableMessageInfo {
    /**
     * @property {string} [lockToken] The lock token for the current message. The lock token is a
     * reference to the lock that is being held by the broker in `ReceiveMode.PeekLock` mode. Locks
     * are used to explicitly settle messages as explained in the {@link https://docs.microsoft.com/azure/service-bus-messaging/message-transfers-locks-settlement product documentation in more detail}
     * The token can also be used to pin the lock permanently through the {@link https://docs.microsoft.com/azure/service-bus-messaging/message-deferral Deferral API}
     * and, with that, take the message out of the regular delivery state flow.
     * @readonly
     */
    readonly lockToken?: string;
    /**
     * @property {number} [deliveryCount] The current delivery count. The value start from 1. Number
     * of deliveries that have been attempted for this message. The count is incremented when a
     * message lock expires, or the message is explicitly abandoned by the receiver.
     * @readonly
     */
    readonly deliveryCount?: number;
    /**
     * @property {Date} [enqueuedTimeUtc] The date and time of the sent message in UTC. The UTC
     * instant at which the message has been accepted and stored in the entity. This value can be
     * used as an authoritative and neutral arrival time indicator when the receiver does not
     * want to trust the sender's clock.
     * @readonly
     */
    readonly enqueuedTimeUtc?: Date;
    /**
     * @property {Date} [expiresAtUtc] The date and time in UTC at which the message is set to expire.
     * The UTC instant at which the message is marked for removal and no longer available for
     * retrieval from the entity due to expiration. Expiry is controlled by the `timeToLive` property
     * and this property is computed from `enqueuedTimeUtc` + `timeToLive`.
     */
    readonly expiresAtUtc?: Date;
    /**
     * @property {Date} [lockedUntilUtc] The date and time in UTC until which the message will be
     * locked in the queue/subscription. For messages retrieved under a lock (peek-lock receive mode,
     * not pre-settled) this property reflects the UTC instant until which the message is held
     * locked in the queue/subscription. When the lock expires, the `deliveryCount` is incremented
     * and the message is again available for retrieval.
     */
    lockedUntilUtc?: Date;
    /**
     * @property {number} [enqueuedSequenceNumber] The original sequence number of the message. For
     * messages that have been auto-forwarded, this property reflects the sequence number that had
     * first been assigned to the message at its original point of submission.
     * @readonly
     */
    readonly enqueuedSequenceNumber?: number;
    /**
     * @property {number} [sequenceNumber] The unique number assigned to a message by Service Bus.
     * The sequence number is a unique 64-bit integer assigned to a message as it is accepted
     * and stored by the broker and functions as its true identifier. For partitioned entities,
     * the topmost 16 bits reflect the partition identifier. Sequence numbers monotonically increase.
     * They roll over to 0 when the 48-64 bit range is exhausted.
     *
     * **Max safe integer** that Javascript currently supports is `2^53 - 1`. The sequence number
     * is an AMQP `Long` type which can be upto 64 bits long. To represent that we are using a
     * library named {@link https://github.com/dcodeIO/long.js long.js}. We expect customers
     * to use the **`Long`** type exported by this library.
     * @readonly
     */
    readonly sequenceNumber?: Long;
    /**
     * @property {string} [deadLetterSource] The name of the queue or subscription that this message
     * was enqueued on, before it was deadlettered. Only set in messages that have been dead-lettered
     * and subsequently auto-forwarded from the dead-letter queue to another entity. Indicates the
     * entity in which the message was dead-lettered.
     * @readonly
     */
    readonly deadLetterSource?: string;
    /**
     * @property {AmqpMessage} _amqpMessage The underlying raw amqp message.
     * @readonly
     */
    readonly _amqpMessage: AmqpMessage;
}
/**
 * Describes the module that is responsible for converting the message received from ServiceBus
 * to/from AmqpMessage.
 */
export declare module ReceivedMessageInfo {
    /**
     * @ignore
     */
    function validate(msg: ReceivedMessageInfo): void;
    /**
     * @ignore
     * Converts given ReceivedMessageInfo to AmqpMessage
     */
    function toAmqpMessage(msg: ReceivedMessageInfo): AmqpMessage;
    /**
     * @ignore
     * Converts given AmqpMessage to ReceivedMessageInfo
     */
    function fromAmqpMessage(msg: AmqpMessage, delivery?: Delivery): ReceivedMessageInfo;
}
/**
 * Describes the message received from ServiceBus.
 * @interface ReceivedMessage
 */
interface ReceivedMessage extends ReceivedMessageInfo {
    complete(): Promise<void>;
    abandon(propertiesToModify?: {
        [key: string]: any;
    }): Promise<void>;
    defer(propertiesToModify?: {
        [key: string]: any;
    }): Promise<void>;
    deadLetter(options?: DeadLetterOptions): Promise<void>;
}
/**
 * Describes the message received from ServiceBus.
 * @class ServiceBusMessage
 */
export declare class ServiceBusMessage implements ReceivedMessage {
    /**
     * @property {any} body - The message body that needs to be sent or is received.
     */
    body: any;
    /**
     * @property {{ [key: string]: any }} [userProperties] The application specific properties.
     */
    userProperties?: {
        [key: string]: any;
    };
    /**
     * @property {string | number | Buffer} [messageId] The message identifier is an
     * application-defined value that uniquely identifies the message and its payload. The identifier
     * is a free-form string and can reflect a GUID or an identifier derived from the application
     * context. If enabled, the
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/duplicate-detection duplicate detection}
     * identifies and removes second and further submissions of messages with the same MessageId.
     */
    messageId?: string | number | Buffer;
    /**
     * @property {string} [contentType] The content type of the message. Optionally describes
     * the payload of the message, with a descriptor following the format of RFC2045, Section 5, for
     * example "application/json".
     */
    contentType?: string;
    /**
     * @property {string | number | Buffer} [correlationId] The correlation identifier that allows an
     * application to specify a context for the message for the purposes of correlation, for example
     * reflecting the MessageId of a message that is being replied to.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    correlationId?: string | number | Buffer;
    /**
     * @property {string} [partitionKey] The partition key for sending a message to a
     * partitioned entity. Maximum length is 128 characters. For {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-partitioning partitioned entities},
     * etting this value enables assigning related messages to the same internal partition,
     * so that submission sequence order is correctly recorded. The partition is chosen by a hash
     * function over this value and cannot be chosen directly. For session-aware entities,
     * the `sessionId` property overrides this value.
     */
    partitionKey?: string;
    /**
     * @property {string} [viaPartitionKey] The partition key for sending a message into an entity
     * via a partitioned transfer queue. Maximum length is 128 characters. If a message is sent via a
     * transfer queue in the scope of a transaction, this value selects the transfer queue partition:
     * This is functionally equivalent to `partitionKey` property and ensures that messages are kept
     * together and in order as they are transferred.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-transactions#transfers-and-send-via Transfers and Send Via}.
     */
    viaPartitionKey?: string;
    /**
     * @property {string} [sessionId] The session identifier for a session-aware entity. Maximum
     * length is 128 characters. For session-aware entities, this application-defined value specifies
     * the session affiliation of the message. Messages with the same session identifier are subject
     * to summary locking and enable exact in-order processing and demultiplexing. For
     * session-unaware entities, this value is ignored.
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/message-sessions Message Sessions}.
     */
    sessionId?: string;
    /**
     * @property {string} [replyToSessionId] The session identifier augmenting the `replyTo` address.
     * Maximum length is 128 characters. This value augments the ReplyTo information and specifies
     * which SessionId should be set for the reply when sent to the reply entity.
     * See {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    replyToSessionId?: string;
    /**
     * @property {number} [timeToLive] The message’s time to live value. This value is the relative
     * duration after which the message expires, starting from the instant the message has been
     * accepted and stored by the broker, as captured in `enqueuedTimeUtc`. When not set explicitly,
     * the assumed value is the DefaultTimeToLive for the respective queue or topic. A message-level
     * `timeToLive` value cannot be longer than the entity's DefaultTimeToLive setting and it is
     * silently adjusted if it does. See
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/message-expiration Expiration}.
     */
    timeToLive?: number;
    /**
     * @property {string} [label] The application specific label. This property enables the
     * application to indicate the purpose of the message to the receiver in a standardized. fashion,
     * similar to an email subject line. The mapped AMQP property is "subject".
     */
    label?: string;
    /**
     * @property {string} [to] The "to" address. This property is reserved for future use in routing
     * scenarios and presently ignored by the broker itself. Applications can use this value in
     * rule-driven {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-auto-forwarding auto-forward chaining}
     * scenarios to indicate the intended logical destination of the message.
     */
    to?: string;
    /**
     * @property {string} [replyTo] The address of an entity to send replies to. This optional and
     * application-defined value is a standard way to express a reply path to the receiver of the
     * message. When a sender expects a reply, it sets the value to the absolute or relative path of
     * the queue or topic it expects the reply to be sent to. See
     * {@link https://docs.microsoft.com/azure/service-bus-messaging/service-bus-messages-payloads?#message-routing-and-correlation Message Routing and Correlation}.
     */
    replyTo?: string;
    /**
     * @property {Date} [scheduledEnqueueTimeUtc] The date and time in UTC at which the message will
     * be enqueued. This property returns the time in UTC; when setting the property, the
     * supplied DateTime value must also be in UTC. This value is for delayed message sending.
     * It is utilized to delay messages sending to a specific time in the future. Message enqueuing
     * time does not mean that the message will be sent at the same time. It will get enqueued,
     * but the actual sending time depends on the queue's workload and its state.
     */
    scheduledEnqueueTimeUtc?: Date;
    /**
     * @property {string} [lockToken] The lock token for the current message. The lock token is a
     * reference to the lock that is being held by the broker in `ReceiveMode.PeekLock` mode. Locks
     * are used to explicitly settle messages as explained in the {@link https://docs.microsoft.com/azure/service-bus-messaging/message-transfers-locks-settlement product documentation in more detail}
     * The token can also be used to pin the lock permanently through the {@link https://docs.microsoft.com/azure/service-bus-messaging/message-deferral Deferral API}
     * and, with that, take the message out of the regular delivery state flow.
     * @readonly
     */
    readonly lockToken?: string;
    /**
     * @property {number} [deliveryCount] The current delivery count. The value start from 1. Number
     * of deliveries that have been attempted for this message. The count is incremented when a
     * message lock expires, or the message is explicitly abandoned by the receiver.
     * @readonly
     */
    readonly deliveryCount?: number;
    /**
     * @property {Date} [enqueuedTimeUtc] The date and time of the sent message in UTC. The UTC
     * instant at which the message has been accepted and stored in the entity. This value can be
     * used as an authoritative and neutral arrival time indicator when the receiver does not
     * want to trust the sender's clock.
     * @readonly
     */
    readonly enqueuedTimeUtc?: Date;
    /**
     * @property {Date} [expiresAtUtc] The date and time in UTC at which the message is set to expire.
     * The UTC instant at which the message is marked for removal and no longer available for
     * retrieval from the entity due to expiration. Expiry is controlled by the `timeToLive` property
     * and this property is computed from `enqueuedTimeUtc` + `timeToLive`.
     */
    readonly expiresAtUtc?: Date;
    /**
     * @property {Date} [lockedUntilUtc] The date and time in UTC until which the message will be
     * locked in the queue/subscription. For messages retrieved under a lock (peek-lock receive mode,
     * not pre-settled) this property reflects the UTC instant until which the message is held
     * locked in the queue/subscription. When the lock expires, the `deliveryCount` is incremented
     * and the message is again available for retrieval.
     */
    lockedUntilUtc?: Date;
    /**
     * @property {number} [enqueuedSequenceNumber] The original sequence number of the message. For
     * messages that have been auto-forwarded, this property reflects the sequence number that had
     * first been assigned to the message at its original point of submission.
     * @readonly
     */
    readonly enqueuedSequenceNumber?: number;
    /**
     * @property {number} [sequenceNumber] The unique number assigned to a message by Service Bus.
     * The sequence number is a unique 64-bit integer assigned to a message as it is accepted
     * and stored by the broker and functions as its true identifier. For partitioned entities,
     * the topmost 16 bits reflect the partition identifier. Sequence numbers monotonically increase.
     * They roll over to 0 when the 48-64 bit range is exhausted.
     * @readonly
     */
    readonly sequenceNumber?: Long;
    /**
     * @property {string} [deadLetterSource] The name of the queue or subscription that this message
     * was enqueued on, before it was deadlettered. Only set in messages that have been dead-lettered
     * and subsequently auto-forwarded from the dead-letter queue to another entity. Indicates the
     * entity in which the message was dead-lettered.
     * @readonly
     */
    readonly deadLetterSource?: string;
    /**
     * The associated delivery of the received message.
     */
    readonly delivery: Delivery;
    /**
     * @property {AmqpMessage} _amqpMessage The underlying raw amqp message.
     * @readonly
     */
    readonly _amqpMessage: AmqpMessage;
    /**
     * @property {ClientEntityContext} _context The client entity context.
     * @readonly
     */
    private readonly _context;
    /**
     * Completes a message using it's lock token. This will delete the message from ServiceBus.
     * @returns Promise<void>.
     */
    complete(): Promise<void>;
    /**
     * Abandons a message using it's lock token. This will make the message available again in
     * Service Bus for processing.
     * @param {{ [key: string]: any }} propertiesToModify The properties of the message to modify while
     * abandoning the message. Abandoning a message will increase the delivery count on the message.
     * @return Promise<void>.
     */
    abandon(propertiesToModify?: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * Defers the processing of the message. In order to receive this message again in the future,
     * you will need to save the `sequenceNumber` and receive it
     * using `receiveDeferredMessage(sequenceNumber)`. Deferring messages does not impact message's
     * expiration, meaning that deferred messages can still expire.
     * @param [propertiesToModify] The properties of the message to modify while
     * deferring the message
     * @returns Promise<void>
     */
    defer(propertiesToModify?: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * Moves the message to the deadletter sub-queue.
     * @param [options] The DeadLetter options that can be provided while
     * rejecting the message.
     * @returns Promise<void>
     */
    deadLetter(options?: DeadLetterOptions): Promise<void>;
    /**
     * Creates a clone of the current message to allow it to be re-sent to the queue
     * @returns ServiceBusMessage
     */
    clone(): SendableMessageInfo;
}
export {};
//# sourceMappingURL=serviceBusMessage.d.ts.map