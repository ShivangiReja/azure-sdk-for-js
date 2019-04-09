import { Receiver, OnAmqpEvent, ReceiverOptions, AmqpError } from "rhea-promise";
import { MessagingError } from "@azure/amqp-common";
import { EventData } from "./eventData";
import { ReceiveOptions } from "./eventHubClient";
import { ConnectionContext } from "./connectionContext";
import { LinkEntity } from "./linkEntity";
import { EventPosition } from "./eventPosition";
interface CreateReceiverOptions {
    onMessage: OnAmqpEvent;
    onError: OnAmqpEvent;
    onClose: OnAmqpEvent;
    onSessionError: OnAmqpEvent;
    onSessionClose: OnAmqpEvent;
    newName?: boolean;
    eventPosition?: EventPosition;
}
/**
 * Represents the approximate receiver runtime information for a logical partition of an Event Hub.
 * @interface ReceiverRuntimeInfo
 */
export interface ReceiverRuntimeInfo {
    /**
     * @property {string} partitionId The parition identifier.
     */
    partitionId: string;
    /**
     * @property {number} lastSequenceNumber The logical sequence number of the event.
     */
    lastSequenceNumber?: number;
    /**
     * @property {Date} lastEnqueuedTimeUtc The enqueued time of the last event.
     */
    lastEnqueuedTimeUtc?: Date;
    /**
     * @property {string} lastEnqueuedOffset The offset of the last enqueued event.
     */
    lastEnqueuedOffset?: string;
    /**
     * @property {Date} retrievalTime The enqueued time of the last event.
     */
    retrievalTime?: Date;
}
/**
 * Describes the checkoint information.
 * @interface CheckpointData
 */
export interface CheckpointData {
    /**
     * @property {Date} enqueuedTimeUtc The enqueued time of the event.
     */
    enqueuedTimeUtc: Date;
    /**
     * @property {string} offset The offset of the event to be checked in.
     */
    offset: string;
    /**
     * @property {string} sequenceNumber The sequence number of the event to be checked in.
     */
    sequenceNumber: number;
}
/**
 * Describes the message handler signature.
 */
export declare type OnMessage = (eventData: EventData) => void;
/**
 * Describes the error handler signature.
 */
export declare type OnError = (error: MessagingError | Error) => void;
/**
 * Describes the EventHubReceiver that will receive event data from EventHub.
 * @class EventHubReceiver
 * @ignore
 */
export declare class EventHubReceiver extends LinkEntity {
    /**
     * @property {string} consumerGroup The EventHub consumer group from which the receiver will
     * receive messages. (Default: "default").
     */
    consumerGroup: string;
    /**
     * @property {ReceiverRuntimeInfo} runtimeInfo The receiver runtime info.
     */
    runtimeInfo: ReceiverRuntimeInfo;
    /**
     * @property {number} [epoch] The Receiver epoch.
     */
    epoch?: number;
    /**
     * @property {string} [identifier] The Receiver identifier
     */
    identifier?: string;
    /**
     * @property {ReceiveOptions} [options] Optional properties that can be set while creating
     * the EventHubReceiver.
     */
    options: ReceiveOptions;
    /**
     * @property {number} [prefetchCount] The number of messages that the receiver can fetch/receive
     * initially. Defaults to 1000.
     */
    prefetchCount?: number;
    /**
     * @property {boolean} receiverRuntimeMetricEnabled Indicates whether receiver runtime metric
     * is enabled. Default: false.
     */
    receiverRuntimeMetricEnabled: boolean;
    /**
     * @property {Receiver} [_receiver] The AMQP receiver link.
     * @protected
     */
    protected _receiver?: Receiver;
    /**
     * @property {OnMessage} _onMessage The message handler provided by the user that will be wrapped
     * inside _onAmqpMessage.
     * @protected
     */
    protected _onMessage?: OnMessage;
    /**
     * @property {OnError} _onError The error handler provided by the user that will be wrapped
     * inside _onAmqpError.
     * @protected
     */
    protected _onError?: OnError;
    /**
     * @property {OnAmqpEvent} _onAmqpError The message handler that will be set as the handler on the
     * underlying rhea receiver for the "message" event.
     * @protected
     */
    protected _onAmqpMessage: OnAmqpEvent;
    /**
     * @property {OnAmqpEvent} _onAmqpError The message handler that will be set as the handler on the
     * underlying rhea receiver for the "receiver_error" event.
     * @protected
     */
    protected _onAmqpError: OnAmqpEvent;
    /**
     * @property {OnAmqpEvent} _onAmqpClose The message handler that will be set as the handler on the
     * underlying rhea receiver for the "receiver_close" event.
     * @protected
     */
    protected _onAmqpClose: OnAmqpEvent;
    /**
     * @property {OnAmqpEvent} _onSessionError The message handler that will be set as the handler on
     * the underlying rhea receiver's session for the "session_error" event.
     * @protected
     */
    protected _onSessionError: OnAmqpEvent;
    /**
     * @property {OnAmqpEvent} _onSessionClose The message handler that will be set as the handler on
     * the underlying rhea receiver's session for the "session_close" event.
     * @protected
     */
    protected _onSessionClose: OnAmqpEvent;
    /**
     * @property {CheckpointData} _checkpoint Describes metadata about the last message received.
     * This is used as the offset to receive messages from incase of recovery.
     */
    protected _checkpoint: CheckpointData;
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {EventHubClient} client                            The EventHub client.
     * @param {string} partitionId                               Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Receiver options.
     */
    constructor(context: ConnectionContext, partitionId: string | number, options?: ReceiveOptions);
    /**
     * Will reconnect the receiver link if necessary.
     * @ignore
     * @param {AmqpError | Error} [receiverError] The receiver error if any.
     * @returns {Promise<void>} Promise<void>.
     */
    detached(receiverError?: AmqpError | Error): Promise<void>;
    /**
     * Closes the underlying AMQP receiver.
     * @ignore
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Determines whether the AMQP receiver link is open. If open then returns true else returns false.
     * @ignore
     * @return {boolean} boolean
     */
    isOpen(): boolean;
    protected _deleteFromCache(): void;
    /**
     * Creates a new AMQP receiver under a new AMQP session.
     * @ignore
     * @returns {Promise<void>}
     */
    protected _init(options?: ReceiverOptions): Promise<void>;
    /**
     * Creates the options that need to be specified while creating an AMQP receiver link.
     * @ignore
     */
    protected _createReceiverOptions(options: CreateReceiverOptions): ReceiverOptions;
}
export {};
//# sourceMappingURL=eventHubReceiver.d.ts.map