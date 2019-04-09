import { EventHubClient, EventPosition, TokenProvider, Dictionary, EventHubRuntimeInformation, EventHubPartitionRuntimeInformation, EventHubConnectionConfig } from "@azure/event-hubs";
import AsyncLock from "async-lock";
import { LeaseManager } from "./leaseManager";
import { PumpManager } from "./pumpManager";
import { PartitionManager } from "./partitionManager";
import { PartitionScanner } from "./partitionScanner";
import { BlobService } from "./blobService";
import { AzureBlob } from "./azureBlob";
import { CheckpointManager } from "./checkpointManager";
import { PartitionPump } from "./partitionPump";
import { EventProcessorHostOptions, OnEphError, OnReceivedMessage, OnReceivedError } from "./modelTypes";
/**
 * @ignore
 */
export interface BaseHostContext {
    hostName: string;
    checkpointLock: AsyncLock;
    checkpointLockId: string;
    consumerGroup: string;
    eventHubPath: string;
    storageContainerName?: string;
    eventHubConnectionString: string;
    connectionConfig: EventHubConnectionConfig;
    onEphError: OnEphError;
    leaseRenewInterval: number;
    leaseDuration: number;
    partitionIds: string[];
    blobReferenceByPartition: Dictionary<AzureBlob>;
    storageConnectionString?: string;
    tokenProvider?: TokenProvider;
    initialOffset?: EventPosition;
    storageBlobPrefix?: string;
    blobService?: BlobService;
    composedBlobPrefix: string;
    onMessage?: OnReceivedMessage;
    onError?: OnReceivedError;
    startupScanDelay?: number;
    fastScanInterval?: number;
    slowScanInterval?: number;
    pumps: Map<string, PartitionPump>;
    userAgent: string;
    withHost(msg: string): string;
    withHostAndPartition(partition: string | {
        partitionId: string;
    }, msg: string): string;
}
/**
 * @ignore
 */
export interface HostContextWithCheckpointLeaseManager extends BaseHostContext {
    leaseManager: LeaseManager;
    checkpointManager: CheckpointManager;
    getEventHubClient(): EventHubClient;
    getHubRuntimeInformation(): Promise<EventHubRuntimeInformation>;
    getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation>;
    getPartitionIds(): Promise<string[]>;
}
export interface HostContextWithPumpManager extends HostContextWithCheckpointLeaseManager {
    pumpManager: PumpManager;
}
export interface HostContext extends HostContextWithPumpManager {
    partitionManager: PartitionManager;
    partitionScanner: PartitionScanner;
}
/**
 * @ignore
 */
export declare namespace HostContext {
    /**
     * @ignore
     */
    function getUserAgent(options: EventProcessorHostOptions): string;
    /**
     * @ignore
     */
    function create(hostName: string, options: EventProcessorHostOptions): HostContext;
}
//# sourceMappingURL=hostContext.d.ts.map