import { EventData } from "@azure/event-hubs";
import { LeaseInfo } from "./azureBlobLease";
/**
 * Describes the checkoint information.
 * @interface CheckpointInfo
 */
export interface CheckpointInfo {
    /**
     * @property {string} partitionId The EventHub partition id.
     */
    partitionId: string;
    /**
     * @property {string} offset The offset of the event to be checked in.
     */
    offset: string;
    /**
     * @property {string} sequenceNumber The sequence number of the event to be checked in.
     */
    sequenceNumber: number;
}
/**
 * Describes the checkoint information.
 * @namespace CheckpointInfo
 */
export declare namespace CheckpointInfo {
    /**
     * Creates the checkpoint info
     * @param {string} partitionId The partition id for the checkpoint
     * @param {string} [offset] The offset of the event to be checked in.
     * @param {number} [sequenceNumber] The sequence number of the event to be checked in.
     * @return {CheckpointInfo} CheckpointInfo
     */
    function create(partitionId: string, offset?: string, sequenceNumber?: number): CheckpointInfo;
    /**
     * Creates the checkpoint info
     * @param {LeaseInfo} lease The lease info from which the checkpoint info needs to created.
     * @return {CheckpointInfo} CheckpointInfo
     */
    function createFromLease(lease: LeaseInfo): CheckpointInfo;
    /**
     * Creates the checkpoint info.
     * @param {string} partitionId The partition id for the checkpoint
     * @param {EventData} eventData The event data from which the checkpoint info needs to created.
     * @return {CheckpointInfo} CheckpointInfo
     */
    function createFromEventData(partitionId: string, eventData: EventData): CheckpointInfo;
}
//# sourceMappingURL=checkpointInfo.d.ts.map