"use strict";
/*
  This sample illustrates how to use topic subscriptions and filters for splitting
  up a message stream into multiple streams based on message properties.

  In this sample, we will send messages with property "priority" of 1 and 2 to two separate subscriptions,
  and the rest of the messages to the third subscription.

  Setup: To run this sample, you would need a Topic with 3 subscriptions.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/topic-filters to learn aboout
  Topic filters and actions.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const topicName = "";
const subscriptionName1 = "";
const subscriptionName2 = "";
const subscriptionName3 = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = lib_1.Namespace.createFromConnectionString(connectionString);
        try {
            yield addRules(ns);
            yield sendMessages(ns);
            yield receiveMessages(ns);
        }
        finally {
            yield ns.close();
        }
    });
}
// Adds Rules on subscriptions to route messages from a topic to different subscriptions
function addRules(ns) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const subscription1Client = ns.createSubscriptionClient(topicName, subscriptionName1);
        const subscription2Client = ns.createSubscriptionClient(topicName, subscriptionName2);
        const subscription3Client = ns.createSubscriptionClient(topicName, subscriptionName3);
        // The default rule on the subscription allows all messages in.
        // So, remove existing rules before adding new ones
        yield removeAllRules(subscription1Client);
        yield removeAllRules(subscription2Client);
        yield removeAllRules(subscription3Client);
        yield subscription1Client.addRule("Priority_1", "priority = 1");
        yield subscription2Client.addRule("Priority_2", "priority = 2");
        yield subscription3Client.addRule("Priority_3", "priority >= 3");
    });
}
// Sends 100 messages with a user property called "priority" whose value is between 1 and 4
function sendMessages(ns) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const topicClient = ns.createTopicClient(topicName);
        for (let index = 0; index < 10; index++) {
            const priority = Math.ceil(Math.random() * 4);
            const message = {
                body: `Message#${index} with priority ${priority}`,
                userProperties: { priority: priority }
            };
            console.log(` Sending message ${index} - ${message.body}`);
            yield topicClient.getSender().send(message);
        }
    });
}
// Prints messages from the 3 subscriptions
function receiveMessages(ns) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const subscription1Client = ns.createSubscriptionClient(topicName, subscriptionName1);
        const subscription2Client = ns.createSubscriptionClient(topicName, subscriptionName2);
        const subscription3Client = ns.createSubscriptionClient(topicName, subscriptionName3);
        const messagesFromSubscription1 = yield subscription1Client.getReceiver().receiveBatch(10, 5);
        console.log(">>>>> Messages from the first subscription:");
        for (let i = 0; i < messagesFromSubscription1.length; i++) {
            console.log(messagesFromSubscription1[i].body);
            yield messagesFromSubscription1[i].complete();
        }
        yield subscription1Client.close();
        const messagesFromSubscription2 = yield subscription2Client.getReceiver().receiveBatch(10, 5);
        console.log(">>>>> Messages from the second subscription:");
        for (let i = 0; i < messagesFromSubscription2.length; i++) {
            console.log(messagesFromSubscription2[i].body);
            yield messagesFromSubscription2[i].complete();
        }
        yield subscription2Client.close();
        const messagesFromSubscription3 = yield subscription3Client.getReceiver().receiveBatch(10, 5);
        console.log(">>>>> Messages from the third subscription:");
        for (let i = 0; i < messagesFromSubscription3.length; i++) {
            console.log(messagesFromSubscription3[i].body);
            yield messagesFromSubscription3[i].complete();
        }
        yield subscription3Client.close();
    });
}
function removeAllRules(client) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rules = yield client.getRules();
        for (let i = 0; i < rules.length; i++) {
            yield client.removeRule(rules[i].name);
        }
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=topicFilters.js.map