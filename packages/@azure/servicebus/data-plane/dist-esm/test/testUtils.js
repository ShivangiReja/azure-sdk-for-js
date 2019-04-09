// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import { delay } from "../lib";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { ServiceBusManagementClient } from "@azure/arm-servicebus";
export class TestMessage {
    static getSample() {
        const randomNumber = Math.random();
        return {
            body: `message body ${randomNumber}`,
            messageId: `message id ${randomNumber}`,
            partitionKey: "dummy"
        };
    }
    static getSessionSample() {
        const randomNumber = Math.random();
        return {
            body: `message body ${randomNumber}`,
            messageId: `message id ${randomNumber}`,
            sessionId: TestMessage.sessionId
        };
    }
}
TestMessage.sessionId = "my-session";
export var ClientType;
(function (ClientType) {
    ClientType[ClientType["PartitionedQueue"] = 0] = "PartitionedQueue";
    ClientType[ClientType["PartitionedTopic"] = 1] = "PartitionedTopic";
    ClientType[ClientType["PartitionedSubscription"] = 2] = "PartitionedSubscription";
    ClientType[ClientType["UnpartitionedQueue"] = 3] = "UnpartitionedQueue";
    ClientType[ClientType["UnpartitionedTopic"] = 4] = "UnpartitionedTopic";
    ClientType[ClientType["UnpartitionedSubscription"] = 5] = "UnpartitionedSubscription";
    ClientType[ClientType["PartitionedQueueWithSessions"] = 6] = "PartitionedQueueWithSessions";
    ClientType[ClientType["PartitionedTopicWithSessions"] = 7] = "PartitionedTopicWithSessions";
    ClientType[ClientType["PartitionedSubscriptionWithSessions"] = 8] = "PartitionedSubscriptionWithSessions";
    ClientType[ClientType["UnpartitionedQueueWithSessions"] = 9] = "UnpartitionedQueueWithSessions";
    ClientType[ClientType["UnpartitionedTopicWithSessions"] = 10] = "UnpartitionedTopicWithSessions";
    ClientType[ClientType["UnpartitionedSubscriptionWithSessions"] = 11] = "UnpartitionedSubscriptionWithSessions";
    ClientType[ClientType["TopicFilterTestTopic"] = 12] = "TopicFilterTestTopic";
    ClientType[ClientType["TopicFilterTestDefaultSubscription"] = 13] = "TopicFilterTestDefaultSubscription";
    ClientType[ClientType["TopicFilterTestSubscription"] = 14] = "TopicFilterTestSubscription";
})(ClientType || (ClientType = {}));
const defaultLockDuration = "PT30S"; // 30 seconds in ISO 8601 FORMAT - equivalent to "P0Y0M0DT0H0M30S"
export function getEnvVars() {
    if (!process.env.AAD_CLIENT_ID) {
        throw new Error("Define AAD_CLIENT_ID in your environment before running integration tests.");
    }
    if (!process.env.AAD_CLIENT_SECRET) {
        throw new Error("Define AAD_CLIENT_SECRET in your environment before running integration tests.");
    }
    if (!process.env.AAD_TENANT_ID) {
        throw new Error("Define AAD_TENANT_ID in your environment before running integration tests.");
    }
    if (!process.env.AZURE_SUBSCRIPTION_ID) {
        throw new Error("Define AZURE_SUBSCRIPTION_ID in your environment before running integration tests.");
    }
    if (!process.env.RESOURCE_GROUP) {
        throw new Error("Define RESOURCE_GROUP in your environment before running integration tests.");
    }
    if (!process.env.SERVICEBUS_CONNECTION_STRING) {
        throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
    }
    const servicebusNamespace = (process.env.SERVICEBUS_CONNECTION_STRING.match("Endpoint=sb://(.*).servicebus.windows.net") || "")[1];
    return {
        clientId: process.env.AAD_CLIENT_ID,
        clientSecret: process.env.AAD_CLIENT_SECRET,
        tenantId: process.env.AAD_TENANT_ID,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
        resourceGroup: process.env.RESOURCE_GROUP,
        servicebusNamespace: servicebusNamespace
    };
}
function recreateQueue(queueName, parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const env = getEnvVars();
        yield msRestNodeAuth
            .loginWithServicePrincipalSecret(env.clientId, env.clientSecret, env.tenantId)
            .then((creds) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = yield new ServiceBusManagementClient(creds, env.subscriptionId);
            yield client.queues.deleteMethod(env.resourceGroup, env.servicebusNamespace, queueName, function (error) {
                if (error)
                    throw error.message;
            });
            yield client.queues.createOrUpdate(env.resourceGroup, env.servicebusNamespace, queueName, parameters, function (error) {
                if (error)
                    throw error.message;
            });
        }));
    });
}
function recreateTopic(topicName, parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const env = getEnvVars();
        yield msRestNodeAuth
            .loginWithServicePrincipalSecret(env.clientId, env.clientSecret, env.tenantId)
            .then((creds) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = yield new ServiceBusManagementClient(creds, env.subscriptionId);
            yield client.topics.deleteMethod(env.resourceGroup, env.servicebusNamespace, topicName, function (error) {
                if (error)
                    throw error.message;
            });
            yield client.topics.createOrUpdate(env.resourceGroup, env.servicebusNamespace, topicName, parameters, function (error) {
                if (error)
                    throw error.message;
            });
        }));
    });
}
function recreateSubscription(topicName, subscriptionName, parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const env = getEnvVars();
        yield msRestNodeAuth
            .loginWithServicePrincipalSecret(env.clientId, env.clientSecret, env.tenantId)
            .then((creds) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = yield new ServiceBusManagementClient(creds, env.subscriptionId);
            /*
              Unlike Queues/Topics, there is no need to delete the subscription because
              `recreateTopic` is called before `recreateSubscription` which would
              delete the topic and the subscriptions before creating a new topic.
            */
            yield client.subscriptions.createOrUpdate(env.resourceGroup, env.servicebusNamespace, topicName, subscriptionName, parameters, function (error) {
                if (error)
                    throw error.message;
            });
        }));
    });
}
export function getSenderReceiverClients(namespace, senderClientType, receiverClientType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        switch (receiverClientType) {
            case ClientType.PartitionedQueue: {
                const queueName = process.env.QUEUE_NAME || "partitioned-queue";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateQueue(queueName, {
                        lockDuration: defaultLockDuration,
                        enablePartitioning: true,
                        enableBatchedOperations: true
                    });
                }
                const queueClient = namespace.createQueueClient(queueName);
                return {
                    senderClient: queueClient,
                    receiverClient: queueClient
                };
            }
            case ClientType.PartitionedSubscription: {
                const topicName = process.env.TOPIC_NAME || "partitioned-topic";
                const subscriptionName = process.env.SUBSCRIPTION_NAME || "partitioned-topic-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enablePartitioning: true,
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            case ClientType.UnpartitionedQueue: {
                const queueName = process.env.QUEUE_NAME_NO_PARTITION || "unpartitioned-queue";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateQueue(queueName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true
                    });
                }
                const queueClient = namespace.createQueueClient(queueName);
                return {
                    senderClient: queueClient,
                    receiverClient: queueClient
                };
            }
            case ClientType.UnpartitionedSubscription: {
                const topicName = process.env.TOPIC_NAME_NO_PARTITION || "unpartitioned-topic";
                const subscriptionName = process.env.SUBSCRIPTION_NAME_NO_PARTITION || "unpartitioned-topic-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            case ClientType.PartitionedQueueWithSessions: {
                const queueName = process.env.QUEUE_NAME_SESSION || "partitioned-queue-sessions";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateQueue(queueName, {
                        lockDuration: defaultLockDuration,
                        enablePartitioning: true,
                        enableBatchedOperations: true,
                        requiresSession: true
                    });
                }
                const queueClient = namespace.createQueueClient(queueName);
                return {
                    senderClient: queueClient,
                    receiverClient: queueClient
                };
            }
            case ClientType.PartitionedSubscriptionWithSessions: {
                const topicName = process.env.TOPIC_NAME_SESSION || "partitioned-topic-sessions";
                const subscriptionName = process.env.SUBSCRIPTION_NAME_SESSION || "partitioned-topic-sessions-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enablePartitioning: true,
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true,
                        requiresSession: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            case ClientType.UnpartitionedQueueWithSessions: {
                const queueName = process.env.QUEUE_NAME_NO_PARTITION_SESSION || "unpartitioned-queue-sessions";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateQueue(queueName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true,
                        requiresSession: true
                    });
                }
                const queueClient = namespace.createQueueClient(queueName);
                return {
                    senderClient: queueClient,
                    receiverClient: queueClient
                };
            }
            case ClientType.UnpartitionedSubscriptionWithSessions: {
                const topicName = process.env.TOPIC_NAME_NO_PARTITION_SESSION || "unpartitioned-topic-sessions";
                const subscriptionName = process.env.SUBSCRIPTION_NAME_NO_PARTITION_SESSION ||
                    "unpartitioned-topic-sessions-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true,
                        requiresSession: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            case ClientType.TopicFilterTestDefaultSubscription: {
                const topicName = process.env.TOPIC_FILTER_NAME || "topic-filter";
                const subscriptionName = process.env.TOPIC_FILTER_DEFAULT_SUBSCRIPTION_NAME || "topic-filter-default-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            case ClientType.TopicFilterTestSubscription: {
                const topicName = process.env.TOPIC_FILTER_NAME || "topic-filter";
                const subscriptionName = process.env.TOPIC_FILTER_SUBSCRIPTION_NAME || "topic-filter-subscription";
                if (process.env.CLEAN_NAMESPACE) {
                    yield recreateTopic(topicName, {
                        enableBatchedOperations: true
                    });
                    yield recreateSubscription(topicName, subscriptionName, {
                        lockDuration: defaultLockDuration,
                        enableBatchedOperations: true
                    });
                }
                return {
                    senderClient: namespace.createTopicClient(topicName),
                    receiverClient: namespace.createSubscriptionClient(topicName, subscriptionName)
                };
            }
            default:
                break;
        }
        throw new Error("Cannot create sender/receiver clients for given client types");
    });
}
/**
 * Purges the content in the Queue/Subscription corresponding to the receiverClient
 * @param receiverClient
 * @param sessionId if passed, session receiver will be used instead of normal receiver
 */
export function purge(receiverClient, sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let isEmpty = false;
        while (!isEmpty) {
            const peekedMsgs = yield receiverClient.peek(10);
            if (peekedMsgs.length === 0) {
                isEmpty = true;
            }
            else {
                const receiver = sessionId
                    ? yield receiverClient.getSessionReceiver({ sessionId: sessionId })
                    : receiverClient.getReceiver();
                const msgs = yield receiver.receiveBatch(peekedMsgs.length);
                for (let index = 0; index < msgs.length; index++) {
                    if (msgs[index]) {
                        yield msgs[index].complete();
                    }
                }
                yield receiver.close();
            }
        }
    });
}
/**
 * Maximum wait duration for the expected event to happen = `10000 ms`(default value is 10 seconds)(= maxWaitTimeInMilliseconds)
 * Keep checking whether the predicate is true after every `1000 ms`(default value is 1 second) (= delayBetweenRetriesInMilliseconds)
 */
export function checkWithTimeout(predicate, delayBetweenRetriesInMilliseconds = 1000, maxWaitTimeInMilliseconds = 10000) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const maxTime = Date.now() + maxWaitTimeInMilliseconds;
        while (Date.now() < maxTime) {
            if (predicate())
                return true;
            yield delay(delayBetweenRetriesInMilliseconds);
        }
        return false;
    });
}
//# sourceMappingURL=testUtils.js.map