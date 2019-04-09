import { CompleteLeaseInfo, CompleteLease } from "./completeLease";
import { AzureBlob } from "./azureBlob";
/**
 * Describes the properties of a lease.
 * @interface LeaseInfo
 */
export interface LeaseInfo extends CompleteLeaseInfo {
    /**
     * @property {string} token The lease token that manages concurrency between hosts. You can use
     * this token to guarantee single access to any resource needed by the EPH.
     */
    token: string;
    /**
     * @property {string} sequenceNumber The sequence number of the event to be checked in.
     */
    sequenceNumber: number;
    /**
     * @property {string} offset The offset of the event to be checked in.
     */
    offset?: string;
}
/**
 * Describes the properties of a lease representing an Azure Blob.
 * @interface AzureBlobLeaseInfo
 */
export interface AzureBlobLeaseInfo extends LeaseInfo {
    /**
     * @property {AzureBlob} blob Reference to the azure blob.
     */
    blob: AzureBlob;
}
/**
 * Describes the lease used with an Azure Blob for storing the checkpoint information.
 */
export declare class AzureBlobLease extends CompleteLease implements AzureBlobLeaseInfo {
    /**
     * @property {string} offset The offset of the event to be checked in.
     */
    offset?: string;
    /**
     * @property {string} sequenceNumber The sequence number of the event to be checked in.
     */
    sequenceNumber: number;
    /**
     * @property {string} token The lease token that manages concurrency between hosts. You can use
     * this token to guarantee single access to any resource needed by the EPH.
     */
    token: string;
    /**
     * @property {AzureBlob} blob Reference to the azure blob.
     */
    blob: AzureBlob;
    constructor(info: AzureBlobLeaseInfo);
    /**
     * Gets the lease information.
     * @returns {LeaseInfo} LeaseInfo.
     */
    getInfo(): LeaseInfo;
    /**
     * Serializes the lease information.
     * @returns {string} string The serialized lease info.
     */
    serialize(): string;
    /**
     * Creates a Lease for the given partitionId.
     * @param {string} id The partitionId for which the lease needs to be created.
     * @param {AzureBlob} blob The azure blob reference
     * @returns {CompleteLease} Lease.
     */
    static createFromPartitionId(id: string, blob: AzureBlob): AzureBlobLease;
}
//# sourceMappingURL=azureBlobLease.d.ts.map