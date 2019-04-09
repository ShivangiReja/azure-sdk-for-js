"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../lib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
// set the values from environment variables.
const storageConnectionString = "STORAGE_CONNECTION_STRING";
const ehconnectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const path = process.env[entityPath] || "";
const storageCS = process.env[storageConnectionString];
const ehCS = process.env[ehconnectionString];
// set the names of eph and the storage container.
// creates a unique storageContainer name for every run
// if you wish to keep the name same between different runs then use the following then that is fine as well.
const storageContainerName = lib_1.EventProcessorHost.createHostName("test-container");
console.log(">>>> The storage container name is: %s.", storageContainerName);
const ephName1 = "eph-1";
const ephName2 = "eph-2";
/**
 * The main function that executes the sample.
 */
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // 1. Start eph-1.
        const eph1 = yield startEph(ephName1);
        yield sleep(20);
        // 2. After 20 seconds start eph-2.
        const eph2 = yield startEph(ephName2);
        yield sleep(90);
        // 3. Now, load will be evenly balanced between eph-1 and eph-2. After 90 seconds stop eph-1.
        yield stopEph(eph1);
        yield sleep(40);
        // 4. Now, eph-1 will regain access to all the partitions and will close after 40 seconds.
        yield stopEph(eph2);
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
        // Create the Event Processor Host
        const eph = lib_1.EventProcessorHost.createFromConnectionString(ephName, storageCS, storageContainerName, ehCS, {
            eventHubPath: path,
            // This method will provide errors that occur during lease and partition management. The
            // errors that occur while receiving messages will be provided in the onError handler
            // provided in the eph.start() method.
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
                    console.log("***** [%s] EPH is currently receiving messages from partitions: %O", ephName, eph.receivingFromPartitions);
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
//# sourceMappingURL=multiEph.js.map