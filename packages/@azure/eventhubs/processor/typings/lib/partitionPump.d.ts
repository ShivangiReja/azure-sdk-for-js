import { HostContextWithCheckpointLeaseManager } from "./hostContext";
import { CompleteLease } from "./completeLease";
import { CloseReason, OnReceivedMessage, OnReceivedError } from "./modelTypes";
/**
 * @ignore
 */
export declare class PartitionPump {
    private _context;
    private _lease;
    private _partitionContext;
    private _onMessage;
    private _onError;
    private _client?;
    private _receiveHandler?;
    private _leaseRenewalTimer?;
    constructor(context: HostContextWithCheckpointLeaseManager, lease: CompleteLease, onMessage: OnReceivedMessage, onError: OnReceivedError);
    lease: CompleteLease;
    isOpen(): boolean;
    start(): Promise<void>;
    stop(reason: CloseReason): Promise<void>;
    private _createNewReceiver;
    private _leaseRenewer;
    private _scheduleLeaseRenewer;
    private _removeReceiver;
    private _isReceiverDisconnectedError;
}
//# sourceMappingURL=partitionPump.d.ts.map