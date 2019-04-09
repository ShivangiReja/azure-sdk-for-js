import { CheckpointInfo } from "./checkpointInfo";
import { CheckpointManager } from "./checkpointManager";
import { LeaseManager } from "./leaseManager";
import { BaseHostContext } from "./hostContext";
import { AzureBlob } from "./azureBlob";
import { CompleteLease } from "./completeLease";
import { AzureBlobLease } from "./azureBlobLease";
import { BaseLease } from "./baseLease";
/**
 * @ignore
 */
export declare class AzureStorageCheckpointLeaseManager implements CheckpointManager, LeaseManager {
    leaseRenewInterval: number;
    leaseDuration: number;
    private _context;
    private _latestCheckpoint;
    constructor(context: BaseHostContext);
    getAzureBlob(partitionId: string): AzureBlob;
    downloadLease(partitionId: string, blob: AzureBlob): Promise<AzureBlobLease>;
    leaseStoreExists(): Promise<boolean>;
    createLeaseStoreIfNotExists(): Promise<void>;
    deleteLeaseStore(): Promise<void>;
    getLease(partitionId: string): Promise<AzureBlobLease | undefined>;
    getAllLeases(): Promise<BaseLease[]>;
    createAllLeasesIfNotExists(partitionIds: string[]): Promise<void>;
    createLeaseIfNotExists(partitionId: string): Promise<CompleteLease>;
    deleteLease(lease: AzureBlobLease): Promise<void>;
    acquireLease(lease: AzureBlobLease): Promise<boolean>;
    renewLease(lease: AzureBlobLease): Promise<boolean>;
    releaseLease(lease: AzureBlobLease): Promise<void>;
    updateLease(lease: AzureBlobLease): Promise<boolean>;
    checkpointStoreExists(): Promise<boolean>;
    deleteCheckpointStore(): Promise<void>;
    createCheckpointStoreIfNotExists(): Promise<void>;
    createAllCheckpointsIfNotExists(partitionIds: string[]): Promise<void>;
    getCheckpoint(partitionId: string): Promise<CheckpointInfo | undefined>;
    updateCheckpoint(lease: AzureBlobLease, checkpoint: CheckpointInfo): Promise<void>;
    deleteCheckpoint(partitionId: string): Promise<void>;
    private _listBlobs;
    private _uploadLease;
    private _wasLeaseLost;
}
//# sourceMappingURL=azureStorageCheckpointLeaseManager.d.ts.map