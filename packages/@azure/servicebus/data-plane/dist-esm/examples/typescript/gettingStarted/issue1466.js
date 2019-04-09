"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://testservicebusstandard.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=rg/eK7FKjWTJGWQJCdh4t7nMqfBAaNlA9/xr1HiGh5c=";
const queueName = "testqueue";
const numberOfMessages = 11000;
let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 100;
let totalMessagesPurged = 0;
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
        const client = ns.createQueueClient(queueName);
        const receiver = client.getReceiver({ receiveMode: lib_1.ReceiveMode.receiveAndDelete });
        let continueLoop = true;
        const list = [];
        for (let index = 0; index < numberOfMessages; index++) {
            list.push("Message " + index);
        }
        // let count = 0;
        do {
            // if (count === 2) {
            //   break;
            // }
            // count++;
            console.log("#################################################################");
            // receiver = receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
            const messages = yield receiver.receiveBatch(numberOfMessages / 10, 10);
            messages.forEach((element) => {
                list.splice(list.indexOf(element.body), 1);
            });
            const deletedMessagesCount = messages.length;
            totalMessagesPurged += deletedMessagesCount;
            console.log("totalMessagesPurged = " + totalMessagesPurged + ", yet to receive = " + list.length);
            if (deletedMessagesCount === 0) {
                consecutiveZeroMessagesCount++;
                console.log("yet to receive = " + list);
                yield lib_1.delay(5000);
                if (consecutiveZeroMessagesCount > maxConsecutiveZeroMessagesCount) {
                    continueLoop = false;
                }
            }
            else {
                consecutiveZeroMessagesCount = 0;
            }
            // await delay(3000);
            // await receiver.close();
        } while (continueLoop);
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=issue1466.js.map