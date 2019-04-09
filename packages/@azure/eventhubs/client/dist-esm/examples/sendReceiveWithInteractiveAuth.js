"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../lib");
const ms_rest_nodeauth_1 = require("@azure/ms-rest-nodeauth");
const dotenv = tslib_1.__importStar(require("dotenv"));
dotenv.config();
const endpoint = "ENDPOINT";
const entityPath = "EVENTHUB_NAME";
const address = process.env[endpoint] || "";
const path = process.env[entityPath] || "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // For now the interactive user needs to explicitly be assigned
        // the role of a constributor/owner even if the user is a subscription owner.
        // azure role assignment create -o contributor --scope /subscriptions/<subscriptionId>/resourceGroups/<rgName>/providers/Microsoft.EventHub/namespaces/<ehNamespaceName> --signInName <user@example.com>
        const credentials = yield ms_rest_nodeauth_1.interactiveLogin({ tokenAudience: lib_1.aadEventHubsAudience });
        const client = lib_1.EventHubClient.createFromAadTokenCredentials(address, path, credentials);
        const partitionIds = yield client.getPartitionIds();
        yield client.send({ body: "Hello awesome world!!" }, partitionIds[0]);
        const result = yield client.receiveBatch(partitionIds[0], 2, 5, { eventPosition: lib_1.EventPosition.fromEnqueuedTime(Date.now()) });
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
//# sourceMappingURL=sendReceiveWithInteractiveAuth.js.map