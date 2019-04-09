"use strict";
/*
  This sample demonstrates how the peek() function can be used to browse a Service Bus message.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/message-browsing to learn
  about message browsing.

  Setup: Please run "sendMessages.ts" sample before running this to populate the queue/topic
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ns = lib_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics & Subscription, use createSubscriptionClient to peek from the subscription
        const client = ns.createQueueClient(queueName);
        try {
            for (let i = 0; i < 20; i++) {
                const messages = yield client.peek();
                if (!messages.length) {
                    console.log("No more messages to peek");
                    break;
                }
                console.log(`Peeking message #${i}: ${messages[0].body}`);
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
//# sourceMappingURL=browseMessages.js.map