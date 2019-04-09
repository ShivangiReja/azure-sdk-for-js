import { HostContextWithPumpManager } from "./hostContext";
/**
 * @ignore
 */
export declare class PartitionScanner {
    private _context;
    private _allLeaseStates;
    private _desiredCount;
    private _unownedCount;
    private _leaseOwnedByOthers;
    constructor(context: HostContextWithPumpManager);
    scan(isFirst: boolean): Promise<boolean>;
    private _reset;
    private _getAllLeaseStates;
    private _sortLeasesAndCalculateDesiredCount;
    private _findExpiredLeases;
    private _acquireExpiredInParallel;
    private _findLeasesToSteal;
    private _stealLeases;
}
//# sourceMappingURL=partitionScanner.d.ts.map