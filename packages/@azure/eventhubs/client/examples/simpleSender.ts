// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventHubClient, EventData } from "../lib";
import dotenv from "dotenv";
import WebSocket from "ws";
const url = require('url');
const httpsProxyAgent = require("https-proxy-agent");
dotenv.config();


const str = "Endpoint=sb://shivangieventhubs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mHuzn4laFeLg25QlzhL7Fe0IfJzkEiqsTZZyAS2z12M=";
const path = "myeventhub";

const proxy = 'http://localhost:3128';
// new WebSocket()

// create an instance of the `HttpsProxyAgent` class with the proxy server information
const options = url.parse(proxy);

const proxyAgent = new httpsProxyAgent(options);
// new WebSocket();

async function main(): Promise<void> {
  console.log("calling createFromConnectionString");
  const client = EventHubClient.createFromConnectionString(str, path, {webSocket: WebSocket, webSocketEndpointPath: "$servicebus/websocket", socketOptions: {agent: proxyAgent}});
  const data: EventData = {
    body: "Hello World- new -1 !!"
  };
  // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub
  // where the body is a JSON object/array.
  // const data = { body: { "message": "Hello World" } };
   const partitionIds = await client.getPartitionIds();
  await client.send(data, partitionIds[0]);
  console.log(">>> Sent the message successfully: ", data.body.toString());
  await client.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
