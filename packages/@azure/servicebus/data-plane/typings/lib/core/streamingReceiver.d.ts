/**
 * Describes the options to control receiving of messages in streaming mode.
 */
export interface MessageHandlerOptions {
    /**
     * @property {boolean} [autoComplete] Indicates whether the message (if not settled by the user)
     * should be automatically completed after the user provided onMessage handler has been executed.
     * Completing a message, removes it from the Queue/Subscription.
     * - **Default**: `true`.
     */
    autoComplete?: boolean;
    /**
     * @property {number} [maxMessageAutoRenewLockDurationInSeconds] The maximum duration in seconds until which
     * the lock on the message will be renewed automatically before the message is settled.
     * - **Default**: `300` seconds (5 minutes).
     * - **To disable autolock renewal**, set `maxMessageAutoRenewLockDurationInSeconds` to `0`.
     */
    maxMessageAutoRenewLockDurationInSeconds?: number;
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
//# sourceMappingURL=streamingReceiver.d.ts.map