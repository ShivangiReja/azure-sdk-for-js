// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventHubClient, EventData, EventPosition } from "../lib";
import dotenv from "dotenv";
dotenv.config();

const str = "Endpoint=sb://shivangieventhubs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mHuzn4laFeLg25QlzhL7Fe0IfJzkEiqsTZZyAS2z12M=";
const path = "myeventhub";



async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  const partitionIds = await client.getPartitionIds();
  const result: EventData[] = await client.receiveBatch(partitionIds[0], 20, 20, { eventPosition: EventPosition.fromStart() });
  let i = 0;
  for (const data of result) {
    console.log("### Actual message (%d):", ++i, data.body);
  }
  await client.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
