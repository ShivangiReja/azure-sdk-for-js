"use strict";
/*
  This sample demonstrates how the defer() function can be used to defer a message for later processing.

  In this sample, we have an application that gets cooking instructions out of order. It uses
  message deferral to defer the instruction that is out of order, and then processes it in order.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/message-deferral to learn about
  message deferral.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const queueName = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield sendMessages();
        yield receiveMessage();
    });
}
// Shuffle and send messages
function sendMessages() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const nsSend = service_bus_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics, use createTopicClient to send to a topic
        const sendClient = nsSend.createQueueClient(queueName);
        const sender = sendClient.getSender();
        const data = [
            { step: 1, title: "Shop" },
            { step: 2, title: "Unpack" },
            { step: 3, title: "Prepare" },
            { step: 4, title: "Cook" },
            { step: 5, title: "Eat" }
        ];
        const promises = new Array();
        for (let index = 0; index < data.length; index++) {
            const message = {
                body: data[index],
                label: "RecipeStep",
                contentType: "application/json"
            };
            // the way we shuffle the message order is to introduce a tiny random delay before each of the messages is sent
            promises.push(service_bus_1.delay(Math.random() * 30).then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield sender.send(message);
                    console.log("Sent message step:", data[index].step);
                }
                catch (err) {
                    console.log("Error while sending message", err);
                }
            })));
        }
        // wait until all the send tasks are complete
        yield Promise.all(promises);
        yield nsSend.close();
    });
}
function receiveMessage() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const nsRcv = service_bus_1.Namespace.createFromConnectionString(connectionString);
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const receiveClient = nsRcv.createQueueClient(queueName);
        const deferredSteps = new Map();
        let lastProcessedRecipeStep = 0;
        try {
            const onMessage = (brokeredMessage) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (brokeredMessage.label === "RecipeStep" &&
                    brokeredMessage.contentType === "application/json") {
                    const message = brokeredMessage.body;
                    // now let's check whether the step we received is the step we expect at this stage of the workflow
                    if (message.step === lastProcessedRecipeStep + 1) {
                        console.log("Process received message:", message);
                        lastProcessedRecipeStep++;
                        yield brokeredMessage.complete();
                    }
                    else {
                        // if this is not the step we expected, we defer the message, meaning that we leave it in the queue but take it out of
                        // the delivery order. We put it aside. To retrieve it later, we remeber its sequence number
                        const sequenceNumber = brokeredMessage.sequenceNumber;
                        deferredSteps.set(message.step, sequenceNumber);
                        console.log("Defer received message:", message);
                        yield brokeredMessage.defer();
                    }
                }
                else {
                    // we dead-letter the message if we don't know what to do with it.
                    console.log("Unknown message received, moving it to dead-letter queue ", brokeredMessage.body);
                    yield brokeredMessage.deadLetter();
                }
            });
            const onError = (err) => {
                console.log(">>>>> Error occurred: ", err);
            };
            let receiver = receiveClient.getReceiver();
            receiver.receive(onMessage, onError, { autoComplete: false }); // Disabling autoComplete so we can control when message can be completed, deferred or deadlettered
            yield service_bus_1.delay(10000);
            yield receiver.close();
            console.log("Total number of deferred messages:", deferredSteps.size);
            receiver = receiveClient.getReceiver();
            // Now we process the deferred messages
            while (deferredSteps.size > 0) {
                const step = lastProcessedRecipeStep + 1;
                const sequenceNumber = deferredSteps.get(step);
                const message = yield receiver.receiveDeferredMessage(sequenceNumber);
                if (message) {
                    console.log("Process deferred message:", message.body);
                    yield message.complete();
                }
                else {
                    console.log("No message found for step number ", step);
                }
                deferredSteps.delete(step);
                lastProcessedRecipeStep++;
            }
        }
        finally {
            yield nsRcv.close();
        }
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=deferral.js.map