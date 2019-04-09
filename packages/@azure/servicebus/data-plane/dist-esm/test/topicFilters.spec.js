// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as tslib_1 from "tslib";
import chai from "chai";
const should = chai.should();
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
dotenv.config();
chai.use(chaiAsPromised);
import { Namespace } from "../lib";
import { getSenderReceiverClients, ClientType, purge, checkWithTimeout } from "./testUtils";
// We need to remove rules before adding one because otherwise the existing default rule will let in all messages.
function removeAllRules(client) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rules = yield client.getRules();
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            yield client.removeRule(rule.name);
        }
    });
}
function testPeekMsgsLength(client, expectedPeekLength) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const peekedMsgs = yield client.peek(expectedPeekLength + 1);
        should.equal(peekedMsgs.length, expectedPeekLength, "Unexpected number of msgs found when peeking");
    });
}
let ns;
let subscriptionClient;
let topicClient;
function beforeEachTest(receiverType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // The tests in this file expect the env variables to contain the connection string and
        // the names of empty queue/topic/subscription that are to be tested
        if (!process.env.SERVICEBUS_CONNECTION_STRING) {
            throw new Error("Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests.");
        }
        ns = Namespace.createFromConnectionString(process.env.SERVICEBUS_CONNECTION_STRING);
        const clients = yield getSenderReceiverClients(ns, ClientType.TopicFilterTestTopic, receiverType);
        topicClient = clients.senderClient;
        subscriptionClient = clients.receiverClient;
        yield purge(subscriptionClient);
        const peekedSubscriptionMsg = yield subscriptionClient.peek();
        if (peekedSubscriptionMsg.length) {
            chai.assert.fail("Please use an empty Subscription for integration testing");
        }
        if (receiverType === ClientType.TopicFilterTestSubscription) {
            yield removeAllRules(subscriptionClient);
        }
    });
}
function afterEachTest(clearRules = true) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (clearRules) {
            yield removeAllRules(subscriptionClient);
            yield subscriptionClient.addRule("DefaultFilter", true);
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "DefaultFilter", "RuleName is different than expected");
        }
        yield ns.close();
    });
}
const data = [
    { Color: "blue", Quantity: 5, Priority: "low" },
    { Color: "red", Quantity: 10, Priority: "high" },
    { Color: "yellow", Quantity: 5, Priority: "low" },
    { Color: "blue", Quantity: 10, Priority: "low" },
    { Color: "blue", Quantity: 5, Priority: "high" },
    { Color: "blue", Quantity: 10, Priority: "low" },
    { Color: "red", Quantity: 5, Priority: "low" },
    { Color: "red", Quantity: 10, Priority: "low" },
    { Color: "red", Quantity: 5, Priority: "low" },
    { Color: "yellow", Quantity: 10, Priority: "high" },
    { Color: "yellow", Quantity: 5, Priority: "low" },
    { Color: "yellow", Quantity: 10, Priority: "low" }
];
function sendOrders() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sender = topicClient.getSender();
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            const message = {
                body: "",
                messageId: `messageId: ${Math.random()}`,
                correlationId: `${element.Priority}`,
                label: `${element.Color}`,
                userProperties: {
                    color: `${element.Color}`,
                    quantity: element.Quantity,
                    priority: `${element.Priority}`
                },
                partitionKey: "dummy" // Ensures all messages go to same parition to make peek work reliably
            };
            yield sender.send(message);
        }
    });
}
function receiveOrders(client, expectedMessageCount) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let errorFromErrorHandler;
        const receivedMsgs = [];
        const receiver = client.getReceiver();
        receiver.receive((msg) => {
            return msg.complete().then(() => {
                receivedMsgs.push(msg);
            });
        }, (err) => {
            if (err) {
                errorFromErrorHandler = err;
            }
        });
        const msgsCheck = yield checkWithTimeout(() => receivedMsgs.length === expectedMessageCount);
        should.equal(msgsCheck, true, `Expected ${expectedMessageCount}, but received ${receivedMsgs.length} messages`);
        yield receiver.close();
        should.equal(errorFromErrorHandler, undefined, errorFromErrorHandler && errorFromErrorHandler.message);
        should.equal(receivedMsgs.length, expectedMessageCount, "Unexpected number of messages");
        return receivedMsgs;
    });
}
function addRules(ruleName, filter, sqlRuleActionExpression) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield subscriptionClient.addRule(ruleName, filter, sqlRuleActionExpression);
        const rules = yield subscriptionClient.getRules();
        should.equal(rules.length, 1, "Unexpected number of rules");
        should.equal(rules[0].name, ruleName, "Expected Rule not found");
        if (sqlRuleActionExpression) {
            should.equal(rules[0].action.expression, sqlRuleActionExpression, "Action not set on the rule.");
        }
    });
}
describe("addRule()", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function BooleanFilter(bool) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("BooleanFilter", bool);
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "BooleanFilter", "RuleName is different than expected");
        });
    }
    it("Add True Filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield BooleanFilter(true);
        });
    });
    it("Add False Filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield BooleanFilter(false);
        });
    });
    it("Add SQL filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Priority_1", "(priority = 1 OR priority = 2) AND (sys.label LIKE '%String2')");
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "Priority_1", "RuleName is different than expected");
        });
    });
    it("Add SQL filter and action", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Priority_1", "(priority = 1 OR priority = 3) AND (sys.label LIKE '%String1')", "SET sys.label = 'MessageX'");
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "Priority_1", "RuleName is different than expected");
        });
    });
    it("Add Correlation filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Correlationfilter", {
                label: "red",
                correlationId: "high"
            });
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "Correlationfilter", "RuleName is different than expected");
        });
    });
    it("Add rule with a name which matches with existing rule", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Priority_1", "priority = 1");
            let errorWasThrown = false;
            try {
                yield subscriptionClient.addRule("Priority_1", "priority = 2");
            }
            catch (error) {
                errorWasThrown = true;
                should.equal(!error.message.search("Priority_1' already exists."), false, "ErrorMessage is different than expected");
                should.equal(error.name, "MessagingEntityAlreadyExistsError", "ErrorName is different than expected");
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("Add rule with no name", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            try {
                yield subscriptionClient.addRule("", "priority = 2");
            }
            catch (error) {
                errorWasThrown = true;
                should.equal(!error.message.search("Rule name is missing"), false, "ErrorMessage is different than expected");
                should.equal(error.name, "Error", "ErrorName is different than expected");
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("Add rule with no filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            try {
                yield subscriptionClient.addRule("Priority_1", "");
            }
            catch (error) {
                errorWasThrown = true;
                should.equal(!error.message.search("Filter is missing"), false, "ErrorMessage is different than expected");
                should.equal(error.name, "Error", "ErrorName is different than expected");
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("Add rule with a Boolean filter whose input is not a Boolean, SQL expression or a Correlation filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            try {
                yield subscriptionClient.addRule("Priority_2", {});
            }
            catch (error) {
                errorWasThrown = true;
                should.equal(error.message, "Cannot add rule. Filter should be either a boolean, string or should have one of the Correlation filter properties.");
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("Adding a rule with a Correlation filter, error for irrelevant properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            const filter = {
                correlationId: 1,
                invalidProperty: 2
            };
            try {
                yield subscriptionClient.addRule("Priority_2", filter);
            }
            catch (error) {
                errorWasThrown = true;
                should.equal(error.message, 'Cannot add rule. Given filter object has unexpected property "invalidProperty".');
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
});
describe("removeRule()", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Removing non existing rule on a subscription that doesnt have any rules should throw error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            try {
                yield subscriptionClient.removeRule("Priority_5");
            }
            catch (error) {
                should.equal(!error.message.search("Priority_5' could not be found"), false, "ErrorMessage is different than expected");
                should.equal(error.name, "MessagingEntityNotFoundError", "ErrorName is different than expected");
                errorWasThrown = true;
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
    it("Removing non existing rule on a subscription that has other rules should throw error", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errorWasThrown = false;
            try {
                yield subscriptionClient.addRule("Priority_1", "priority = 1");
                yield subscriptionClient.removeRule("Priority_5");
            }
            catch (error) {
                errorWasThrown = true;
            }
            should.equal(errorWasThrown, true, "Error thrown flag must be true");
        });
    });
});
describe("getRules()", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Subscription with 0/1/multiple rules returns rules as expected", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 0, "Unexpected number of rules");
            const expr1 = "(priority = 1)";
            yield subscriptionClient.addRule("Priority_1", expr1);
            rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "Priority_1", "RuleName is different than expected");
            should.equal(JSON.stringify(rules[0].filter), JSON.stringify({ expression: expr1 }), "Filter-expression is different than expected");
            const expr2 = "(priority = 1 OR priority = 3) AND (sys.label LIKE '%String1')";
            yield subscriptionClient.addRule("Priority_2", expr2);
            rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 2, "Unexpected number of rules");
            should.equal(rules[0].name, "Priority_1", "RuleName is different than expected");
            should.equal(JSON.stringify(rules[0].filter), JSON.stringify({ expression: expr1 }), "Filter-expression is different than expected");
            should.equal(rules[1].name, "Priority_2", "RuleName is different than expected");
            should.equal(JSON.stringify(rules[1].filter), JSON.stringify({ expression: expr2 }), "Filter-expression is different than expected");
        });
    });
    it("Rule with SQL filter and action returns expected filter and action expression", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Priority_1", "(priority = 1 OR priority = 3) AND (sys.label LIKE '%String1')", "SET sys.label = 'MessageX'");
            const rules = yield subscriptionClient.getRules();
            should.equal(rules[0].name, "Priority_1", "RuleName is different than expected");
        });
    });
    it("Rule with Correlation filter returns expected filter", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("Correlationfilter", {
                label: "red",
                correlationId: "high"
            });
            const rules = yield subscriptionClient.getRules();
            should.equal(rules[0].name, "Correlationfilter", "RuleName is different than expected");
            const expectedFilter = {
                correlationId: "high",
                label: "red",
                userProperties: []
            };
            should.equal(rules.length, 1, "Unexpected number of rules");
            rules.forEach((rule) => {
                should.equal(rule.filter.correlationId, expectedFilter.correlationId, "MessageId is different than expected");
                should.equal(rule.filter.label, expectedFilter.label, "Filter-label is different than expected");
                const userProperties = rule.filter.userProperties;
                should.equal(Array.isArray(userProperties), true, "`ReceivedMessages` is not an array");
                should.equal(userProperties.length, 0, "Unexpected number of messages");
            });
        });
    });
});
describe("Default Rule - Send/Receive", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestDefaultSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest(false);
    }));
    it("Default rule is returned for the subscription for which no rules were added", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "$Default", "RuleName is different than expected");
        });
    });
    it("Subscription with default filter receives all messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield sendOrders();
            yield receiveOrders(subscriptionClient, data.length);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
});
describe("Boolean Filter - Send/Receive", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    function addFilterAndReceiveOrders(bool, client, expectedMessageCount) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield subscriptionClient.addRule("BooleanFilter", bool);
            const rules = yield subscriptionClient.getRules();
            should.equal(rules.length, 1, "Unexpected number of rules");
            should.equal(rules[0].name, "BooleanFilter", "RuleName is different than expected");
            yield sendOrders();
            yield receiveOrders(client, expectedMessageCount);
            yield testPeekMsgsLength(client, 0);
        });
    }
    it("True boolean filter receives all messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addFilterAndReceiveOrders(true, subscriptionClient, data.length);
        });
    });
    it("False boolean filter does not receive any messages", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addFilterAndReceiveOrders(false, subscriptionClient, 0);
        });
    });
});
describe("Sql Filter - Send/Receive", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("SQL rule filter on the message properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("SQLMsgPropertyRule", "sys.label = 'red'");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "red").length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("SQL rule filter on the custom properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("SQLCustomRule", "color = 'red'");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "red").length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("SQL rule filter using AND operator ", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("SqlRuleWithAND", "color = 'blue' and quantity = 10");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "blue" && x.Quantity === 10).length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("SQL rule filter using OR operator ", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("SqlRuleWithOR", "color = 'blue' OR quantity = 10");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "blue" || x.Quantity === 10).length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("SQL rule filter with action with custom properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("SqlRuleWithAction", "color='blue'", "SET priority = 'High'");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "blue").length;
            const receivedMsgs = yield receiveOrders(subscriptionClient, dataLength);
            if (receivedMsgs[0].userProperties) {
                should.equal(receivedMsgs[0].userProperties.priority, "High", "Priority of the receivedMessage is different than expected");
            }
            else {
                chai.assert.fail("Received message doesnt have user properties");
            }
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    // Standard subscription : Update message properties in random order.
    // Premium subscription : Update message properties only first time when you create new subscription.
    /* it("SQL rule filter with action with message properties", async function(): Promise<void> {
      await addRules("SqlRuleWithAction", "color='blue'", "SET sys.label = 'color blue'");
  
      await sendOrders();
      const dataLength = data.filter((x) => x.Color === "blue").length;
      const receivedMsgs = await receiveOrders(subscriptionClient, dataLength);
  
      if (receivedMsgs[0].userProperties) {
        should.equal(receivedMsgs[0].userProperties.priority, "High",
          "Priority of the receivedMessage is different than expected");
      } else {
        chai.assert.fail("Received message doesnt have user properties");
      }
      await testPeekMsgsLength(subscriptionClient, 0);
    });*/
});
describe("Correlation Filter - Send/Receive", function () {
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield beforeEachTest(ClientType.TopicFilterTestSubscription);
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield afterEachTest();
    }));
    it("Correlation filter on the message properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("CorrelationMsgPropertyRule", {
                label: "red"
            });
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "red").length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("Correlation filter on the custom properties", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("CorrelationCustomRule", {
                userProperties: {
                    color: "red"
                }
            });
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "red").length;
            yield receiveOrders(subscriptionClient, dataLength);
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
    it("Correlation filter with SQL action", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield addRules("CorrelationRuleWithAction", {
                userProperties: {
                    color: "blue"
                }
            }, "SET priority = 'High'");
            yield sendOrders();
            const dataLength = data.filter((x) => x.Color === "blue").length;
            const receivedMsgs = yield receiveOrders(subscriptionClient, dataLength);
            if (receivedMsgs[0].userProperties) {
                should.equal(receivedMsgs[0].userProperties.priority, "High", "Priority of the receivedMessage is different than expected");
            }
            else {
                chai.assert.fail("Received message doesnt have user properties");
            }
            yield testPeekMsgsLength(subscriptionClient, 0);
        });
    });
});
//# sourceMappingURL=topicFilters.spec.js.map