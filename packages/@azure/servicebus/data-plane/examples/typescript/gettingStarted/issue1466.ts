import { Namespace, delay, ReceiveMode } from "../../../lib";

// Define connection string and related Service Bus entity names here
const connectionString =
  "Endpoint=sb://samplesservicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=J7loIoFdNr8sx8QSU/kl9Uj4iXgmQKlB2l17G6DGxGc=";
const queueName = "partitioned-queue";

const numberOfMessages = 11000;
let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 100;
let totalMessagesPurged = 0;
const ns = Namespace.createFromConnectionString(connectionString);

async function main(): Promise<void> {
  // If using Topics, use createTopicClient to send to a topic
  const client = ns.createQueueClient(queueName);
  const sender = client.getSender();

  try {
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

    // await client.close();
  } finally {
    // await ns.close();
    console.log("Finally...");
  }
}

async function purgeMessages(): Promise<void> {
  const client = ns.createQueueClient(queueName);
  const receiver = client.getReceiver({ receiveMode: ReceiveMode.receiveAndDelete });
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
    const messages = await receiver.receiveBatch(numberOfMessages / 10, 10);
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

main().catch((err) => {
  console.log("Error occurred: ", err);
});
