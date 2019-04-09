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
import { DispositionType } from "../lib/serviceBusMessage";
import { TestMessage, getSenderReceiverClients, ClientType, purge, checkWithTimeout } from "./testUtils";
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
let sessionReceiver;
let sender;
let errorWasThrown;
let unexpectedError;
function unExpectedErrorHandler(err) {
    if (err) {
        unexpectedError = err;
    }
}
function beforeEachTest(senderType, receiverType) {
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
        sender = senderClient.getSender();
        if (receiverClient instanceof QueueClient) {
            deadLetterClient = ns.createQueueClient(Namespace.getDeadLetterQueuePath(receiverClient.entityPath));
        }
        if (receiverClient instanceof SubscriptionClient) {
            deadLetterClient = ns.createSubscriptionClient(Namespace.getDeadLetterTopicPath(senderClient.entityPath, receiverClient.subscriptionName), receiverClient.subscriptionName);
        }
        yield purge(receiverClient, TestMessage.sessionId);
        yield purge(deadLetterClient);
        const peekedMsgs = yield receiverClient.peek();
        const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
        if (peekedMsgs.length) {
            chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
        }
        sessionReceiver = yield receiverClient.getSessionReceiver({
            sessionId: TestMessage.sessionId
        });
        errorWasThrown = false;
        unexpectedError = undefined;
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("Sessions Streaming - Misc Tests", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testAutoComplete() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => {
                receivedMsgs.push(msg);
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return Promise.resolve();
            }, unExpectedErrorHandler);
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1 && receivedMsgs[0].delivery.remote_settled === true);
            should.equal(msgsCheck, true, receivedMsgs.length !== 1
                ? `Expected 1, received ${receivedMsgs.length} messages`
                : "Message didnt get auto-completed in time");
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: AutoComplete removes the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testAutoComplete();
        });
    });
    it("Partitioned Subscription: AutoComplete removes the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testAutoComplete();
        });
    });
    it("UnPartitioned Queue: AutoComplete removes the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testAutoComplete();
        });
    });
    it("UnPartitioned Subscription: AutoComplete removes the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testAutoComplete();
        });
    });
    function testManualComplete() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => {
                receivedMsgs.push(msg);
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return Promise.resolve();
            }, unExpectedErrorHandler, { autoComplete: false });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            yield testPeekMsgsLength(receiverClient, 1);
            yield receivedMsgs[0].complete();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Disabled autoComplete, no manual complete retains the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testManualComplete();
        });
    });
    it("Partitioned Subscription: Disabled autoComplete, no manual complete retains the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testManualComplete();
        });
    });
    it("UnPartitioned Queue: Disabled autoComplete, no manual complete retains the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testManualComplete();
        });
    });
    it("UnPartitioned Subscription: Disabled autoComplete, no manual complete retains the message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testManualComplete();
        });
    });
});
describe("Sessions Streaming - Complete message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testComplete(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => {
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return msg.complete().then(() => {
                    receivedMsgs.push(msg);
                });
            }, unExpectedErrorHandler, { autoComplete });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testComplete(false);
        });
    });
    it("Partitioned Subscription: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testComplete(false);
        });
    });
    it("UnPartitioned Queue: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testComplete(false);
        });
    });
    it("UnPartitioned Subscription: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testComplete(false);
        });
    });
    it("Partitioned Queue with autoComplete: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testComplete(true);
        });
    });
    it("Partitioned Subscription with autoComplete: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testComplete(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testComplete(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: complete() removes message(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testComplete(true);
        });
    });
});
describe("Sessions Streaming - Abandon message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testAbandon(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            let abandonFlag = 0;
            yield sessionReceiver.receive((msg) => {
                return msg.abandon().then(() => {
                    abandonFlag = 1;
                    if (sessionReceiver.isReceivingMessages()) {
                        return sessionReceiver.close();
                    }
                    return Promise.resolve();
                });
            }, unExpectedErrorHandler, { autoComplete });
            const msgAbandonCheck = yield checkWithTimeout(() => abandonFlag === 1);
            should.equal(msgAbandonCheck, true, "Abandoning the message results in a failure");
            if (sessionReceiver.isReceivingMessages()) {
                yield sessionReceiver.close();
            }
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            sessionReceiver = yield receiverClient.getSessionReceiver({
                sessionId: TestMessage.sessionId
            });
            const receivedMsgs = yield sessionReceiver.receiveBatch(1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(receivedMsgs[0].deliveryCount, 1, "DeliveryCount is different than expected");
            yield receivedMsgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testAbandon(false);
        });
    });
    it("Partitioned Subscription: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testAbandon(false);
        });
    });
    it("UnPartitioned Queue: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testAbandon(false);
        });
    });
    it("UnPartitioned Subscription: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testAbandon(false);
        });
    });
    it("Partitioned Queue with autoComplete: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testAbandon(true);
        });
    });
    it("Partitioned Subscription with autoComplete: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testAbandon(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testAbandon(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: abandon() retains message with incremented deliveryCount(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testAbandon(true);
        });
    });
});
describe("Sessions Streaming - Defer message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testDefer(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            let sequenceNum = 0;
            yield sessionReceiver.receive((msg) => {
                return msg.defer().then(() => {
                    sequenceNum = msg.sequenceNumber;
                });
            }, unExpectedErrorHandler, { autoComplete });
            const sequenceNumCheck = yield checkWithTimeout(() => sequenceNum !== 0);
            should.equal(sequenceNumCheck, true, "Either the message is not received or observed an unexpected SequenceNumber.");
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            const deferredMsg = yield sessionReceiver.receiveDeferredMessage(sequenceNum);
            if (!deferredMsg) {
                throw "No message received for sequence number";
            }
            should.equal(deferredMsg.body, testMessage.body, "MessageBody is different than expected");
            should.equal(deferredMsg.messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(deferredMsg.deliveryCount, 1, "DeliveryCount is different than expected");
            yield deferredMsg.complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testDefer(false);
        });
    });
    it("Partitioned Subscription: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testDefer(false);
        });
    });
    it("UnPartitioned Queue: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testDefer(false);
        });
    });
    it("UnPartitioned Subscription: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testDefer(false);
        });
    });
    it("Partitioned Queue with autoComplete: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testDefer(true);
        });
    });
    it("Partitioned Subscription with autoComplete: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testDefer(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testDefer(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: defer() moves message to deferred queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testDefer(true);
        });
    });
});
describe("Sessions Streaming - Deadletter message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testDeadletter(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            let msgCount = 0;
            yield sessionReceiver.receive((msg) => {
                return msg.deadLetter().then(() => {
                    msgCount++;
                });
            }, unExpectedErrorHandler, { autoComplete });
            const msgsCheck = yield checkWithTimeout(() => msgCount === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${msgCount} messages`);
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(msgCount, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(Array.isArray(deadLetterMsgs), true, "`ReceivedMessages` is not an array");
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testDeadletter(false);
        });
    });
    it("Partitioned Subscription: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testDeadletter(false);
        });
    });
    it("UnPartitioned Queue: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testDeadletter(false);
        });
    });
    it("UnPartitioned Subscription: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testDeadletter(false);
        });
    });
    it("Partitioned Queue with autoComplete: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testDeadletter(true);
        });
    });
    it("Partitioned Subscription with autoComplete: deadLetter() moves message to deadletter(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testDeadletter(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testDeadletter(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: deadLetter() moves message to deadletter queue(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testDeadletter(true);
        });
    });
});
describe("Sessions Streaming - Multiple Streaming Receivers", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testMultipleReceiveCalls() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sessionReceiver.receive((msg) => {
                return msg.complete();
            }, unExpectedErrorHandler);
            yield delay(5000);
            try {
                yield sessionReceiver.receive((msg) => {
                    return Promise.resolve();
                }, (err) => {
                    should.exist(err);
                });
            }
            catch (err) {
                errorWasThrown = true;
                should.equal(!err.message.search("has already been created for the Subscription"), false, "ErrorMessage is different than expected");
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    }
    it("Partitioned Queue: Second Streaming Receiver call should fail if the first one is not stopped(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testMultipleReceiveCalls();
        });
    });
    it("Partitioned Subscription: Second Streaming Receiver call should fail if the first one is not stopped(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testMultipleReceiveCalls();
        });
    });
    it("UnPartitioned Queue: Second Streaming Receiver call should fail if the first one is not stopped(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testMultipleReceiveCalls();
        });
    });
    it("UnPartitioned Subscription: Second Streaming Receiver call should fail if the first one is not stopped(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testMultipleReceiveCalls();
        });
    });
});
describe("Sessions Streaming - Settle an already Settled message throws error", () => {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    const testError = (err) => {
        should.equal(err.message, "This message has been already settled.", "ErrorMessage is different than expected");
        errorWasThrown = true;
    };
    function testSettlement(operation) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => {
                receivedMsgs.push(msg);
                return Promise.resolve();
            }, unExpectedErrorHandler);
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1 && receivedMsgs[0].delivery.remote_settled === true);
            should.equal(msgsCheck, true, receivedMsgs.length !== 1
                ? `Expected 1, received ${receivedMsgs.length} messages`
                : "Message didnt get auto-completed in time");
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            should.equal(receivedMsgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(receivedMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            yield testPeekMsgsLength(receiverClient, 0);
            if (operation === DispositionType.complete) {
                yield receivedMsgs[0].complete().catch((err) => testError(err));
            }
            else if (operation === DispositionType.abandon) {
                yield receivedMsgs[0].abandon().catch((err) => testError(err));
            }
            else if (operation === DispositionType.deadletter) {
                yield receivedMsgs[0].deadLetter().catch((err) => testError(err));
            }
            else if (operation === DispositionType.defer) {
                yield receivedMsgs[0].defer().catch((err) => testError(err));
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    }
    it("Partitioned Queue: complete() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("Partitioned Subscription: complete() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("UnPartitioned Queue: complete() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("UnPartitioned Subscription: complete() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("Partitioned Queue: abandon() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("Partitioned Subscription: abandon() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("UnPartitioned Queue: abandon() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("UnPartitioned Subscription: abandon() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("Partitioned Queue: defer() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("Partitioned Subscription: defer() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("UnPartitioned Queue: defer() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("UnPartitioned Subscription: defer() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("Partitioned Queue: deadLetter() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    it("Partitioned Subscription: deadLetter() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    it("UnPartitioned Queue: deadLetter() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    it("UnPartitioned Subscription: deadLetter() throws error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testSettlement(DispositionType.deadletter);
        });
    });
});
describe("Sessions Streaming - User Error", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testUserError() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const errorMessage = "Will we see this error message?";
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield msg.complete().then(() => {
                    receivedMsgs.push(msg);
                });
                throw new Error(errorMessage);
            }), unExpectedErrorHandler);
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages.`);
            yield sessionReceiver.close();
            should.equal(unexpectedError && unexpectedError.message, errorMessage, "User error did not surface.");
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
        });
    }
    it("Partitioned Queue: onError handler is called for user error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testUserError();
        });
    });
    it("Partitioned Subscription: onError handler is called for user error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testUserError();
        });
    });
    it("UnPartitioned Queue: onError handler is called for user error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testUserError();
        });
    });
    it("UnPartitioned Subscription: onError handler is called for user error(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testUserError();
        });
    });
});
describe("Sessions Streaming - maxConcurrentCalls", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testConcurrency(maxConcurrentCalls) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof maxConcurrentCalls === "number" &&
                (maxConcurrentCalls < 1 || maxConcurrentCalls > 2)) {
                chai.assert.fail("Sorry, the tests here only support cases when maxConcurrentCalls is set to 1 or 2");
            }
            const testMessages = [TestMessage.getSessionSample(), TestMessage.getSessionSample()];
            yield sender.sendBatch(testMessages);
            const settledMsgs = [];
            const receivedMsgs = [];
            sessionReceiver.receive((msg) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (receivedMsgs.length === 1) {
                    if ((!maxConcurrentCalls || maxConcurrentCalls === 1) && settledMsgs.length === 0) {
                        throw new Error("onMessage for the second message should not have been called before the first message got settled");
                    }
                }
                else {
                    if (maxConcurrentCalls === 2 && settledMsgs.length !== 0) {
                        throw new Error("onMessage for the second message should have been called before the first message got settled");
                    }
                }
                receivedMsgs.push(msg);
                yield delay(2000);
                yield msg.complete().then(() => {
                    settledMsgs.push(msg);
                });
            }), unExpectedErrorHandler, maxConcurrentCalls ? { maxConcurrentCalls } : {});
            yield checkWithTimeout(() => settledMsgs.length === 2);
            yield sessionReceiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(settledMsgs.length, 2, `Expected 2, received ${settledMsgs.length} messages.`);
        });
    }
    it("Partitioned Queue: no maxConcurrentCalls passed(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Partitioned Queue: pass 1 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Partitioned Queue: pass 2 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: no maxConcurrentCalls passed(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: pass 1 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: pass 2 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testConcurrency();
        });
    });
    it("Partitioned Subscription: no maxConcurrentCalls passed(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testConcurrency();
        });
    });
    it("Partitioned Queue: pass 1 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testConcurrency(1);
        });
    });
    it("Partitioned Queue: pass 2 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testConcurrency(2);
        });
    });
    it("Unpartitioned Subscription: no maxConcurrentCalls passed(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: pass 1 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testConcurrency(1);
        });
    });
    it("Unpartitioned Queue: pass 2 for maxConcurrentCalls(with sessions)", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testConcurrency(2);
        });
    });
});
//# sourceMappingURL=streamingReceiverSessions.spec.js.map