"use strict";
/*
  This sample demonstrates usage of SessionState.

  We take for example the context of an online shopping app and see how we can use Session State
  to implement the maintaining of shopping cart information completely on server side i.e.,
  remembering the users' shopped items even if they leave the site and return later.

  The scenario in sample walks through user activity of two customers Alice and Bob.
  Alice adds 3 items to the shopping cart and checks out, whereas Bob adds 3 items and leaves without
  checking out to likely return later.
  The session state keeps track of the cart items accordingly.

  Setup: To run this sample, you would need session enabled Queue/Subscription.

  See https://docs.microsoft.com/en-us/azure/service-bus-messaging/message-sessions#message-session-state
  to learn about session state.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
// Define connection string and related Service Bus entity names here
const connectionString = "";
const userEventsQueueName = "";
let ns;
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        ns = service_bus_1.Namespace.createFromConnectionString(connectionString);
        try {
            yield runScenario();
        }
        finally {
            yield ns.close();
        }
    });
}
function runScenario() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // User activity data for Alice and Bob
        const shoppingEventsDataAlice = [
            { event_name: "Add Item", event_details: "Milk" },
            { event_name: "Add Item", event_details: "Bread" },
            { event_name: "Add Item", event_details: "Eggs" },
            { event_name: "Checkout", event_details: "Success" }
        ];
        const shoppingEventsDataBob = [
            { event_name: "Add Item", event_details: "Pencil" },
            { event_name: "Add Item", event_details: "Paper" },
            { event_name: "Add Item", event_details: "Stapler" }
        ];
        // Simulating user events
        yield sendMessagesForSession(shoppingEventsDataAlice, "alice");
        yield sendMessagesForSession(shoppingEventsDataBob, "bob");
        yield processMessageFromSession("alice");
        yield processMessageFromSession("alice");
        // Displaying snapshot of Alice's shopping cart (SessionState) after processing 2 events
        // This will show two items
        yield getSessionState("alice");
        yield processMessageFromSession("alice");
        yield processMessageFromSession("alice");
        yield processMessageFromSession("bob");
        yield processMessageFromSession("bob");
        yield processMessageFromSession("bob");
        // Displaying snapshot of Alice's shopping cart (SessionState) after processing remaining events
        // This will show null as Alice checksout and cart is cleared
        yield getSessionState("alice");
        // Displaying snapshot of Bob's shopping cart (SessionState) after processing all the events
        // This will show three items
        yield getSessionState("bob");
    });
}
function getSessionState(sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(userEventsQueueName);
        const sessionReceiver = yield client.getSessionReceiver({ sessionId: sessionId });
        const sessionState = yield sessionReceiver.getState();
        if (sessionState) {
            // Get list of items
            console.log(`\nItems in cart for ${sessionId}: ${sessionState}\n`);
        }
        else {
            console.log(`\nNo Items were added to cart for ${sessionId}\n`);
        }
        yield sessionReceiver.close();
        yield client.close();
    });
}
function sendMessagesForSession(shoppingEvents, sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics, use createTopicClient to send to a topic
        const client = ns.createQueueClient(userEventsQueueName);
        const sender = client.getSender();
        for (let index = 0; index < shoppingEvents.length; index++) {
            const message = {
                sessionId: sessionId,
                body: shoppingEvents[index],
                label: "Shopping Step"
            };
            yield sender.send(message);
        }
        yield client.close();
    });
}
function processMessageFromSession(sessionId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // If using Topics & Subscriptions, use createSubscriptionClient to receive from the subscription
        const client = ns.createQueueClient(userEventsQueueName);
        const sessionReceiver = yield client.getSessionReceiver({ sessionId: sessionId });
        const messages = yield sessionReceiver.receiveBatch(1, 10);
        // Custom logic for processing the messages
        if (messages.length > 0) {
            // Update sessionState
            if (messages[0].body.event_name === "Checkout") {
                // Clear cart if customer exits, else retain items.
                yield sessionReceiver.setState(JSON.stringify([]));
            }
            else if (messages[0].body.event_name === "Add Item") {
                // Update cart if customer adds items and store it in session state.
                const currentSessionState = yield sessionReceiver.getState();
                let newSessionState = [];
                if (currentSessionState) {
                    newSessionState = JSON.parse(currentSessionState);
                }
                newSessionState.push(messages[0].body.event_details);
                yield sessionReceiver.setState(JSON.stringify(newSessionState));
            }
            console.log(`Received message: Customer '${sessionReceiver.sessionId}': '${messages[0].body.event_name} ${messages[0].body.event_details}'`);
            yield messages[0].complete();
        }
        else {
            console.log(`No events were received for Customer: ${sessionId}\n`);
        }
        yield sessionReceiver.close();
        yield client.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=sessionState.js.map