"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://testservicebusstandard.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=rg/eK7FKjWTJGWQJCdh4t7nMqfBAaNlA9/xr1HiGh5c=";
const queueName = "testqueue";
const numberOfMessages = 11000;
let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 3;
let consecutiveTimeoutExeptionsCount = 0;
const maxConsecutiveTimeoutExeptionsCount = 3;
const ns = lib_1.Namespace.createFromConnectionString(connectionString);
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(queueName);
        const sender = client.getSender();
        try {
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
            yield lib_1.delay(10000);
            yield purgeMessages();
            // await client.close();
        }
        finally {
            // await ns.close();
            console.log("Finally...");
        }
    });
}
function purgeMessages() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const queueClient = ns.createQueueClient(queueName);
        let receiver = queueClient.getReceiver({ receiveMode: lib_1.ReceiveMode.receiveAndDelete });
        const receiverParameters = {
            receiveMode: lib_1.ReceiveMode.receiveAndDelete
        };
        let continueLoop = true;
        do {
            try {
                receiver = queueClient.getReceiver(receiverParameters);
                const messages = yield receiver.receiveBatch(1000, 5);
                console.log(`Received message length ${messages.length}`);
                const deletedMessagesCount = messages.length;
                if (deletedMessagesCount === 0) {
                    consecutiveZeroMessagesCount++;
                    if (consecutiveZeroMessagesCount > maxConsecutiveZeroMessagesCount) {
                        continueLoop = false;
                    }
                }
                else {
                    consecutiveZeroMessagesCount = 0;
                }
            }
            catch (error) {
                if (error.name && error.name.toLowerCase() === "operationtimeouterror") {
                    consecutiveTimeoutExeptionsCount++;
                    if (consecutiveTimeoutExeptionsCount > maxConsecutiveTimeoutExeptionsCount) {
                        continueLoop = false;
                    }
                }
                else {
                    continueLoop = false;
                    consecutiveTimeoutExeptionsCount = 0;
                }
            }
            finally {
                if (receiver !== null) {
                    yield receiver.close();
                }
            }
        } while (continueLoop);
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=test.js.map