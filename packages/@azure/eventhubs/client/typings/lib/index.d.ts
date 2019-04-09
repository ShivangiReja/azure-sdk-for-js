export { EventData, EventHubDeliveryAnnotations, EventHubMessageAnnotations } from "./eventData";
export { Delivery, AmqpError, Message, MessageHeader, MessageProperties, Dictionary } from "rhea-promise";
export { ReceiverRuntimeInfo, OnMessage, OnError } from "./eventHubReceiver";
export { ReceiveHandler } from "./streamingReceiver";
export { EventHubClient, ReceiveOptions, ClientOptionsBase, ClientOptions } from "./eventHubClient";
export { EventPosition } from "./eventPosition";
export { EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";
export declare const aadEventHubsAudience = "https://eventhubs.azure.net/";
export { delay, Timeout, EventHubConnectionStringModel, parseConnectionString, IotHubConnectionStringModel, StorageConnectionStringModel, isIotHubConnectionString, ErrorNameConditionMapper, ConditionStatusMapper, ConditionErrorNameMapper, MessagingError, DataTransformer, DefaultDataTransformer, TokenType, TokenProvider, TokenInfo, AadTokenProvider, SasTokenProvider, ConnectionConfig, EventHubConnectionConfig } from "@azure/amqp-common";
//# sourceMappingURL=index.d.ts.map