import { ConnectionContext, ConnectionContextOptions } from "../connectionContext";
/**
 * @interface ParsedRedirectError
 * @ignore
 */
export interface ParsedRedirectError {
    endpoint: string;
    entityPath: string;
}
/**
 * @interface EHConfig
 * @ignore
 */
export interface EHConfig extends ParsedRedirectError {
    sharedAccessKey: string;
    sharedAccessKeyName: string;
}
/**
 * @class IotHubClient
 * @ignore
 */
export declare class IotHubClient {
    /**
     * @property {string} connectionString the IotHub connection string.
     */
    connectionString: string;
    constructor(connectionString: string);
    /**
     * Constructs the EventHub connection string by catching the redirect error and parsing the error
     * information.
     * @ignore
     * @param {ConnectionContextOptions} [options] optional parameters to be provided while creating
     * the connection context.
     * @return {Promise<string>} Promise<string>
     */
    getEventHubConnectionString(options?: ConnectionContextOptions): Promise<string>;
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @ignore
     * @returns {Promise<any>}
     */
    close(context: ConnectionContext): Promise<any>;
    private _parseRedirectError;
    private _buildConnectionString;
}
//# sourceMappingURL=iothubClient.d.ts.map