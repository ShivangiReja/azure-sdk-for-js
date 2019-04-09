import * as Long from "long";
import { MessageHandlerOptions } from "./core/streamingReceiver";
import { OnError, OnMessage } from "./core/messageReceiver";
import { ServiceBusMessage, ReceiveMode, ReceivedMessageInfo } from "./serviceBusMessage";
import { SessionMessageHandlerOptions } from "./session/messageSession";
/**
 * Describes the options for creating a Receiver.
 */
export interface MessageReceiverOptions {
    /**
     * An enum indicating the mode in which messages should be received.
     * Possible values are `ReceiveMode.peekLock` (default) and `ReceiveMode.receiveAndDelete`
     */
    receiveMode?: ReceiveMode;
}
/**
 * The Receiver class can be used to receive messages in a batch or by registering handlers.
 * Use the `getReceiver` function on the QueueClient or SubscriptionClient to instantiate a Receiver.
 * The Receiver class is an abstraction over the underlying AMQP receiver link.
 * @class Receiver
 */
export declare class Receiver {
    /**
     * @property {ClientEntityContext} _context Describes the amqp connection context for the QueueClient.
     */
    private _context;
    private _receiveMode;
    private _isClosed;
    /**
     * @property {boolean} [isClosed] Denotes if close() was called on this receiver.
     * @readonly
     */
    readonly isClosed: boolean;
    /**
     * Registers handlers to deal with the incoming stream of messages over an AMQP receiver link
     * from a Queue/Subscription.
     * To stop receiving messages, call `close()` on the Receiver or set the property
     * `newMessageWaitTimeoutInSeconds` in the options to provide a timeout.
     *
     * @param onMessage - Handler for processing each incoming message.
     * @param onError - Handler for any error that occurs while receiving or processing messages.
     * @param options - Options to control if messages should be automatically completed, and/or have
     * their locks automatically renewed. You can control the maximum number of messages that should
     * be concurrently processed. You can also provide a timeout in seconds to denote the
     * amount of time to wait for a new message before closing the receiver.
     *
     * @returns void
     */
    receive(onMessage: OnMessage, onError: OnError, options?: MessageHandlerOptions): void;
    /**
     * Returns a batch of messages based on given count and timeout over an AMQP receiver link
     * from a Queue/Subscription.
     *
     * @param maxMessageCount      The maximum number of messages to receive from Queue/Subscription.
     * @param idleTimeoutInSeconds The maximum wait time in seconds for which the Receiver
     * should wait to receive the first message. If no message is received by this time,
     * the returned promise gets resolved to an empty array.
     * - **Default**: `60` seconds.
     * @returns Promise<ServiceBusMessage[]> A promise that resolves with an array of Message objects.
     */
    receiveBatch(maxMessageCount: number, idleTimeoutInSeconds?: number): Promise<ServiceBusMessage[]>;
    /**
     * Renews the lock on the message.
     *
     * When a message is received in `PeekLock` mode, the message is locked on the server for this
     * receiver instance for a duration as specified during the Queue/Subscription creation
     * (LockDuration). If processing of the message requires longer than this duration, the
     * lock needs to be renewed. For each renewal, it resets the time the message is locked by the
     * LockDuration set on the Entity.
     *
     * @param lockTokenOrMessage - Lock token of the message or the message itself.
     * @returns Promise<Date> - New lock token expiry date and time in UTC format.
     */
    renewLock(lockTokenOrMessage: string | ServiceBusMessage): Promise<Date>;
    /**
     * Receives a deferred message identified by the given `sequenceNumber`.
     * @param sequenceNumber The sequence number of the message that will be received.
     * @returns Promise<ServiceBusMessage | undefined>
     * - Returns `Message` identified by sequence number.
     * - Returns `undefined` if no such message is found.
     * - Throws an error if the message has not been deferred.
     */
    receiveDeferredMessage(sequenceNumber: Long): Promise<ServiceBusMessage | undefined>;
    /**
     * Receives a list of deferred messages identified by given `sequenceNumbers`.
     * @param sequenceNumbers A list containing the sequence numbers to receive.
     * @returns Promise<ServiceBusMessage[]>
     * - Returns a list of messages identified by the given sequenceNumbers.
     * - Returns an empty list if no messages are found.
     * - Throws an error if the messages have not been deferred.
     */
    receiveDeferredMessages(sequenceNumbers: Long[]): Promise<ServiceBusMessage[]>;
    /**
     * Closes the underlying AMQP receiver link.
     * Once closed, the receiver cannot be used for any further operations.
     * Use the `getReceiver` function on the QueueClient or SubscriptionClient to instantiate
     * a new Receiver
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Indicates whether the receiver is currently receiving messages or not.
     * When this return true, a new receive() or receiveBatch() call cannot be made.
     */
    isReceivingMessages(): boolean;
    private validateNewReceiveCall;
    private throwIfReceiverOrConnectionClosed;
}
/**
 * The SessionReceiver class can be used to receive messages from a session enabled Queue or
 * Subscription in a batch or by registering handlers.
 * Use the `getSessionReceiver` function on the QueueClient or SubscriptionClient to instantiate a
 * SessionReceiver.
 * The SessionReceiver class is an abstraction over the underlying AMQP receiver link.
 * @class SessionReceiver
 */
export declare class SessionReceiver {
    /**
     * @property {ClientEntityContext} _context Describes the amqp connection context for the QueueClient.
     */
    private _context;
    private _receiveMode;
    private _sessionId;
    private _messageSession;
    /**
     * @property {boolean} [isClosed] Denotes if close() was called on this receiver.
     * @readonly
     */
    readonly isClosed: boolean;
    /**
     * @property {string} [sessionId] The sessionId for the message session.
     * @readonly
     */
    readonly sessionId: string;
    /**
     * @property {Date} [sessionLockedUntilUtc] The time in UTC until which the session is locked.
     * @readonly
     */
    readonly sessionLockedUntilUtc: Date | undefined;
    /**
     * Renews the lock for the Session.
     * @returns Promise<Date> New lock token expiry date and time in UTC format.
     */
    renewLock(): Promise<Date>;
    /**
     * Sets the state of the MessageSession.
     * @param state The state that needs to be set.
     */
    setState(state: any): Promise<void>;
    /**
     * Gets the state of the MessageSession.
     * @returns Promise<any> The state of that session
     */
    getState(): Promise<any>;
    /**
     * Fetches the next batch of active messages (including deferred but not deadlettered messages) in
     * the current session. The first call to `peek()` fetches the first active message. Each
     * subsequent call fetches the subsequent message.
     *
     * Unlike a `received` message, `peeked` message is a read-only version of the message.
     * It cannot be `Completed/Abandoned/Deferred/Deadlettered`. The lock on it cannot be renewed.
     *
     * @param messageCount The number of messages to retrieve. Default value `1`.
     * @returns Promise<ReceivedMessageInfo[]>
     */
    peek(messageCount?: number): Promise<ReceivedMessageInfo[]>;
    /**
     * Peeks the desired number of active messages (including deferred but not deadlettered messages)
     * from the specified sequence number in the current session.
     *
     * Unlike a `received` message, `peeked` message is a read-only version of the message.
     * It cannot be `Completed/Abandoned/Deferred/Deadlettered`. The lock on it cannot be renewed.
     *
     * @param fromSequenceNumber The sequence number from where to read the message.
     * @param [messageCount] The number of messages to retrieve. Default value `1`.
     * @returns Promise<ReceivedSBMessage[]>
     */
    peekBySequenceNumber(fromSequenceNumber: Long, messageCount?: number): Promise<ReceivedMessageInfo[]>;
    /**
     * Receives a deferred message identified by the given `sequenceNumber`.
     * @param sequenceNumber The sequence number of the message that will be received.
     * @returns Promise<ServiceBusMessage | undefined>
     * - Returns `Message` identified by sequence number.
     * - Returns `undefined` if no such message is found.
     * - Throws an error if the message has not been deferred.
     */
    receiveDeferredMessage(sequenceNumber: Long): Promise<ServiceBusMessage | undefined>;
    /**
     * Receives a list of deferred messages identified by given `sequenceNumbers`.
     * @param sequenceNumbers A list containing the sequence numbers to receive.
     * @returns Promise<ServiceBusMessage[]>
     * - Returns a list of messages identified by the given sequenceNumbers.
     * - Returns an empty list if no messages are found.
     * - Throws an error if the messages have not been deferred.
     */
    receiveDeferredMessages(sequenceNumbers: Long[]): Promise<ServiceBusMessage[]>;
    /**
     * Returns a batch of messages based on given count and timeout over an AMQP receiver link
     * from a Queue/Subscription.
     *
     * @param maxMessageCount      The maximum number of messages to receive from Queue/Subscription.
     * @param maxWaitTimeInSeconds The maximum wait time in seconds for which the Receiver
     * should wait to receive the first message. If no message is received by this time,
     * the returned promise gets resolved to an empty array.
     * - **Default**: `60` seconds.
     * @returns Promise<ServiceBusMessage[]> A promise that resolves with an array of Message objects.
     */
    receiveBatch(maxMessageCount: number, maxWaitTimeInSeconds?: number): Promise<ServiceBusMessage[]>;
    /**
     * Registers handlers to deal with the incoming stream of messages over an AMQP receiver link
     * from a Queue/Subscription.
     * To stop receiving messages, call `close()` on the SessionReceiver or set the property
     * `newMessageWaitTimeoutInSeconds` in the options to provide a timeout.
     *
     * @param onMessage - Handler for processing each incoming message.
     * @param onError - Handler for any error that occurs while receiving or processing messages.
     * @param options - Options to control whether messages should be automatically completed
     * or if the lock on the session should be automatically renewed. You can control the
     * maximum number of messages that should be concurrently processed. You can
     * also provide a timeout in seconds to denote the amount of time to wait for a new message
     * before closing the receiver.
     *
     * @returns void
     */
    receive(onMessage: OnMessage, onError: OnError, options?: SessionMessageHandlerOptions): void;
    /**
     * Closes the underlying AMQP receiver link.
     * Once closed, the receiver cannot be used for any further operations.
     * Use the `getSessionReceiver` function on the QueueClient or SubscriptionClient to instantiate
     * a new Receiver
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Indicates whether the receiver is currently receiving messages or not.
     * When this return true, a new receive() or receiveBatch() call cannot be made on the receiver.
     */
    isReceivingMessages(): boolean;
    private throwIfReceiverOrConnectionClosed;
}
//# sourceMappingURL=receiver.d.ts.map