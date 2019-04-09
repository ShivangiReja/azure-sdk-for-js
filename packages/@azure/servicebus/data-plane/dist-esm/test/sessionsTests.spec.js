// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, delay } from "../lib";
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
let unexpectedError;
function unExpectedErrorHandler(err) {
    if (err) {
        unexpectedError = err;
    }
}
const testSessionId2 = "my-session2";
function beforeEachTest(senderType, sessionType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // The tests in this file expect the env variables to contain the connection string and
        // the names of empty queue/topic/subscription that are to be tested
        if (!process.env.SERVICEBUS_CONNECTION_STRING) {
            throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
        }
        ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
        const clients = yield getSenderReceiverClients(ns, senderType, sessionType);
        senderClient = clients.senderClient;
        receiverClient = clients.receiverClient;
        yield purge(receiverClient, TestMessage.sessionId);
        const peekedMsgs = yield receiverClient.peek();
        const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
        if (peekedMsgs.length) {
            chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
        }
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("SessionReceiver with invalid sessionId", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function test_batching() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield senderClient.getSender().send(testMessage);
            let receiver = yield receiverClient.getSessionReceiver({
                sessionId: "non" + TestMessage.sessionId
            });
            let msgs = yield receiver.receiveBatch(1, 10);
            should.equal(msgs.length, 0, "Unexpected number of messages");
            yield receiver.close();
            receiver = yield receiverClient.getSessionReceiver();
            msgs = yield receiver.receiveBatch(1);
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            yield msgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue - Batch Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield test_batching();
        });
    });
    it("Partitioned Subscription - Batch Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield test_batching();
        });
    });
    it("Unpartitioned Queue - Batch Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield test_batching();
        });
    });
    it("Unpartitioned Subscription - Batch Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield test_batching();
        });
    });
    function test_streaming() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSessionSample();
            yield senderClient.getSender().send(testMessage);
            let receiver = yield receiverClient.getSessionReceiver({
                sessionId: "non" + TestMessage.sessionId
            });
            let receivedMsgs = [];
            receiver.receive((msg) => {
                receivedMsgs.push(msg);
                return Promise.resolve();
            }, unExpectedErrorHandler);
            yield delay(2000);
            should.equal(receivedMsgs.length, 0, `Expected 0, received ${receivedMsgs.length} messages`);
            yield receiver.close();
            receiver = yield receiverClient.getSessionReceiver();
            receivedMsgs = [];
            receiver.receive((msg) => {
                should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
                should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
                return msg.complete().then(() => {
                    receivedMsgs.push(msg);
                });
            }, unExpectedErrorHandler, { autoComplete: false });
            const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === 1);
            should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
            should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue - Streaming Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield test_streaming();
        });
    });
    it("Partitioned Subscription - Streaming Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield test_streaming();
        });
    });
    it("Unpartitioned Queue - Streaming Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield test_streaming();
        });
    });
    it("Unpartitioned Subscription - Streaming Receiver: no messages received for invalid sessionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield test_streaming();
        });
    });
});
describe("SessionReceiver with no sessionId", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    const testMessagesWithDifferentSessionIds = [
        {
            body: "hello1",
            messageId: `test message ${Math.random()}`,
            sessionId: TestMessage.sessionId
        },
        {
            body: "hello2",
            messageId: `test message ${Math.random()}`,
            sessionId: testSessionId2
        }
    ];
    function testComplete_batching() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender = senderClient.getSender();
            yield sender.send(testMessagesWithDifferentSessionIds[0]);
            yield sender.send(testMessagesWithDifferentSessionIds[1]);
            let receiver = yield receiverClient.getSessionReceiver();
            let msgs = yield receiver.receiveBatch(2);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(testMessagesWithDifferentSessionIds.some((x) => msgs[0].body === x.body &&
                msgs[0].messageId === x.messageId &&
                msgs[0].sessionId === x.sessionId), true, "Received Message doesnt match any of the test messages");
            yield msgs[0].complete();
            yield receiver.close();
            receiver = yield receiverClient.getSessionReceiver();
            msgs = yield receiver.receiveBatch(2);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(testMessagesWithDifferentSessionIds.some((x) => msgs[0].body === x.body &&
                msgs[0].messageId === x.messageId &&
                msgs[0].sessionId === x.sessionId), true, "Received Message doesnt match any of the test messages");
            yield msgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: complete() removes message from random session", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testComplete_batching();
        });
    });
    it("Partitioned Subscription: complete() removes message from random session", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testComplete_batching();
        });
    });
    it("Unpartitioned Queue: complete() removes message from random session", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testComplete_batching();
        });
    });
    it("Unpartitioned Subscription: complete() removes message from random session", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testComplete_batching();
        });
    });
});
describe("Session State", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testGetSetState() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender = senderClient.getSender();
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            let receiver = yield receiverClient.getSessionReceiver();
            let msgs = yield receiver.receiveBatch(2);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(msgs[0].sessionId, testMessage.sessionId, "SessionId is different than expected");
            let testState = yield receiver.getState();
            should.equal(!!testState, false, "SessionState is different than expected");
            yield receiver.setState("new_state");
            testState = yield receiver.getState();
            should.equal(testState, "new_state", "SessionState is different than expected");
            yield receiver.close();
            receiver = yield receiverClient.getSessionReceiver();
            msgs = yield receiver.receiveBatch(2);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
            should.equal(msgs[0].sessionId, testMessage.sessionId, "SessionId is different than expected");
            testState = yield receiver.getState();
            should.equal(testState, "new_state", "SessionState is different than expected");
            yield receiver.setState(""); // clearing the session-state
            yield msgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue - Testing getState and setState", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testGetSetState();
        });
    });
    it("Partitioned Subscription - Testing getState and setState", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testGetSetState();
        });
    });
    it("Unpartitioned Queue - Testing getState and setState", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testGetSetState();
        });
    });
    it("Unpartitioned Subscription - Testing getState and setState", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield purge(receiverClient, testSessionId2);
            yield testGetSetState();
        });
    });
});
describe("Second SessionReceiver for same sessionId", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testSecondSessionReceiverForSameSession() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender = senderClient.getSender();
            const testMessage = TestMessage.getSessionSample();
            yield sender.send(testMessage);
            const firstReceiver = yield receiverClient.getSessionReceiver();
            should.equal(firstReceiver.sessionId, testMessage.sessionId, "MessageId is different than expected");
            let errorWasThrown = false;
            try {
                const secondReceiver = yield receiverClient.getSessionReceiver({
                    sessionId: testMessage.sessionId
                });
                if (secondReceiver) {
                    chai.assert.fail("Second receiver for same session id should not have been created");
                }
            }
            catch (error) {
                errorWasThrown =
                    error &&
                        error.message ===
                            `Close the current session receiver for sessionId ${testMessage.sessionId} before using "getSessionReceiver" to create a new one for the same sessionId`;
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    }
    it("Partitioned Queue - Second Session Receiver for same session id throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
            yield testSecondSessionReceiverForSameSession();
        });
    });
    it("Partitioned Subscription - Second Session Receiver for same session id throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
            yield testSecondSessionReceiverForSameSession();
        });
    });
    it("Unpartitioned Queue - Second Session Receiver for same session id throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
            yield testSecondSessionReceiverForSameSession();
        });
    });
    it("Unpartitioned Subscription - Second Session Receiver for same session id throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
            yield testSecondSessionReceiverForSameSession();
        });
    });
});
//# sourceMappingURL=sessionsTests.spec.js.map