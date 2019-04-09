"use strict";
/*
  This sample demonstrates how to create a namespace using AAD token credentials
  obtained from signing in through your Azure account.

  Setup :
    Please ensure that your Azure Service Bus resource is in US East, US East 2, or West Europe
    region. AAD Role Based Access Control is not supported in other regions yet.

    In the Azure portal, go to your Service Bus resource and click on the Access control (IAM) tab.
    Here, assign "owner" role to your account.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
const ms_rest_azure_1 = require("ms-rest-azure");
// Define Service Bus Endpoint here and related entity names here
const serviceBusEndpoint = ""; // <your-servicebus-namespace>.servicebus.windows.net
const username = "";
const password = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tokenCreds = yield ms_rest_azure_1.loginWithUsernamePassword(username, password, {
            tokenAudience: "https://servicebus.azure.net/"
        });
        const ns = service_bus_1.Namespace.createFromAadTokenCredentials(serviceBusEndpoint, tokenCreds);
        /*
         Refer to other samples, and place your code here
         to create queue clients, and to send/receive messages
        */
        yield ns.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=loginWithAzureAccount.js.map