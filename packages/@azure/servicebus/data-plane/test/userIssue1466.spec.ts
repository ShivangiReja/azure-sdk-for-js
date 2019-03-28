// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace, QueueClient, TopicClient, SubscriptionClient, ReceiveMode } from "../lib";

import { TestMessage, getSenderReceiverClients, ClientType, purge } from "./testUtils";
import { Receiver, SessionReceiver } from "../lib/receiver";
import { Sender } from "../lib/sender";
import { delay } from "rhea-promise";

let ns: Namespace;

let senderClient: QueueClient | TopicClient;
let receiverClient: QueueClient | SubscriptionClient;
let deadLetterClient: QueueClient | SubscriptionClient;
let sender: Sender;
let receiver: Receiver | SessionReceiver;

const numberOfMessages = 11000;

let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 100;
let totalMessagesPurged = 0;
async function beforeEachTest(
  senderType: ClientType,
  receiverType: ClientType,
  useSessions?: boolean
): Promise<void> {
  // The tests in this file expect the env variables to contain the connection string and
  // the names of empty queue/topic/subscription that are to be tested

  if (!process.env.SERVICEBUS_CONNECTION_STRING) {
    throw new Error(
      "Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests."
    );
  }

  ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);

  const clients = await getSenderReceiverClients(ns, senderType, receiverType);
  senderClient = clients.senderClient;
  receiverClient = clients.receiverClient;
  if (receiverClient instanceof QueueClient) {
    deadLetterClient = ns.createQueueClient(
      Namespace.getDeadLetterQueuePath(receiverClient.entityPath)
    );
  }

  if (receiverClient instanceof SubscriptionClient) {
    deadLetterClient = ns.createSubscriptionClient(
      Namespace.getDeadLetterTopicPath(senderClient.entityPath, receiverClient.subscriptionName),
      receiverClient.subscriptionName
    );
  }

  await purge(receiverClient, useSessions ? TestMessage.sessionId : undefined);
  await purge(deadLetterClient);
  const peekedMsgs = await receiverClient.peek();
  const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
  if (peekedMsgs.length) {
    chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
  }
  const peekedDeadMsgs = await deadLetterClient.peek();
  if (peekedDeadMsgs.length) {
    chai.assert.fail(
      `Please use an empty dead letter ${receiverEntityType} for integration testing`
    );
  }

  sender = senderClient.getSender();
  receiver = receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
}

async function afterEachTest(): Promise<void> {
  await ns.close();
}
describe("User Issue 1466", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function purgeMessages(): Promise<void> {
    let continueLoop = true;
    const list: any[] = [];
    for (let index = 0; index < numberOfMessages; index++) {
      list.push("Message " + index);
    }
    // let count = 0;
    do {
      // if (count === 2) {
      //   break;
      // }
      // count++;
      console.log("#################################################################");
      // receiver = receiverClient.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
      const messages = await receiver.receiveBatch(numberOfMessages / 10, 5);
      messages.forEach((element: any) => {
        list.splice(list.indexOf(element.body), 1);
      });
      const deletedMessagesCount = messages.length;
      totalMessagesPurged += deletedMessagesCount;
      console.log(
        "totalMessagesPurged = " + totalMessagesPurged + ", yet to receive = " + list.length
      );
      if (deletedMessagesCount === 0) {
        consecutiveZeroMessagesCount++;
        console.log("yet to receive = " + list);
        await delay(5000);
        if (consecutiveZeroMessagesCount > maxConsecutiveZeroMessagesCount) {
          continueLoop = false;
        }
      } else {
        consecutiveZeroMessagesCount = 0;
      }
      // await delay(3000);
      // await receiver.close();
    } while (continueLoop);
  }

  it.only("User Issue 1466 - batch receiver", async function(): Promise<void> {
    await beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
    let batchMessages = [];
    let index = 0;
    for (index = 0; index < numberOfMessages; index++) {
      if (index % (numberOfMessages / 10) === 0) {
        console.log(`Sending ${index}`);
        if (batchMessages.length > 0) await sender.sendBatch(batchMessages);
        batchMessages = [];
      }
      batchMessages.push({ body: "Message " + index });
      // await sender.send({ body: "Message " + index });
    }
    console.log(`Sending ${index}`);
    await sender.sendBatch(batchMessages);
    console.log("Sending Done, waiting for 10 seconds...");
    await delay(10000);
    await purgeMessages();
  });

  it("User Issue 1466 - streaming receiver", async function(): Promise<void> {
    await beforeEachTest(ClientType.PartitionedQueue, ClientType.PartitionedQueue);
    let batchMessages = [];
    let index = 0;
    for (index = 0; index < numberOfMessages; index++) {
      if (index % (numberOfMessages / 10) === 0) {
        console.log(`Sending ${index}`);
        if (batchMessages.length > 0) await sender.sendBatch(batchMessages);
        batchMessages = [];
      }
      batchMessages.push({ body: "Message " + index });
    }
    console.log(`Sending ${index}`);
    await sender.sendBatch(batchMessages);
    console.log("Sending Done, waiting for 10 seconds...");
    await delay(10000);
    const receivedMsgs = [];
    receiver.receive(
      (msg) => {
        receivedMsgs.push(msg);
        console.log(msg.body);
        if (receivedMsgs.length % (numberOfMessages / 10) === 0) {
          console.log("received " + receivedMsgs.length + " messages till now");
        }
        return Promise.resolve();
      },
      (err) => {
        if (err) {
          console.log(err.message);
        }
      }
    );
    await delay(10000000);
    console.log(receivedMsgs.length);
  });

  it("User Issue 1466 - no sending", async function(): Promise<void> {
    if (!process.env.SERVICEBUS_CONNECTION_STRING) {
      throw new Error(
        "Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests."
      );
    }
    ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);

    const clients = await getSenderReceiverClients(
      ns,
      ClientType.PartitionedQueue,
      ClientType.PartitionedQueue
    );
    receiverClient = clients.receiverClient;
    await purgeMessages();
  });
});
