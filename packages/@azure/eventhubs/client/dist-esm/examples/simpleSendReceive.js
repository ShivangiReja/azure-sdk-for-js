"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../lib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
let client;
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        client = lib_1.EventHubClient.createFromConnectionString(str, path);
        const ids = yield client.getPartitionIds();
        for (let i = 0; i < 1; i++) {
            const onMessage = (eventData) => {
                console.log("### Actual message:", eventData.body);
            };
            const onError = (err) => {
                console.log(">>>>> Error occurred: ", err);
            };
            const rcvrHandler = client.receive(ids[i], onMessage, onError, {
                enableReceiverRuntimeMetric: true,
                eventPosition: lib_1.EventPosition.fromEnqueuedTime(Date.now())
            });
            // giving some time for receiver setup to complete. This will make sure that the
            // receiver can receive the newly sent message from now onwards.
            yield lib_1.delay(3000);
            console.log("***********Created receiver %d", i);
            // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub
            // where the body is a JSON object/array.
            // const data = { body: { "message": "Hello World" } };
            yield client.send({ body: "Hello awesome world!!" + new Date().toString() }, ids[i]);
            console.log("***********Created sender %d and sent the message...", i);
            // Giving enough time for the receiver to receive the message...
            yield lib_1.delay(6000);
            yield rcvrHandler.stop();
        }
    });
}
main().then(() => {
    return client.close();
}).catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=simpleSendReceive.js.map