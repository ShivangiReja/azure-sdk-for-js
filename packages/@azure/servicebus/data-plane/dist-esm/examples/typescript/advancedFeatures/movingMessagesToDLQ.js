"use strict";
/*
    This sample demonstrates scenarios as to how a Service Bus message can be explicitly moved to
    the DLQ. For other implicit ways when Service Bus messages get moved to DLQ, refer to -
    https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues

    Run processMessagesInDLQ example after this to see how the messages in DLQ can be reprocessed.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
let ns;
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        ns = lib_1.Namespace.createFromConnectionString(connectionString);
        try {
            // Sending a message to ensure that there is atleast one message in the main queue
            yield sendMessage();
            yield receiveMessage();
        }
        finally {
            yield ns.close();
        }
    });
}
function sendMessage() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        const message = {
            body: { name: "Creamy Chicken Pasta", type: "Dinner" },
            contentType: "application/json",
            label: "Recipe"
        };
        yield sender.send(message);
        yield client.close();
    });
}
function receiveMessage() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(queueName);
        const receiver = client.getReceiver();
        const message = yield receiver.receiveBatch(1);
        if (message) {
            console.log(">>>>> Deadletter the one message received from the main queue - ", message[0].body);
            // Deadletter the message received
            yield message[0].deadLetter({
                deadletterReason: "Incorrect Recipe type",
                deadLetterErrorDescription: "Recipe type does not  match preferences."
            });
        }
        else {
            console.log(">>>> Error: No messages were received from the main queue.");
        }
        yield client.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=movingMessagesToDLQ.js.map