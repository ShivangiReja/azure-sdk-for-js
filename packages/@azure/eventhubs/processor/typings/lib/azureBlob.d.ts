import { BlobService, CreateContainerResult } from "./blobService";
import { BlobService as StorageBlobService } from "azure-storage";
import { Dictionary } from "@azure/event-hubs";
/**
 * @ignore
 */
export declare class AzureBlob {
    private _blobService;
    private _containerName;
    private _blobPath;
    private _containerAndBlobExist;
    constructor(hostName: string, connectionString: string, containerName: string, blob: string, blobService?: BlobService);
    ensureContainerAndBlobExist(): Promise<void>;
    ensureContainerExists(): Promise<CreateContainerResult>;
    doesContainerExist(): Promise<boolean>;
    doesBlobExist(): Promise<boolean>;
    ensureBlobExists(text: string): Promise<void>;
    renewLease(leaseId: string, options: StorageBlobService.LeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    releaseLease(leaseId: string, options?: StorageBlobService.LeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    updateContent(text: string, options?: StorageBlobService.CreateBlobRequestOptions): Promise<StorageBlobService.BlobResult>;
    getContent(options?: StorageBlobService.GetBlobRequestOptions): Promise<string>;
    changeLease(currentLeaseId: string, proposedLeaseId: string): Promise<StorageBlobService.LeaseResult>;
    getBlobProperties(): Promise<StorageBlobService.BlobResult>;
    getBlobMetadata(): Promise<StorageBlobService.BlobResult>;
    setBlobMetadata(metadata: Dictionary<string>, options?: StorageBlobService.BlobRequestOptions): Promise<StorageBlobService.BlobResult>;
    listBlobsSegmented(options?: StorageBlobService.ListBlobsSegmentedRequestOptions): Promise<StorageBlobService.ListBlobsResult>;
    acquireLease(options: StorageBlobService.AcquireLeaseRequestOptions): Promise<StorageBlobService.LeaseResult>;
    deleteBlobIfExists(): Promise<void>;
}
//# sourceMappingURL=azureBlob.d.ts.map