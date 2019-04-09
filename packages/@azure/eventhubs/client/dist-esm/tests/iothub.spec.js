// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import dotenv from "dotenv";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import debugModule from "debug";
const debug = debugModule("azure:event-hubs:iothub-spec");
import { EventHubClient } from "../lib";
dotenv.config();
describe("EventHub Client with iothub connection string", function () {
    const service = { connectionString: process.env.IOTHUB_CONNECTION_STRING };
    let client;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should.exist(process.env.IOTHUB_CONNECTION_STRING, "define IOTHUB_CONNECTION_STRING in your environment before running integration tests.");
        });
    });
    afterEach("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (client) {
                debug(">>> After Each, closing the client...");
                yield client.close();
            }
        });
    });
    it("should be able to get hub runtime info", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = yield EventHubClient.createFromIotHubConnectionString(service.connectionString);
            const runtimeInfo = yield client.getHubRuntimeInformation();
            debug(">>> RuntimeInfo: ", runtimeInfo);
            should.exist(runtimeInfo);
            runtimeInfo.type.should.equal("com.microsoft:eventhub");
            runtimeInfo.partitionCount.should.be.greaterThan(0);
            runtimeInfo.partitionIds.length.should.be.greaterThan(0);
        });
    });
    it("should be able to receive messages from the event hub", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = yield EventHubClient.createFromIotHubConnectionString(service.connectionString);
            const datas = yield client.receiveBatch("0", 15, 10);
            debug(">>>> Received events from partition %s, %O", "0", datas);
        });
    });
}).timeout(30000);
//# sourceMappingURL=iothub.spec.js.map