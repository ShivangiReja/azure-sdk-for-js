import { EventHubReceiver } from "./eventHubReceiver";
import { EventHubSender } from "./eventHubSender";
import { ConnectionContextBase, EventHubConnectionConfig } from "@azure/amqp-common";
import { ManagementClient } from "./managementClient";
import { ClientOptions } from "./eventHubClient";
import { Dictionary } from "rhea-promise";
/**
 * @interface ConnectionContext
 * @ignore
 * Provides contextual information like the underlying amqp connection, cbs session, management session,
 * tokenProvider, senders, receivers, etc. about the EventHub client.
 */
export interface ConnectionContext extends ConnectionContextBase {
    /**
     * @property {EventHubConnectionConfig} config The EventHub connection config that is created after
     * parsing the connection string.
     */
    readonly config: EventHubConnectionConfig;
    /**
     * @property {boolean} wasConnectionCloseCalled Indicates whether the close() method was
     * called on theconnection object.
     */
    wasConnectionCloseCalled: boolean;
    /**
     * @property {Dictionary<EventHubReceiver>} receivers A dictionary of the EventHub Receivers associated with this client.
     */
    receivers: Dictionary<EventHubReceiver>;
    /**
     * @property {Dictionary<EventHubSender>} senders A dictionary of the EventHub Senders associated with this client.
     */
    senders: Dictionary<EventHubSender>;
    /**
     * @property {ManagementClient} managementSession A reference to the management session ($management endpoint) on
     * the underlying amqp connection for the EventHub Client.
     */
    managementSession?: ManagementClient;
}
export interface ConnectionContextOptions extends ClientOptions {
    managementSessionAddress?: string;
    managementSessionAudience?: string;
}
export declare namespace ConnectionContext {
    function getUserAgent(options: ConnectionContextOptions): string;
    function create(config: EventHubConnectionConfig, options?: ConnectionContextOptions): ConnectionContext;
}
//# sourceMappingURL=connectionContext.d.ts.map