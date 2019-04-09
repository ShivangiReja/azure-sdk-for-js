"use strict";
/*
  This sample demonstrates how the receiveBatch() function can be used to receive Service Bus
  messages in a loop.

  Setup: Please run "sendMessages.ts" sample before running this to populate the queue/topic
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = service_bus_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(queueName);
        // To receive messages from sessions, use getSessionReceiver instead of getReceiver or look at
        // the sample in sessions.ts file
        const receiver = client.getReceiver();
        try {
            for (let i = 0; i < 10; i++) {
                const messages = yield receiver.receiveBatch(1, 5);
                if (!messages.length) {
                    console.log("No more messages to receive");
                    break;
                }
                console.log(`Received message #${i}: ${messages[0].body}`);
                yield messages[0].complete();
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
//# sourceMappingURL=receiveMessagesLoop.js.map