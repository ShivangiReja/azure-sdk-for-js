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
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = lib_1.EventHubClient.createFromConnectionString(str, path);
        const partitionIds = yield client.getPartitionIds();
        console.log("Created EH client from connection string");
        console.log("Created Sender for partition 0.");
        let count = 0;
        const onMessage = (eventData) => {
            console.log("### Actual message:", eventData.body);
            count++;
            if (count >= 5) {
                client.close().catch((err) => {
                    console.log(">>>>> Error closing the client: ", err);
                });
            }
        };
        const onError = (err) => {
            console.log(">>>>> Error occurred: ", err);
        };
        client.receive(partitionIds[0], onMessage, onError, { eventPosition: lib_1.EventPosition.fromEnqueuedTime(Date.now()) });
        console.log("Created Receiver for partition 0 and CG $default.");
        const messageCount = 5;
        const data = [];
        for (let i = 0; i < messageCount; i++) {
            const obj = { body: `Hello foo ${i}` };
            data.push(obj);
        }
        console.log("Sending batch message...");
        // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub
        // where the body is a JSON object/array.
        // const datas = [
        //   { body: { "message": "Hello World 1" }, applicationProperties: { id: "Some id" }, partitionKey: "pk786" },
        //   { body: { "message": "Hello World 2" } },
        //   { body: { "message": "Hello World 3" } }
        // ];
        yield client.sendBatch(data, partitionIds[0]);
        console.log("message sent");
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=batchSendReceive.js.map