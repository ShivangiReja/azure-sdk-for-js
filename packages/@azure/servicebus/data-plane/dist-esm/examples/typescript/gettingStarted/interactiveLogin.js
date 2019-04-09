"use strict";
/*
  This sample demonstrates how to create a namespace using AAD token credentials
  obtained from interactive login.

  Setup :
    Please ensure that your Azure Service Bus resource is in US East, US East 2, or West Europe
    region. AAD Role Based Access Control is not supported in other regions yet.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("../../../lib");
const ms_rest_azure_1 = require("ms-rest-azure");
// Define Service Bus Endpoint here
const serviceBusEndpoint = ""; // <your-servicebus-namespace>.servicebus.windows.net
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tokenCreds = yield ms_rest_azure_1.interactiveLogin({
            tokenAudience: "https://servicebus.azure.net/"
        });
        const ns = lib_1.Namespace.createFromAadTokenCredentials(serviceBusEndpoint, tokenCreds);
        /*
         Refer to other samples, and place your code here
         to create queue clients, and send/receive messages
        */
        yield ns.close();
    });
}
main().catch((err) => {
    console.log("Error occurred: ", err);
});
//# sourceMappingURL=interactiveLogin.js.map