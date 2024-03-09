const assert = require("chai").assert;
const Transaction = require("../src/backend/node/transaction").Transaction;

describe("Transactions", function() {
    let tx0_s = "0479385f8e94a7cb2c28b2a6e79587fd3e846b8cb79fb1683d304edba08c819fc6fbf687808673eda42034bd872dedde04f820be8686374bfac01a0377451cc0c7";
    let tx0_v =  "[A] Mette Frederiksen";
    let tx0_si = "304402202d01ed5aa5a536258a658202f47d144f2af5180b82cbffd3ba67fa3e5fe80da90220181a29f8ca440c85903e22c7f252c0f7844a84db40f76200e16c39a225c41fc1";
    let tx0_t = 1621242813152;
    let tx0_h = "31fb832f0514d36192c696c4e6937cb5efe492615e34be16eb39c0a5e305f64d";
    let tx0 = new Transaction(tx0_s, tx0_v, tx0_si, tx0_t, tx0_h);
    
    let tx1_s = "0429289b69ec7f47c5e4ec0534ec8fda27cb52e7127a94c2fc7f6bb092454fcb840316447257f84f0cb2d6ec231d97cc0cd541ba9131c569e2be28eeb189b2e7b0";
    let tx1_v =  "[B] Amalie Mørkøre Højsholt";
    let tx1_si = "3046022100be7ec69a8546d78c250c9626f8b3ab886ff6fcffbde47a931f742d986c8365350221008ebe8fc9a2b0ba5163384dec54d10592b988584153cd92057210c0b49b5e627f";
    let tx1_t = 1621243853544;
    let tx1_h = "83b7bc7d55790b9ee239e3c67abe0ffc9c938c1a18dafd7ffc014f222a7b9b29";
    let tx1 = new Transaction(tx1_s, tx1_v, tx1_si, tx1_t, tx1_h);
    
    it("Create transaction", function() {
        assert.equal(tx0.senderm, tx0.s);
        assert.equal(tx0.vote, tx0_v);
        assert.equal(tx0.signature, tx0_si);
        assert.equal(tx0.timestamp, tx0_t);
        assert.equal(tx0.hash, tx0_h);

        assert.equal(tx1.senderm, tx1.s);
        assert.equal(tx1.vote, tx1_v);
        assert.equal(tx1.signature, tx1_si);
        assert.equal(tx1.timestamp, tx1_t);
        assert.equal(tx1.hash, tx1_h);
    });

    it("Create transaction hash", function () {
        assert.equal(tx0.hash, tx0.calculate_hash());
        assert.equal(tx1.hash, tx1.calculate_hash());
    });

    it("Validate transaction", function() {
        assert.isTrue(tx0.validate(), "tx0 invalid transaction");
        assert.isTrue(tx1.validate(), "tx1 invalid transaction");
    });
});