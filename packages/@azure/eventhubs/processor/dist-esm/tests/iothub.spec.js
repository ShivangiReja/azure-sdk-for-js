// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import dotenv from "dotenv";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import debugModule from "debug";
const debug = debugModule("azure:eph:iothub-spec");
import { EventPosition, EventProcessorHost } from "../lib";
import { delay } from "@azure/event-hubs";
dotenv.config();
describe("EPH with iothub connection string", function () {
    const iothubConnString = process.env.IOTHUB_CONNECTION_STRING;
    const storageConnString = process.env.STORAGE_CONNECTION_STRING;
    const hostName = EventProcessorHost.createHostName();
    let host;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should.exist(process.env.IOTHUB_CONNECTION_STRING, "define IOTHUB_CONNECTION_STRING in your environment before running integration tests.");
        });
    });
    it("should be able to receive messages from the event hub associated with an iothub.", function (done) {
        const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                host = yield EventProcessorHost.createFromIotHubConnectionString(hostName, storageConnString, EventProcessorHost.createHostName("iot"), iothubConnString, {
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now()),
                    leaseDuration: 20,
                    leaseRenewInterval: 10
                });
                const onMessage = (context, data) => {
                    debug(">>> [%s] Rx message from '%s': '%O'", hostName, context.partitionId, data);
                };
                const onError = (err) => {
                    debug("An error occurred while receiving the message: %O", err);
                    throw err;
                };
                const runtimeInfo = yield host.getHubRuntimeInformation();
                debug(">>>> runtimeInfo: %O", runtimeInfo);
                // tslint:disable-next-line: no-unused-expression
                runtimeInfo.createdAt.should.exist;
                (typeof runtimeInfo.partitionCount).should.equal("number");
                yield host.start(onMessage, onError);
                yield delay(15000);
                yield host.stop();
            }
            catch (err) {
                throw err;
            }
        });
        test().then(() => { done(); }).catch((err) => { done(err); });
    });
}).timeout(60000);
//# sourceMappingURL=iothub.spec.js.map