import { ReceiveOptions } from "./eventHubClient";
import { EventHubReceiver, ReceiverRuntimeInfo, OnMessage, OnError } from "./eventHubReceiver";
import { ConnectionContext } from "./connectionContext";
/**
 * Describes the receive handler object that is returned from the receive() method with handlers is
 * called. The ReceiveHandler is used to stop receiving more messages.
 * @class ReceiveHandler
 */
export declare class ReceiveHandler {
    /**
     * @property {string} name The Receiver handler name.
     * @readonly
     */
    readonly name: string;
    /**
     * @property {EventHubReceiver} _receiver  The underlying EventHubReceiver.
     * @private
     */
    private _receiver;
    /**
     * Creates an instance of the ReceiveHandler.
     * @constructor
     * @param {EventHubReceiver} receiver The underlying EventHubReceiver.
     */
    constructor(receiver: EventHubReceiver);
    /**
     * @property {string | number} [partitionId] The partitionId from which the handler is receiving
     * events from.
     * @readonly
     */
    readonly partitionId: string | number | undefined;
    /**
     * @property {string} [consumerGroup] The consumer group from which the handler is receiving
     * events from.
     * @readonly
     */
    readonly consumerGroup: string | undefined;
    /**
     * @property {string} [address] The address of the underlying receiver.
     * @readonly
     */
    readonly address: string | undefined;
    /**
     * @property {number} [epoch] The epoch value of the underlying receiver, if present.
     * @readonly
     */
    readonly epoch: number | undefined;
    /**
     * @property {string} [identifier] The identifier of the underlying receiver, if present.
     * @readonly
     */
    readonly identifier: string | undefined;
    /**
     * @property {ReceiverRuntimeInfo} [runtimeInfo] The receiver runtime info. This property will only
     * be enabled when `enableReceiverRuntimeMetric` option is set to true in the
     * `client.receive()` method.
     * @readonly
     */
    readonly runtimeInfo: ReceiverRuntimeInfo | undefined;
    /**
     * @property {boolean} isReceiverOpen Indicates whether the receiver is connected/open.
     * `true` - is open; `false` otherwise.
     * @readonly
     */
    readonly isReceiverOpen: boolean;
    /**
     * Stops the underlying EventHubReceiver from receiving more messages.
     * @return {Promise<void>} Promise<void>
     */
    stop(): Promise<void>;
}
/**
 * Describes the streaming receiver where the user can receive the message
 * by providing handler functions.
 * @ignore
 * @class StreamingReceiver
 * @extends EventHubReceiver
 */
export declare class StreamingReceiver extends EventHubReceiver {
    receiveHandler: ReceiveHandler;
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {EventHubClient} client          The EventHub client.
     * @param {string} partitionId             Partition ID from which to receive.
     * @param {ReceiveOptions} [options]       Options for how you'd like to connect.
     */
    constructor(context: ConnectionContext, partitionId: string | number, options?: ReceiveOptions);
    /**
     * Starts the receiver by establishing an AMQP session and an AMQP receiver link on the session.
     * @ignore
     * @param {OnMessage} onMessage The message handler to receive event data objects.
     * @param {OnError} onError The error handler to receive an error that occurs while receivin messages.
     */
    receive(onMessage: OnMessage, onError: OnError): ReceiveHandler;
    /**
     * Creates a streaming receiver.
     * @static
     * @ignore
     * @param {ConnectionContext} context    The connection context.
     * @param {string | number} partitionId  The partitionId to receive events from.
     * @param {ReceiveOptions} [options]     Receive options.
     */
    static create(context: ConnectionContext, partitionId: string | number, options?: ReceiveOptions): StreamingReceiver;
}
//# sourceMappingURL=streamingReceiver.d.ts.map