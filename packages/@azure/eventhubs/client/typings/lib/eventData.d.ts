import { Message, MessageProperties, MessageHeader, Dictionary, MessageAnnotations, DeliveryAnnotations } from "rhea-promise";
/**
 * Describes the delivery annotations.
 * @interface EventHubDeliveryAnnotations
 */
export interface EventHubDeliveryAnnotations extends DeliveryAnnotations {
    /**
     * @property {string} [last_enqueued_offset] The offset of the last event.
     */
    last_enqueued_offset?: string;
    /**
     * @property {number} [last_enqueued_sequence_number] The sequence number of the last event.
     */
    last_enqueued_sequence_number?: number;
    /**
     * @property {number} [last_enqueued_time_utc] The enqueued time of the last event.
     */
    last_enqueued_time_utc?: number;
    /**
     * @property {number} [runtime_info_retrieval_time_utc] The retrieval time of the last event.
     */
    runtime_info_retrieval_time_utc?: number;
    /**
     * @property {string} Any unknown delivery annotations.
     */
    [x: string]: any;
}
/**
 * Map containing message attributes that will be held in the message header.
 * @interface EventHubMessageAnnotations
 */
export interface EventHubMessageAnnotations extends MessageAnnotations {
    /**
     * @property {string | null} [x-opt-partition-key] Annotation for the partition key set for the event.
     */
    "x-opt-partition-key"?: string | null;
    /**
     * @property {number} [x-opt-sequence-number] Annontation for the sequence number of the event.
     */
    "x-opt-sequence-number"?: number;
    /**
     * @property {number} [x-opt-enqueued-time] Annotation for the enqueued time of the event.
     */
    "x-opt-enqueued-time"?: number;
    /**
     * @property {string} [x-opt-offset] Annotation for the offset of the event.
     */
    "x-opt-offset"?: string;
    /**
     * @property {any} Any other annotation that can be added to the message.
     */
    [x: string]: any;
}
/**
 * Describes the structure of an event to be sent or received from the EventHub.
 * @interface EventData
 */
export interface EventData {
    /**
     * @property {MessageHeader} [header] - The message headers.
     */
    header?: MessageHeader;
    /**
     * @property {any} body - The message body that needs to be sent or is received.
     */
    body: any;
    /**
     * @property {Date} [enqueuedTimeUtc] The enqueued time of the event.
     */
    enqueuedTimeUtc?: Date;
    /**
     * @property {string | null} [partitionKey] If specified EventHub will hash this to a partitionId.
     * It guarantees that messages end up in a specific partition on the event hub.
     */
    partitionKey?: string | null;
    /**
     * @property {string} [offset] The offset of the event.
     */
    offset?: string;
    /**
     * @property {number} [sequenceNumber] The sequence number of the event.
     */
    sequenceNumber?: number;
    /**
     * @property {AmqpMessageAnnotations} [annotations] The amqp message attributes.
     */
    annotations?: EventHubMessageAnnotations;
    /**
     * @property {AmqpMessageProperties} [properties] The predefined AMQP properties like message_id, correlation_id, reply_to, etc.
     */
    properties?: MessageProperties;
    /**
     * @property {Dictionary<any>} [applicationProperties] The application specific properties.
     */
    applicationProperties?: Dictionary<any>;
    /**
     * @property {number} [lastSequenceNumber] The last sequence number of the event within the partition stream of the Event Hub.
     */
    lastSequenceNumber?: number;
    /**
     * @property {string} [lastEnqueuedOffset] The offset of the last enqueued event.
     */
    lastEnqueuedOffset?: string;
    /**
     * @property {Date} [lastEnqueuedTime] The enqueued UTC time of the last event.
     */
    lastEnqueuedTime?: Date;
    /**
     * @property {Date} [retrievalTime] The time when the runtime info was retrieved
     */
    retrievalTime?: Date;
    /**
     * @property {AmqpMessage} _raw_amqp_mesage The underlying raw amqp message.
     */
    _raw_amqp_mesage?: Message;
}
/**
 * Describes the methods on the EventData interface.
 * @module EventData
 */
export declare namespace EventData {
    /**
     * Converts the AMQP message to an EventData.
     * @param {AmqpMessage} msg The AMQP message that needs to be converted to EventData.
     */
    function fromAmqpMessage(msg: Message): EventData;
    /**
     * Converts an EventData object to an AMQP message.
     * @param {EventData} data The EventData object that needs to be converted to an AMQP message.
     */
    function toAmqpMessage(data: EventData): Message;
}
//# sourceMappingURL=eventData.d.ts.map