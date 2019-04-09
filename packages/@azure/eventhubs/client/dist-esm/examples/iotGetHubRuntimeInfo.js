"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../lib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = "IOTHUB_CONNECTION_STRING";
const str = process.env[connectionString] || "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = yield lib_1.EventHubClient.createFromIotHubConnectionString(str);
        const info = yield client.getHubRuntimeInformation();
        console.log("RuntimeInfo: ", info);
        const pInfo = yield client.getPartitionInformation(info.partitionIds[0]);
        console.log("Partition Information: ", pInfo);
        yield client.close();
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=iotGetHubRuntimeInfo.js.map