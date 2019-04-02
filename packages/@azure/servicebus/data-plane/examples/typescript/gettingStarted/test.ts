import { Namespace, delay, ReceiveMode } from "../../../lib";

// Define connection string and related Service Bus entity names here
const connectionString =
  "Endpoint=sb://testservicebusstandard.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=rg/eK7FKjWTJGWQJCdh4t7nMqfBAaNlA9/xr1HiGh5c=";
const queueName = "testqueue";

const numberOfMessages = 11000;
let consecutiveZeroMessagesCount = 0;
const maxConsecutiveZeroMessagesCount = 3;
let consecutiveTimeoutExeptionsCount = 0;
const maxConsecutiveTimeoutExeptionsCount = 3;
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
  const queueClient = ns.createQueueClient(queueName);
  const receiverParameters = {
    receiveMode: ReceiveMode.receiveAndDelete
  };
  let receiver = null;
  let continueLoop = true;
  do {
    try {
      receiver = queueClient.getReceiver(receiverParameters);
      const messages = await receiver.receiveBatch(1000, 5);
      console.log(`Received message length ${messages.length}`);
      const deletedMessagesCount = messages.length;
      if (deletedMessagesCount === 0) {
        consecutiveZeroMessagesCount++;
        if (consecutiveZeroMessagesCount > maxConsecutiveZeroMessagesCount) {
          continueLoop = false;
        }
      } else {
        consecutiveZeroMessagesCount = 0;
        totalMessagesPurged += deletedMessagesCount;
      }
    } catch (error) {
      if (error.name && error.name.toLowerCase() === "operationtimeouterror") {
        consecutiveTimeoutExeptionsCount++;
        if (consecutiveTimeoutExeptionsCount > maxConsecutiveTimeoutExeptionsCount) {
          continueLoop = false;
        }
      } else {
        continueLoop = false;
        consecutiveTimeoutExeptionsCount = 0;
      }
    } finally {
      if (receiver !== null) {
        await receiver.close();
        receiver = null;
      }
    }
  } while (continueLoop);
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});
