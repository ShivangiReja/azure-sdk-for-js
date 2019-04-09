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
describe("Simple Send", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testSimpleSend(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield senderClient.getSender().send(testMessages);
            const msgs = yield receiver.receiveBatch(1);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(msgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            should.equal(msgs[0].deliveryCount, 0, "DeliveryCount is different than expected");
            yield msgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testSimpleSend();
        });
    });
    it("Partitioned Topic: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testSimpleSend();
        });
    });
    it("Unpartitioned Queue: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testSimpleSend();
        });
    });
    it("Unpartitioned Topic: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testSimpleSend();
        });
    });
    it("Partitioned Queue with Sessions: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testSimpleSend(true);
        });
    });
    it("Partitioned Topic with Sessions: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testSimpleSend(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testSimpleSend(true);
        });
    });
    it("Unpartitioned Topic with Sessions: Simple Send", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testSimpleSend(true);
        });
    });
});
describe("Schedule single message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testScheduleMessage(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const scheduleTime = new Date(Date.now() + 10000); // 10 seconds from now
            yield senderClient.getSender().scheduleMessage(scheduleTime, testMessages);
            const msgs = yield receiver.receiveBatch(1);
            const msgEnqueueTime = msgs[0].enqueuedTimeUtc ? msgs[0].enqueuedTimeUtc.valueOf() : 0;
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 1, "Unexpected number of messages");
            should.equal(msgEnqueueTime - scheduleTime.valueOf() >= 0, true, "Enqueued time must be greater than scheduled time"); // checking received message enqueue time is greater or equal to the scheduled time.
            should.equal(msgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(msgs[0].messageId, testMessages.messageId, "MessageId is different than expected");
            yield msgs[0].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testScheduleMessage();
        });
    });
    it("Partitioned Topic: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testScheduleMessage();
        });
    });
    it("Unpartitioned Queue: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testScheduleMessage();
        });
    });
    it("Unpartitioned Topic: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testScheduleMessage();
        });
    });
    it("Partitioned Queue with Sessions: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testScheduleMessage(true);
        });
    });
    it("Partitioned Topic with Sessions: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testScheduleMessage(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testScheduleMessage(true);
        });
    });
    it("Unpartitioned Topic with Sessions: Schedule single message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testScheduleMessage(true);
        });
    });
});
describe("Schedule multiple messages", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
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
    function testScheduleMessages(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? messageWithSessions : messages;
            const scheduleTime = new Date(Date.now() + 10000); // 10 seconds from now
            yield senderClient.getSender().scheduleMessages(scheduleTime, testMessages);
            const msgs = yield receiver.receiveBatch(2);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs.length, 2, "Unexpected number of messages");
            const msgEnqueueTime1 = msgs[0].enqueuedTimeUtc ? msgs[0].enqueuedTimeUtc.valueOf() : 0;
            const msgEnqueueTime2 = msgs[1].enqueuedTimeUtc ? msgs[1].enqueuedTimeUtc.valueOf() : 0;
            // checking received message enqueue time is greater or equal to the scheduled time.
            should.equal(msgEnqueueTime1 - scheduleTime.valueOf() >= 0, true, "msgEnqueueTime1 time must be greater than scheduled time");
            should.equal(msgEnqueueTime2 - scheduleTime.valueOf() >= 0, true, "msgEnqueueTime2 time must be greater than scheduled time");
            should.equal(testMessages.some((x) => x.messageId === msgs[0].messageId), true, "MessageId of first message is different than expected");
            should.equal(testMessages.some((x) => x.messageId === msgs[1].messageId), true, "MessageId of second message is different than expected");
            yield msgs[0].complete();
            yield msgs[1].complete();
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testScheduleMessages();
        });
    });
    it("Partitioned Topic: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testScheduleMessages();
        });
    });
    it("UnPartitioned Queue: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testScheduleMessages();
        });
    });
    it("UnPartitioned Topic: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testScheduleMessages();
        });
    });
    it("Partitioned Queue with Sessions: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testScheduleMessages(true);
        });
    });
    it("Partitioned Topic with Sessions: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testScheduleMessages(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testScheduleMessages(true);
        });
    });
    it("Unpartitioned Topic with Sessions: Schedule multiple messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testScheduleMessages(true);
        });
    });
});
describe("Cancel single Scheduled message", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testCancelScheduleMessage(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const scheduleTime = new Date(Date.now() + 30000); // 30 seconds from now as anything less gives inconsistent results for cancelling
            const sequenceNumber = yield senderClient
                .getSender()
                .scheduleMessage(scheduleTime, testMessages);
            yield delay(2000);
            yield senderClient.getSender().cancelScheduledMessage(sequenceNumber);
            // Wait until we are sure we have passed the schedule time
            yield delay(30000);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testCancelScheduleMessage();
        });
    });
    it("Partitioned Topic: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testCancelScheduleMessage();
        });
    });
    it("Unpartitioned Queue: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testCancelScheduleMessage();
        });
    });
    it("Unpartitioned Topic: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testCancelScheduleMessage();
        });
    });
    it("Partitioned Queue with Sessions: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testCancelScheduleMessage(true);
        });
    });
    it("Partitioned Topic with Sessions: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testCancelScheduleMessage(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testCancelScheduleMessage(true);
        });
    });
    it("Unpartitioned Topic with Sessions: Cancel single Scheduled message", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testCancelScheduleMessage(true);
        });
    });
});
describe("Cancel multiple Scheduled messages", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function testCancelScheduleMessages(useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            const sender = senderClient.getSender();
            const scheduleTime = new Date(Date.now() + 30000); // 30 seconds from now as anything less gives inconsistent results for cancelling
            const sequenceNumber1 = yield sender.scheduleMessage(scheduleTime, testMessage);
            const sequenceNumber2 = yield sender.scheduleMessage(scheduleTime, testMessage);
            yield delay(2000);
            yield sender.cancelScheduledMessages([sequenceNumber1, sequenceNumber2]);
            // Wait until we are sure we have passed the schedule time
            yield delay(30000);
            yield testPeekMsgsLength(receiverClient, 0);
        });
    }
    it("Partitioned Queue: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            yield testCancelScheduleMessages(false);
        });
    });
    it("Partitioned Topic: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription);
            yield testCancelScheduleMessages(false);
        });
    });
    it("Unpartitioned Queue: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            yield testCancelScheduleMessages(false);
        });
    });
    it("Unpartitioned Topic: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription);
            yield testCancelScheduleMessages(false);
        });
    });
    it("Partitioned Queue with Sessions: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, true);
            yield testCancelScheduleMessages(true);
        });
    });
    it("Partitioned Topic with Sessions: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, true);
            yield testCancelScheduleMessages(true);
        });
    });
    it("Unpartitioned Queue with Sessions: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, true);
            yield testCancelScheduleMessages(true);
        });
    });
    it("Unpartitioned Topic with Sessions: Cancel scheduled messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, true);
            yield testCancelScheduleMessages(true);
        });
    });
});
describe("Message validations", function () {
    const longString = "A very very very very very very very very very very very very very very very very very very very very very very very very very long string.";
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function validationTest(msg, expectedErrorMsg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let actualErrorMsg = "";
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            const sender = senderClient.getSender();
            yield sender.send(msg).catch((err) => {
                actualErrorMsg = err.message;
            });
            should.equal(actualErrorMsg, expectedErrorMsg, "Error not thrown as expected");
        });
    }
    it("Error thrown when the 'msg' is undefined", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest(undefined, "data is required and it must be of type object.");
        });
    });
    it("Error thrown when the 'contentType' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", contentType: 1 }, "'contentType' must be of type 'string'.");
        });
    });
    it("Error thrown when the 'label' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", label: 1 }, "'label' must be of type 'string'.");
        });
    });
    it("Error thrown when the 'to' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", to: 1 }, "'to' must be of type 'string'.");
        });
    });
    it("Error thrown when the 'replyToSessionId' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", replyToSessionId: 1 }, "'replyToSessionId' must be of type 'string'.");
        });
    });
    it("Error thrown when the 'timeToLive' is not of type 'number'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", timeToLive: "" }, "'timeToLive' must be of type 'number'.");
        });
    });
    it("Error thrown when the 'scheduledEnqueueTimeUtc' is not an instance of a valid 'Date'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", scheduledEnqueueTimeUtc: new Date("foo") }, "'scheduledEnqueueTimeUtc' must be an instance of a valid 'Date'.");
        });
    });
    it("Error thrown when the 'scheduledEnqueueTimeUtc' is a number(not an instance of 'Date')", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", scheduledEnqueueTimeUtc: 1 }, "'scheduledEnqueueTimeUtc' must be an instance of a valid 'Date'.");
        });
    });
    it("Error thrown when the length of 'partitionKey' is greater than 128 characters", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", partitionKey: longString }, "'partitionKey' must be of type 'string' with a length less than 128 characters.");
        });
    });
    it("Error thrown when the 'partitionKey' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", partitionKey: 1 }, "'partitionKey' must be of type 'string' with a length less than 128 characters.");
        });
    });
    it("Error thrown when the length of 'viaPartitionKey' is greater than 128 characters.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", viaPartitionKey: longString }, "'viaPartitionKey' must be of type 'string' with a length less than 128 characters.");
        });
    });
    it("Error thrown when the 'viaPartitionKey' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", viaPartitionKey: 1 }, "'viaPartitionKey' must be of type 'string' with a length less than 128 characters.");
        });
    });
    it("Error thrown when the 'sessionId' is not of type 'string'", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", sessionId: 1 }, "'sessionId' must be of type 'string'.");
        });
    });
    it("Error thrown when the length of 'sessionId' is greater than 128 characters", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", sessionId: longString }, "Length of 'sessionId' of type 'string' cannot be greater than 128 characters.");
        });
    });
    it("Error thrown when the 'messageId' is not a whole number.", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", messageId: 1.5 }, "'messageId' must be a whole integer. Decimal points are not allowed.");
        });
    });
    it("Error thrown when the length of 'messageId' is greater than 128 characters", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", messageId: longString }, "Length of 'messageId' of type 'string' cannot be greater than 128 characters.");
        });
    });
    it("Error thrown when the 'correlationId' is not an instance of 'string' | 'number' | Buffer", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield validationTest({ body: "", correlationId: [] }, "'correlationId' must be of type 'string' | 'number' | Buffer.");
        });
    });
});
//# sourceMappingURL=sendSchedule.spec.js.map