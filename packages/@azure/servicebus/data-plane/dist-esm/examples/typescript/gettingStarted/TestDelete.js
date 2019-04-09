"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const rhea_1 = require("rhea");
testDeleteFunction();
function testDeleteFunction() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const before = rhea_1.string_to_uuid("797ff043-11eb-11e1-80d6-510998755d10");
            console.log(`UUID ${before}`);
            const after = rhea_1.uuid_to_string(before);
            console.log(`String ${after}`);
        }
        catch (err) {
            throw new Error(err);
        }
    });
}
//# sourceMappingURL=TestDelete.js.map