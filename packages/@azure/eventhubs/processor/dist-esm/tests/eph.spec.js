// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
import uuid from "uuid/v4";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import debugModule from "debug";
const should = chai.should();
const debug = debugModule("azure:eph:eph-spec");
import { EventHubClient, EventPosition, delay } from "@azure/event-hubs";
import dotenv from "dotenv";
import { EventProcessorHost } from "../lib";
dotenv.config();
describe("EPH", function () {
    before("validate environment", function () {
        should.exist(process.env.STORAGE_CONNECTION_STRING, "define STORAGE_CONNECTION_STRING in your environment before running integration tests.");
        should.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
        should.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
    });
    const ehConnString = process.env.EVENTHUB_CONNECTION_STRING;
    const storageConnString = process.env.STORAGE_CONNECTION_STRING;
    const hubName = process.env.EVENTHUB_NAME;
    let host;
    describe("user-agent", function () {
        it("should be populated correctly as a part of the connection property", function (done) {
            host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, "test-container", ehConnString, {
                eventHubPath: hubName
            });
            const context = host["_context"];
            const ua = "/js-event-processor-host=1.0.5";
            context.userAgent.should.equal(ua);
            const ehc = context.getEventHubClient();
            const properties = ehc["_context"].connection.options.properties;
            should.equal(properties["user-agent"], `/js-event-hubs,${ua}`);
            should.equal(properties.product, "MSJSClient");
            done();
        });
        it("should support appending custom user-agent", function (done) {
            const customua = "my-custom-string";
            host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, "test-container", ehConnString, {
                eventHubPath: hubName,
                userAgent: customua
            });
            const context = host["_context"];
            const ua = "/js-event-processor-host=1.0.5";
            context.userAgent.should.equal(`${ua},${customua}`);
            const ehc = context.getEventHubClient();
            const properties = ehc["_context"].connection.options.properties;
            should.equal(properties["user-agent"], `/js-event-hubs,${ua},${customua}`);
            should.equal(properties.product, "MSJSClient");
            done();
        });
    });
    describe("single", function () {
        it("should checkpoint messages in order", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const messageCount = 100;
                const datas = [];
                for (let i = 0; i < messageCount; i++) {
                    const obj = { body: `Hello foo ${i}` };
                    datas.push(obj);
                }
                const ehc = EventHubClient.createFromConnectionString(ehConnString, hubName);
                yield ehc.sendBatch(datas, "0");
                yield ehc.close();
                debug("Sent batch message successfully");
                let num = 0;
                let offset = "0";
                let sequence = 0;
                let doneCheckpointing = false;
                const onMessage = (context, data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    ++num;
                    debug("num: %d", num);
                    if (num % 10 === 0) {
                        const cpointNum = num;
                        try {
                            yield context.checkpoint();
                            debug("Done checkpointing: %d", cpointNum);
                            if (num === 100) {
                                offset = data.offset;
                                sequence = data.sequenceNumber;
                                doneCheckpointing = true;
                            }
                        }
                        catch (err) {
                            debug(">>>>>>> An error occurred while checkpointing msg number %d: %O", num, err);
                        }
                    }
                });
                const onError = (err) => {
                    debug("An error occurred while receiving the message: %O", err);
                    throw err;
                };
                yield host.start(onMessage, onError);
                while (!doneCheckpointing) {
                    debug("Not done checkpointing -> %s, sleeping for 10 more seconds.", doneCheckpointing);
                    yield delay(10000);
                }
                debug("sleeping for 10 more seconds..");
                yield delay(10000);
                const stringContent = yield host["_context"].blobReferenceByPartition["0"].getContent();
                const content = JSON.parse(stringContent);
                debug("Fetched content from blob is: %o", content);
                content.offset.should.equal(offset);
                content.sequenceNumber.should.equal(sequence);
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should checkpoint a single received event.", function (done) {
            const msgId = uuid();
            const ehc = EventHubClient.createFromConnectionString(ehConnString, hubName);
            ehc.getPartitionIds().then((ids) => {
                debug(">>> Received partition ids: ", ids);
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                debug(">>>>> Sending the test message...");
                ehc.send({ body: "Test Message", properties: { message_id: msgId } }).then(() => {
                    const onMessage = (context, data) => {
                        debug(">>>>> Rx message from '%s': '%s'", context.partitionId, data);
                        if (data.properties.message_id === msgId) {
                            debug(">>>> Checkpointing the received message...");
                            context.checkpoint().then(() => {
                                debug(">>>> Checkpoint succesful...");
                                return context["_context"].blobReferenceByPartition[context.partitionId].getContent();
                            }).then((content) => {
                                debug(">>>> Seen expected message. New lease contents: %s", content);
                                const parsed = JSON.parse(content);
                                parsed.offset.should.eql(data.offset);
                            }).then(() => {
                                return ehc.close();
                            }).then(() => {
                                return host.stop();
                            }).then(() => {
                                debug(">>>> closed the sender and the eph...");
                                return done();
                            }).catch((err) => {
                                done(err);
                            });
                        }
                    };
                    const onError = (err) => {
                        debug("An error occurred while receiving the message: %O", err);
                        done(err);
                    };
                    return host.start(onMessage, onError);
                }).catch((err) => {
                    done(err);
                });
            }).catch((err) => {
                done(err);
            });
        });
        it("should be able to receive messages from the checkpointed offset.", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const msgId = uuid();
                const ehc = EventHubClient.createFromConnectionString(ehConnString, hubName);
                const leasecontainerName = EventProcessorHost.createHostName("tc");
                debug(">>>>> Lease container name: %s", leasecontainerName);
                function sendAcrossAllPartitions(ehc, ids) {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const result = [];
                        const idMessage = {};
                        for (const id of ids) {
                            const data = { body: "Test Message - " + id, properties: { message_id: msgId } };
                            idMessage[id] = data;
                            result.push(ehc.send(data, id));
                        }
                        yield Promise.all(result);
                        debug(">>>> Successfully finished sending messages.. %O", idMessage);
                        return idMessage;
                    });
                }
                const ids = yield ehc.getPartitionIds();
                debug(">>> Received partition ids: ", ids);
                host = EventProcessorHost.createFromConnectionString("my-eph-1", storageConnString, leasecontainerName, ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now()),
                    startupScanDelay: 15,
                    leaseRenewInterval: 5,
                    leaseDuration: 15
                });
                yield delay(1000);
                debug(">>>>> Sending the first set of test messages...");
                const firstSend = yield sendAcrossAllPartitions(ehc, ids);
                let count = 0;
                const onMessage = (context, data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const partitionId = context.partitionId;
                    debug(">>>>> Rx message from '%s': '%o'", partitionId, data);
                    if (data.properties.message_id === firstSend[partitionId].properties.message_id) {
                        debug(">>>> Checkpointing the received message...");
                        yield context.checkpoint();
                        count++;
                    }
                    else {
                        const msg = `Sent message id '${data.properties.message_id}' did not match the ` +
                            `received message id '${firstSend[partitionId].properties.message_id}' for ` +
                            `partitionId '${partitionId}'.`;
                        throw new Error(msg);
                    }
                });
                const onError = (err) => {
                    debug("An error occurred while receiving the message: %O", err);
                    throw err;
                };
                debug(">>>> Starting my-eph-1");
                yield host.start(onMessage, onError);
                while (count < ids.length) {
                    yield delay(10000);
                    debug(">>>> number of partitionIds: %d, count: %d", ids.length, count);
                }
                yield host.stop();
                debug(">>>> Restarting the same host. This time the initial offset should be ignored, and " +
                    "the EventPosition should be from the checkpointed offset..");
                debug(">>>>> Sending the second set of test messages...");
                const secondSend = yield sendAcrossAllPartitions(ehc, ids);
                let count2 = 0;
                const onMessage2 = (context, data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const partitionId = context.partitionId;
                    debug(">>>>> Rx message from '%s': '%s'", partitionId, data);
                    if (data.properties.message_id === secondSend[partitionId].properties.message_id) {
                        debug(">>>> Checkpointing the received message...");
                        yield context.checkpoint();
                        count2++;
                    }
                    else {
                        const msg = `Sent message id '${data.properties.message_id}' did not match the ` +
                            `received message id '${secondSend[partitionId].properties.message_id}' for ` +
                            `partitionId '${partitionId}'.`;
                        throw new Error(msg);
                    }
                });
                const onError2 = (err) => {
                    debug("An error occurred while receiving the message: %O", err);
                    throw err;
                };
                debug(">>>> Starting my-eph-2");
                yield host.start(onMessage2, onError2);
                while (count2 < ids.length) {
                    yield delay(10000);
                    debug(">>>> number of partitionIds: %d, count: %d", ids.length, count);
                }
                debug(">>>>>> sleeping for 10 more seconds....");
                yield delay(10000);
                yield host.stop();
                yield ehc.close();
                if (count2 > ids.length) {
                    throw new Error("We received more messages than we were expecting...");
                }
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
    });
    describe("multiple", function () {
        it("should be able to run multiple eph successfully.", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const ehc = EventHubClient.createFromConnectionString(ehConnString, hubName);
                const containerName = `sharedhost-${uuid()}`;
                const now = Date.now();
                const hostByName = {};
                const sendDataByPartition = {};
                const getReceivingFromPartitionsForAllEph = () => {
                    const receivingPartitionsByHost = {};
                    for (const hostName in hostByName) {
                        receivingPartitionsByHost[hostName] = hostByName[hostName].receivingFromPartitions;
                    }
                    debug(">>> EPH -> Partitions: \n%O", receivingPartitionsByHost);
                    return receivingPartitionsByHost;
                };
                const sendEvents = (ids) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < ids.length; i++) {
                        const data = {
                            body: `Hello World - ${ids[i]}!!`
                        };
                        sendDataByPartition[ids[i]] = data;
                        yield ehc.send(data, ids[i]);
                        debug(">>> Sent data to partition: %s", ids[i]);
                    }
                });
                const ids = yield ehc.getPartitionIds();
                for (let i = 0; i < ids.length; i++) {
                    const hostName = `host-${i}`;
                    hostByName[hostName] = EventProcessorHost.createFromConnectionString(hostName, storageConnString, containerName, ehConnString, {
                        eventHubPath: hubName,
                        initialOffset: EventPosition.fromEnqueuedTime(now),
                    });
                    const onError = (error) => {
                        debug(`>>> [%s] Received error: %O`, hostName, error);
                        throw error;
                    };
                    const onMessage = (context, data) => {
                        debug(">>> [%s] Rx message from '%s': '%O'", hostName, context.partitionId, data);
                        should.equal(sendDataByPartition[context.partitionId].body, data.body);
                    };
                    yield hostByName[hostName].start(onMessage, onError);
                    debug(">>> Sleeping for 8 seconds after starting %s.", hostName);
                    yield delay(8000);
                    debug(">>> [%s] currently receiving messages from partitions : %o", hostName, hostByName[hostName].receivingFromPartitions);
                }
                debug(">>> Sleeping for another 15 seconds.");
                yield delay(15000);
                const hostToPartition = getReceivingFromPartitionsForAllEph();
                for (const host in hostToPartition) {
                    should.equal(Array.isArray(hostToPartition[host]), true);
                    hostToPartition[host].length.should.eql(1);
                }
                yield sendEvents(ids);
                yield delay(5000);
                yield ehc.close();
                for (const host in hostByName) {
                    yield hostByName[host].stop();
                }
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
    });
    describe("runtimeInfo", function () {
        it("should get hub runtime info correctly", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const hubRuntimeInfo = yield host.getHubRuntimeInformation();
                should.equal(Array.isArray(hubRuntimeInfo.partitionIds), true);
                should.equal(typeof hubRuntimeInfo.partitionCount, "number");
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should get partition runtime info correctly with partitionId as string", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const partitionInfo = yield host.getPartitionInformation("0");
                debug(">>> partitionInfo: %o", partitionInfo);
                partitionInfo.partitionId.should.equal("0");
                partitionInfo.type.should.equal("com.microsoft:partition");
                partitionInfo.hubPath.should.equal(hubName);
                partitionInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
                should.exist(partitionInfo.lastSequenceNumber);
                should.exist(partitionInfo.lastEnqueuedOffset);
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should get partition runtime info correctly with partitionId as number", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const partitionInfo = yield host.getPartitionInformation(0);
                partitionInfo.partitionId.should.equal("0");
                partitionInfo.type.should.equal("com.microsoft:partition");
                partitionInfo.hubPath.should.equal(hubName);
                partitionInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
                should.exist(partitionInfo.lastSequenceNumber);
                should.exist(partitionInfo.lastEnqueuedOffset);
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should fail getting partition information when partitionId is not a string or number", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                try {
                    yield host.getPartitionInformation(false);
                }
                catch (err) {
                    err.message.should.equal("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
                }
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should fail getting partition information when partitionId is empty string", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                try {
                    yield host.getPartitionInformation("");
                }
                catch (err) {
                    err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
                }
                finally {
                    yield host.stop();
                }
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("should fail getting partition information when partitionId is a negative number", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehConnString, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                try {
                    yield host.getPartitionInformation(-1);
                }
                catch (err) {
                    err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
                }
                finally {
                    yield host.stop();
                }
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
    });
    describe("options", function () {
        it("should throw an error if the event hub name is neither provided in the connection string and nor in the options object", function (done) {
            try {
                const ehc = "Endpoint=sb://foo.bar.baz.net/;SharedAccessKeyName=somekey;SharedAccessKey=somesecret";
                EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), ehc, {
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
            }
            catch (err) {
                should.exist(err);
                err.message.match(/.*Either provide "path" or the "connectionString": "Endpoint=sb:\/\/foo\.bar\.baz\.net\/;SharedAccessKeyName=somekey;SharedAccessKey=somesecret", must contain EntityPath="<path-to-the-entity>.*"/ig);
                done();
            }
        });
        it("should get hub runtime info correctly when eventhub name is present in connection string but not as an option in the options object.", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), `${ehConnString};EntityPath=${hubName}`, {
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const hubRuntimeInfo = yield host.getHubRuntimeInformation();
                hubRuntimeInfo.path.should.equal(hubName);
                should.equal(Array.isArray(hubRuntimeInfo.partitionIds), true);
                should.equal(typeof hubRuntimeInfo.partitionCount, "number");
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
        it("when eventhub name is present in connection string and in the options object, the one in options object is selected.", function (done) {
            const test = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                host = EventProcessorHost.createFromConnectionString(EventProcessorHost.createHostName(), storageConnString, EventProcessorHost.createHostName("single"), `${ehConnString};EntityPath=foo`, {
                    eventHubPath: hubName,
                    initialOffset: EventPosition.fromEnqueuedTime(Date.now())
                });
                const hubRuntimeInfo = yield host.getHubRuntimeInformation();
                hubRuntimeInfo.path.should.equal(hubName);
                should.equal(Array.isArray(hubRuntimeInfo.partitionIds), true);
                should.equal(typeof hubRuntimeInfo.partitionCount, "number");
                yield host.stop();
            });
            test().then(() => { done(); }).catch((err) => { done(err); });
        });
    });
}).timeout(1200000);
//# sourceMappingURL=eph.spec.js.map