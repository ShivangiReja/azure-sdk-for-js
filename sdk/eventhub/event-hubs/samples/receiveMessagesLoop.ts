/*
  This sample demonstrates how the receiveBatch() function can be used to receive Event Hubs
  messages in a loop.

  If your Event Hubs instance doesn't have any messages, then please run "sendMesages.ts" sample
  to populate Event Hubs before running this sample.
*/

import { EventHubClient, EventPosition } from "@azure/event-hubs";

// Define connection string and related Event Hubs entity name here
const connectionString = "";
const eventHubsName = "";

async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(connectionString, eventHubsName);
  const partitionIds = await client.getPartitionIds();
  let eventPosition = EventPosition.fromStart();

  for (let i = 0; i < 10; i++) {
    const messages = await client.receiveBatch(partitionIds[0], 1, 5, {
      eventPosition: eventPosition
    });
    eventPosition = EventPosition.fromSequenceNumber(messages[0].sequenceNumber!);
    console.log(`Received message #${i}: ${messages[messages.length - 1].body}`);
  }
  await client.close();
}

main().catch(err => {
  console.log("Error occurred: ", err);
});
