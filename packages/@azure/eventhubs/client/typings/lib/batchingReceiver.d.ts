import { EventData } from "./eventData";
import { ReceiveOptions } from "./eventHubClient";
import { EventHubReceiver } from "./eventHubReceiver";
import { ConnectionContext } from "./connectionContext";
/**
 * Describes the batching receiver where the user can receive a specified number of messages for a predefined time.
 * @class BatchingReceiver
 * @extends EventHubReceiver
 * @ignore
 */
export declare class BatchingReceiver extends EventHubReceiver {
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context                        The connection context.
     * @param {string} partitionId                               Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
     */
    constructor(context: ConnectionContext, partitionId: string | number, options?: ReceiveOptions);
    /**
     * Receive a batch of EventData objects from an EventHub partition for a given count and
     * a given max wait time in seconds, whichever happens first. This method can be used directly
     * after creating the receiver object.
     * @ignore
     * @param {number} maxMessageCount The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds] The maximum wait time in seconds for which the Receiver
     * should wait to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @returns {Promise<EventData[]>} A promise that resolves with an array of EventData objects.
     */
    receive(maxMessageCount: number, maxWaitTimeInSeconds?: number): Promise<EventData[]>;
    /**
     * Creates a batching receiver.
     * @static
     * @ignore
     * @param {ConnectionContext} context    The connection context.
     * @param {string | number} partitionId  The partitionId to receive events from.
     * @param {ReceiveOptions} [options]     Receive options.
     */
    static create(context: ConnectionContext, partitionId: string | number, options?: ReceiveOptions): BatchingReceiver;
}
//# sourceMappingURL=batchingReceiver.d.ts.map