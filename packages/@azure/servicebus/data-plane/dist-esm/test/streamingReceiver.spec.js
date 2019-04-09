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
let sender;
let receiver;
let deadLetterClient;
let errorWasThrown;
let unexpectedError;
const maxDeliveryCount = 10;
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
        if (receiverClient instanceof QueueClient) {
            deadLetterClient = ns.createQueueClient(Namespace.getDeadLetterQueuePath(receiverClient.entityPath));
        }
        if (receiverClient instanceof SubscriptionClient) {
            deadLetterClient = ns.createSubscriptionClient(Namespace.getDeadLetterTopicPath(senderClient.entityPath, receiverClient.subscriptionName), receiverClient.subscriptionName);
        }
        yield purge(receiverClient);
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
        receiver = receiverClient.getReceiver();
        errorWasThrown = false;
        unexpectedError = undefined;
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("Streaming - Misc Tests", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testAutoComplete() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                receivedMsgs.push(msg);
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return Promise.resolve();
            }, unExpectedErrorHandler);
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1 && receivedMsgs[0].delivery.remote_settled === true);
            should.equal(msgsCheck, true, receivedMsgs.length !== 1
                ? `Expected 1, received ${receivedMsgs.length} messages`
                : "Message didnt get auto-completed in time");
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: AutoComplete removes the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testAutoComplete();
        });
    });
    it("Partitioned Subscription: AutoComplete removes the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testAutoComplete();
        });
    });
    it("UnPartitioned Queue: AutoComplete removes the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testAutoComplete();
        });
    });
    it("UnPartitioned Subscription: AutoComplete removes the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testAutoComplete();
        });
    });
    function testManualComplete() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                receivedMsgs.push(msg);
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return Promise.resolve();
            }, unExpectedErrorHandler, { autoComplete: false });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            yield testPeekMsgsLength(receiverClient, 1);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield receivedMsgs[0].complete();
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Disabled autoComplete, no manual complete retains the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testManualComplete();
        });
    });
    it("Partitioned Subscription: Disabled autoComplete, no manual complete retains the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testManualComplete();
        });
    });
    it("UnPartitioned Queue: Disabled autoComplete, no manual complete retains the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testManualComplete();
        });
    });
    it("UnPartitioned Subscription: Disabled autoComplete, no manual complete retains the message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testManualComplete();
        });
    });
});
describe("Streaming - Complete message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testComplete(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return msg.complete().then(() => {
                    receivedMsgs.push(msg);
                });
            }, unExpectedErrorHandler, { autoComplete });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testComplete(false);
        });
    });
    it("Partitioned Subscription: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testComplete(false);
        });
    });
    it("UnPartitioned Queue: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testComplete(false);
        });
    });
    it("UnPartitioned Subscription: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testComplete(false);
        });
    });
    it("Partitioned Queue with autoComplete: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testComplete(true);
        });
    });
    it("Partitioned Subscription with autoComplete: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testComplete(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testComplete(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: complete() removes message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testComplete(true);
        });
    });
});
describe("Streaming - Abandon message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testMultipleAbandons() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            let checkDeliveryCount = 0;
            receiver.receive((msg) => {
                should.equal(msg.deliveryCount, checkDeliveryCount, "DeliveryCount is different than expected");
                return msg.abandon().then(() => {
                    checkDeliveryCount++;
                });
            }, unExpectedErrorHandler, { autoComplete: false });
            const deliveryCountFlag = yield checkWithTimeout(() => checkDeliveryCount === maxDeliveryCount);
            should.equal(deliveryCountFlag, true, "DeliveryCount is different than expected");
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            yield testPeekMsgsLength(receiverClient, 0); // No messages in the queue
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(Array.isArray(deadLetterMsgs), true, "`ReceivedMessages` is not an array");
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].deliveryCount, maxDeliveryCount, "DeliveryCount is different than expected");
            should.equal(deadLetterMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: Multiple abandons until maxDeliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testMultipleAbandons();
        });
    });
    it("Partitioned Subscription: Multiple abandons until maxDeliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testMultipleAbandons();
        });
    });
    it("Unpartitioned Queue: Multiple abandons until maxDeliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testMultipleAbandons();
        });
    });
    it("Unpartitioned Subscription: Multiple abandons until maxDeliveryCount", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testMultipleAbandons();
        });
    });
});
describe("Streaming - Defer message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testDefer(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            let sequenceNum = 0;
            receiver.receive((msg) => {
                return msg.defer().then(() => {
                    sequenceNum = msg.sequenceNumber;
                });
            }, unExpectedErrorHandler, { autoComplete });
            const sequenceNumCheck = yield checkWithTimeout(() => sequenceNum !== 0);
            should.equal(sequenceNumCheck, true, "Either the message is not received or observed an unexpected SequenceNumber.");
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            receiver = receiverClient.getReceiver();
            const deferredMsgs = yield receiver.receiveDeferredMessages([sequenceNum]);
            if (!deferredMsgs) {
                throw "No message received for sequence number";
            }
            should.equal(deferredMsgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(deferredMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(deferredMsgs[0].deliveryCount, 1, "DeliveryCount is different than expected");
            yield deferredMsgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDefer(false);
        });
    });
    it("Partitioned Subscription: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDefer(false);
        });
    });
    it("UnPartitioned Queue: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDefer(false);
        });
    });
    it("UnPartitioned Subscription: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDefer(false);
        });
    });
    it("Partitioned Queue with autoComplete: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDefer(true);
        });
    });
    it("Partitioned Subscription with autoComplete: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDefer(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDefer(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: defer() moves message to deferred queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDefer(true);
        });
    });
});
describe("Streaming - Deadletter message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testDeadletter(autoComplete) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                return msg.deadLetter().then(() => {
                    receivedMsgs.push(msg);
                });
            }, unExpectedErrorHandler, { autoComplete });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
            yield testPeekMsgsLength(receiverClient, 0);
            const deadLetterMsgs = yield deadLetterClient.getReceiver().receiveBatch(1);
            should.equal(Array.isArray(deadLetterMsgs), true, "`ReceivedMessages` is not an array");
            should.equal(deadLetterMsgs.length, 1, "Unexpected number of messages");
            should.equal(deadLetterMsgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            yield deadLetterMsgs[0].complete();
            yield testPeekMsgsLength(deadLetterClient, 0);
        });
    }
    it("Partitioned Queue: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDeadletter(false);
        });
    });
    it("Partitioned Subscription: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDeadletter(false);
        });
    });
    it("UnPartitioned Queue: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDeadletter(false);
        });
    });
    it("UnPartitioned Subscription: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDeadletter(false);
        });
    });
    it("Partitioned Queue with autoComplete: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testDeadletter(true);
        });
    });
    it("Partitioned Subscription with autoComplete: deadLetter() moves message to deadletter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testDeadletter(true);
        });
    });
    it("UnPartitioned Queue with autoComplete: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testDeadletter(true);
        });
    });
    it("UnPartitioned Subscription with autoComplete: deadLetter() moves message to deadletter queue", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testDeadletter(true);
        });
    });
});
describe("Streaming - Multiple Streaming Receivers", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testMultipleReceiveCalls() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            receiver.receive((msg) => {
                return msg.complete();
            }, unExpectedErrorHandler);
            yield delay(1000);
            try {
                receiver.receive((msg) => {
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
    it("Partitioned Queue: Second Streaming Receiver call should fail if the first one is not stopped", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testMultipleReceiveCalls();
        });
    });
    it("Partitioned Subscription: Second Streaming Receiver call should fail if the first one is not stopped", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testMultipleReceiveCalls();
        });
    });
    it("UnPartitioned Queue: Second Streaming Receiver call should fail if the first one is not stopped", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testMultipleReceiveCalls();
        });
    });
    it("UnPartitioned Subscription: Second Streaming Receiver call should fail if the first one is not stopped", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testMultipleReceiveCalls();
        });
    });
});
describe("Streaming - Settle an already Settled message throws error", () => {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    const testError = (err) => {
        should.equal(err.message, "This message has been already settled.", "ErrorMessage is different than expected");
        errorWasThrown = true;
    };
    function testSettlement(operation) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = [];
            receiver.receive((msg) => {
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
    it("UnPartitioned Queue: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSettlement(DispositionType.complete);
        });
    });
    it("UnPartitioned Subscription: complete() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSettlement(DispositionType.complete);
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
    it("UnPartitioned Queue: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSettlement(DispositionType.abandon);
        });
    });
    it("UnPartitioned Subscription: abandon() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSettlement(DispositionType.abandon);
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
    it("UnPartitioned Queue: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSettlement(DispositionType.defer);
        });
    });
    it("UnPartitioned Subscription: defer() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSettlement(DispositionType.defer);
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
    it("UnPartitioned Queue: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSettlement(DispositionType.deadletter);
        });
    });
    it("UnPartitioned Subscription: deadLetter() throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSettlement(DispositionType.deadletter);
        });
    });
});
describe("Streaming - User Error", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testUserError() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sender.send(TestMessage.getSample());
            const errorMessage = "Will we see this error message?";
            const receivedMsgs = [];
            receiver.receive((msg) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield msg.complete().then(() => {
                    receivedMsgs.push(msg);
                });
                throw new Error(errorMessage);
            }), unExpectedErrorHandler);
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages.`);
            yield receiver.close();
            should.equal(unexpectedError && unexpectedError.message, errorMessage, "User error did not surface.");
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
        });
    }
    it("Partitioned Queue: onError handler is called for user error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testUserError();
        });
    });
    it("Partitioned Subscription: onError handler is called for user error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testUserError();
        });
    });
    it("UnPartitioned Queue: onError handler is called for user error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testUserError();
        });
    });
    it("UnPartitioned Subscription: onError handler is called for user error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testUserError();
        });
    });
});
describe("Streaming - maxConcurrentCalls", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testConcurrency(maxConcurrentCalls) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = [TestMessage.getSample(), TestMessage.getSample()];
            yield sender.sendBatch(testMessages);
            const settledMsgs = [];
            const receivedMsgs = [];
            receiver.receive((msg) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (receivedMsgs.length === 1) {
                    if ((!maxConcurrentCalls || maxConcurrentCalls === 1) && settledMsgs.length === 0) {
                        throw new Error("onMessage for the second message should not have been called before the first message got settled");
                    }
                }
                else {
                    if (maxConcurrentCalls && maxConcurrentCalls > 1 && settledMsgs.length !== 0) {
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
            yield receiver.close();
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            should.equal(settledMsgs.length, 2, `Expected 2, received ${settledMsgs.length} messages.`);
        });
    }
    it("Partitioned Queue: no maxConcurrentCalls passed", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testConcurrency();
        });
    });
    it("Partitioned Queue: pass 1 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testConcurrency(1);
        });
    });
    it("Partitioned Queue: pass 2 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testConcurrency(2);
        });
    });
    it("Unpartitioned Queue: no maxConcurrentCalls passed", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: pass 1 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testConcurrency(1);
        });
    });
    it("Unpartitioned Queue: pass 2 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testConcurrency(2);
        });
    });
    it("Partitioned Subscription: no maxConcurrentCalls passed", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testConcurrency();
        });
    });
    it("Partitioned Queue: pass 1 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testConcurrency(1);
        });
    });
    it("Partitioned Queue: pass 2 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testConcurrency(2);
        });
    });
    it("Unpartitioned Subscription: no maxConcurrentCalls passed", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testConcurrency();
        });
    });
    it("Unpartitioned Queue: pass 1 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testConcurrency(1);
        });
    });
    it("Unpartitioned Queue: pass 2 for maxConcurrentCalls", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testConcurrency(2);
        });
    });
});
//# sourceMappingURL=streamingReceiver.spec.js.map