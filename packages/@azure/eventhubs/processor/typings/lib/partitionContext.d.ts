import { EventData, EventPosition } from "@azure/event-hubs";
import { CompleteLease } from "./completeLease";
import { HostContextWithCheckpointLeaseManager } from "./hostContext";
/**
 * Describes the Partition Context.
 * @class PartitionContext
 */
export declare class PartitionContext {
    /**
     * @property {Lease} lease The most recdent checkpointed lease with the partitionId.
     */
    lease: CompleteLease;
    /**
     * @property {string} partitionId The eventhub partition id.
     * @readonly
     */
    readonly partitionId: string;
    /**
     * @property {string} owner The host/owner of the partition.
     * @readonly
     */
    readonly owner: string;
    /**
     * @property {string} eventhubPath The path of the eventhub
     * @readonly
     */
    readonly eventhubPath: string;
    /**
     * @property {string} consumerGroup The name of the consumer group.
     * @readonly
     */
    readonly consumerGroup: string;
    private _context;
    private _offset;
    private _sequenceNumber;
    /**
     * Creates a new PartitionContext.
     * @param {string} partitionId The eventhub partition id.
     * @param {string} owner The name of the owner.
     * @param {CompleteLease} lease The lease object.
     */
    constructor(context: HostContextWithCheckpointLeaseManager, partitionId: string, lease: CompleteLease);
    /**
     * Sets the offset and sequence number of the partition context from the provided EventData.
     * @param {EventData} eventData The event data `received` from the EventHubReceiver.
     */
    setOffsetAndSequenceNumber(eventData: EventData): void;
    /**
     * Writes the current offset and sequenceNumber to the checkpoint store via the checkpoint manager.
     *
     * The checkpoint data is structured as a JSON payload (example):
     * `{ "partitionId":"0","owner":"ephtest","token":"48e209e3-55f0-41b8-a8dd-d9c09ff6c35a",
     * "epoch":1,"offset":"","SequenceNumber":0 }`.
     *
     * @return {Promise<void>}
     */
    checkpoint(): Promise<void>;
    /**
     * Writes the current offset and sequenceNumber to the checkpoint store via the checkpoint manager.
     *
     * The checkpoint data is structured as a JSON payload (example):
     * `{ "partitionId":"0","owner":"ephtest","token":"48e209e3-55f0-41b8-a8dd-d9c09ff6c35a",
     * "epoch":1,"offset":"","SequenceNumber":0 }`.
     *
     * @param {EventData} eventData The event data received from the EventHubReceiver.
     * @return {Promise<void>}
     */
    checkpointFromEventData(eventData: EventData): Promise<void>;
    /**
     * @ignore
     */
    getInitialOffset(): Promise<EventPosition>;
    /**
     * @ignore
     */
    private _persistCheckpoint;
}
//# sourceMappingURL=partitionContext.d.ts.map