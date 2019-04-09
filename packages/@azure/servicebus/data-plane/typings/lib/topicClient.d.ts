import { Client } from "./client";
import { Sender } from "./sender";
import { AmqpError } from "rhea-promise";
/**
 * Describes the client that allows interacting with a Service Bus Topic.
 * Use the `createTopicClient` function on the Namespace object to instantiate a TopicClient
 * @class TopicClient
 */
export declare class TopicClient implements Client {
    /**
     * @property {string} The entitypath for the Service Bus Topic for which this client is created.
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
    private _currentSender;
    /**
     * Closes the AMQP link for the sender created by this client.
     * Once closed, neither the TopicClient nor its senders can be used for any
     * further operations. Use the `createTopicClient` function on the Namespace object to
     * instantiate a new TopicClient
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Will reconnect the topicClient and its sender links.
     * This is meant for the library to use to resume sending when retryable errors are seen.
     * This is not meant for the consumer of this library to use.
     * @ignore
     * @param error Error if any due to which we are attempting to reconnect
     */
    detached(error?: AmqpError | Error): Promise<void>;
    /**
     * Gets a Sender to be used for sending messages, scheduling messages to be sent at a later time
     * and cancelling such scheduled messages.
     *
     * If the Topic has session enabled Subscriptions, then messages sent without the `sessionId`
     * property will go to the dead letter queue of such subscriptions.
     */
    getSender(): Sender;
    /**
     * Throws error if given client has been closed
     * @param client
     */
    private throwErrorIfClientOrConnectionClosed;
}
//# sourceMappingURL=topicClient.d.ts.map