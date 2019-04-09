import { HostContextWithCheckpointLeaseManager } from "./hostContext";
import { CompleteLease } from "./completeLease";
import { CloseReason } from "./modelTypes";
/**
 * @ignore
 */
export declare class PumpManager {
    private _context;
    constructor(context: HostContextWithCheckpointLeaseManager);
    addPump(lease: CompleteLease): Promise<void>;
    removePump(partitionId: string, reason: CloseReason): Promise<void>;
    removeAllPumps(reason: CloseReason): Promise<void>;
}
//# sourceMappingURL=pumpManager.d.ts.map