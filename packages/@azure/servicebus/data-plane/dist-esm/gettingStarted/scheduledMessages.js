"use strict";
/*
  This sample demonstrates how the scheduleMessage() function can be used to schedule messages to
  appear on a Service Bus Queue/Subscription at a later time.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/message-sequencing#scheduled-messages
  to learn about scheduling messages.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
const rhea_promise_1 = require("rhea-promise");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
const listOfScientists = [
    { lastName: "Einstein", firstName: "Albert" },
    { lastName: "Heisenberg", firstName: "Werner" },
    { lastName: "Curie", firstName: "Marie" },
    { lastName: "Hawking", firstName: "Steven" },
    { lastName: "Newton", firstName: "Isaac" },
    { lastName: "Bohr", firstName: "Niels" },
    { lastName: "Faraday", firstName: "Michael" },
    { lastName: "Galilei", firstName: "Galileo" },
    { lastName: "Kepler", firstName: "Johannes" },
    { lastName: "Kopernikus", firstName: "Nikolaus" }
];
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = service_bus_1.Namespace.createFromConnectionString(connectionString);
        try {
            yield sendScheduledMessages(ns);
            yield receiveMessages(ns);
        }
        finally {
            yield ns.close();
        }
    });
}
// Scheduling messages to be sent after 10 seconds from now
function sendScheduledMessages(ns) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        const messages = listOfScientists.map((scientist) => ({
            body: `${scientist.firstName} ${scientist.lastName}`,
            label: "Scientist"
        }));
        const timeNowUtc = new Date(Date.now());
        const scheduledEnqueueTimeUtc = new Date(Date.now() + 10000);
        console.log(`Time now in UTC: ${timeNowUtc}`);
        console.log(`Messages will appear in Service Bus after 10 seconds at: ${scheduledEnqueueTimeUtc}`);
        yield sender.scheduleMessages(scheduledEnqueueTimeUtc, messages);
    });
}
function receiveMessages(ns) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(queueName);
        let numOfMessagesReceived = 0;
        const onMessageHandler = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            numOfMessagesReceived++;
            console.log(`Received message: ${brokeredMessage.body} - ${brokeredMessage.label}`);
            yield brokeredMessage.complete();
        });
        const onErrorHandler = (err) => {
            console.log("Error occurred: ", err);
        };
        console.log(`\nStarting receiver immediately at ${new Date(Date.now())}`);
        const receiver = client.getReceiver();
        receiver.receive(onMessageHandler, onErrorHandler);
        yield rhea_promise_1.delay(5000);
        yield receiver.close();
        console.log(`Received ${numOfMessagesReceived} messages.`);
        yield rhea_promise_1.delay(5000);
        console.log(`\nStarting receiver at ${new Date(Date.now())}`);
        receiver.receive(onMessageHandler, onErrorHandler);
        yield rhea_promise_1.delay(5000);
        yield receiver.close();
        console.log(`Received ${numOfMessagesReceived} messages.`);
        yield client.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=scheduledMessages.js.map