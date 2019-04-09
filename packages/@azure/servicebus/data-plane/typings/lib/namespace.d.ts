import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
import { QueueClient } from "./queueClient";
import { TopicClient } from "./topicClient";
import { DataTransformer, TokenProvider } from "@azure/amqp-common";
import { SubscriptionClient } from "./subscriptionClient";
/**
 * Describes the options that can be provided while creating the Namespace.
 * @interface NamespaceOptions
 */
export interface NamespaceOptions {
    /**
     * @property {DataTransformer} [dataTransformer] The data transformer that will be used to encode
     * and decode the sent and received messages respectively. If not provided then we will use the
     * DefaultDataTransformer. The default transformer should handle majority of the cases. This
     * option needs to be used only for specialized scenarios.
     */
    dataTransformer?: DataTransformer;
}
/**
 * Holds the AMQP connection to the Service Bus Namespace and is the entry point for using Queues,
 * Topics and Subscriptions.
 */
export declare class Namespace {
    /**
     * @property {string} name The namespace name of the service bus.
     */
    readonly name: string;
    /**
     * @property {ConnectionContext} _context Describes the amqp connection context for the Namespace.
     * @private
     */
    private _context;
    /**
     * Instantiates a client pointing to the Service Bus Namespace.
     *
     * @constructor
     * @param {ConnectionConfig} config - The connection configuration to create the Namespace.
     * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for
     * authentication.
     * @param {NamespaceOptions} - Options to create the Namespace.
     */
    private constructor();
    /**
     * Creates a QueueClient for the given Queue name. It assumes that the queue has already been
     * created.
     * @param {string} queueName The queue name.
     * @returns QueueClient.
     */
    createQueueClient(queueName: string): QueueClient;
    /**
     * Creates a TopicClient for the given topic name. It assumes that the topic has already been
     * created.
     * @param {string} topicName The topic name.
     * @returns TopicClient.
     */
    createTopicClient(topicName: string): TopicClient;
    /**
     * Creates a SubscriptionClient for the given topic name and subscription.
     * It assumes that the topic has already been created.
     * @param {string} topicName The topic name.
     * @param {string} subscriptionName The subscription name.
     * @returns SubscriptionClient.
     */
    createSubscriptionClient(topicName: string, subscriptionName: string): SubscriptionClient;
    /**
     * Closes the AMQP connection created by this namespace along with AMQP links for sender/receivers
     * created by the queue/topic/subscription clients created in this namespace.
     * Once closed,
     * - the namespace cannot be used to create anymore clients for queues/topics/subscriptions
     * - the clients created in this namespace cannot be used to send/receive messages anymore
     * @returns {Promise<any>}
     */
    close(): Promise<any>;
    /**
     * Creates a Namespace from connection string.
     * @param {string} connectionString - Connection string of the form
     * 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {NamespaceOptions} [options] Options that can be provided during namespace creation.
     * @returns {Namespace} - An instance of the Namespace.
     */
    static createFromConnectionString(connectionString: string, options?: NamespaceOptions): Namespace;
    /**
     * Creates a Namespace from a generic token provider.
     * @param {string} host - Fully qualified domain name for Servicebus. Most likely,
     * `<yournamespace>.servicebus.windows.net`.
     * @param {TokenProvider} tokenProvider - Your token provider that implements the TokenProvider interface.
     * @param {NamespaceOptions} options - The options that can be provided during namespace creation.
     * @returns {Namespace} An instance of the Namespace.
     */
    static createFromTokenProvider(host: string, tokenProvider: TokenProvider, options?: NamespaceOptions): Namespace;
    /**
     * Creates a Namespace from AADTokenCredentials.
     * @param {string} host - Fully qualified domain name for ServiceBus.
     * Most likely, {yournamespace}.servicebus.windows.net
     * @param {TokenCredentials} credentials - The AAD Token credentials.
     * It can be one of the following: ApplicationTokenCredentials | UserTokenCredentials |
     * DeviceTokenCredentials | MSITokenCredentials.
     * @param {NamespaceOptions} options - The options that can be provided during namespace creation.
     * @returns {Namespace} An instance of the Namespace.
     */
    static createFromAadTokenCredentials(host: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials, options?: NamespaceOptions): Namespace;
    /**
     * Returns the corresponding dead letter queue name for the given queue name.
     * Use this in the `createQueueClient` function to receive messages from dead letter queue.
     * @param queueName
     */
    static getDeadLetterQueuePath(queueName: string): string;
    /**
     * Returns the corresponding dead letter topic name for the given topic and subscription names.
     * Use this in the `createSubscriptionClient` function to receive messages from dead letter
     * subscription corresponding to given subscription
     * @param topicName
     * @param subscriptionName
     */
    static getDeadLetterTopicPath(topicName: string, subscriptionName: string): string;
}
//# sourceMappingURL=namespace.d.ts.map