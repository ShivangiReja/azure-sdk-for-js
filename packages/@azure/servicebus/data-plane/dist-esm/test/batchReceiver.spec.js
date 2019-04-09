// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, SubscriptionClient, delay } from "../lib";
import { TestMessage, getSenderReceiverClients, ClientType, purge } from "./testUtils";
function testPeekMsgsLength(client, expectedPeekLength) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const peekedMsgs = yield client.peek(expectedPeekLength + 1);
        should.equal(peekedMsgs.length, expectedPeekLength, "Unexpected number of msgs found when peeking");
    });
}
let ns;
let errorWasThrown;
let senderClient;
let receiverClient;
let deadLetterClient;
let sender;
let receiver;
const maxDeliveryCount = 10;
function beforeEachTest(senderType, receiverType, useSessions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // The tests in this file expect the env variables to contain the connection string and
        // the names of empty queue/topic/subscription that are to be tested
        if (!process.env.SERVICEBUS_CONNECTION_STRING) {
            throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
        }
        ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
        const clients = yield getSenderReceiverClients(ns, senderType, receiverType);
        senderClient = clients.senderClient;
        receiverClient = clients.receiverClient;
        if (receiverClient instanceof QueueClient) {
            deadLetterClient = ns.createQueueClient(Namespace.getDeadLetterQueuePath(receiverClient.entityPath));
        }
        if (receiverClient instanceof SubscriptionClient) {
            deadLetterClient = ns.createSubscriptionClient(Namespace.getDeadLetterTopicPath(senderClient.entityPath, receiverClient.subscriptionName), receiverClient.subscriptionName);
        }
        yield purge(receiverClient, useSessions ? TestMessage.sessionId : undefined);
        yield purge(deadLetterClient);
        const peekedMsgs = yield receiverClient.peek();
        const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
        if (peekedMsgs.length) {
            chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
        }
        const peekedDeadMsgs = yield deadLetterClient.peek();
        if (peekedDeadMsgs.length) {
            chai.assert.fail(`Please use an empty dead letter ${receiverEntityType} for integration testing`);
        }
        sender = senderClient.getSender();
        receiver = useSessions
            ? yield receiverClient.getSessionReceiver({
                sessionId: TestMessage.sessionId
            })
            : receiverClient.getReceiver();
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("Batch Receiver - Settle message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function sendReceiveMsg(testMessages) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sender.send(testMessages);
            const msgs = yield receiver.receiveBatch(1);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(msgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            should.equal(msgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
            return msgs[0];
        });
    }
    function testComplete(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const msg = yield sendReceiveMsg(testMessages);
            yield msg.complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testComplete();
        });
    });
    it("Partitioned Subscription: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testComplete();
        });
    });
    it("Unpartitioned Queue: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testComplete();
        });
    });
    it("Unpartitioned Subscription: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testComplete();
        });
    });
    it("Partitioned Queue with Sessions: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testComplete(true);
        });
    });
    it("Partitioned Subscription with Sessions: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testComplete(true);
        });
    });
    it("Unpartitioned Queue with Sessions: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testComplete(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testComplete(true);
        });
    });
    function testAbandon(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const msg = yield sendReceiveMsg(testMessages);
            yield msg.abandon();
            yield testPeekMsgsLength(receiverClient, 1);
            const receivedMsgs = yield receiver.receiveBatch(1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].deliveryCount, 1, "DeliveryCount is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield receivedMsgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAbandon();
        });
    });
    it("Partitioned Subscription: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAbandon();
        });
    });
    it("Unpartitioned Queue: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAbandon();
        });
    });
    it("Unpartitioned Subscription: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAbandon();
        });
    });
    it("Partitioned Queue with Sessions: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Partitioned Subscription with Sessions: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Unpartitioned Queue with Sessions: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: abandon() retains message with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testAbandon(true);
        });
    });
    function testAbandonMsgsTillMaxDeliveryCount(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sender.send(testMessages);
            let abandonMsgCount = 0;
            while (abandonMsgCount < maxDeliveryCount) {
                const receivedMsgs = yield receiver.receiveBatch(1);
                should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
                should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
                should.equal(receivedMsgs[0].deliveryCount, abandonMsgCount, "DeliveryCount is different than expected");
                abandonMsgCount++;
                yield receivedMsgs[0].abandon();
            }
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(Array.isArray(deadLetterMsgs), true, "`ReceivedMessages` from Deadletter is not an array");
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAbandonMsgsTillMaxDeliveryCount();
        });
    });
    it("Partitioned Subscription: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAbandonMsgsTillMaxDeliveryCount();
        });
    });
    it("Unpartitioned Queue: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAbandonMsgsTillMaxDeliveryCount();
        });
    });
    it("Unpartitioned Subscription: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAbandonMsgsTillMaxDeliveryCount();
        });
    });
    it("Partitioned Queue with Sessions: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAbandonMsgsTillMaxDeliveryCount(true);
        });
    });
    it("Partitioned Subscription with Sessions: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAbandonMsgsTillMaxDeliveryCount(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAbandonMsgsTillMaxDeliveryCount(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: Multiple abandons until maxDeliveryCount.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAbandonMsgsTillMaxDeliveryCount(true);
        });
    });
    function testDefer(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const msg = yield sendReceiveMsg(testMessages);
            if (!msg.sequenceNumber) {
                throw "Sequence Number can not be null";
            }
            const sequenceNumber = msg.sequenceNumber;
            yield msg.defer();
            const deferredMsgs = yield receiver.receiveDeferredMessage(sequenceNumber);
            if (!deferredMsgs) {
                throw "No message received for sequence number";
            }
            should.equal(deferredMsgs.body, testMessages.body, "MessageBody is different than expected");
            should.equal(deferredMsgs.messageId, testMessages.messageId, "MessageId is different than expected");
            should.equal(deferredMsgs.deliveryCount, 1, "DeliveryCount is different than expected");
            yield deferredMsgs.complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDefer();
        });
    });
    it("Partitioned Subscription: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDefer();
        });
    });
    it("Partitioned Queue with Sessions: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Partitioned Subscription with Sessions: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Unpartitioned Queue: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDefer();
        });
    });
    it("Unpartitioned Subscription: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDefer();
        });
    });
    it("Unpartitioned Queue with Sessions: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testDefer(true);
        });
    });
    function testDeadletter(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const msg = yield sendReceiveMsg(testMessages);
            yield msg.deadLetter();
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(Array.isArray(deadLetterMsgs), true, "`ReceivedMessages` from Deadletter is not an array");
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDeadletter();
        });
    });
    it("Partitioned Subscription: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDeadletter();
        });
    });
    it("Unpartitioned Queue: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDeadletter();
        });
    });
    it("Unpartitioned Subscription: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDeadletter();
        });
    });
    it("Partitioned Queue with Sessions: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Partitioned Subscription with Sessions: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Unpartitioned Queue with Sessions: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testDeadletter(true);
        });
    });
});
describe("Batch Receiver - Settle deadlettered message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function deadLetterMessage(testMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sender.send(testMessage);
            const receivedMsgs = yield receiver.receiveBatch(1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(receivedMsgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
            yield receivedMsgs[0].deadLetter();
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(deadLetterMsgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
            return deadLetterMsgs[0];
        });
    }
    function completeDeadLetteredMessage(testMessage, deadletterClient, expectedDeliverCount) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const deadLetterMsgs = yield deadletterClient.getReceiver().receiveBatch(1);
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(deadLetterMsgs[0].deliveryCount, expectedDeliverCount, "DeliveryCount is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadletterClient, 0);
        });
    }
    function testDeadletter(testMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const deadLetterMsg = yield deadLetterMessage(testMessage);
            yield deadLetterMsg.deadLetter().catch((err) => {
                should.equal(err.name, "InvalidOperationError", "ErrorName is different than expected");
                errorWasThrown = true;
            });
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
            yield completeDeadLetteredMessage(testMessage, deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Throws error when dead lettering a dead lettered message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDeadletter(TestMessage.getSample());
        });
    });
    it("Partitioned Subscription: Throws error when dead lettering a dead lettered message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDeadletter(TestMessage.getSample());
        });
    });
    it("Unpartitioned Queue: Throws error when dead lettering a dead lettered message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDeadletter(TestMessage.getSample());
        });
    });
    it("Unpartitioned Subscription: Throws error when dead lettering a dead lettered message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDeadletter(TestMessage.getSample());
        });
    });
    function testAbandon(testMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const deadLetterMsg = yield deadLetterMessage(testMessage);
            yield deadLetterMsg.abandon();
            yield completeDeadLetteredMessage(testMessage, deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Abandon a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAbandon(TestMessage.getSample());
        });
    });
    it("Partitioned Subscription: Abandon a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAbandon(TestMessage.getSample());
        });
    });
    it("Unpartitioned Queue: Abandon a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAbandon(TestMessage.getSample());
        });
    });
    it("Unpartitioned Subscription: Abandon a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAbandon(TestMessage.getSample());
        });
    });
    function testDefer(testMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const deadLetterMsg = yield deadLetterMessage(testMessage);
            if (!deadLetterMsg.sequenceNumber) {
                throw "Sequence Number can not be null";
            }
            const sequenceNumber = deadLetterMsg.sequenceNumber;
            yield deadLetterMsg.defer();
            const deferredMsgs = yield deadLetterClient
                .getReceiver()
                .receiveDeferredMessage(sequenceNumber);
            if (!deferredMsgs) {
                throw "No message received for sequence number";
            }
            should.equal(deferredMsgs.body, testMessage.body, "MessageBody is different than expected");
            should.equal(deferredMsgs.messageId, testMessage.messageId, "MessageId is different than expected");
            yield deferredMsgs.complete();
            yield testPeekMsgsLength(receiverClient, 0);
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Defer a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDefer(TestMessage.getSample());
        });
    });
    it("Partitioned Subscription: Defer a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDefer(TestMessage.getSample());
        });
    });
    it("Unpartitioned Queue: Defer a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDefer(TestMessage.getSample());
        });
    });
    it("Unpartitioned Subscription: Defer a message received from dead letter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDefer(TestMessage.getSample());
        });
    });
});
describe("Batch Receiver - Multiple ReceiveBatch calls", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    // We use an empty queue/topic here so that the first receiveBatch call takes time to return
    function testParallelReceiveBatchCalls() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const firstBatchPromise = receiver.receiveBatch(1, 10);
            yield delay(5000);
            const secondBatchPromise = receiver.receiveBatch(1, 10).catch((err) => {
                should.equal(err.name, "Error", "Error name is different than expected");
                errorWasThrown = true;
            });
            yield Promise.all([firstBatchPromise, secondBatchPromise]);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    }
    it("Partitioned Queue: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Partitioned Subscription: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Unpartitioned Queue: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Unpartitioned Subscription: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Partitioned Queue with Sessions: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Partitioned Subscription with Sessions: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Unpartitioned Queue with Sessions: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testParallelReceiveBatchCalls();
        });
    });
    it("Unpartitioned Subscription with Sessions: Throws error when ReceiveBatch is called while the previous call is not done", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testParallelReceiveBatchCalls();
        });
    });
    const messages = [
        {
            body: "hello1",
            messageId: `test message ${Math.random()}`,
            partitionKey: "dummy" // partitionKey is only for partitioned queue/subscrption, Unpartitioned queue/subscrption do not care about partitionKey.
        },
        {
            body: "hello2",
            messageId: `test message ${Math.random()}`,
            partitionKey: "dummy" // partitionKey is only for partitioned queue/subscrption, Unpartitioned queue/subscrption do not care about partitionKey.
        }
    ];
    const messageWithSessions = [
        {
            body: "hello1",
            messageId: `test message ${Math.random()}`,
            sessionId: TestMessage.sessionId
        },
        {
            body: "hello2",
            messageId: `test message ${Math.random()}`,
            sessionId: TestMessage.sessionId
        }
    ];
    // We test for mutilple receiveBatch specifically to ensure that batchingRecevier on a client is reused
    // See https://github.com/Azure/azure-service-bus-node/issues/31
    function testSequentialReceiveBatchCalls(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? messageWithSessions : messages;
            yield sender.sendBatch(testMessages);
            const msgs1 = yield receiver.receiveBatch(1);
            const msgs2 = yield receiver.receiveBatch(1);
            // Results are checked after both receiveBatches are done to ensure that the second call doesnt
            // affect the result from the first one.
            should.equal(Array.isArray(msgs1), true, "`ReceivedMessages` is not an array");
            should.equal(msgs1.length, 1, "Unexpected number of messages");
            should.equal(Array.isArray(msgs2), true, "`ReceivedMessages` is not an array");
            should.equal(msgs2.length, 1, "Unexpected number of messages");
            should.equal(testMessages.some((x) => x.messageId === msgs1[0].messageId), true, "MessageId is different than expected");
            should.equal(testMessages.some((x) => x.messageId === msgs2[0].messageId), true, "MessageId is different than expected");
            yield msgs1[0].complete();
            yield msgs2[0].complete();
        });
    }
    it("Partitioned Queue: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSequentialReceiveBatchCalls();
        });
    });
    it("Partitioned Subscription: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSequentialReceiveBatchCalls();
        });
    });
    it("Unpartitioned Queue: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSequentialReceiveBatchCalls();
        });
    });
    it("Unpartitioned Subscription: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSequentialReceiveBatchCalls();
        });
    });
    it("Partitioned Queue with Sessions: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSequentialReceiveBatchCalls(true);
        });
    });
    it("Partitioned Subscription with Sessions: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSequentialReceiveBatchCalls(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSequentialReceiveBatchCalls(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: Multiple sequential receiveBatch calls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSequentialReceiveBatchCalls(true);
        });
    });
});
describe("Batch Receiver - Others", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testNoSettlement(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sender.send(testMessages);
            let receivedMsgs = yield receiver.receiveBatch(1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield testPeekMsgsLength(receiverClient, 1);
            receivedMsgs = yield receiver.receiveBatch(1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].deliveryCount, 1, "DeliveryCount is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield receivedMsgs[0].complete();
        });
    }
    it("Partitioned Queue: No settlement of the message is retained with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testNoSettlement();
        });
    });
    it("Partitioned Subscription: No settlement of the message is retained with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testNoSettlement();
        });
    });
    it("Unpartitioned Queue: No settlement of the message is retained with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testNoSettlement();
        });
    });
    it("Unpartitioned Subscription: No settlement of the message is retained with incremented deliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testNoSettlement();
        });
    });
    function testAskForMore(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sender.send(testMessages);
            const receivedMsgs = yield receiver.receiveBatch(2);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield receivedMsgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Receive n messages but queue only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAskForMore();
        });
    });
    it("Partitioned Subscription: Receive n messages but subscription only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAskForMore();
        });
    });
    it("Unpartitioned Queue: Receive n messages but queue only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAskForMore();
        });
    });
    it("Unpartitioned Subscription: Receive n messages but subscription only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAskForMore();
        });
    });
    it("Partitioned Queue with Sessions: Receive n messages but queue only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testAskForMore(true);
        });
    });
    it("Partitioned Subscription with Sessions: Receive n messages but subscription only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testAskForMore(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Receive n messages but queue only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testAskForMore(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: Receive n messages but subscription only has m messages, where m < n", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testAskForMore(true);
        });
    });
});
//# sourceMappingURL=batchReceiver.spec.js.map