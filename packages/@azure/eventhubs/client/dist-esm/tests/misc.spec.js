// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import uuid from "uuid/v4";
import chai from "chai";
import assert from "assert";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import debugModule from "debug";
const debug = debugModule("azure:event-hubs:misc-spec");
import { EventPosition, EventHubClient } from "../lib";
import { BatchingReceiver } from "../lib/batchingReceiver";
import dotenv from "dotenv";
dotenv.config();
describe("Misc tests", function () {
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    const client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
    let breceiver;
    let hubInfo;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
            should.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
            hubInfo = yield client.getHubRuntimeInformation();
        });
    });
    after("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield client.close();
        });
    });
    it("should be able to send and receive a large message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const bodysize = 220 * 1024;
            const partitionId = hubInfo.partitionIds[0];
            const msgString = "A".repeat(220 * 1024);
            const msgBody = Buffer.from(msgString);
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug("Sending one message with %d bytes.", bodysize);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            let data = yield breceiver.receive(5, 10);
            data.length.should.equal(0, "Unexpected to receive message before client sends it");
            yield client.send(obj, partitionId);
            debug("Successfully sent the large message.");
            data = yield breceiver.receive(5, 30);
            debug("Closing the receiver..");
            yield breceiver.close();
            debug("received message: ", data.length);
            should.exist(data);
            data.length.should.equal(1);
            data[0].body.toString().should.equal(msgString);
            should.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive a JSON object as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = {
                id: '123-456-789',
                weight: 10,
                isBlue: true,
                siblings: [
                    {
                        id: '098-789-564',
                        weight: 20,
                        isBlue: false,
                    }
                ]
            };
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug("received message: ", data);
            should.exist(data);
            data.length.should.equal(1);
            debug("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            should.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive an array as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = [
                {
                    id: '098-789-564',
                    weight: 20,
                    isBlue: false,
                },
                10,
                20,
                "some string"
            ];
            const obj = { body: msgBody, properties: { message_id: uuid() } };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug("received message: ", data);
            should.exist(data);
            data.length.should.equal(1);
            debug("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            assert.strictEqual(data[0].properties.message_id, obj.properties.message_id);
        });
    });
    it("should be able to send a boolean as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = true;
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug("received message: ", data);
            should.exist(data);
            data.length.should.equal(1);
            debug("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            should.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive batched messages correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const partitionId = hubInfo.partitionIds[0];
                const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
                debug(`Partition ${partitionId} has last message with offset ${offset}.`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
                let data = yield breceiver.receive(5, 10);
                data.length.should.equal(0, "Unexpected to receive message before client sends it");
                const messageCount = 5;
                const d = [];
                for (let i = 0; i < messageCount; i++) {
                    const obj = { body: `Hello EH ${i}` };
                    d.push(obj);
                }
                d[0].partitionKey = 'pk1234656';
                yield client.sendBatch(d, partitionId);
                debug("Successfully sent 5 messages batched together.");
                data = yield breceiver.receive(5, 30);
                yield breceiver.close();
                debug("received message: ", data);
                should.exist(data);
                data.length.should.equal(5);
                for (const message of data) {
                    should.not.exist((message.properties || {}).message_id);
                }
            }
            catch (err) {
                debug("should not have happened, uber catch....", err);
                throw err;
            }
        });
    });
    it("should be able to send and receive batched messages as JSON objects correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const partitionId = hubInfo.partitionIds[0];
                const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
                debug(`Partition ${partitionId} has last message with offset ${offset}.`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
                let data = yield breceiver.receive(5, 10);
                data.length.should.equal(0, "Unexpected to receive message before client sends it");
                const messageCount = 5;
                const d = [];
                for (let i = 0; i < messageCount; i++) {
                    const obj = {
                        body: {
                            id: '123-456-789',
                            count: i,
                            weight: 10,
                            isBlue: true,
                            siblings: [
                                {
                                    id: '098-789-564',
                                    weight: 20,
                                    isBlue: false,
                                }
                            ]
                        },
                        properties: {
                            message_id: uuid()
                        }
                    };
                    d.push(obj);
                }
                d[0].partitionKey = 'pk1234656';
                yield client.sendBatch(d, partitionId);
                debug("Successfully sent 5 messages batched together.");
                data = yield breceiver.receive(5, 30);
                yield breceiver.close();
                debug("received message: ", data);
                should.exist(data);
                data[0].body.count.should.equal(0);
                data.length.should.equal(5);
                for (const [index, message] of data.entries()) {
                    assert.strictEqual(message.properties.message_id, d[index].properties.message_id);
                }
            }
            catch (err) {
                debug("should not have happened, uber catch....", err);
                throw err;
            }
        });
    });
    it("should consistently send messages with partitionkey to a partitionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const msgToSendCount = 50;
            const partitionOffsets = {};
            debug("Discovering end of stream on each partition.");
            const partitionIds = hubInfo.partitionIds;
            for (const id of partitionIds) {
                const pInfo = yield client.getPartitionInformation(id);
                partitionOffsets[id] = pInfo.lastEnqueuedOffset;
                debug(`Partition ${id} has last message with offset ${pInfo.lastEnqueuedOffset}.`);
            }
            debug("Sending %d messages.", msgToSendCount);
            function getRandomInt(max) {
                return Math.floor(Math.random() * Math.floor(max));
            }
            for (let i = 0; i < msgToSendCount; i++) {
                const partitionKey = getRandomInt(10);
                yield client.send({ body: "Hello EventHub " + i, partitionKey: partitionKey.toString() });
            }
            debug("Starting to receive all messages from each partition.");
            const partitionMap = {};
            let totalReceived = 0;
            for (const id of partitionIds) {
                const data = yield client.receiveBatch(id, 50, 10, { eventPosition: EventPosition.fromOffset(partitionOffsets[id]) });
                debug(`Received ${data.length} messages from partition ${id}.`);
                for (const d of data) {
                    debug(">>>> _raw_amqp_mesage: ", d._raw_amqp_mesage);
                    const pk = d.partitionKey;
                    debug("pk: ", pk);
                    if (partitionMap[pk] && partitionMap[pk] !== id) {
                        debug(`#### Error: Received a message from partition ${id} with partition key ${pk}, whereas the same key was observed on partition ${partitionMap[pk]} before.`);
                        assert(partitionMap[pk] === id);
                    }
                    partitionMap[pk] = id;
                    debug("partitionMap ", partitionMap);
                }
                totalReceived += data.length;
            }
            totalReceived.should.equal(msgToSendCount);
        });
    });
}).timeout(60000);
//# sourceMappingURL=misc.spec.js.map