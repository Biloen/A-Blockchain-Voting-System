const SHA256 = require("../helpers/sha256");

class Block {
    constructor(timestamp, transactions, previous_hash){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = "";
        this.previous_hash = previous_hash;
        this.nonce = 0;
        this.tx_count = transactions.length;
    }

    validate(previous_hash){
        return this.calculate_hash() == this.hash && this.previous_hash == previous_hash;
    }

    calculate_hash(){
        let txs_hash = "";
        this.transactions.forEach(tx => {
            txs_hash += tx.hash;
        });
        return SHA256(this.timestamp.toString() + this.previous_hash + this.nonce.toString() + txs_hash);
    }
    
    fast_calculate_hash(txs_hash){
        return SHA256(this.timestamp.toString() + this.previous_hash + this.nonce.toString() + txs_hash);
    }

    mine_block(difficulty){
        // Create an array with the necessary zeroes
        let required_zeroes = "0".repeat(difficulty);
        // Rehash until the hash begins with the necessary amount of zeroes
        let txs_hash = "";
        this.transactions.forEach(tx => {
            txs_hash += tx.hash;
        });
        while(this.hash.substring(0, difficulty) !== required_zeroes){
            this.nonce++;
            this.hash = this.fast_calculate_hash(txs_hash);
        }
    }
}

module.exports.Block = Block;