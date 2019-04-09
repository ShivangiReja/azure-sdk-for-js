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
import { purge, getSenderReceiverClients, ClientType, TestMessage } from "./testUtils";
let ns;
let senderClient;
let receiverClient;
function beforeEachTest(senderType, receiverType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!process.env.SERVICEBUS_CONNECTION_STRING) {
            throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
        }
        ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
        const clients = yield getSenderReceiverClients(ns, senderType, receiverType);
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
describe("Unpartitioned Queue - Lock Renewal for Sessions", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Batch Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Batch Receiver: complete() after lock expiry with throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: complete() after lock expiry with auto-renewal disabled throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                expectSessionLockLostErrorToBeThrown: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 80,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    }).timeout(95000);
    it("Receive a msg using Streaming Receiver, lock renewal does not take place when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
});
describe("Partitioned Queue - Lock Renewal for Sessions", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Batch Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Batch Receiver: complete() after lock expiry with throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: complete() after lock expiry with auto-renewal disabled throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                expectSessionLockLostErrorToBeThrown: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 80,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    }).timeout(95000);
    it("Receive a msg using Streaming Receiver, lock renewal does not take place when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
});
describe("Unpartitioned Subscription - Lock Renewal for Sessions", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Batch Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Batch Receiver: complete() after lock expiry with throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: complete() after lock expiry with auto-renewal disabled throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                expectSessionLockLostErrorToBeThrown: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 80,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    }).timeout(95000);
    it("Receive a msg using Streaming Receiver, lock renewal does not take place when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
});
describe("Partitioned Subscription - Lock Renewal for Sessions", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Batch Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Batch Receiver: complete() after lock expiry with throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: renewLock() resets lock duration each time.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient);
        });
    });
    it("Streaming Receiver: complete() after lock expiry with auto-renewal disabled throws error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                expectSessionLockLostErrorToBeThrown: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 80,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    }).timeout(95000);
    it("Receive a msg using Streaming Receiver, lock renewal does not take place when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxSessionAutoRenewLockDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                expectSessionLockLostErrorToBeThrown: true
            });
        });
    });
});
const lockDurationInMilliseconds = 30000;
// const maxSessionAutoRenewLockDurationInSeconds = 300;
let uncaughtErrorFromHandlers;
const onError = (err) => {
    uncaughtErrorFromHandlers = err;
};
/**
 * Test manual renewLock() using Batch Receiver, with autoLockRenewal disabled
 */
function testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testMessage = TestMessage.getSessionSample();
        yield senderClient.getSender().send(testMessage);
        const sessionClient = yield receiverClient.getSessionReceiver({
            sessionId: TestMessage.sessionId,
            maxSessionAutoRenewLockDurationInSeconds: 0
        });
        const msgs = yield sessionClient.receiveBatch(1);
        // Compute expected initial lock expiry time
        const expectedLockExpiryTimeUtc = new Date();
        expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + lockDurationInMilliseconds / 1000);
        should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
        should.equal(msgs.length, 1, "Unexpected number of messages");
        should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
        should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
        // Verify initial lock expiry time on the session
        assertTimestampsAreApproximatelyEqual(sessionClient.sessionLockedUntilUtc, expectedLockExpiryTimeUtc, "Initial");
        yield delay(5000);
        yield sessionClient.renewLock();
        // Compute expected lock expiry time after renewing lock after 5 seconds
        expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + 5);
        // Verify lock expiry time after renewLock()
        assertTimestampsAreApproximatelyEqual(sessionClient.sessionLockedUntilUtc, expectedLockExpiryTimeUtc, "After renewlock()");
        yield msgs[0].complete();
    });
}
/**
 * Test settling of message from Batch Receiver fails after session lock expires
 */
function testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testMessage = TestMessage.getSessionSample();
        yield senderClient.getSender().send(testMessage);
        let sessionClient = yield receiverClient.getSessionReceiver({
            sessionId: TestMessage.sessionId,
            maxSessionAutoRenewLockDurationInSeconds: 0
        });
        const msgs = yield sessionClient.receiveBatch(1);
        should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
        should.equal(msgs.length, 1, "Expected message length does not match");
        should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
        should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
        yield delay(lockDurationInMilliseconds + 1000);
        let errorWasThrown = false;
        yield msgs[0].complete().catch((err) => {
            should.equal(err.name, "SessionLockLostError", "ErrorName is different than expected");
            errorWasThrown = true;
        });
        should.equal(errorWasThrown, true, "Error thrown flag must be true");
        // Subsequent receivers for the same session should work as expected.
        sessionClient = yield receiverClient.getSessionReceiver();
        const unprocessedMsgs = yield sessionClient.receiveBatch(1);
        should.equal(unprocessedMsgs[0].deliveryCount, 1, "Unexpected deliveryCount");
        yield unprocessedMsgs[0].complete();
    });
}
/**
 * Test manual renewLock() using Streaming Receiver with autoLockRenewal disabled
 */
function testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let numOfMessagesReceived = 0;
        const testMessage = TestMessage.getSessionSample();
        yield senderClient.getSender().send(testMessage);
        const sessionClient = yield receiverClient.getSessionReceiver({
            sessionId: TestMessage.sessionId,
            maxSessionAutoRenewLockDurationInSeconds: 0
        });
        const onSessionMessage = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (numOfMessagesReceived < 1) {
                numOfMessagesReceived++;
                should.equal(brokeredMessage.body, testMessage.body, "MessageBody is different than expected");
                should.equal(brokeredMessage.messageId, testMessage.messageId, "MessageId is different than expected");
                // Compute expected initial lock expiry time
                const expectedLockExpiryTimeUtc = new Date();
                expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + lockDurationInMilliseconds / 1000);
                // Verify initial expiry time on session
                assertTimestampsAreApproximatelyEqual(sessionClient.sessionLockedUntilUtc, expectedLockExpiryTimeUtc, "Initial");
                yield delay(5000);
                yield sessionClient.renewLock();
                // Compute expected lock expiry time after renewing lock after 5 seconds
                expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + 5);
                // Verify actual expiry time on session after renewal
                assertTimestampsAreApproximatelyEqual(sessionClient.sessionLockedUntilUtc, expectedLockExpiryTimeUtc, "After renewlock()");
                yield brokeredMessage.complete();
            }
        });
        yield sessionClient.receive(onSessionMessage, onError, {
            autoComplete: false
        });
        yield delay(10000);
        yield sessionClient.close();
        if (uncaughtErrorFromHandlers) {
            chai.assert.fail(uncaughtErrorFromHandlers.message);
        }
        should.equal(numOfMessagesReceived, 1, "Unexpected number of messages");
    });
}
function testAutoLockRenewalConfigBehavior(senderClient, receiverClient, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let numOfMessagesReceived = 0;
        const testMessage = TestMessage.getSessionSample();
        yield senderClient.getSender().send(testMessage);
        const sessionClient = yield receiverClient.getSessionReceiver({
            sessionId: TestMessage.sessionId,
            maxSessionAutoRenewLockDurationInSeconds: options.maxSessionAutoRenewLockDurationInSeconds
        });
        let sessionLockLostErrorThrown = false;
        const messagesReceived = [];
        yield sessionClient.receive((brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (numOfMessagesReceived < 1) {
                numOfMessagesReceived++;
                should.equal(brokeredMessage.body, testMessage.body, "MessageBody is different than expected");
                should.equal(brokeredMessage.messageId, testMessage.messageId, "MessageId is different than expected");
                messagesReceived.push(brokeredMessage);
                // Sleeping...
                yield delay(options.delayBeforeAttemptingToCompleteMessageInSeconds * 1000);
            }
        }), (err) => {
            if (err.name === "SessionLockLostError") {
                sessionLockLostErrorThrown = true;
            }
            else {
                onError(err);
            }
        }, {
            autoComplete: false
        });
        yield delay(options.delayBeforeAttemptingToCompleteMessageInSeconds * 1000 + 2000);
        should.equal(sessionLockLostErrorThrown, options.expectSessionLockLostErrorToBeThrown, "SessionLockLostErrorThrown flag must match");
        should.equal(messagesReceived.length, 1, "Mismatch in number of messages received");
        let errorWasThrown = false;
        yield messagesReceived[0].complete().catch((err) => {
            should.equal(err.name, "SessionLockLostError", "ErrorName is different than expected");
            errorWasThrown = true;
        });
        should.equal(errorWasThrown, options.expectSessionLockLostErrorToBeThrown, "Error Thrown flag value mismatch");
        yield sessionClient.close();
        if (uncaughtErrorFromHandlers) {
            chai.assert.fail(uncaughtErrorFromHandlers.message);
        }
    });
}
function assertTimestampsAreApproximatelyEqual(actualTimeInUTC, expectedTimeInUTC, label) {
    if (actualTimeInUTC) {
        should.equal(Math.pow((actualTimeInUTC.valueOf() - expectedTimeInUTC.valueOf()) / 1000, 2) < 100, // Within +/- 10 seconds
        true, `${label}: Actual time ${actualTimeInUTC} must be approximately equal to ${expectedTimeInUTC}`);
    }
}
//# sourceMappingURL=renewLockSessions.spec.js.map