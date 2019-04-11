// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    EventProcessorHost, OnReceivedError, EventData, PartitionContext, delay
  } from "../src";
  import dotenv from "dotenv";
  dotenv.config();
  
  const path = "storageeventhub";
  const storageCS = "DefaultEndpointsProtocol=https;AccountName=shivangirejastorage;AccountKey=BcYIFj9D4jlFs6rnB8ZxruW/siUkw3gFE/55xiEPjQrWmRHpcZc2biACCfLr5WVZGDqj68gwMBNsgOtzIwACaQ==;EndpointSuffix=core.windows.net";
  const ehCS = "Endpoint=sb://shivangieventhubs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mHuzn4laFeLg25QlzhL7Fe0IfJzkEiqsTZZyAS2z12M=";
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
    await sleep(90);
    // 3. After 90 seconds stop eph.
    await stopEph(eph);
  }
  
  // calling the main().
  main().catch((err) => {
    console.log("Exiting from main() due to an error: %O.", err);
  });
  
  /**
   * Sleeps for the given number of seconds.
   * @param timeInSeconds Time to sleep in seconds.
   */
  async function sleep(timeInSeconds: number): Promise<void> {
    console.log(">>>>>> Sleeping for %d seconds..", timeInSeconds);
    await delay(timeInSeconds * 1000);
  }

  async function startEph(ephName: string): Promise<EventProcessorHost> {
    // Create the Event Processor Host
    const host = EventProcessorHost.createFromConnectionString(
      EventProcessorHost.createHostName(ephName),
      storageCS!,
      storageContainerName,
      ehCS!,
      {
        eventHubPath: path,
        onEphError: (error) => {
          console.log(">>>>>>> [%s] Error: %O", ephName, error);
        }
      }
    );
    // Message handler
    let num = 0;
    let doneCheckpointing = false;
    const onMessage = async (context: PartitionContext, data: EventData) => {
      ++num;
      console.log("num: %d", num);
      if (num % 1 === 0) {
        const cpointNum = num;
        try {
        console.log("$$$$ [%s] Attempting to checkpoint message number %d", ephName, cpointNum);
          await context.checkpoint();
          console.log("$$$$ [%s] Successfully checkpointed message number %d", ephName, cpointNum);
          if (num === 600) {
            doneCheckpointing = true;
          }
        } catch (err) {
            console.log(">>>>>>> An error occurred while checkpointing msg number %d: %O", num, err);
        }
      }
    };
    const onError: OnReceivedError = (err) => {
        console.log("An error occurred while receiving the message: %O", err);
      throw err;
    };
    await host.start(onMessage, onError);
    while (!doneCheckpointing) {
        console.log("Not done checkpointing -> %s, sleeping for 20 more seconds.", doneCheckpointing);
      await delay(20000);
    }
    console.log("sleeping for 20 more seconds..");
    await delay(20000);

    const partition0StringContent = await host["_context"].blobReferenceByPartition["0"].getContent();
    const partition0Content = JSON.parse(partition0StringContent);
    console.log("[Partition 0] Fetched content for from blob is: %o", partition0Content);

    const partition1StringContent = await host["_context"].blobReferenceByPartition["1"].getContent();
    const partition1Content = JSON.parse(partition1StringContent);
    console.log("[Partition 1] Fetched content from blob is: %o", partition1Content);
    

    return host;
  }
  
  /**
   * Stops the given EventProcessorHost.
   * @param eph The event processor host.
   * @returns {Promise<void>} Promise<void>
   */
  async function stopEph(eph: EventProcessorHost): Promise<void> {
    console.log(">>>>>> Stopping the EPH - '%s'.", eph.hostName);
    await eph.stop();
    console.log(">>>>>> Successfully stopped the EPH - '%s'.", eph.hostName);
  }
  