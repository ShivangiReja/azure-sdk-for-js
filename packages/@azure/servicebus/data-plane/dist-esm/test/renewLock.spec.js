// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient } from "../lib";
import { delay } from "rhea-promise";
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
        yield purge(receiverClient);
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
describe("Unpartitioned Queue - Lock Renewal", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
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
                maxAutoRenewDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                willCompleteFail: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 55,
                willCompleteFail: true
            });
        });
    }).timeout(90000);
    it("Streaming Receiver: No lock renewal when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
        });
    });
});
describe("Partitioned Queue - Lock Renewal", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
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
                maxAutoRenewDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
            // Complete fails as expected
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                willCompleteFail: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 55,
                willCompleteFail: true
            });
        });
    }).timeout(90000);
    it("Streaming Receiver: No lock renewal when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
        });
    });
});
describe("Unpartitioned Subscription - Lock Renewal", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
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
                maxAutoRenewDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
            // Complete fails as expected
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                willCompleteFail: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 55,
                willCompleteFail: true
            });
        });
    }).timeout(90000);
    it("Streaming Receiver: No lock renewal when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
        });
    });
});
describe("Partitioned Subscription - Lock Renewal", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
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
                maxAutoRenewDurationInSeconds: 0,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
            // Complete fails as expected
        });
    });
    it("Streaming Receiver: lock will not expire until configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 38,
                delayBeforeAttemptingToCompleteMessageInSeconds: 35,
                willCompleteFail: false
            });
        });
    });
    it("Streaming Receiver: lock expires sometime after configured time", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 35,
                delayBeforeAttemptingToCompleteMessageInSeconds: 55,
                willCompleteFail: true
            });
        });
    }).timeout(90000);
    it("Streaming Receiver: No lock renewal when config value is less than lock duration", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testAutoLockRenewalConfigBehavior(senderClient, receiverClient, {
                maxAutoRenewDurationInSeconds: 15,
                delayBeforeAttemptingToCompleteMessageInSeconds: 31,
                willCompleteFail: true
            });
        });
    });
});
const lockDurationInMilliseconds = 30000;
let uncaughtErrorFromHandlers;
const onError = (err) => {
    uncaughtErrorFromHandlers = err;
};
/**
 * Test renewLock() after receiving a message using Batch Receiver
 */
function testBatchReceiverManualLockRenewalHappyCase(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testMessage = TestMessage.getSample();
        yield senderClient.getSender().send(testMessage);
        const receiver = receiverClient.getReceiver();
        const msgs = yield receiver.receiveBatch(1);
        // Compute expected initial lock expiry time
        const expectedLockExpiryTimeUtc = new Date();
        expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + lockDurationInMilliseconds / 1000);
        should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
        should.equal(msgs.length, 1, "Unexpected number of messages");
        should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
        should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
        // Verify initial lock expiry time on the message
        assertTimestampsAreApproximatelyEqual(msgs[0].lockedUntilUtc, expectedLockExpiryTimeUtc, "Initial");
        yield delay(5000);
        if (msgs[0].lockToken) {
            yield receiver.renewLock(msgs[0].lockToken);
        }
        // Compute expected lock expiry time after renewing lock after 5 seconds
        expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + 5);
        // Verify lock expiry time after renewLock()
        assertTimestampsAreApproximatelyEqual(msgs[0].lockedUntilUtc, expectedLockExpiryTimeUtc, "After renewlock()");
        yield msgs[0].complete();
    });
}
/**
 * Test settling of message from Batch Receiver fails after message lock expires
 */
function testBatchReceiverManualLockRenewalErrorOnLockExpiry(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testMessage = TestMessage.getSample();
        yield senderClient.getSender().send(testMessage);
        const receiver = receiverClient.getReceiver();
        const msgs = yield receiver.receiveBatch(1);
        should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
        should.equal(msgs.length, 1, "Expected message length does not match");
        should.equal(msgs[0].body, testMessage.body, "MessageBody is different than expected");
        should.equal(msgs[0].messageId, testMessage.messageId, "MessageId is different than expected");
        // Sleeping 30 seconds...
        yield delay(lockDurationInMilliseconds + 1000);
        let errorWasThrown = false;
        yield msgs[0].complete().catch((err) => {
            should.equal(err.name, "MessageLockLostError", "ErrorName is different than expected");
            errorWasThrown = true;
        });
        should.equal(errorWasThrown, true, "Error thrown flag must be true");
        // Clean up any left over messages
        const unprocessedMsgs = yield receiver.receiveBatch(1);
        yield unprocessedMsgs[0].complete();
    });
}
/**
 * Test renewLock() after receiving a message using Streaming Receiver with autoLockRenewal disabled
 */
function testStreamingReceiverManualLockRenewalHappyCase(senderClient, receiverClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let numOfMessagesReceived = 0;
        const testMessage = TestMessage.getSample();
        yield senderClient.getSender().send(testMessage);
        const receiver = receiverClient.getReceiver();
        const onMessage = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (numOfMessagesReceived < 1) {
                numOfMessagesReceived++;
                should.equal(brokeredMessage.body, testMessage.body, "MessageBody is different than expected");
                should.equal(brokeredMessage.messageId, testMessage.messageId, "MessageId is different than expected");
                // Compute expected initial lock expiry time
                const expectedLockExpiryTimeUtc = new Date();
                expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + lockDurationInMilliseconds / 1000);
                // Verify initial expiry time on message
                assertTimestampsAreApproximatelyEqual(brokeredMessage.lockedUntilUtc, expectedLockExpiryTimeUtc, "Initial");
                yield delay(5000);
                yield receiver.renewLock(brokeredMessage);
                // Compute expected lock expiry time after renewing lock after 5 seconds
                expectedLockExpiryTimeUtc.setSeconds(expectedLockExpiryTimeUtc.getSeconds() + 5);
                // Verify actual expiry time on session after first renewal
                assertTimestampsAreApproximatelyEqual(brokeredMessage.lockedUntilUtc, expectedLockExpiryTimeUtc, "After renewlock");
                yield brokeredMessage.complete();
            }
        });
        receiver.receive(onMessage, onError, {
            autoComplete: false,
            maxMessageAutoRenewLockDurationInSeconds: 0
        });
        yield delay(10000);
        yield receiver.close();
        if (uncaughtErrorFromHandlers) {
            chai.assert.fail(uncaughtErrorFromHandlers.message);
        }
        should.equal(numOfMessagesReceived, 1, "Unexpected number of messages");
    });
}
function testAutoLockRenewalConfigBehavior(senderClient, receiverClient, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let numOfMessagesReceived = 0;
        const testMessage = TestMessage.getSample();
        yield senderClient.getSender().send(testMessage);
        const receiver = receiverClient.getReceiver();
        const onMessage = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (numOfMessagesReceived < 1) {
                numOfMessagesReceived++;
                should.equal(brokeredMessage.body, testMessage.body, "MessageBody is different than expected");
                should.equal(brokeredMessage.messageId, testMessage.messageId, "MessageId is different than expected");
                // Sleeping...
                yield delay(options.delayBeforeAttemptingToCompleteMessageInSeconds * 1000);
                let errorWasThrown = false;
                yield brokeredMessage.complete().catch((err) => {
                    should.equal(err.name, "MessageLockLostError", "ErrorName is different than expected");
                    errorWasThrown = true;
                });
                should.equal(errorWasThrown, options.willCompleteFail, "Error Thrown flag value mismatch");
            }
        });
        receiver.receive(onMessage, onError, {
            autoComplete: false,
            maxMessageAutoRenewLockDurationInSeconds: options.maxAutoRenewDurationInSeconds
        });
        yield delay(options.delayBeforeAttemptingToCompleteMessageInSeconds * 1000 + 10000);
        yield receiver.close();
        if (uncaughtErrorFromHandlers) {
            chai.assert.fail(uncaughtErrorFromHandlers.message);
        }
        should.equal(numOfMessagesReceived, 1, "Mismatch in number of messages received");
        if (options.willCompleteFail) {
            // Clean up any left over messages
            const newReceiver = receiverClient.getReceiver();
            const unprocessedMsgs = yield newReceiver.receiveBatch(1);
            yield unprocessedMsgs[0].complete();
        }
    });
}
function assertTimestampsAreApproximatelyEqual(actualTimeInUTC, expectedTimeInUTC, label) {
    if (actualTimeInUTC) {
        should.equal(Math.pow((actualTimeInUTC.valueOf() - expectedTimeInUTC.valueOf()) / 1000, 2) < 100, // Within +/- 10 seconds
        true, `${label}: Actual time ${actualTimeInUTC} must be approximately equal to ${expectedTimeInUTC}`);
    }
}
//# sourceMappingURL=renewLock.spec.js.map