"use strict";
/*
  This sample demonstrates how to send/receive messages to/from session enabled queues/subscriptions
  in Service Bus.

  Setup: To run this sample, you would need session enabled Queue/Subscription.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/message-sessions to learn about
  sessions in Service Bus.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
// Define connection string and related Service Bus entity names here
// Ensure on portal.azure.com that queue/topic has Sessions feature enabled
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
            yield sendMessage(ns, listOfScientists[0], "session-1");
            yield sendMessage(ns, listOfScientists[1], "session-1");
            yield sendMessage(ns, listOfScientists[2], "session-1");
            yield sendMessage(ns, listOfScientists[3], "session-1");
            yield sendMessage(ns, listOfScientists[4], "session-1");
            yield sendMessage(ns, listOfScientists[5], "session-2");
            yield sendMessage(ns, listOfScientists[6], "session-2");
            yield sendMessage(ns, listOfScientists[7], "session-2");
            yield sendMessage(ns, listOfScientists[8], "session-2");
            yield sendMessage(ns, listOfScientists[9], "session-2");
            yield receiveMessages(ns, "session-1");
            yield receiveMessages(ns, "session-2");
        }
        finally {
            yield ns.close();
        }
    });
}
function sendMessage(ns, scientist, sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        const message = {
            body: `${scientist.firstName} ${scientist.lastName}`,
            label: "Scientist",
            sessionId: sessionId
        };
        console.log(`Sending message: "${message.body}" to "${sessionId}"`);
        yield sender.send(message);
        yield client.close();
    });
}
function receiveMessages(ns, sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(queueName);
        const receiver = yield client.getSessionReceiver({ sessionId: sessionId });
        const onMessage = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`Received: ${brokeredMessage.sessionId} - ${brokeredMessage.body} `);
        });
        const onError = (err) => {
            console.log(">>>>> Error occurred: ", err);
        };
        receiver.receive(onMessage, onError);
        yield service_bus_1.delay(5000);
        yield client.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=session.js.map