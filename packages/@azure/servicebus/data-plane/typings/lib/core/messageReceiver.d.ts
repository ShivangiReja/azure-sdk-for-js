import { MessagingError } from "@azure/amqp-common";
import { ServiceBusMessage } from "../serviceBusMessage";
/**
 * Describes the message handler signature.
 */
export interface OnMessage {
    /**
     * Handler for processing each incoming message.
     */
    (message: ServiceBusMessage): Promise<void>;
}
/**
 * Describes the error handler signature.
 */
export interface OnError {
    /**
     * Handler for any error that occurs while receiving or processing messages.
     */
    (error: MessagingError | Error): void;
}
//# sourceMappingURL=messageReceiver.d.ts.map