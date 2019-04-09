// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, SubscriptionClient } from "../lib";
import { TestMessage, getSenderReceiverClients, ClientType, purge } from "./testUtils";
function testPeekMsgsLength(client, expectedPeekLength) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const peekedMsgs = yield client.peek(expectedPeekLength + 1);
        should.equal(peekedMsgs.length, expectedPeekLength, "Unexpected number of msgs found when peeking");
    });
}
let ns;
let senderClient;
let receiverClient;
let deadLetterClient;
let sender;
let receiver;
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
function deferMessage(testMessages) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield sender.send(testMessages);
        const receivedMsgs = yield receiver.receiveBatch(1);
        should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
        should.equal(receivedMsgs[0].body, testMessages.body, "MessageBody is different than expected");
        should.equal(receivedMsgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
        should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
        if (!receivedMsgs[0].sequenceNumber) {
            throw "Sequence Number can not be null";
        }
        const sequenceNumber = receivedMsgs[0].sequenceNumber;
        yield receivedMsgs[0].defer();
        const deferredMsgs = yield receiver.receiveDeferredMessage(sequenceNumber);
        if (!deferredMsgs) {
            throw "No message received for sequence number";
        }
        should.equal(deferredMsgs.body, testMessages.body, "MessageBody is different than expected");
        should.equal(deferredMsgs.messageId, testMessages.messageId, "MessageId is different than expected");
        should.equal(deferredMsgs.deliveryCount, 1, "DeliveryCount is different than expected");
        return deferredMsgs;
    });
}
function completeDeferredMessage(sequenceNumber, expectedDeliverCount, testMessages, useSessions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield testPeekMsgsLength(receiverClient, 1);
        const deferredMsg = yield receiver.receiveDeferredMessage(sequenceNumber);
        if (!deferredMsg) {
            throw "No message received for sequence number";
        }
        should.equal(deferredMsg.body, testMessages.body, "MessageBody is different than expected");
        should.equal(deferredMsg.deliveryCount, expectedDeliverCount, "DeliveryCount is different than expected");
        should.equal(deferredMsg.messageId, testMessages.messageId, "MessageId is different than expected");
        yield deferredMsg.complete();
        yield testPeekMsgsLength(receiverClient, 0);
    });
}
describe("Abandon/Defer/Deadletter deferred message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testAbandon(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const deferredMsg = yield deferMessage(testMessages);
            const sequenceNumber = deferredMsg.sequenceNumber;
            if (!sequenceNumber) {
                throw "Sequence Number can not be null";
            }
            yield deferredMsg.abandon();
            yield completeDeferredMessage(sequenceNumber, 2, testMessages);
        });
    }
    it("Partitioned Queue: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAbandon();
        });
    });
    it("Partitioned Subscription: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAbandon();
        });
    });
    it("Partitioned Queue with Sessions: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Partitioned Subscription with Sessions: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Unpartitioned Queue: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAbandon();
        });
    });
    it("Unpartitioned Subscription: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAbandon();
        });
    });
    it("Unpartitioned Queue with Sessions:: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testAbandon(true);
        });
    });
    it("Unpartitioned Subscription with Sessions:: Abandoning a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testAbandon(true);
        });
    });
    function testDefer(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const deferredMsg = yield deferMessage(testMessages);
            const sequenceNumber = deferredMsg.sequenceNumber;
            if (!sequenceNumber) {
                throw "Sequence Number can not be null";
            }
            yield deferredMsg.defer();
            yield completeDeferredMessage(sequenceNumber, 2, testMessages);
        });
    }
    it("Partitioned Queue: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDefer();
        });
    });
    it("Partitioned Subscription: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDefer();
        });
    });
    it("Partitioned Queue with Sessions: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Partitioned Subscription with Sessions: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Unpartitioned Queue: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDefer();
        });
    });
    it("Unpartitioned Subscription: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDefer();
        });
    });
    it("Unpartitioned Queue with Sessions: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testDefer(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: Deferring a deferred message puts it back to the deferred queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testDefer(true);
        });
    });
    function testDeadletter(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const deferredMsg = yield deferMessage(testMessages);
            yield deferredMsg.deadLetter();
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(deadLetterMsgs[0].deliveryCount, 1, "DeliveryCount is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDeadletter();
        });
    });
    it("Partitioned Subscription: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDeadletter();
        });
    });
    it("Partitioned Queue with Sessions: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Partitioned Subscription with Sessions: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Unpartitioned Queue: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDeadletter();
        });
    });
    it("Unpartitioned Subscription: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDeadletter();
        });
    });
    it("Unpartitioned Queue with Sessions: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testDeadletter(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: Deadlettering a deferred message moves it to dead letter queue.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testDeadletter(true);
        });
    });
});
//# sourceMappingURL=deferredMessage.spec.js.map