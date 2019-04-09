import { SendableMessageInfo } from "../serviceBusMessage";
/**
 * Represents a description of a rule.
 */
export interface RuleDescription {
    /**
     * Filter expression used to match messages.
     */
    filter?: SQLExpression | CorrelationFilter;
    /**
     * Action to perform if the message satisfies the filtering expression.
     */
    action?: SQLExpression;
    /**
     * Represents the name of the rule.
     */
    name: string;
}
/**
 * Represents the sql filter expression.
 */
export interface SQLExpression {
    /**
     * SQL-like condition expression that is evaluated in the broker against the arriving messages'
     * user-defined properties and system properties. All system properties must be prefixed with
     * `sys.` in the condition expression.
     */
    expression: string;
}
/**
 * Represents the correlation filter expression.
 * A CorrelationFilter holds a set of conditions that are matched against one of more of an
 * arriving message's user and system properties.
 */
export interface CorrelationFilter {
    /**
     * Identifier of the correlation.
     */
    correlationId?: string;
    /**
     * Identifier of the message.
     */
    messageId?: string;
    /**
     * Address to send to.
     */
    to?: string;
    /**
     * Address of the queue to reply to.
     */
    replyTo?: string;
    /**
     * Application specific label.
     */
    label?: string;
    /**
     * Session identifier.
     */
    sessionId?: string;
    /**
     * Session identifier to reply to.
     */
    replyToSessionId?: string;
    /**
     * Content type of the message.
     */
    contentType?: string;
    /**
     * Application specific properties of the message.
     */
    userProperties?: any;
}
/**
 * Provides information about the message to be scheduled.
 * @interface ScheduleMessage
 */
export interface ScheduleMessage {
    /**
     * @property message - The message to be scheduled
     */
    message: SendableMessageInfo;
    /**
     * @property scheduledEnqueueTimeUtc - The UTC time at which the message should be available
     * for processing.
     */
    scheduledEnqueueTimeUtc: Date;
}
//# sourceMappingURL=managementClient.d.ts.map