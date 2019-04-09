import { Delivery, AmqpError } from "rhea-promise";
import { EventData } from "./eventData";
import { ConnectionContext } from "./connectionContext";
import { LinkEntity } from "./linkEntity";
/**
 * Describes the EventHubSender that will send event data to EventHub.
 * @class EventHubSender
 * @ignore
 */
export declare class EventHubSender extends LinkEntity {
    /**
     * @property {string} senderLock The unqiue lock name per connection that is used to acquire the
     * lock for establishing a sender link by an entity on that connection.
     * @readonly
     */
    readonly senderLock: string;
    /**
     * @property {OnAmqpEvent} _onAmqpError The handler function to handle errors that happen on the
     * underlying sender.
     * @readonly
     */
    private readonly _onAmqpError;
    /**
     * @property {OnAmqpEvent} _onAmqpClose The handler function to handle "sender_close" event
     * that happens on the underlying sender.
     * @readonly
     */
    private readonly _onAmqpClose;
    /**
     * @property {OnAmqpEvent} _onSessionError The message handler that will be set as the handler on
     * the underlying rhea sender's session for the "session_error" event.
     * @private
     */
    private _onSessionError;
    /**
     * @property {OnAmqpEvent} _onSessionClose The message handler that will be set as the handler on
     * the underlying rhea sender's session for the "session_close" event.
     * @private
     */
    private _onSessionClose;
    /**
     * @property {Sender} [_sender] The AMQP sender link.
     * @private
     */
    private _sender?;
    /**
     * Creates a new EventHubSender instance.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context The connection context.
     * @param {string|number} [partitionId] The EventHub partition id to which the sender
     * wants to send the event data.
     */
    constructor(context: ConnectionContext, partitionId?: string | number, name?: string);
    /**
     * Will reconnect the sender link if necessary.
     * @ignore
     * @param {AmqpError | Error} [senderError] The sender error if any.
     * @returns {Promise<void>} Promise<void>.
     */
    detached(senderError?: AmqpError | Error): Promise<void>;
    /**
     * Deletes the sender fromt the context. Clears the token renewal timer. Closes the sender link.
     * @ignore
     * @return {Promise<void>} Promise<void>
     */
    close(): Promise<void>;
    /**
     * Determines whether the AMQP sender link is open. If open then returns true else returns false.
     * @ignore
     * @return {boolean} boolean
     */
    isOpen(): boolean;
    /**
     * Sends the given message, with the given options on this link
     * @ignore
     * @param {any} data Message to send.  Will be sent as UTF8-encoded JSON string.
     * @returns {Promise<Delivery>} Promise<Delivery>
     */
    send(data: EventData): Promise<Delivery>;
    /**
     * Send a batch of EventData to the EventHub. The "message_annotations",
     * "application_properties" and "properties" of the first message will be set as that
     * of the envelope (batch message).
     * @ignore
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    sendBatch(datas: EventData[]): Promise<Delivery>;
    private _deleteFromCache;
    private _createSenderOptions;
    /**
     * Tries to send the message to EventHub if there is enough credit to send them
     * and the circular buffer has available space to settle the message after sending them.
     *
     * We have implemented a synchronous send over here in the sense that we shall be waiting
     * for the message to be accepted or rejected and accordingly resolve or reject the promise.
     * @ignore
     * @param message The message to be sent to EventHub.
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    private _trySend;
    /**
     * Initializes the sender session on the connection.
     * @ignore
     * @returns {Promise<void>}
     */
    private _init;
    /**
     * Creates a new sender to the given event hub, and optionally to a given partition if it is
     * not present in the context or returns the one present in the context.
     * @ignore
     * @static
     * @param {(string|number)} [partitionId] Partition ID to which it will send event data.
     * @returns {Promise<EventHubSender>}
     */
    static create(context: ConnectionContext, partitionId?: string | number): EventHubSender;
}
//# sourceMappingURL=eventHubSender.d.ts.map