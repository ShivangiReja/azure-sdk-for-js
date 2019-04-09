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
        const data = {
            body: "Hello World!!"
        };
        // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub
        // where the body is a JSON object/array.
        // const data = { body: { "message": "Hello World" } };
        const partitionIds = yield client.getPartitionIds();
        yield client.send(data, partitionIds[0]);
        console.log(">>> Sent the message successfully: ", data.body.toString());
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=simpleSender.js.map