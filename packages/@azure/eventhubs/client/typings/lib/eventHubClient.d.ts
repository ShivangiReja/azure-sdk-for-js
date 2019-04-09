import { Delivery } from "rhea-promise";
import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "@azure/ms-rest-nodeauth";
import { DataTransformer, TokenProvider, EventHubConnectionConfig } from "@azure/amqp-common";
import { OnMessage, OnError } from "./eventHubReceiver";
import { EventData } from "./eventData";
import { EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";
import { EventPosition } from "./eventPosition";
import { ReceiveHandler } from "./streamingReceiver";
/**
 * Describes the required shape of WebSocket instances.
 * @interface WebSocketInstance
 */
export interface WebSocketInstance {
    send: Function;
    onmessage: Function | null;
    onopen: Function | null;
    onclose: Function | null;
    onerror: Function | null;
}
/**
 * Describes the required shape of WebSocket constructors.
 * @interface WebSocketImpl
 */
export interface WebSocketImpl {
    new (url: string, protocols?: string | string[]): WebSocketInstance;
}
/**
 * Describes the options that one can set while receiving messages.
 * @interface ReceiveOptions
 */
export interface ReceiveOptions {
    /**
     * @property {string} [name] The name of the receiver. If not provided then we will set a GUID by default.
     */
    name?: string;
    /**
     * @property {object} [eventPosition] The starting event position at which to start receiving messages.
     * This is used to filter messages for the EventHub Receiver.
     */
    eventPosition?: EventPosition;
    /**
     * @property {string} [consumerGroup] The consumer group to which the receiver wants to connect to.
     * If not provided then it will be connected to "$default" consumer group.
     */
    consumerGroup?: string;
    /**
     * @property {number} [prefetchCount] The upper limit of events this receiver will actively receive
     * regardless of whether a receive operation is pending. Defaults to 1000.
     */
    prefetchCount?: number;
    /**
     * @property {number} [epoch] The epoch value that this receiver is currently using for partition ownership.
     */
    epoch?: number;
    /**
     * @property {string} [identifier] The receiver identifier that uniqely identifies the receiver.
     */
    identifier?: string;
    /**
     * @property {boolean} [enableReceiverRuntimeMetric] A value indicating whether the runtime metric of a receiver is enabled.
     */
    enableReceiverRuntimeMetric?: boolean;
}
/**
 * Describes the base client options.
 * @interface ClientOptionsBase
 */
export interface ClientOptionsBase {
    /**
     * @property {DataTransformer} [dataTransformer] The data transformer that will be used to encode
     * and decode the sent and received messages respectively. If not provided then we will use the
     * DefaultDataTransformer. The default transformer should handle majority of the cases. This
     * option needs to be used only for specialized scenarios.
     */
    dataTransformer?: DataTransformer;
    /**
     * @property {string} [userAgent] The user agent that needs to be appended to the built in
     * user agent string.
     */
    userAgent?: string;
    /**
     * @property {WebSocketImpl} [webSocket] - The WebSocket constructor used to create an AMQP connection
     * over a WebSocket. In browsers, the built-in WebSocket will be  used by default. In Node, a
     * TCP socket will be used if a WebSocket constructor is not provided.
     */
    webSocket?: WebSocketImpl;
    /**
     * @property {string} [webSocketEndpointPath] - The path for the endpoint that accepts an AMQP
     * connection over WebSockets.
     */
    webSocketEndpointPath?: string;
}
/**
 * Describes the options that can be provided while creating the EventHub Client.
 * @interface ClientOptions
 */
export interface ClientOptions extends ClientOptionsBase {
    /**
     * @property {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
     * Default value: SasTokenProvider.
     */
    tokenProvider?: TokenProvider;
}
/**
 * @class EventHubClient
 * Describes the EventHub client.
 */
export declare class EventHubClient {
    /**
     * @property {string} [connectionId] The amqp connection id that uniquely identifies the connection within a process.
     */
    connectionId?: string;
    /**
     * @property {string} eventhubName The name of the Eventhub.
     * @readonly
     */
    readonly eventhubName: string;
    /**
     * @property {ConnectionContext} _context Describes the amqp connection context for the eventhub client.
     * @private
     */
    private _context;
    /**
     * Instantiates a client pointing to the Event Hub given by this configuration.
     *
     * @constructor
     * @param {EventHubConnectionConfig} config - The connection configuration to create the EventHub Client.
     * @param {ClientOptions} options - The optional parameters that can be provided to the EventHub
     * Client constructor.
     */
    constructor(config: EventHubConnectionConfig, options?: ClientOptions);
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @returns {Promise<void>} Promise<void>
     */
    close(): Promise<void>;
    /**
     * Sends the given message to the EventHub.
     *
     * @param {any} data                    Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string|number} [partitionId] Partition ID to which the event data needs to be sent. This should only be specified
     * if you intend to send the event to a specific partition. When not specified EventHub will store the messages in a round-robin
     * fashion amongst the different partitions in the EventHub.
     *
     * @returns {Promise<Delivery>} Promise<Delivery>
     */
    send(data: EventData, partitionId?: string | number): Promise<Delivery>;
    /**
     * Send a batch of EventData to the EventHub. The "message_annotations", "application_properties" and "properties"
     * of the first message will be set as that of the envelope (batch message).
     *
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @param {string|number} [partitionId] Partition ID to which the event data needs to be sent. This should only be specified
     * if you intend to send the event to a specific partition. When not specified EventHub will store the messages in a round-robin
     * fashion amongst the different partitions in the EventHub.
     *
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    sendBatch(datas: EventData[], partitionId?: string | number): Promise<Delivery>;
    /**
     * Starts the receiver by establishing an AMQP session and an AMQP receiver link on the session. Messages will be passed to
     * the provided onMessage handler and error will be passed to the provided onError handler.
     *
     * @param {string|number} partitionId                        Partition ID from which to receive.
     * @param {OnMessage} onMessage                              The message handler to receive event data objects.
     * @param {OnError} onError                                  The error handler to receive an error that occurs
     * while receiving messages.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to receive messages.
     *
     * @returns {ReceiveHandler} ReceiveHandler - An object that provides a mechanism to stop receiving more messages.
     */
    receive(partitionId: string | number, onMessage: OnMessage, onError: OnError, options?: ReceiveOptions): ReceiveHandler;
    /**
     * Receives a batch of EventData objects from an EventHub partition for a given count and a given max wait time in seconds, whichever
     * happens first. This method can be used directly after creating the receiver object and **MUST NOT** be used along with the `start()` method.
     *
     * @param {string|number} partitionId                        Partition ID from which to receive.
     * @param {number} maxMessageCount                           The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds]                    The maximum wait time in seconds for which the Receiver should wait
     * to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to receive messages.
     *
     * @returns {Promise<Array<EventData>>} Promise<Array<EventData>>.
     */
    receiveBatch(partitionId: string | number, maxMessageCount: number, maxWaitTimeInSeconds?: number, options?: ReceiveOptions): Promise<EventData[]>;
    /**
     * Provides the eventhub runtime information.
     * @returns {Promise<EventHubRuntimeInformation>} A promise that resolves with EventHubRuntimeInformation.
     */
    getHubRuntimeInformation(): Promise<EventHubRuntimeInformation>;
    /**
     * Provides an array of partitionIds.
     * @returns {Promise<Array<string>>} A promise that resolves with an Array of strings.
     */
    getPartitionIds(): Promise<Array<string>>;
    /**
     * Provides information about the specified partition.
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     * @returns {Promise<EventHubPartitionRuntimeInformation>} A promise that resoloves with EventHubPartitionRuntimeInformation.
     */
    getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation>;
    /**
     * Creates an EventHub Client from connection string.
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
     * @param {ClientOptions} [options] Options that can be provided during client creation.
     * @returns {EventHubClient} - An instance of the eventhub client.
     */
    static createFromConnectionString(connectionString: string, path?: string, options?: ClientOptions): EventHubClient;
    /**
     * Creates an EventHub Client from connection string.
     * @param {string} iothubConnectionString - Connection string of the form 'HostName=iot-host-name;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {ClientOptions} [options] Options that can be provided during client creation.
     * @returns {Promise<EventHubClient>} - Promise<EventHubClient>.
     */
    static createFromIotHubConnectionString(iothubConnectionString: string, options?: ClientOptions): Promise<EventHubClient>;
    /**
     * Creates an EventHub Client from a generic token provider.
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely,
     * <yournamespace>.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     * @param {TokenProvider} tokenProvider - Your token provider that implements the TokenProvider interface.
     * @param {ClientOptionsBase} options - The options that can be provided during client creation.
     * @returns {EventHubClient} An instance of the Eventhub client.
     */
    static createFromTokenProvider(host: string, entityPath: string, tokenProvider: TokenProvider, options?: ClientOptionsBase): EventHubClient;
    /**
     * Creates an EventHub Client from AADTokenCredentials.
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely,
     * <yournamespace>.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     * @param {TokenCredentials} credentials - The AAD Token credentials. It can be one of the following:
     * ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.
     * @param {ClientOptionsBase} options - The options that can be provided during client creation.
     * @returns {EventHubClient} An instance of the Eventhub client.
     */
    static createFromAadTokenCredentials(host: string, entityPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials, options?: ClientOptionsBase): EventHubClient;
}
//# sourceMappingURL=eventHubClient.d.ts.map