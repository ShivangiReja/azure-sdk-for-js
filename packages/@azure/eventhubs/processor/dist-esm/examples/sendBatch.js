"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const event_hubs_1 = require("@azure/event-hubs");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = event_hubs_1.EventHubClient.createFromConnectionString(str, path);
        console.log("Created EH client from connection string");
        console.log("Created Sender for partition 0.");
        const partitionIds = yield client.getPartitionIds();
        const messageCount = 300;
        const data = [];
        for (let i = 1; i <= messageCount; i++) {
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
        const sendPromises = [];
        for (const id of partitionIds) {
            sendPromises.push(client.sendBatch(data, id));
        }
        // Will concurrently send batched messages to all the partitions.
        yield Promise.all(sendPromises);
        // Giving some more time, just in case.
        yield event_hubs_1.delay(5000);
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=sendBatch.js.map