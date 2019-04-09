"use strict";
/*
  This sample demonstrates how to create a namespace using AAD token credentials
  obtained from using Service Principal Secrets.

  Setup :
    Please ensure that your Azure Service Bus resource is in US East, US East 2, or West Europe
    region. AAD Role Based Access Control is not supported in other regions yet.

    Register a new application in AAD and assign the "owner" role to it
     - See https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app
       to register a new application in the Azure Active Directory.
     - Note down the CLIENT_ID and TENANT_ID from the above step.
     - In the "Certificates & Secrets" tab, create a secret and note that down.
     - In the Azure portal, go to your Service Bus resource and click on the Access control (IAM)
       tab. Here, assign "owner" role to the registered application.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const service_bus_1 = require("@azure/service-bus");
const ms_rest_azure_1 = require("ms-rest-azure");
// Define Service Bus Endpoint here and related entity names here
const serviceBusEndpoint = ""; // <your-servicebus-namespace>.servicebus.windows.net
// Define CLIENT_ID, TENANT_ID and SECRET of your AAD application here
const clientId = "";
const clientSecret = "";
const tenantId = "";
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tokenCreds = yield ms_rest_azure_1.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId, {
            tokenAudience: "https://servicebus.azure.net/"
        });
        const ns = service_bus_1.Namespace.createFromAadTokenCredentials(serviceBusEndpoint, tokenCreds);
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
//# sourceMappingURL=servicePrincipalLogin.js.map