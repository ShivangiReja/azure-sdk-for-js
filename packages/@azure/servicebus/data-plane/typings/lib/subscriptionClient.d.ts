/// <reference types="long" />
import { Receiver, MessageReceiverOptions, SessionReceiver } from "./receiver";
import { ReceivedMessageInfo } from "./serviceBusMessage";
import { Client } from "./client";
import { CorrelationFilter, RuleDescription } from "./core/managementClient";
import { SessionReceiverOptions } from "./session/messageSession";
import { AmqpError } from "rhea-promise";
/**
 * Describes the client that allows interacting with a Service Bus Subscription.
 * Use the `createSubscriptionClient` function on the Namespace object to instantiate a
 * SubscriptionClient
 * @class SubscriptionClient
 */
export declare class SubscriptionClient implements Client {
    /**
     * @property {string}  The topic name.
     */
    readonly topicName: string;
    /**
     * @property {string}  The subscription name.
     */
    readonly subscriptionName: string;
    /**
     * @property {string} defaultRuleName Name of the default rule on the subscription.
     */
    readonly defaultRuleName: string;
    /**
     * @property {string} The entitypath for the Service Bus Subscription for which this client is created.
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
    /**
     * Closes the AMQP link for the receivers created by this client.
     * Once closed, neither the SubscriptionClient nor its recievers can be used for any
     * further operations. Use the `createSubscriptionClient` function on the Namespace object to
     * instantiate a new SubscriptionClient.
     *
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Will reconnect the subscritpionClient and its receiver links.
     * This is meant for the library to use to resume receiving when retryable errors are seen.
     * This is not meant for the consumer of this library to use.
     * @ignore
     * @param error Error if any due to which we are attempting to reconnect
     */
    detached(error?: AmqpError | Error): Promise<void>;
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
     * Get all the rules associated with the subscription
     */
    getRules(): Promise<RuleDescription[]>;
    /**
     * Removes the rule on the subscription identified by the given rule name.
     * @param ruleName
     */
    removeRule(ruleName: string): Promise<void>;
    /**
     * Adds a rule on the subscription as defined by the given rule name, filter and action.
     * Remember to remove the default true filter on the subscription before adding a rule,
     * otherwise, the added rule will have no affect as the true filter will always result in
     * the subscription receiving all messages.
     * @param ruleName Name of the rule
     * @param filter A Boolean, SQL expression or a Correlation filter. For SQL Filter syntax, see
     * {@link https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-sql-filter SQLFilter syntax}.
     * @param sqlRuleActionExpression Action to perform if the message satisfies the filtering expression. For SQL Rule Action syntax,
     * see {@link https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-sql-rule-action SQLRuleAction syntax}.
     */
    addRule(ruleName: string, filter: boolean | string | CorrelationFilter, sqlRuleActionExpression?: string): Promise<void>;
    /**
     * Gets a SessionReceiver for receiving messages in batches or by registering handlers from a
     * session enabled Subscription. When no sessionId is given, a random session among the available
     * sessions is used.
     *
     * @param options Options to provide sessionId and ReceiveMode for receiving messages from the
     * session enabled Servicebus Subscription.
     *
     * @returns SessionReceiver An instance of a SessionReceiver to receive messages from the session.
     */
    getSessionReceiver(options?: SessionReceiverOptions): Promise<SessionReceiver>;
    /**
     * Throws error if this subscriptionClient has been closed
     * @param client
     */
    private throwErrorIfClientOrConnectionClosed;
}
//# sourceMappingURL=subscriptionClient.d.ts.map