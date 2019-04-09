import { SendableMessageInfo, QueueClient, TopicClient, Namespace, SubscriptionClient } from "../lib";
export declare class TestMessage {
    static sessionId: string;
    static getSample(): SendableMessageInfo;
    static getSessionSample(): SendableMessageInfo;
}
export declare enum ClientType {
    PartitionedQueue = 0,
    PartitionedTopic = 1,
    PartitionedSubscription = 2,
    UnpartitionedQueue = 3,
    UnpartitionedTopic = 4,
    UnpartitionedSubscription = 5,
    PartitionedQueueWithSessions = 6,
    PartitionedTopicWithSessions = 7,
    PartitionedSubscriptionWithSessions = 8,
    UnpartitionedQueueWithSessions = 9,
    UnpartitionedTopicWithSessions = 10,
    UnpartitionedSubscriptionWithSessions = 11,
    TopicFilterTestTopic = 12,
    TopicFilterTestDefaultSubscription = 13,
    TopicFilterTestSubscription = 14
}
export declare function getEnvVars(): {
    [key: string]: string;
};
export declare function getSenderReceiverClients(namespace: Namespace, senderClientType: ClientType, receiverClientType: ClientType): Promise<{
    senderClient: QueueClient | TopicClient;
    receiverClient: QueueClient | SubscriptionClient;
}>;
/**
 * Purges the content in the Queue/Subscription corresponding to the receiverClient
 * @param receiverClient
 * @param sessionId if passed, session receiver will be used instead of normal receiver
 */
export declare function purge(receiverClient: QueueClient | SubscriptionClient, sessionId?: string): Promise<void>;
/**
 * Maximum wait duration for the expected event to happen = `10000 ms`(default value is 10 seconds)(= maxWaitTimeInMilliseconds)
 * Keep checking whether the predicate is true after every `1000 ms`(default value is 1 second) (= delayBetweenRetriesInMilliseconds)
 */
export declare function checkWithTimeout(predicate: () => boolean, delayBetweenRetriesInMilliseconds?: number, maxWaitTimeInMilliseconds?: number): Promise<boolean>;
//# sourceMappingURL=testUtils.d.ts.map