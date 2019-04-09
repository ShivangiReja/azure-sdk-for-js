// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { loginWithServicePrincipalSecret } from "ms-rest-azure";
const aadServiceBusAudience = "https://servicebus.azure.net/";
import { Namespace, delay, QueueClient } from "../lib";
import { getSenderReceiverClients, ClientType, TestMessage, purge, getEnvVars } from "./testUtils";
import long from "long";
function testFalsyValues(testFn) {
    [undefined, "", 0].forEach(function (value) {
        testFn(value);
    });
}
describe("Create Namespace", function () {
    it("throws error when there is no connection string", function () {
        testFalsyValues(function (value) {
            const test = function () {
                Namespace.createFromConnectionString(value);
            };
            test.should.throw(Error, "'connectionString' is a required parameter and must be of type: 'string'.");
        });
    });
    it("creates an Namespace from a connection string", function () {
        const namespace = Namespace.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c;EntityPath=d");
        namespace.should.be.an.instanceof(Namespace);
        should.equal(namespace.name, "sb://a/", "Name of the namespace is different than expected");
    });
});
describe("Clients with no name", function () {
    let namespace;
    beforeEach(() => {
        namespace = Namespace.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c;EntityPath=d");
    });
    afterEach(() => {
        return namespace.close();
    });
    it("throws error when creating queue client with no name", function () {
        testFalsyValues(function (value) {
            const test = function () {
                namespace.createQueueClient(value);
            };
            test.should.throw(Error, "'queueName' is a required parameter and must be of type 'string'.");
        });
    });
    it("throws error when creating topic client with no name", function () {
        testFalsyValues(function (value) {
            const test = function () {
                namespace.createTopicClient(value);
            };
            test.should.throw(Error, "'topicName' is a required parameter and must be of type 'string'.");
        });
    });
    it("throws error when creating subscription client with no topic name", function () {
        testFalsyValues(function (value) {
            const test = function () {
                namespace.createSubscriptionClient(value, "some-name");
            };
            test.should.throw(Error, "'topicName' is a required parameter and must be of type 'string'.");
        });
    });
    it("throws error when creating subscription client with no subscription name", function () {
        testFalsyValues(function (value) {
            const test = function () {
                namespace.createSubscriptionClient("some-name", value);
            };
            test.should.throw(Error, "'subscriptionName' is a required parameter and must be of type 'string'.");
        });
    });
});
describe("Errors with non existing Namespace", function () {
    let namespace;
    let errorWasThrown;
    beforeEach(() => {
        namespace = Namespace.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c;EntityPath=d");
        errorWasThrown = false;
    });
    afterEach(() => {
        return namespace.close();
    });
    const testError = (err) => {
        should.equal(err.name, "ServiceCommunicationError", "ErrorName is different than expected");
        should.equal(err.message, "getaddrinfo ENOTFOUND a a:5671", "ErrorMessage is different than expected");
        errorWasThrown = true;
    };
    it("throws error when sending data via a queueClient to a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createQueueClient("some-name");
            yield client
                .getSender()
                .send({ body: "hello" })
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when sending data via a topicClient to a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createTopicClient("some-name");
            yield client
                .getSender()
                .send({ body: "hello" })
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when sending batch data via a queueClient to a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createQueueClient("some-name");
            yield client
                .getSender()
                .send({ body: "hello" })
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when sending batch data via a topicClient to a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createTopicClient("some-name");
            yield client
                .getSender()
                .send({ body: "hello" })
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when receving batch data via a queueClient from a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createQueueClient("some-name");
            yield client
                .getReceiver()
                .receiveBatch(10)
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when receving batch data via a subscriptionClient from a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createSubscriptionClient("some-topic-name", "some-subscription-name");
            yield client
                .getReceiver()
                .receiveBatch(10)
                .catch(testError);
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error when receving streaming data via a queueClient from a non existing namespace", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = namespace.createQueueClient("some-name");
            const onMessage = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                throw "onMessage should not have been called when receive call is made from a non existing namespace";
            });
            client.getReceiver().receive(onMessage, testError);
            yield delay(3000);
            yield client.close();
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
});
describe("Errors with non existing Queue/Topic/Subscription", function () {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let namespace;
        let errorWasThrown;
        beforeEach(() => {
            if (!process.env.SERVICEBUS_CONNECTION_STRING) {
                throw "define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.";
            }
            namespace = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
            errorWasThrown = false;
        });
        afterEach(() => {
            return namespace.close();
        });
        const testError = (err, entityPath) => {
            should.equal(err.name, "MessagingEntityNotFoundError", "ErrorName is different than expected");
            should.equal(err.message.startsWith(`The messaging entity '${namespace.name}${entityPath}' could not be found.`), true);
            errorWasThrown = true;
        };
        it("throws error when sending data to a non existing queue", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createQueueClient("some-name");
                yield client
                    .getSender()
                    .send({ body: "hello" })
                    .catch((err) => testError(err, "some-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when sending data to a non existing topic", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createTopicClient("some-name");
                yield client
                    .getSender()
                    .send({ body: "hello" })
                    .catch((err) => testError(err, "some-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when sending batch data to a non existing queue", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createQueueClient("some-name");
                yield client
                    .getSender()
                    .send({ body: "hello" })
                    .catch((err) => testError(err, "some-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when sending batch data to a non existing topic", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createTopicClient("some-name");
                yield client
                    .getSender()
                    .send({ body: "hello" })
                    .catch((err) => testError(err, "some-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when receiving batch data from a non existing queue", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createQueueClient("some-name");
                yield client
                    .getReceiver()
                    .receiveBatch(1)
                    .catch((err) => testError(err, "some-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when receiving batch data from a non existing subscription", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createSubscriptionClient("some-topic-name", "some-subscription-name");
                yield client
                    .getReceiver()
                    .receiveBatch(1)
                    .catch((err) => testError(err, "some-topic-name/Subscriptions/some-subscription-name"));
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when receving streaming data from a non existing queue", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createQueueClient("some-name");
                const onMessage = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    throw "onMessage should not have been called when receive call is made from a non existing namespace";
                });
                client.getReceiver().receive(onMessage, (err) => testError(err, "some-name"));
                yield delay(3000);
                yield client.close();
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
        it("throws error when receving streaming data from a non existing subscription", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = namespace.createSubscriptionClient("some-topic-name", "some-subscription-name");
                const onMessage = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    throw "onMessage should not have been called when receive call is made from a non existing namespace";
                });
                client
                    .getReceiver()
                    .receive(onMessage, (err) => testError(err, "some-topic-name/Subscriptions/some-subscription-name"));
                yield delay(3000);
                yield client.close();
                should.equal(errorWasThrown, true, "Error thrown flag must be true");
            });
        });
    });
});
describe("Test createFromAadTokenCredentials", function () {
    let namespace;
    let tokenCreds;
    let errorWasThrown = false;
    if (!process.env.SERVICEBUS_CONNECTION_STRING) {
        throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
    }
    const serviceBusEndpoint = (process.env.SERVICEBUS_CONNECTION_STRING.match("Endpoint=sb://((.*).servicebus.windows.net)") || "")[1];
    function testCreateFromAadTokenCredentials(host, tokenCreds) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessages = TestMessage.getSample();
            namespace = Namespace.createFromAadTokenCredentials(host, tokenCreds);
            namespace.should.be.an.instanceof(Namespace);
            const clients = yield getSenderReceiverClients(namespace, ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue);
            const sender = clients.senderClient.getSender();
            const receiver = clients.receiverClient.getReceiver();
            yield sender.send(testMessages);
            const msgs = yield receiver.receiveBatch(1);
            should.equal(Array.isArray(msgs), true, "`ReceivedMessages` is not an array");
            should.equal(msgs[0].body, testMessages.body, "MessageBody is different than expected");
            should.equal(msgs.length, 1, "Unexpected number of messages");
        });
    }
    it("throws error for an invalid host", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const env = getEnvVars();
            tokenCreds = yield loginWithServicePrincipalSecret(env.clientId, env.clientSecret, env.tenantId, {
                tokenAudience: aadServiceBusAudience
            });
            yield testCreateFromAadTokenCredentials("", tokenCreds).catch((err) => {
                errorWasThrown = true;
                should.equal(err.message, "'host' is a required parameter and must be of type: 'string'.", "ErrorMessage is different than expected");
            });
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("throws error for invalid tokenCredentials", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testCreateFromAadTokenCredentials(serviceBusEndpoint, "").catch((err) => {
                errorWasThrown = true;
                should.equal(err.message, "'credentials' is a required parameter and must be an instance of ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.", "ErrorMessage is different than expected");
            });
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("sends a message to the ServiceBus entity", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const env = getEnvVars();
            tokenCreds = yield loginWithServicePrincipalSecret(env.clientId, env.clientSecret, env.tenantId, {
                tokenAudience: aadServiceBusAudience
            });
            yield testCreateFromAadTokenCredentials(serviceBusEndpoint, tokenCreds);
            yield namespace.close();
        });
    });
});
describe("Errors after close()", function () {
    let namespace;
    let senderClient;
    let receiverClient;
    let sender;
    let receiver;
    afterEach(() => {
        return namespace.close();
    });
    function beforeEachTest(senderType, receiverType, entityToClose, useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!process.env.SERVICEBUS_CONNECTION_STRING) {
                throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
            }
            namespace = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
            const clients = yield getSenderReceiverClients(namespace, senderType, receiverType);
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
                    sessionId: TestMessage.sessionId
                })
                : receiverClient.getReceiver();
            // Normal send/receive
            const testMessage = useSessions ? TestMessage.getSessionSample() : TestMessage.getSample();
            yield sender.send(testMessage);
            const receivedMsgs = yield receiver.receiveBatch(1, 3);
            should.equal(receivedMsgs.length, 1, "Unexpected number of messages received");
            yield receivedMsgs[0].complete();
            // close(), so that we can then test the resulting error.
            switch (entityToClose) {
                case "namespace":
                    yield namespace.close();
                    break;
                case "senderClient":
                    yield senderClient.close();
                    break;
                case "receiverClient":
                    yield receiverClient.close();
                    break;
                case "sender":
                    yield sender.close();
                    break;
                case "receiver":
                    yield receiver.close();
                    break;
                default:
                    break;
            }
        });
    }
    /**
     * Tests that each feature of the sender throws expected error
     */
    function testSender(expectedErrorMsg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testMessage = TestMessage.getSample();
            let errorSend = "";
            yield sender.send(testMessage).catch((err) => {
                errorSend = err.message;
            });
            should.equal(errorSend, expectedErrorMsg, "Expected error not thrown for send()");
            let errorSendBatch = "";
            yield sender.sendBatch([testMessage]).catch((err) => {
                errorSendBatch = err.message;
            });
            should.equal(errorSendBatch, expectedErrorMsg, "Expected error not thrown for sendBatch()");
            let errorScheduleMsg = "";
            yield sender.scheduleMessage(new Date(Date.now() + 30000), testMessage).catch((err) => {
                errorScheduleMsg = err.message;
            });
            should.equal(errorScheduleMsg, expectedErrorMsg, "Expected error not thrown for scheduleMessage()");
            let errorScheduleMsgs = "";
            yield sender.scheduleMessages(new Date(Date.now() + 30000), [testMessage]).catch((err) => {
                errorScheduleMsgs = err.message;
            });
            should.equal(errorScheduleMsgs, expectedErrorMsg, "Expected error not thrown for scheduleMessages()");
            let errorCancelMsg = "";
            yield sender.cancelScheduledMessage(long.ZERO).catch((err) => {
                errorCancelMsg = err.message;
            });
            should.equal(errorCancelMsg, expectedErrorMsg, "Expected error not thrown for cancelScheduledMessage()");
            let errorCancelMsgs = "";
            yield sender.cancelScheduledMessages([long.ZERO]).catch((err) => {
                errorCancelMsgs = err.message;
            });
            should.equal(errorCancelMsgs, expectedErrorMsg, "Expected error not thrown for cancelScheduledMessages()");
        });
    }
    /**
     * Tests that each feature of the senderClient throws expected error
     */
    function testSenderClient(expectedErrorMsg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorNewSender = "";
            try {
                senderClient.getSender();
            }
            catch (err) {
                errorNewSender = err.message;
            }
            should.equal(errorNewSender, expectedErrorMsg, "Expected error not thrown for getSender()");
        });
    }
    /**
     * Tests that each feature of the receiver throws expected error
     */
    function testReceiver(expectedErrorMsg, useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorReceiveBatch = "";
            yield receiver.receiveBatch(1, 1).catch((err) => {
                errorReceiveBatch = err.message;
            });
            should.equal(errorReceiveBatch, expectedErrorMsg, "Expected error not thrown for receiveBatch()");
            let errorReceiveStream = "";
            try {
                receiver.receive(() => Promise.resolve(), (e) => console.log(e));
            }
            catch (err) {
                errorReceiveStream = err.message;
            }
            should.equal(errorReceiveStream, expectedErrorMsg, "Expected error not thrown for receive()");
            let errorDeferredMsg = "";
            yield receiver.receiveDeferredMessage(long.ZERO).catch((err) => {
                errorDeferredMsg = err.message;
            });
            should.equal(errorDeferredMsg, expectedErrorMsg, "Expected error not thrown for receiveDeferredMessage()");
            let errorDeferredMsgs = "";
            yield receiver.receiveDeferredMessage(long.ZERO).catch((err) => {
                errorDeferredMsgs = err.message;
            });
            should.equal(errorDeferredMsgs, expectedErrorMsg, "Expected error not thrown for receiveDeferredMessages()");
            let errorRenewLock = "";
            yield receiver.renewLock("randomLockToken").catch((err) => {
                errorRenewLock = err.message;
            });
            should.equal(errorRenewLock, expectedErrorMsg, "Expected error not thrown for renewLock()");
        });
    }
    /**
     * Tests that each feature of the receiverClient throws expected error
     */
    function testReceiverClient(expectedErrorMsg, useSessions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorNewReceiver = "";
            try {
                useSessions
                    ? yield receiverClient.getSessionReceiver({
                        sessionId: TestMessage.sessionId
                    })
                    : receiverClient.getReceiver();
            }
            catch (err) {
                errorNewReceiver = err.message;
            }
            should.equal(errorNewReceiver, expectedErrorMsg, "Expected error not thrown for getReceiver()");
            let errorPeek = "";
            yield receiverClient.peek().catch((err) => {
                errorPeek = err.message;
            });
            should.equal(errorPeek, expectedErrorMsg, "Expected error not thrown for peek() from receiverClient");
            let errorPeekBySequence = "";
            yield receiverClient.peekBySequenceNumber(long.ZERO).catch((err) => {
                errorPeekBySequence = err.message;
            });
            should.equal(errorPeekBySequence, expectedErrorMsg, "Expected error not thrown for peekBySequenceNumber() from receiverClient");
        });
    }
    /**
     * Tests that each feature of the receiver client with sessions throws expected error
     */
    function testSessionReceiver(expectedErrorMsg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield testReceiver(expectedErrorMsg, true);
            const sessionReceiver = receiver;
            let errorPeek = "";
            yield sessionReceiver.peek().catch((err) => {
                errorPeek = err.message;
            });
            should.equal(errorPeek, expectedErrorMsg, "Expected error not thrown for peek() from sessionReceiver");
            let errorPeekBySequence = "";
            yield sessionReceiver.peekBySequenceNumber(long.ZERO).catch((err) => {
                errorPeekBySequence = err.message;
            });
            should.equal(errorPeekBySequence, expectedErrorMsg, "Expected error not thrown for peekBySequenceNumber() from sessionReceiver");
            let errorGetState = "";
            yield sessionReceiver.getState().catch((err) => {
                errorGetState = err.message;
            });
            should.equal(errorGetState, expectedErrorMsg, "Expected error not thrown for getState()");
            let errorSetState = "";
            yield sessionReceiver.setState("state!!").catch((err) => {
                errorSetState = err.message;
            });
            should.equal(errorSetState, expectedErrorMsg, "Expected error not thrown for setState()");
        });
    }
    /**
     * Tests that each feature of the topic filters throws expected error
     */
    function testRules(expectedErrorMsg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const subscriptionClient = receiverClient;
            let errorAddRule = "";
            yield subscriptionClient.addRule("myRule", true).catch((err) => {
                errorAddRule = err.message;
            });
            should.equal(errorAddRule, expectedErrorMsg, "Expected error not thrown for addRule()");
            let errorRemoveRule = "";
            yield subscriptionClient.removeRule("myRule").catch((err) => {
                errorRemoveRule = err.message;
            });
            should.equal(errorRemoveRule, expectedErrorMsg, "Expected error not thrown for removeRule()");
            let errorGetRules = "";
            yield subscriptionClient.getRules().catch((err) => {
                errorGetRules = err.message;
            });
            should.equal(errorGetRules, expectedErrorMsg, "Expected error not thrown for getRule()");
        });
    }
    describe("Errors after close() on namespace", function () {
        const entityToClose = "namespace";
        const expectedErrorMsg = "The underlying AMQP connection is closed.";
        it("Partitioned Queue: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg);
            });
        });
        it("Partitioned Queue with sessions: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testSessionReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg, true);
            });
        });
        it("Partitioned Topic/Subscription: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription, entityToClose);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg);
                yield testRules(expectedErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription with sessions: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testSessionReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg, true);
                yield testRules(expectedErrorMsg);
            });
        });
        it("Unpartitioned Queue: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue, entityToClose);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg);
            });
        });
        it("Unpartitioned Queue with sessions: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testSessionReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg, true);
            });
        });
        it("Unpartitioned Topic/Subscription: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription, entityToClose);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg);
                yield testRules(expectedErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription with sessions: errors after close() on namespace", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedErrorMsg);
                yield testSenderClient(expectedErrorMsg);
                yield testSessionReceiver(expectedErrorMsg);
                yield testReceiverClient(expectedErrorMsg, true);
                yield testRules(expectedErrorMsg);
            });
        });
        it("Create Queue/Topic/Subscription clients throws error after namespace.close()", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                // beforeEachTest() can be run for any entity type, we need it only to ensure that the
                // connection is indeed opened
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                let errorCreateQueueClient = "";
                try {
                    namespace.createQueueClient("random-name");
                }
                catch (err) {
                    errorCreateQueueClient = err.message;
                }
                should.equal(errorCreateQueueClient, expectedErrorMsg, "Expected error not thrown for createQueueClient()");
                let errorCreateTopicClient = "";
                try {
                    namespace.createTopicClient("random-name");
                }
                catch (err) {
                    errorCreateTopicClient = err.message;
                }
                should.equal(errorCreateTopicClient, expectedErrorMsg, "Expected error not thrown for createTopicClient()");
                let errorCreateSubscriptionClient = "";
                try {
                    namespace.createSubscriptionClient("random-name", "random-name");
                }
                catch (err) {
                    errorCreateSubscriptionClient = err.message;
                }
                should.equal(errorCreateSubscriptionClient, expectedErrorMsg, "Expected error not thrown for createubscriptionClient()");
            });
        });
    });
    describe("Errors after close() on senderClient", function () {
        const entityToClose = "senderClient";
        const expectedSenderErrorMsg = "The sender has been closed and can no longer be used.";
        const expectedQueueClientErrorMsg = "The queueClient has been closed and can no longer be used.";
        const expectedTopicClientErrorMsg = "The topicClient has been closed and can no longer be used.";
        it("Partitioned Queue: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedQueueClientErrorMsg);
            });
        });
        it("Partitioned Queue with sessions: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedQueueClientErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription, entityToClose);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedTopicClientErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription with sessions: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedTopicClientErrorMsg);
            });
        });
        it("Unpartitioned Queue: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue, entityToClose);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedQueueClientErrorMsg);
            });
        });
        it("Unpartitioned Queue with sessions: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedQueueClientErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription, entityToClose);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedTopicClientErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription with sessions: errors after close() on senderClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
                yield testSenderClient(expectedTopicClientErrorMsg);
            });
        });
    });
    describe("Errors after close() on receiverClient", function () {
        const entityToClose = "receiverClient";
        const expectedReceiverErrorMsg = "The receiver has been closed and can no longer be used.";
        const expectedQueueClientErrorMsg = "The queueClient has been closed and can no longer be used.";
        const expectedSubscriptionClientErrorMsg = "The subscriptionClient has been closed and can no longer be used.";
        it("Partitioned Queue: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedQueueClientErrorMsg);
            });
        });
        it("Partitioned Queue with sessions: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedQueueClientErrorMsg, true);
            });
        });
        it("Partitioned Topic/Subscription: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedSubscriptionClientErrorMsg);
                yield testRules(expectedSubscriptionClientErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription with sessions: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedSubscriptionClientErrorMsg, true);
                yield testRules(expectedSubscriptionClientErrorMsg);
            });
        });
        it("Unpartitioned Queue: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedQueueClientErrorMsg);
            });
        });
        it("Unpartitioned Queue with sessions: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedQueueClientErrorMsg, true);
            });
        });
        it("Unpartitioned Topic/Subscription: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedSubscriptionClientErrorMsg);
                yield testRules(expectedSubscriptionClientErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription with sessions: errors after close() on receiverClient", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
                yield testReceiverClient(expectedSubscriptionClientErrorMsg, true);
                yield testRules(expectedSubscriptionClientErrorMsg);
            });
        });
    });
    describe("Errors after close() on sender", function () {
        const entityToClose = "sender";
        const expectedSenderErrorMsg = "The sender has been closed and can no longer be used.";
        it("Partitioned Queue: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Partitioned Queue with sessions: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription, entityToClose);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription with sessions: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Unpartitioned Queue: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue, entityToClose);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Unpartitioned Queue with sessions: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription, entityToClose);
                yield testSender(expectedSenderErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription with sessions: errors after close() on sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSender(expectedSenderErrorMsg);
            });
        });
    });
    describe("Errors after close() on receiver", function () {
        const entityToClose = "receiver";
        const expectedReceiverErrorMsg = "The receiver has been closed and can no longer be used.";
        it("Partitioned Queue: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Partitioned Queue with sessions: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedQueueWithSessions, ClientType.PartitionedQueueWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopic, ClientType.PartitionedSubscription, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Partitioned Topic/Subscription with sessions: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.PartitionedTopicWithSessions, ClientType.PartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Unpartitioned Queue: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueue, ClientType.UnpartitionedQueue, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Unpartitioned Queue with sessions: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedQueueWithSessions, ClientType.UnpartitionedQueueWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopic, ClientType.UnpartitionedSubscription, entityToClose);
                yield testReceiver(expectedReceiverErrorMsg);
            });
        });
        it("Unpartitioned Topic/Subscription with sessions: errors after close() on receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield beforeEachTest(ClientType.UnpartitionedTopicWithSessions, ClientType.UnpartitionedSubscriptionWithSessions, entityToClose, true);
                yield testSessionReceiver(expectedReceiverErrorMsg);
            });
        });
    });
});
//# sourceMappingURL=namespace.spec.js.map