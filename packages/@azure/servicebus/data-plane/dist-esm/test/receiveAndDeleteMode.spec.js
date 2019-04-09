// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, ReceiveMode } from "../lib";
import { DispositionType } from "../lib/serviceBusMessage";
import { TestMessage, getSenderReceiverClients, ClientType, purge, checkWithTimeout } from "./testUtils";
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
        yield purge(receiverClient, useSessions ? TestMessage.sessionId : undefined);
        const peekedMsgs = yield receiverClient.peek();
        const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
        if (peekedMsgs.length) {
            chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
        }
        sender = senderClient.getSender();
        receiver = useSessions
            ? yield receiverClient.getSessionReceiver({
                sessionId: TestMessage.sessionId,
                receiveMode: ReceiveMode.receiveAndDelete
            })
            : receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
        errorWasThrown = false;
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("Batch Receiver in ReceiveAndDelete mode", function () {
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
        });
    }
    function testNoSettlement(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sendReceiveMsg(testMessages);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testNoSettlement();
        });
    });
    it("Partitioned Subscription: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testNoSettlement();
        });
    });
    /*it("Unpartitioned Queue: No settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testNoSettlement();
    });
  
    it("Unpartitioned Subscription: No settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testNoSettlement();
    });*/
    it("Partitioned Queue with Sessions: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testNoSettlement(true);
        });
    });
    it("Partitioned Subscription with Sessions: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(true);
        });
    });
    it("Unpartitioned Queue with Sessions: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testNoSettlement(true);
        });
    });
    it("Unpartitioned Subscription with Sessions: No settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(true);
        });
    });
});
describe("Streaming Receiver in ReceiveAndDelete mode", function () {
    let errorFromErrorHandler;
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function sendReceiveMsg(testMessages, autoCompleteFlag) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sender.send(testMessages);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                receivedMsgs.push(msg);
                return Promise.resolve();
            }, (err) => {
                if (err) {
                    errorFromErrorHandler = err;
                }
            }, { autoComplete: autoCompleteFlag });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, "Could not receive the messages in expected time.");
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            should.equal(errorFromErrorHandler, undefined, errorFromErrorHandler && errorFromErrorHandler.message);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    function testNoSettlement(autoCompleteFlag, useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sendReceiveMsg(testMessages, autoCompleteFlag);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testNoSettlement(true);
        });
    });
    it("Partitioned Subscription: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testNoSettlement(true);
        });
    });
    /* it("Unpartitioned Queue: With auto-complete enabled, no settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testNoSettlement(true);
    });
  
    it("Unpartitioned Subscription: With auto-complete enabled, no settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testNoSettlement(true);
    });*/
    it("Partitioned Queue with Sessions: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testNoSettlement(true, true);
        });
    });
    it("Partitioned Subscription with Sessions: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(true, true);
        });
    });
    it("Unpartitioned Queue with Sessions: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testNoSettlement(true, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: With auto-complete enabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(true, true);
        });
    });
    it("Partitioned Queue: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testNoSettlement(false);
        });
    });
    it("Partitioned Subscription: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testNoSettlement(false);
        });
    });
    /* it("Unpartitioned Queue: With auto-complete disabled, no settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testNoSettlement(false);
    });
  
    it("Unpartitioned Subscription: With auto-complete disabled, no settlement of the message removes message", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testNoSettlement(false);
    });*/
    it("Partitioned Queue with Sessions: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testNoSettlement(false, true);
        });
    });
    it("Partitioned Subscription with Sessions: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(false, true);
        });
    });
    it("Unpartitioned Queue with Sessions: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testNoSettlement(false, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: With auto-complete disabled, no settlement of the message removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testNoSettlement(false, true);
        });
    });
});
describe("Unsupported features in ReceiveAndDelete mode", function () {
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
    const testError = (err) => {
        should.equal(err.message, "The operation is only supported in 'PeekLock' receive mode.", "ErrorMessage is different than expected");
        errorWasThrown = true;
    };
    function testSettlement(operation, useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const msg = yield sendReceiveMsg(testMessages);
            if (operation === DispositionType.complete) {
                yield msg.complete().catch((err) => testError(err));
            }
            else if (operation === DispositionType.abandon) {
                yield msg.abandon().catch((err) => testError(err));
            }
            else if (operation === DispositionType.deadletter) {
                yield msg.deadLetter().catch((err) => testError(err));
            }
            else if (operation === DispositionType.defer) {
                yield msg.defer().catch((err) => testError(err));
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("Partitioned Subscription: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSettlement(DispositionType.complete);
        });
    });
    /* it("Unpartitioned Queue: complete() throws error", async function(): Promise<void> {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testSettlement(DispositionType.complete);
    });
  
    it("Unpartitioned Subscription: complete() throws error", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testSettlement(DispositionType.complete);
    });*/
    it("Partitioned Queue with Sessions: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.complete, true);
        });
    });
    it("Partitioned Subscription with Sessions: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.complete, true);
        });
    });
    it("Unpartitioned Queue with Sessions: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.complete, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.complete, true);
        });
    });
    it("Partitioned Queue: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("Partitioned Subscription: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSettlement(DispositionType.abandon);
        });
    });
    /* it("Unpartitioned Queue: abandon() throws error", async function(): Promise<void> {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testSettlement(DispositionType.abandon);
    });
  
    it("Unpartitioned Subscription: abandon() throws error", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testSettlement(DispositionType.abandon);
    });*/
    it("Partitioned Queue with Sessions: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.abandon, true);
        });
    });
    it("Partitioned Subscription with Sessions: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.abandon, true);
        });
    });
    it("Unpartitioned Queue with Sessions: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.abandon, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.abandon, true);
        });
    });
    it("Partitioned Queue: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("Partitioned Subscription: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSettlement(DispositionType.defer);
        });
    });
    /* it("Unpartitioned Queue: defer() throws error", async function(): Promise<void> {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testSettlement(DispositionType.defer);
    });
  
    it("Unpartitioned Subscription: defer() throws error", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testSettlement(DispositionType.defer);
    });*/
    it("Partitioned Queue with Sessions: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.defer, true);
        });
    });
    it("Partitioned Subscription with Sessions: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.defer, true);
        });
    });
    it("Unpartitioned Queue with Sessions: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.defer, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.defer, true);
        });
    });
    it("Partitioned Queue: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    it("Partitioned Subscription: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    /* it("Unpartitioned Queue: deadLetter() throws error", async function(): Promise<void> {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testSettlement(DispositionType.deadletter);
    });
  
    it("Unpartitioned Subscription: deadLetter() throws error", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testSettlement(DispositionType.deadletter);
    });*/
    it("Partitioned Queue with Sessions: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.deadletter, true);
        });
    });
    it("Partitioned Subscription with Sessions: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.deadletter, true);
        });
    });
    it("Unpartitioned Queue with Sessions: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSettlement(DispositionType.deadletter, true);
        });
    });
    it("Unpartitioned Subscription with Sessions: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSettlement(DispositionType.deadletter, true);
        });
    });
    function testRenewLock() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const msg = yield sendReceiveMsg(TestMessage.getSample());
            yield receiver.renewLock(msg).catch((err) => testError(err));
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    }
    it("Partitioned Queue: Renew message lock throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testRenewLock();
        });
    });
    it("Partitioned Subscription: Renew message lock throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testRenewLock();
        });
    });
    /* it("Unpartitioned Queue: Renew message lock throws error", async function(): Promise<void> {
      await beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
      await testRenewLock();
    });
  
    it("Unpartitioned Subscription: Renew message lock throws error", async function(): Promise<
      void
    > {
      await beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
      await testRenewLock();
    });*/
});
//# sourceMappingURL=receiveAndDeleteMode.spec.js.map