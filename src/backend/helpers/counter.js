const Block = require("../node/block").Block;
const Transaction = require("../node/transaction").Transaction;
const fs = require("fs");
const path = require("path");
const {parentPort, workerData} = require("worker_threads");
const db = require("better-sqlite3")(workerData.db);

class Counter {
    constructor(db, time_start, time_end, chunck_size, candidate_path) {
        this.db = db;
        this.time_start = time_start;
        this.time_end = time_end;
        this.chunck_size = chunck_size;
        this.candidates = {};
        this.offset = 0;
        this.max = 0;
        this.count = 0;
        this.last_block_hash = "";
        
        this.generate_candidate_list(candidate_path).forEach(candidate => {
            this.candidates[candidate] = 0;
        });
    }

    setup(){
        this.create_table();
        try {
            let query = "INSERT INTO Counter (ID, OFFSET, HASH) VALUES (1, 0, '0x0000000000000000000000000000000000000000000000000000000000000000') ON CONFLICT(ID) DO NOTHING";
            let statement = this.db.prepare(query);
            statement.run();
        }  catch (e) {
            console.error(e.message);
        }
    }

    generate_candidate_list(candidate_path){
        let result = [];
        let file = fs.readFileSync(path.join(__dirname, candidate_path));
        let parties = JSON.parse(file);
        parties.forEach(party => {
            let prefix = `[${party.Char}]`;
            result.push(prefix);
            party.Candidates.forEach(candidate => {
                result.push(prefix + " " + candidate);
            });
        });
        return result;
    }

    run() {
        this.get_candidates();
        this.max = this.get_height();
        this.get_counter_data();
        while(this.count <= this.max){
            this.get_next_chunk();
        }
        this.set_counter(this.offset, this.last_block_hash);
        this.add_candidates();
        return Date.now();
    }

    create_table() {
        try {
            let query = "CREATE TABLE IF NOT EXISTS Results(Candidate TEXT not null PRIMARY KEY, Votes INTEGER NOT NULL, Last_modified INTEGER NOT NULL)";
            let statement = this.db.prepare(query);
            statement.run();
    
            query = "CREATE TABLE IF NOT EXISTS Counter(ID INTEGER NOT NULL PRIMARY KEY, OFFSET INTEGER NOT NULL, HASH STRING NOT NULL)";
            statement = this.db.prepare(query);
            statement.run();
        } catch (e) {
            console.error(e.message);
        }
    }

    add_candidates() {
        try {
            let query = "INSERT INTO Results (Candidate, Votes, Last_modified) VALUES (?, ?, ?) ON CONFLICT(Candidate) DO UPDATE SET Votes = ?, Last_modified = ?";
            let statement = this.db.prepare(query);
            let date = Date.now();
            let transaction = this.db.transaction(()=>{
                for (var key of Object.keys(this.candidates)) {
                    statement.run(key, this.candidates[key], date, this.candidates[key], date);
                }
            });
            transaction();
        } catch (e) {
            console.error(e.message);
        }
    }

    get_candidates() {
        try {
            let query = "SELECT * FROM Results";
            let statement = this.db.prepare(query);
            let candidates = statement.all();
            candidates.forEach(candidate => {
                if(this.candidates.hasOwnProperty(candidate.Candidate)){
                    this.candidates[candidate.Candidate] = candidate.Votes;
                }
            });
        } catch (e) {
            console.error(e.message);
        }
    }

    get_height() {
        try {
            let limit = `WHERE Timestamp >= ${this.time_start} AND Timestamp <= ${this.time_end}`;
            let query = `SELECT COUNT(*) AS count FROM Blocks ${limit}`;
            let statement = this.db.prepare(query);
            let res = statement.get();
            return Math.ceil(res.count / this.chunck_size);
        } catch (e) {
            console.error(e.message);
            return 0;
        }
    }

    get_counter_data() {
        try {
            let query = "SELECT * FROM Counter WHERE ID = 1";
            let statement = this.db.prepare(query);
            let res = statement.get();
            this.offset = res.OFFSET;
            this.last_block_hash = res.HASH;
            this.count = this.offset / this.chunck_size;
        } catch (e) {
            console.log("get_counter_data");
            console.error(e.message);
            return 0;
        }
    }

    set_counter(offset, hash) {
        try {
            let query = "UPDATE Counter SET OFFSET = ?, HASH = ? WHERE ID = 1";
            let statement = this.db.prepare(query);
            statement.run(offset, hash);
        } catch (e) {
            console.log("set_counter");
            console.error(e.message);
        }
    }

    get_next_chunk() {
        let limit = `WHERE Timestamp >= ${this.time_start} AND Timestamp <= ${this.time_end} LIMIT ${this.chunck_size} OFFSET ${this.offset}`;
        let query = `SELECT * FROM (SELECT Hash AS BlockHash FROM Blocks ${limit}) Block INNER JOIN Transactions ON Transactions.BlockHash = Block.BlockHash ORDER BY Qi`;
        let statement = this.db.prepare(query);
        let Transactions = statement.all();
        query = `SELECT * FROM Blocks ${limit}`;
        statement = this.db.prepare(query);
        let Blocks = statement.all();
        let blocks = this.create_blocks(Blocks, Transactions);
        blocks.forEach(block => {
            if(block.validate(this.last_block_hash)){
                block.transactions.forEach(tx => {
                    if(this.candidates.hasOwnProperty(tx.vote)){
                        let newer_vote_exits = this.newer_vote_exits(tx.sender, tx.timestamp);
                        if(!newer_vote_exits){
                            this.candidates[tx.vote] += 1;
                        }
                    }
                });
                this.offset++;
                this.last_block_hash = block.hash;
            }
        });
        this.count++;
    }

    create_blocks(blocks, transactions) {
        let res = [];
        blocks.forEach((block) => {
            let block_transactions = [];
            for (let i = 0; i < transactions.length; i++){
                if(block.Hash == transactions[i].BlockHash) {
                    block_transactions.push(transactions[i]);
                }
            }
            let txs = this.create_transactions(block_transactions);
            let _block = new Block(block.Timestamp, txs, block.PreviousHash);
            _block.hash = block.Hash;
            _block.nonce = block.Nonce;
            res.push(_block);
        });
        return res;
    }

    create_transactions(transactions) {
        let result = [];
        transactions.forEach(tx =>{
            let transaction = new Transaction(tx.Sender, tx.Vote, tx.Signature, parseInt(tx.Timestamp), tx.Hash);
            if(transaction.validate()){
                result.push(transaction);
            } else {
                console.log("Invalid tx");
            }
        });
        return result;
    }

    newer_vote_exits(sender, timestamp) {
        let query = "SELECT COUNT() as count FROM Transactions WHERE Sender = ? AND Timestamp > ?";
        let statement = this.db.prepare(query);
        return (statement.all(sender, timestamp)[0].count >= 1);
    }
}
let counter = new Counter(db, workerData.start, workerData.end, workerData.chunck_size, workerData.path);
counter.setup();
parentPort.postMessage(counter.run());