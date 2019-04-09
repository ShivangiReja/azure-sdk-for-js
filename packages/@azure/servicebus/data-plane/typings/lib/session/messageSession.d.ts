import { ReceiveMode } from "../serviceBusMessage";
/**
 * Describes the options for creating a SessionReceiver.
 */
export interface SessionReceiverOptions {
    /**
     * @property {string} [sessionId] The sessionId for the message session. If none is provided,
     * the SessionReceiver gets created for a randomly chosen session from available sessions
     */
    sessionId?: string;
    /**
     * @property {number} [receiveMode] The mode in which messages should be received.
     * Possible values are `ReceiveMode.peekLock` (default) and `ReceiveMode.receiveAndDelete`
     */
    receiveMode?: ReceiveMode;
    /**
     * @property {number} [maxSessionAutoRenewLockDurationInSeconds] The maximum duration in seconds
     * until which, the lock on the session will be renewed automatically.
     * - **Default**: `300` seconds (5 minutes).
     * - **To disable autolock renewal**, set `maxSessionAutoRenewLockDurationInSeconds` to `0`.
     */
    maxSessionAutoRenewLockDurationInSeconds?: number;
}
/**
 * Describes the options to control receiving of messages in streaming mode.
 */
export interface SessionMessageHandlerOptions {
    /**
     * @property {boolean} [autoComplete] Indicates whether the message (if not settled by the user)
     * should be automatically completed after the user provided onMessage handler has been executed.
     * Completing a message, removes it from the Queue/Subscription.
     * - **Default**: `true`.
     */
    autoComplete?: boolean;
    /**
     * @property {number} [newMessageWaitTimeoutInSeconds] The maximum amount of time the receiver
     * will wait to receive a new message. If no new message is received in this time, then the
     * receiver will be closed.
     *
     * Caution: When setting this value, take into account the time taken to process messages. Once
     * the receiver is closed, operations like complete()/abandon()/defer()/deadletter() cannot be
     * invoked on messages.
     *
     * If this option is not provided, then receiver link will stay open until manually closed.
     */
    newMessageWaitTimeoutInSeconds?: number;
    /**
     * @property {number} [maxConcurrentCalls] The maximum number of concurrent calls that the library
     * can make to the user's message handler. Once this limit has been reached, more messages will
     * not be received until atleast one of the calls to the user's message handler has completed.
     * - **Default**: `1`.
     */
    maxConcurrentCalls?: number;
}
//# sourceMappingURL=messageSession.d.ts.map