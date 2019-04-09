import { Dictionary } from "@azure/event-hubs";
import { BlobService as StorageBlobService, ServiceResponse } from "azure-storage";
/**
 * @ignore
 */
export interface CreateContainerResult {
    created: StorageBlobService.ContainerResult;
    details: ServiceResponse;
}
/**
 * @ignore
 */
export declare enum LeaseState {
    /**
     * The lease state is not specified.
     */
    unspecified = "unspecified",
    /**
     * The lease is in the "available" state.
     */
    available = "available",
    /**
     * The lease is in the "leased" state.
     */
    leased = "leased",
    /**
     * The lease is in the "expired" state.
     */
    expired = "expired",
    /**
     * The lease is in the "breaking" state.
     */
    breaking = "breaking",
    /**
     * The lease is in the "broken" state.
     */
    broken = "broken"
}
/**
 * @ignore
 */
export declare class BlobService {
    private _hostName;
    private _connectionString;
    private _storageBlobService;
    private _beginningOfTime;
    constructor(hostName: string, connectionString: string);
    /**
     * Ensures that the container and blob exist.
     */
    ensureContainerAndBlobExist(containerName: string, blobPath: string): Promise<void>;
    ensureContainerExists(containerName: string): Promise<CreateContainerResult>;
    doesContainerExist(containerName: string): Promise<boolean>;
    doesBlobExist(containerName: string, blobPath: string): Promise<boolean>;
    ensureBlobExists(containerName: string, blobPath: string, text: string): Promise<void>;
    renewLease(containerName: string, blobPath: string, leaseId: string, options: StorageBlobService.LeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    releaseLease(containerName: string, blobPath: string, leaseId: string, options?: StorageBlobService.LeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    updateContent(containerName: string, blobPath: string, text: string, options?: StorageBlobService.CreateBlobRequestOptions): Promise<StorageBlobService.BlobResult>;
    getContent(containerName: string, blobPath: string, options?: StorageBlobService.GetBlobRequestOptions): Promise<string>;
    changeLease(containerName: string, blobPath: string, currentLeaseId: string, proposedLeaseId: string): Promise<StorageBlobService.LeaseResult>;
    getBlobProperties(containerName: string, blobPath: string): Promise<StorageBlobService.BlobResult>;
    listBlobsSegmented(containerName: string, options?: StorageBlobService.ListBlobsSegmentedRequestOptions): Promise<StorageBlobService.ListBlobsResult>;
    getBlobMetadata(containerName: string, blobPath: string): Promise<StorageBlobService.BlobResult>;
    setBlobMetadata(containerName: string, blobPath: string, metadata: Dictionary<string>, options?: StorageBlobService.BlobRequestOptions): Promise<StorageBlobService.BlobResult>;
    acquireLease(containerName: string, blobPath: string, options: StorageBlobService.AcquireLeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    deleteBlobIfExists(containerName: string, blobPath: string): Promise<void>;
    deleteContainerIfExists(containerName: string): Promise<void>;
    static create(hostName: string, connectionString: string): BlobService;
}
//# sourceMappingURL=blobService.d.ts.map