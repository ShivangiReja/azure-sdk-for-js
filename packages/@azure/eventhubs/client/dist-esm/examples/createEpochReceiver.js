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
        const onMessage = (eventData) => {
            console.log("@@@@ receiver with epoch 2.\n ### Actual message:", eventData.body);
        };
        const onError = (err) => {
            console.log(">>>>> Error occurred for receiver with epoch 2: ", err);
        };
        const rcvHandler1 = client.receive(partitionIds[0], onMessage, onError, { epoch: 2 });
        yield lib_1.delay(10000);
        yield rcvHandler1.stop();
        console.log("\n $$$$ Waiting for 10 seconds to let receiver 1 set up and start receiving messages...");
        const onMessage2 = (eventData) => {
            console.log("@@@@ receiver with epoch 1. \n ### Actual message:", eventData.body);
        };
        const onError2 = (err) => {
            console.log(">>>>> Error occurred for receiver with epoch 1: ", err);
        };
        console.log("$$$$ Will start receiving messages from receiver with epoch value 1...");
        const rcvHandler2 = client.receive(partitionIds[0], onMessage2, onError2, { epoch: 1 });
        yield lib_1.delay(10000);
        yield rcvHandler2.stop();
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=createEpochReceiver.js.map