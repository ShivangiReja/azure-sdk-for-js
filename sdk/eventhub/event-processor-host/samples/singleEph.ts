/*
  This sample demonstrates how the start() function can be used to Start the event processor host
  and provide messages received across all the partitions. It also describes how the
  checkpointFromEventData() function can be used to checkpoint metadata about the received
  messages at regular interval in an Azure Storage Blob.

  If your Event Hubs instance doesn't have any messages, then please run "sendBatch.ts" sample
  to populate Event Hubs before running this sample.

  See https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-event-processor-host
  to learn about Event Processor Host.
*/

import {
  EventProcessorHost,
  OnReceivedError,
  OnReceivedMessage,
  EventData,
  PartitionContext,
  delay
} from "@azure/event-processor-host";

// Define storage connection string and Event Hubs connection string and related entity name here
const ehConnectionString = "";
const eventHubsName = "";
const storageConnectionString = "";

// creates a unique storageContainer name for every run
// if you wish to keep the name same between different runs then use the following then that is fine as well.
const storageContainerName = EventProcessorHost.createHostName("test-container");
const ephName = "my-eph";

/**
 * The main function that executes the sample.
 */
async function main(): Promise<void> {
  // Please feel free to use the `./sendBatch.ts` sample to send messages to an EventHub.
  // Post that you can run this sample to start the EPH and see it in action.
  // 1. Start eph.
  const eph = await startEph(ephName);
  // 2. Sleeeping for 90 seconds. This will give time for eph to receive messages.
  await delay(90000);
  // 3. After 90 seconds stop eph.
  await stopEph(eph);
}

// calling the main().
main().catch(err => {
  console.log("Error occurred: ", err);
});

/**
 * Creates an EPH with the given name and starts the EPH.
 * @param ephName The name of the EPH.
 * @returns {Promise<EventProcessorHost>} Promise<EventProcessorHost>
 */
async function startEph(ephName: string): Promise<EventProcessorHost> {
  // Create the Event Processo Host
  const eph = EventProcessorHost.createFromConnectionString(
    EventProcessorHost.createHostName(ephName),
    storageConnectionString!,
    storageContainerName,
    ehConnectionString!,
    {
      eventHubPath: eventHubsName,
      onEphError: error => {
        console.log("[%s] Error: %O", ephName, error);
      }
    }
  );
  // Message handler
  const partionCount: { [x: string]: number } = {};
  const onMessage: OnReceivedMessage = async (context: PartitionContext, data: EventData) => {
    !partionCount[context.partitionId] ? (partionCount[context.partitionId] = 1) : partionCount[context.partitionId]++;
    console.log(
      "[%s] %d - Received message from partition: '%s', offset: '%s'",
      ephName,
      partionCount[context.partitionId],
      context.partitionId,
      data.offset
    );
    // Checkpointing every 100th event received for a given partition.
    if (partionCount[context.partitionId] % 100 === 0) {
      try {
        console.log(
          "[%s] EPH is currently receiving messages from partitions: %O",
          ephName,
          eph.receivingFromPartitions
        );
        await context.checkpointFromEventData(data);
        console.log("[%s] Successfully checkpointed message number %d", ephName, partionCount[context.partitionId]);
      } catch (err) {
        console.log(
          "[%s] An error occurred while checkpointing msg number %d: %O",
          ephName,
          partionCount[context.partitionId],
          err
        );
      }
    }
  };
  // Error handler
  const onError: OnReceivedError = error => {
    console.log("[%s] Received Error: %O", ephName, error);
  };
  console.log("Starting the EPH - %s", ephName);
  await eph.start(onMessage, onError);
  return eph;
}

/**
 * Stops the given EventProcessorHost.
 * @param eph The event processor host.
 * @returns {Promise<void>} Promise<void>
 */
async function stopEph(eph: EventProcessorHost): Promise<void> {
  console.log("Stopping the EPH - '%s'.", eph.hostName);
  await eph.stop();
  console.log("Successfully stopped the EPH - '%s'.", eph.hostName);
}
