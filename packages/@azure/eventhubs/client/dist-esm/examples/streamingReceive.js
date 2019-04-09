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
        const onMessage = (eventData) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log("### Actual message:", eventData.body);
        });
        const onError = (err) => {
            console.log(">>>>> Error occurred: ", err);
        };
        const options = {
            // Receive messages starting from the last 1 hour.
            eventPosition: lib_1.EventPosition.fromEnqueuedTime(Date.now() - (60 * 60 * 1000)),
            enableReceiverRuntimeMetric: true
        };
        const rcvHandler = client.receive(partitionIds[0], onMessage, onError, options);
        console.log("rcvHandler: ", rcvHandler.name);
        yield lib_1.delay(10000);
        yield rcvHandler.stop();
        console.log("Closed the receiver after receiving messages for 10 seconds.");
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=streamingReceive.js.map