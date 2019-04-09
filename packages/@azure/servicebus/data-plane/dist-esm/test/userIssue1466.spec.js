// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, SubscriptionClient, ReceiveMode } from "../lib";
import { TestMessage, getSenderReceiverClients, ClientType, purge } from "./testUtils";
import { delay } from "rhea-promise";
let ns;
let senderClient;
let receiverClient;
let deadLetterClient;
let sender;
let receiver;
const numberOfMessages = 11000;
let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 100;
let totalMessagesPurged = 0;
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
        receiver = receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
    });
}
function afterEachTest() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ns.close();
    });
}
describe("User Issue 1466", function () {
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function purgeMessages() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let continueLoop = true;
            const list = [];
            for (let index = 0; index < numberOfMessages; index++) {
                list.push("Message " + index);
            }
            // let count = 0;
            do {
                // if (count === 2) {
                //   break;
                // }
                // count++;
                console.log("#################################################################");
                // receiver = receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
                const messages = yield receiver.receiveBatch(numberOfMessages / 10, 5);
                messages.forEach((element) => {
                    list.splice(list.indexOf(element.body), 1);
                });
                const deletedMessagesCount = messages.length;
                totalMessagesPurged += deletedMessagesCount;
                console.log("totalMessagesPurged = " + totalMessagesPurged + ", yet to receive = " + list.length);
                if (deletedMessagesCount === 0) {
                    consecutiveZeroMessagesCount++;
                    console.log("yet to receive = " + list);
                    yield delay(5000);
                    if (consecutiveZeroMessagesCount > maxConsecutiveZeroMessagesCount) {
                        continueLoop = false;
                    }
                }
                else {
                    consecutiveZeroMessagesCount = 0;
                }
                // await delay(3000);
                // await receiver.close();
            } while (continueLoop);
        });
    }
    it.only("User Issue 1466 - batch receiver", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            let batchMessages = [];
            let index = 0;
            for (index = 0; index < numberOfMessages; index++) {
                if (index % (numberOfMessages / 10) === 0) {
                    console.log(`Sending ${index}`);
                    if (batchMessages.length > 0)
                        yield sender.sendBatch(batchMessages);
                    batchMessages = [];
                }
                batchMessages.push({ body: "Message " + index });
                // await sender.send({ body: "Message " + index });
            }
            console.log(`Sending ${index}`);
            yield sender.sendBatch(batchMessages);
            console.log("Sending Done, waiting for 10 seconds...");
            yield delay(10000);
            yield purgeMessages();
        });
    });
    it("User Issue 1466 - streaming receiver", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            let batchMessages = [];
            let index = 0;
            for (index = 0; index < numberOfMessages; index++) {
                if (index % (numberOfMessages / 10) === 0) {
                    console.log(`Sending ${index}`);
                    if (batchMessages.length > 0)
                        yield sender.sendBatch(batchMessages);
                    batchMessages = [];
                }
                batchMessages.push({ body: "Message " + index });
            }
            console.log(`Sending ${index}`);
            yield sender.sendBatch(batchMessages);
            console.log("Sending Done, waiting for 10 seconds...");
            yield delay(10000);
            const receivedMsgs = [];
            receiver.receive((msg) => {
                receivedMsgs.push(msg);
                console.log(msg.body);
                if (receivedMsgs.length % (numberOfMessages / 10) === 0) {
                    console.log("received " + receivedMsgs.length + " messages till now");
                }
                return Promise.resolve();
            }, (err) => {
                if (err) {
                    console.log(err.message);
                }
            });
            yield delay(10000000);
            console.log(receivedMsgs.length);
        });
    });
    it("User Issue 1466 - no sending", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!process.env.SERVICEBUS_CONNECTION_STRING) {
                throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
            }
            ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
            const clients = yield getSenderReceiverClients(ns, ClientType.PartitionedQueue, ClientType.PartitionedQueue);
            receiverClient = clients.receiverClient;
            yield purgeMessages();
        });
    });
});
//# sourceMappingURL=userIssue1466.spec.js.map