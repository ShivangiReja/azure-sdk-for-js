import { StorageError } from "azure-storage";
/**
 * Generates a random number between the given interval
 * @param {number} min Min number of the range (inclusive).
 * @param {number} max Max number of the range (inclusive).
 */
export declare function randomNumberFromInterval(min: number, max: number): number;
/**
 * Validates the type and requiredness of a given parameter.
 * @param paramName The name of the parameter.
 * @param paramValue The parameter value
 * @param type The type of the parameter
 */
export declare function validateType(paramName: string, paramValue: any, required: boolean, type: "string" | "number" | "boolean" | "Array" | "object" | "Date" | "function"): void;
/**
 * @ignore
 */
export interface StorageErrorInfo {
    name: string;
    message: string;
    statusCode: number;
    code: string;
    requestId: string;
}
/**
 * @ignore
 */
export declare function getStorageError(err: StorageError): StorageErrorInfo;
/**
 * @ignore
 */
export interface RetryConfig<T> {
    hostName: string;
    operation: () => Promise<T>;
    partitionId?: string;
    retryMessage: string;
    finalFailureMessage: string;
    action: string;
    maxRetries: number;
}
/**
 * @ignore
 */
export declare enum EPHActionStrings {
    acquireLease = "Acquire Lease",
    gettingPartitionIds = "Getting PartitionIds",
    gettingAllLeases = "Getting All Leases",
    creatingAllLeases = "Creating All Leases",
    scanningLeases = "Scanning leases",
    checkingLeases = "Checking Leases",
    checkingExpiredLeases = "Checking Expired Leases",
    renewingLease = "Renewing Lease",
    stealingLease = "Stealing Lease",
    creatingLease = "Creating Lease",
    creatingCheckpoint = "Creating Checkpoint",
    updatingCheckpoint = "Updating Checkpoint",
    creatingCheckpointStore = "Creating Checkpoint Store",
    creatingEventProcessor = "Creating Event Processor",
    creatingLeaseStore = "Creating Lease Store",
    initializingStores = "Initializing Stores",
    partitionManagerCleanup = "Partition Manager Cleanup",
    partitionManagerMainLoop = "Partition Manager Main Loop",
    partitionReceiverManagement = "Partition Receiver Management",
    deletingLeaseStore = "Deleting Lease Store"
}
/**
 * @ignore
 */
export declare function retry<T>(config: RetryConfig<T>): Promise<T>;
//# sourceMappingURL=utils.d.ts.map