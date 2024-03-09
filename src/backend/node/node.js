const Block = require("./block").Block;
const Queue = require("./queue").Queue;
const Transaction = require("./transaction").Transaction;
const genesis_previous_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const {Worker} = require("worker_threads");
const path = require("path");

class Node {
    constructor(difficulty, database, counter){
        this.transaction_queue = new Queue();
        this.difficulty = difficulty;
        this.db = database;
        this.chain = [];
        this.counter = counter;
    }

    setup() {
        this.setup_db();
        let {block, err} = this.get_latest_blocks(1);
        if (err) {
            console.error(err.message);
        } else {
            if (block?.Hash){
                let {transactions, err} = this.get_transactions(block.Hash);
                let result = [];
                if(err) {
                    console.error(err.message);
                } else {
                    transactions.forEach((transaction)=> {
                        let tx = new Transaction(transaction.Sender, transaction.Vote, transaction.Signature, transaction.Timestamp);
                        tx.hash = transaction.Hash;
                        result.push(tx);
                    });
                    let latest_block = new Block(block.Timestamp, result, block.PreviousHash);
                    latest_block.hash = block.Hash;
                    latest_block.nonce = block.Nonce;
                    this.chain[0] = latest_block;
                    this.mine_transactions();
                }
            } else {
                console.log("added genesis block");
                this.mine_transactions();
            }
        }
    }

    setup_db() {
        try {
            let query = "CREATE TABLE IF NOT EXISTS Blocks(ID INTEGER not null PRIMARY KEY  AUTOINCREMENT, PreviousHash TEXT NOT NULL, Timestamp DATE NOT NULL, Hash text NOT NULL, Nonce INTEGER NOT NULL, tx_count INTEGER NOT NULL)";
            let statement = this.db.prepare(query);
            statement.run();
            query = "CREATE TABLE IF NOT EXISTS Transactions(ID INTEGER not null PRIMARY KEY AUTOINCREMENT, BlockHash TEXT NOT NULL, Sender TEXT NOT NULL, Vote TEXT NOT NULL, Timestamp TEXT NOT NULL, Signature TEXT NOT NULL, Hash TEXT NOT NULL, Qi INTEGER NOT NULL)";
            statement = this.db.prepare(query);
            statement.run();
        } catch (e) {
            console.error(e.message);
        }
    }

    create_genesis_block(){
        return new Block(Date.now(), [], genesis_previous_hash);
    }

    // Returns the index of the previous block
    previous_block(){
        return this.chain[this.chain.length - 1];
    }

    add_transaction(tx){
        this.transaction_queue.enqueue(tx);
    }

    // Mines the transaction queue
    mine_transactions(){
        let tx_queue = this.validate_transactions(this.transaction_queue);
        let previous_block_hash = this.previous_block() ? this.previous_block().hash : genesis_previous_hash;
        const worker = new Worker(path.join(__dirname,"../helpers/miner.js"), {workerData: {tx_queue, previous_block_hash, difficulty: this.difficulty}});

        //Listen for a message from worker
        worker.once("message", result => {
            let block = new Block(result.timestamp, result.transactions, result.previous_hash);
            block.nonce = result.nonce;
            block.hash = result.hash;
            block.tx_count = result.tx_count;

            let err = this.add_transactions_db(result.transactions, block.hash);
            if (err){
                console.log(err);
            } 
            
            err = this.add_block(block);
            if (err){
                console.log(err);
            }
            this.mine_transactions();
        });
        
        worker.on("error", error => {
            console.log(error);
        });
    }

    add_block(block){
        let err = undefined;
        try {
            this.chain.push(block);
            let query = "INSERT INTO Blocks (previousHash, Timestamp, Hash, Nonce, tx_count) VALUES (?, ?, ?, ?, ?)";
            let statement = this.db.prepare(query);
            statement.run(block.previous_hash, block.timestamp, block.hash, block.nonce, block.tx_count);
        } catch (e) {
            err = e;
        }
        return err;
    }

    validate_transactions(transactions){
        let valid_transactions = [];
        let length = transactions.length();
        for(let i = 0; i < length; i++){
            if(i >= 100){
                break;
            }
            let tx = transactions.dequeue();
            if(tx.validate()){
                valid_transactions.push(tx);
            } else {
                console.log("invalid transaction");
            }
        }

        return valid_transactions;
    }

    add_transactions_db(Transactions, BlockHash){
        let err = undefined;
        try {
            
            let query = "INSERT INTO Transactions (BlockHash, Sender, Vote, Timestamp, Signature, Hash, Qi) VALUES (?, ?, ?, ?, ?, ?, ?)";
            let statement = this.db.prepare(query);
            let transaction = this.db.transaction(()=>{
                Transactions.forEach((tx, i) => {
                    tx.blockhash = BlockHash;
                    statement.run(tx.blockhash, tx.sender, tx.vote, tx.timestamp, tx.signature, tx.hash, i);
                });
            });
            transaction();
        } catch (e) {
            err = e;
        }
        return err;
    }

    get_transaction(hash){
        let err = undefined;
        let transaction = undefined;
        try{
            let query = "SELECT * FROM Transactions WHERE Hash = (?)";
            let statement = this.db.prepare(query);
            transaction = statement.get(hash);
        }catch(e) {
            err = e;
        }
        return {transaction, err};
    }

    get_transactions(block_hash){
        let err = undefined;
        let query = "SELECT * FROM Transactions WHERE BlockHash = (?)";
        let statement = this.db.prepare(query);
        let transactions = statement.all(block_hash);
        return {transactions, err};
    }

    get_block(hash){
        let err = undefined;
        let block = undefined;
        try {
            let query = "SELECT * FROM Blocks WHERE Hash = (?)";
            let statement = this.db.prepare(query);
            block = statement.get(hash);
        } catch (e) {
            err = e;
        }
        return {block, err};
    }

    get_blocks_date(start, end){
        let err = undefined;
        let blocks = undefined;
        try {
            let query = "SELECT * FROM Blocks WHERE Timestamp >= ? AND Timestamp <= ?";
            let statement = this.db.prepare(query);
            blocks = statement.all(start, end);
        } catch (e) {
            err = e;
        }
        return {blocks, err};
    }

    get_blocks_height(start, end){
        let err = undefined;
        let blocks = undefined;
        try {
            let query = "SELECT * FROM Blocks WHERE ID >= ? AND ID <= ?";
            let statement = this.db.prepare(query);
            blocks = statement.all(start, end);
        } catch (e) {
            err = e;
        }
        return {blocks, err};
    }

    get_latest_blocks(limit){
        let err = undefined;
        let blocks = undefined;
        try{
            let query = "SELECT * FROM Blocks ORDER BY ID DESC LIMIT ?";
            let statement = this.db.prepare(query);
            blocks = statement.all(limit);
        }catch(e) {
            err = e;
        }
        if (limit == 1){
            let block = blocks[0];
            return {block, err};
        } else {
            return {blocks, err};
        }
    }

    get_latest_transaction(limit){
        let err = undefined;
        let transactions = undefined;
        try{
            let query = "SELECT * FROM Transactions ORDER BY ID DESC LIMIT ?";
            let statement = this.db.prepare(query);
            transactions = statement.all(limit);
        }catch(e) {
            err = e;
        }
        if (limit == 1){
            let transaction = transactions[0];
            return {transaction, err};
        } else {
            return {transactions, err};
        }
    }

    get_results() {
        let err = undefined;
        let candidates = undefined;
        try{
            let query = "SELECT * FROM Results";
            let statement = this.db.prepare(query);
            candidates = statement.all();
        } catch(e) {
            err = e;
        }
        return {candidates, err};
    }
}

module.exports.Node = Node;