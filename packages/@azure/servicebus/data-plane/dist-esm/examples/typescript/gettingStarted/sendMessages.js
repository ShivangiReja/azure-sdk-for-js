"use strict";
/*
  This sample demonstrates how the send() function can be used to send messages to Service Bus
  Queue/Topic.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions
  to learn about Queues, Topics and Subscriptions.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
const listOfScientists = [
    { name: "Einstein", firstName: "Albert" },
    { name: "Heisenberg", firstName: "Werner" },
    { name: "Curie", firstName: "Marie" },
    { name: "Hawking", firstName: "Steven" },
    { name: "Newton", firstName: "Isaac" },
    { name: "Bohr", firstName: "Niels" },
    { name: "Faraday", firstName: "Michael" },
    { name: "Galilei", firstName: "Galileo" },
    { name: "Kepler", firstName: "Johannes" },
    { name: "Kopernikus", firstName: "Nikolaus" }
];
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = lib_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        try {
            for (let index = 0; index < listOfScientists.length; index++) {
                const scientist = listOfScientists[index];
                const message = {
                    body: `${scientist.firstName} ${scientist.name}`,
                    label: "Scientist"
                };
                console.log(`Sending message: ${message.body} - ${message.label}`);
                yield sender.send(message);
            }
            yield client.close();
        }
        finally {
            yield ns.close();
        }
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=sendMessages.js.map