import { HostContextWithPumpManager } from "./hostContext";
import { OnReceivedMessage, OnReceivedError } from "./modelTypes";
/**
 * @ignore
 */
export declare class PartitionManager {
    private _context;
    private _partitionScanner;
    private _isCancelRequested;
    private _isRunning;
    private _runTask?;
    constructor(context: HostContextWithPumpManager);
    /**
     * @ignore
     */
    start(onMessage: OnReceivedMessage, onError: OnReceivedError): Promise<void>;
    /**
     * @ignore
     */
    stop(): Promise<void>;
    /**
     * @ignore
     */
    shouldStop(): boolean;
    /**
     * @ignore
     */
    private _reset;
    /**
     * @ignore
     */
    private _run;
    /**
     * @ignore
     */
    private _cachePartitionIds;
    /**
     * @ignore
     */
    private _initializeStores;
    /**
     * @ignore
     */
    private _scan;
}
//# sourceMappingURL=partitionManager.d.ts.map