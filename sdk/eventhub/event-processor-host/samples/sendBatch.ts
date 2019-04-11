// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventHubClient, EventData, delay } from "@azure/event-hubs";
import dotenv from "dotenv";
dotenv.config();


const str = "Endpoint=sb://shivangieventhubs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mHuzn4laFeLg25QlzhL7Fe0IfJzkEiqsTZZyAS2z12M=";
const path ="testeventhubs";


async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  console.log("Created EH client from connection string");
  console.log("Created Sender for partition 0.");

  const partitionIds = await client.getPartitionIds();
  const messageCount = 300;
  const data: EventData[] = [];
  for (let i = 1; i <= messageCount; i++) {
    const obj: EventData = { body: `Hello foo ${i}` };
    data.push(obj);
  }
  console.log("Sending batch message...");
  // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub
  // where the body is a JSON object/array.
  // const datas = [
  //   { body: { "message": "Hello World 1" }, applicationProperties: { id: "Some id" }, partitionKey: "pk786" },
  //   { body: { "message": "Hello World 2" } },
  //   { body: { "message": "Hello World 3" } }
  // ];
  const sendPromises: Promise<any>[] = [];
  for (const id of partitionIds) {
    sendPromises.push(client.sendBatch(data, id));
  }

  // Will concurrently send batched messages to all the partitions.
  await Promise.all(sendPromises);
  // Giving some more time, just in case.
  await delay(5000);
  await client.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
