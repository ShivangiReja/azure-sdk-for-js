// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import debugModule from "debug";
const debug = debugModule("azure:event-hubs:hubruntime-spec");
import dotenv from "dotenv";
dotenv.config();
import { EventHubClient } from "../lib";
describe("RuntimeInformation", function () {
    let client;
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    before("validate environment", function () {
        should.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
        should.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
    });
    afterEach('close the connection', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield client.close();
        });
    });
    function arrayOfIncreasingNumbersFromZero(length) {
        return Array.apply(undefined, new Array(length)).map((x, i) => { return `${i}`; });
    }
    it("gets the hub runtime information", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path, { userAgent: "/js-event-processor-host=0.2.0" });
            const hubRuntimeInfo = yield client.getHubRuntimeInformation();
            debug(hubRuntimeInfo);
            hubRuntimeInfo.path.should.equal(service.path);
            hubRuntimeInfo.type.should.equal("com.microsoft:eventhub");
            hubRuntimeInfo.partitionIds.should.have.members(arrayOfIncreasingNumbersFromZero(hubRuntimeInfo.partitionIds.length));
            hubRuntimeInfo.partitionCount.should.equal(hubRuntimeInfo.partitionIds.length);
            hubRuntimeInfo.createdAt.should.be.instanceof(Date);
        });
    });
    it("gets the partition runtime information with partitionId as a string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            const partitionRuntimeInfo = yield client.getPartitionInformation("0");
            debug(partitionRuntimeInfo);
            partitionRuntimeInfo.partitionId.should.equal("0");
            partitionRuntimeInfo.type.should.equal("com.microsoft:partition");
            partitionRuntimeInfo.hubPath.should.equal(service.path);
            partitionRuntimeInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
            should.exist(partitionRuntimeInfo.lastSequenceNumber);
            should.exist(partitionRuntimeInfo.lastEnqueuedOffset);
        });
    });
    it("gets the partition runtime information with partitionId as a number", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            const partitionRuntimeInfo = yield client.getPartitionInformation(0);
            debug(partitionRuntimeInfo);
            partitionRuntimeInfo.partitionId.should.equal("0");
            partitionRuntimeInfo.type.should.equal("com.microsoft:partition");
            partitionRuntimeInfo.hubPath.should.equal(service.path);
            partitionRuntimeInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
            should.exist(partitionRuntimeInfo.lastSequenceNumber);
            should.exist(partitionRuntimeInfo.lastEnqueuedOffset);
        });
    });
    it("should fail the partition runtime information when partitionId is not a number or string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation(true);
            }
            catch (err) {
                err.message.should.equal("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
            }
        });
    });
    it("should fail the partition runtime information when partitionId is empty string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation("");
            }
            catch (err) {
                err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
            }
        });
    });
    it("should fail the partition runtime information when partitionId is a negative number", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation(-1);
            }
            catch (err) {
                err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
            }
        });
    });
}).timeout(60000);
//# sourceMappingURL=hubruntime.spec.js.map