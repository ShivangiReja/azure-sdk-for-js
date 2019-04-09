"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const request_1 = tslib_1.__importDefault(require("request"));
getFunction();
function getFunction() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const uri = `https://samplesservicebus.servicebus.windows.net/partitioned-queue/messages/head`;
            console.log(`URL: ${uri}`);
            try {
                request_1.default({
                    method: 'POST',
                    uri: uri,
                    headers: {
                        'authorization': 'SharedAccessSignature sr=samplesservicebus.servicebus.windows.net%2fpartitioned-queue&sig=L183Je%2blU6NmtSqF8Q6np%2fe%2bhxxu1ywFApHVCPPFHNE%3d&se=1553033267&skn=RootManageSharedAccessKey',
                        'host': 'samplesservicebus.servicebus.windows.net',
                        'content-length': 0,
                    }
                }, function (error, res) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        console.log(`\n Response code ${res.statusCode} \n Resolved ${res.body}`);
                        resolve(true);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
//# sourceMappingURL=TestSample.js.map