const assert = require("chai").assert;
const Block = require("../src/backend/node/block").Block;
const Transaction = require("../src/backend/node/transaction").Transaction;

describe("Block", function() {
    let timestamp0 = 1621085454845;
    let previous_hash0 = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let timestamp1 = 1621239884609;
    let previous_hash1 = "000000b58ed5fb69ee201d6c319d8226f044e2eb62d0ca986a6d678b501200b2";
    let transactions1 = [
        new Transaction("040b9654506d2a7b554289ed1ba230128a5fc42b684470bb10de9c47138c3cc8f517450da73c0f73e478c65cb4c0ea0d684d9fd50365cc6baa8a04e45a2cba163c", "[P] Danni Pedersen", 1621239883142, "304502210097ead2e2ebcaac3404311c875a2c317ffdc1a41e5ee89a27b77cc43da9f5df290220484be8257b8425dea7778c6569c84e5323e1d1637b7dcbc68d5752d2421d8bb6"),
        new Transaction("04747c730f0369072a3caea180d5baecf257e57af736520efc4c458ab330aa9ff3137c7c59fa35c55a963a3b2edb29921902216d9913ae3b334a84a76de0be65ea", "[P] Danni Pedersen", 1621239883107, "3044022062d9e4d42ac69f01c3f18c198e803a0334ae1e8b5ed7665e46977f06ace186ee0220558c3a581660f838793a6c41794a65709793f4265c4f27316cdad8a877c93081"),
        new Transaction("048d8243225f8520d3f675178761e6869a773e3aa6d8e1ebf31916c980efa0707d2c1b34f4997c3dedb7d38b4648fd5b94ba0e8598935bf5efa26c628da36771ce", "[P] Danni Pedersen", 1621239883149, "30460221008c5588afca5ce7b0a7a95f9277dd654e992bcdce976d8f2142180066a66cc8c802210088bbbd49e61ca6bd5727ee3bf0c772dbc1fac97d479a5a1e6533b903d07d7254"),
        new Transaction("04e1c9aa8dbc4134bd7b423b54e5d0444dbaff515b779b2add0378387674c3867a10ec697247a15bec18d88e6df8a629db8a0d2b51a4b741769f9dc21c8743e285", "[P] Danni Pedersen", 1621239883130, "304502201fdbd34aeaa0c68c2e1c68edc998b699ae15df2b4384866a61e5537ac0e36f5c022100a7493a4cd6131fc109a6d661346149df94c4d88e4144339a894d79cc90affaf6"),
    ];
    let block0 = new Block(timestamp0, [], previous_hash0);
    let block1 = new Block(timestamp1, transactions1, previous_hash1);
    it("Create block", function() {
        assert.equal(block0.timestamp, timestamp0);
        assert.isEmpty(block0.transactions);
        assert.equal(block0.previous_hash, previous_hash0);

        assert.equal(block1.timestamp, timestamp1);
        assert.deepEqual(block1.transactions, transactions1);
        assert.equal(block1.previous_hash, previous_hash1);
    });

    it("Generate block hash", function() {
        block0.mine_block(4);
        block1.mine_block(4);
        block1.hash = block1.calculate_hash();
        assert.equal(block0.nonce, 7095);
        assert.equal(block0.hash, "00007ee85332864d9a6b07d38e377173c5c9d1a5d9b11897998284820120d3fa");
        assert.equal(block1.nonce, 147240);
        assert.equal(block1.hash, "00000f071d84b07cb9c9325ab21a37c1efb65c5cd133a44a419069aea1201a9e");
    });
    
    it("Validate block", function() {
        assert.isTrue(block0.validate(previous_hash0), true);
        assert.isTrue(block1.validate(previous_hash1), true);
    });
});