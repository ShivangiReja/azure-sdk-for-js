"use strict";
/*
  This sample demonstrates how the receive() function can be used to receive Service Bus messages
  in a stream.

  Setup: Please run "sendMessages.ts" sample before running this to populate the queue/topic
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://samplesservicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=J7loIoFdNr8sx8QSU/kl9Uj4iXgmQKlB2l17G6DGxGc=";
const queueName = "partitioned-queue";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = service_bus_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(queueName);
        // To receive messages from sessions, use getSessionReceiver instead of getReceiver or look at
        // the sample in sessions.ts file
        const receiver = client.getReceiver();
        const onMessageHandler = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`Received message: ${brokeredMessage.body}`);
            yield brokeredMessage.complete();
        });
        const onErrorHandler = (err) => {
            console.log("Error occurred: ", err);
        };
        try {
            receiver.receive(onMessageHandler, onErrorHandler, { autoComplete: false });
            // Waiting long enough before closing the receiver to receive messages
            yield service_bus_1.delay(5000);
            yield receiver.close();
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
//# sourceMappingURL=receiveMessagesStreaming.js.map