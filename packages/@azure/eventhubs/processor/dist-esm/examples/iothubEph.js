"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../lib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const storageCS = process.env.STORAGE_CONNECTION_STRING;
const iotCS = process.env.IOTHUB_CONNECTION_STRING;
// creates a unique storageContainer name for every run
// if you wish to keep the name same between different runs then use the following then that is fine as well.
const storageContainerName = lib_1.EventProcessorHost.createHostName("iothub-container");
const ephName = "my-iothub-eph";
/**
 * The main function that executes the sample.
 */
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // 1. Start eph.
        const eph = yield startEph(ephName);
        // 2. Sleeeping for 90 seconds. This will give time for eph to receive messages.
        yield sleep(90);
        // 3. After 90 seconds stop eph. This sample illustrates, how to start and stop the EPH.
        // You can decide to stop the EPH, based on your business requirements.
        yield stopEph(eph);
    });
}
// calling the main().
main().catch((err) => {
    console.log("Exiting from main() due to an error: %O.", err);
});
/**
 * Sleeps for the given number of seconds.
 * @param timeInSeconds Time to sleep in seconds.
 */
function sleep(timeInSeconds) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(">>>>>> Sleeping for %d seconds..", timeInSeconds);
        yield lib_1.delay(timeInSeconds * 1000);
    });
}
/**
 * Creates an EPH with the given name and starts the EPH.
 * @param ephName The name of the EPH.
 * @returns {Promise<EventProcessorHost>} Promise<EventProcessorHost>
 */
function startEph(ephName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Create the Event Processo Host from an IotHub ConnectionString
        const eph = yield lib_1.EventProcessorHost.createFromIotHubConnectionString(ephName, storageCS, storageContainerName, iotCS, {
            onEphError: (error) => {
                console.log(">>>>>>> [%s] Error: %O", ephName, error);
            }
        });
        // Message handler
        const partionCount = {};
        const onMessage = (context, data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            (!partionCount[context.partitionId])
                ? partionCount[context.partitionId] = 1
                : partionCount[context.partitionId]++;
            console.log("##### [%s] %d - Rx message from partition: '%s', offset: '%s'", ephName, partionCount[context.partitionId], context.partitionId, data.offset);
            // Checkpointing every 100th event
            if (partionCount[context.partitionId] % 100 === 0) {
                try {
                    console.log("***** [%s] Number of partitions: %O", ephName, eph.receivingFromPartitions.length);
                    console.log("***** [%s] EPH is currently receiving messages from partitions: %s", ephName, eph.receivingFromPartitions.toString());
                    yield context.checkpoint();
                    console.log("$$$$ [%s] Successfully checkpointed message number %d", ephName, partionCount[context.partitionId]);
                }
                catch (err) {
                    console.log(">>>>>>> [%s] An error occurred while checkpointing msg number %d: %O", ephName, partionCount[context.partitionId], err);
                }
            }
        });
        // Error handler
        const onError = (error) => {
            console.log(">>>>> [%s] Received Error: %O", ephName, error);
        };
        console.log(">>>>>> Starting the EPH - %s", ephName);
        yield eph.start(onMessage, onError);
        return eph;
    });
}
/**
 * Stops the given EventProcessorHost.
 * @param eph The event processor host.
 * @returns {Promise<void>} Promise<void>
 */
function stopEph(eph) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(">>>>>> Stopping the EPH - '%s'.", eph.hostName);
        yield eph.stop();
        console.log(">>>>>> Successfully stopped the EPH - '%s'.", eph.hostName);
    });
}
//# sourceMappingURL=iothubEph.js.map