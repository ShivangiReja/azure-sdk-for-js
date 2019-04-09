import * as Long from "long";
import { ReceivedMessageInfo } from "./serviceBusMessage";
import { Client } from "./client";
import { SessionReceiverOptions } from "./session/messageSession";
import { Sender } from "./sender";
import { Receiver, MessageReceiverOptions, SessionReceiver } from "./receiver";
import { AmqpError } from "rhea-promise";
/**
 * Describes the client that allows interacting with a Service Bus Queue.
 * Use the `createQueueClient` function on the Namespace object to instantiate a QueueClient
 * @class QueueClient
 */
export declare class QueueClient implements Client {
    /**
     * @property {string} The entitypath for the Service Bus Queue for which this client is created.
     */
    readonly entityPath: string;
    /**
     * @property {string} A unique identifier for the client.
     */
    readonly id: string;
    /**
     * @property {boolean} _isClosed Denotes if close() was called on this client.
     */
    private _isClosed;
    /**
     * @property {ClientEntityContext} _context Describes the amqp connection context for the QueueClient.
     */
    private _context;
    private _currentReceiver;
    private _currentSender;
    /**
     * Closes all the AMQP links for sender/receivers created by this client.
     * Once closed, neither the QueueClient nor its sender/recievers can be used for any
     * further operations. Use the `createQueueClient` function on the Namespace object to
     * instantiate a new QueueClient
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Will reconnect the queueClient and all its sender/receiver links.
     * This is meant for the library to use to resume sending/receiving when retryable errors are seen.
     * This is not meant for the consumer of this library to use.
     * @ignore
     * @param error Error if any due to which we are attempting to reconnect
     */
    detached(error?: AmqpError | Error): Promise<void>;
    /**
     * Gets a Sender to be used for sending messages, scheduling messages to be sent at a later time
     * and cancelling such scheduled messages.
     */
    getSender(): Sender;
    /**
     * Gets a Receiver to be used for receiving messages in batches or by registering handlers.
     *
     * @param options Options for creating the receiver.
     */
    getReceiver(options?: MessageReceiverOptions): Receiver;
    /**
     * Fetches the next batch of active messages (including deferred but not deadlettered messages).
     * The first call to `peek()` fetches the first active message. Each subsequent call fetches the
     * subsequent message.
     *
     * Unlike a `received` message, `peeked` message is a read-only version of the message.
     * It cannot be `Completed/Abandoned/Deferred/Deadlettered`. The lock on it cannot be renewed.
     *
     * @param [messageCount] The number of messages to retrieve. Default value `1`.
     * @returns Promise<ReceivedSBMessage[]>
     */
    peek(messageCount?: number): Promise<ReceivedMessageInfo[]>;
    /**
     * Peeks the desired number of active messages (including deferred but not deadlettered messages)
     * from the specified sequence number.
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
     * Gets a SessionReceiver for receiving messages in batches or by registering handlers from a
     * session enabled Queue. When no sessionId is given, a random session among the available
     * sessions is used.
     *
     * @param options Options to provide sessionId and ReceiveMode for receiving messages from the
     * session enabled Servicebus Queue.
     *
     * @returns SessionReceiver An instance of a SessionReceiver to receive messages from the session.
     */
    getSessionReceiver(options?: SessionReceiverOptions): Promise<SessionReceiver>;
    /**
     * Throws error if this queueClient has been closed
     * @param client
     */
    private throwErrorIfClientOrConnectionClosed;
}
//# sourceMappingURL=queueClient.d.ts.map