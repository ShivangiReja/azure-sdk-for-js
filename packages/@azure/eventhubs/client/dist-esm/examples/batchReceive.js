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
        const result = yield client.receiveBatch(partitionIds[0], 10, 20, { eventPosition: lib_1.EventPosition.fromStart() });
        let i = 0;
        for (const data of result) {
            console.log("### Actual message (%d):", ++i, data.body);
        }
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=batchReceive.js.map