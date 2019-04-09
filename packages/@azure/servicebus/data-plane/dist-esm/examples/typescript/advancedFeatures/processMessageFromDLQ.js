"use strict";
/*
  This sample demonstrates retrieving a message from a dead letter queue, editing it and
  sending it back to the main queue.

  Prior to running this sample, run the sample in movingMessagesToDLQ.ts file to move a message
  to the Dead Letter Queue
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
const deadLetterQueueName = lib_1.Namespace.getDeadLetterQueuePath(queueName);
// const deadLetterQueueName = Namespace.getDeadLetterTopicPath(topicName, subscriptionName);
let ns;
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        ns = lib_1.Namespace.createFromConnectionString(connectionString);
        try {
            yield processDeadletterMessageQueue();
        }
        finally {
            yield ns.close();
        }
    });
}
function processDeadletterMessageQueue() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = ns.createQueueClient(deadLetterQueueName);
        const receiver = client.getReceiver();
        const message = yield receiver.receiveBatch(1);
        if (message.length > 0) {
            console.log(">>>>> Received the message from DLQ - ", message[0].body);
            // Do something with the message retrieved from DLQ
            yield fixAndResendMessage(message[0]);
            // Mark message as complete/processed.
            yield message[0].complete();
        }
        else {
            console.log(">>>> Error: No messages were received from the DLQ.");
        }
        yield client.close();
    });
}
// Send repaired message back to the current queue / topic
function fixAndResendMessage(oldMessage) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        // Inspect given message and make any changes if necessary
        const repairedMessage = oldMessage.clone();
        console.log(">>>>> Cloning the message from DLQ and resending it - ", oldMessage.body);
        yield sender.send(repairedMessage);
        yield client.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=processMessageFromDLQ.js.map