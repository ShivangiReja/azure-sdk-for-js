"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dns_1 = require("dns");
retry();
function checkNetworkConnection() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((res) => {
            dns_1.resolve("testeventhubssample.servicebus.windows.net", function (err) {
                console.log(err);
                if (err && err.code === "ECONNREFUSED") {
                    res(false);
                }
                else {
                    res(true);
                }
            });
        });
    });
}
function retry() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const isConnected = yield checkNetworkConnection();
        if (!isConnected) {
            console.log("Not connected");
        }
        else {
            console.log("connected");
        }
    });
}
//# sourceMappingURL=test.js.map