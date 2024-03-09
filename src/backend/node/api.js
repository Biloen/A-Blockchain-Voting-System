const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("better-sqlite3")("chain.db");
const Node = require("./node").Node;
const Transaction = require("./transaction").Transaction;
const arg = require("arg");
const https = require("https");
const fs = require("fs");
const path = require("path");
const {Worker} = require("worker_threads");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const args = arg({
    "--address": String,
    "--port": Number,
    "--start": String,
    "--end": String,
    "--difficulty": Number,
    "--help": Boolean,
    "-h": "--help",
    "-d": "--difficulty"
});

if (args["--help"]) {
    let help = `        --help: Shows this help message
        --address: The ip address to listen on.
        --port: The port to listen on.
        --start: The date the election starts. FORMAT: "yyyy/mm/dd"
        --end: The date the election ends. FORMAT: "yyyy/mm/dd"
        -h: A shorthand alias for --help.`;
    console.log(help);
    process.exit(1);
}

if (!args["--start"]) {
    console.log("missing required argument: --start");
    process.exit(1);
}

if (!args["--end"]) {
    console.log("missing required argument: --end");
    process.exit(1);
}

if (!args["--difficulty"]) {
    console.log("missing required argument: --difficulty");
    process.exit(1);
}

const address = args["--address"] ? args["--address"] : "127.0.0.1";
const port = args["--port"] ? args["--port"] : 3051;
let is_counting = false;
let start = new Date(args["--start"]).valueOf();
let end = new Date(args["--end"]).valueOf();

const node = new Node(args["--difficulty"], db);

node.setup();
run_counter();

app.post("/new/transaction", (req, res)=>{
    let transaction = new Transaction(req.body.sender, req.body.vote, req.body.signature, req.body.timestamp, req.body.hash);
    let error = false;
    for (const [_, value] of Object.entries(req.body)) {
        if(value == undefined || value == "") {
            error = true;
        }
    }
    if (error) {
        res.status(400);
        res.send("{\"status\":\"error\", \"msg\": \"Missing value\"}");
    } else {
        console.log("");
        error = !transaction.validate();
        if(error){
            res.status(400);
            res.send("{\"status\":\"error\", \"msg\": \"Invalid transaction\"}");
        }else {
            node.add_transaction(transaction);
            res.status(200);
            res.send(`{"status":"ok", "result":${JSON.stringify(transaction)}}`);
        }
    }
});

app.post("/get/transaction", (req, res)=>{
    let {transaction, err} = node.get_transaction(req.body.hash);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "msg":"${err.message}"}`);
    } else if (transaction?.ID){
        res.status(200);
        res.send(`{"status":"ok","result":${JSON.stringify(transaction)}}`);
    } else {
        res.status(400);
        res.send(`{"status":"error", "msg":"There is no transaction with the hash ${req.body.hash}"}`);
    }
});

app.post("/get/unconfirmed/transaction", (req, res) => {
    let hash = req.body.hash;
    let unconfirmed = node.transaction_queue.transactions;
    let transaction = undefined;
    unconfirmed.forEach(tx => {
        if (tx.hash === hash){
            transaction = {
                Hash: tx.hash,
                Timestamp: tx.timestamp,
                Vote: tx.vote,
                Signature: tx.signature
            };
        }
    });
    if(transaction){
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify(transaction)}}`);
    } else {
        res.status(400);
        res.send(`{"status":"error", "msg":"No unconfirmed transaction with the hash: ${hash}"}`);
    }
});

app.post("/get/transactions", (req, res)=>{
    let {transactions, err} = node.get_transactions(req.body.block_hash);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "msg":"${err.message}"}`);
    } else {
        let result = [];
        transactions.forEach((tx) => {
            result.push({
                sender: tx.Sender,
                vote: tx.Vote,
                timestamp: tx.Timestamp,
                signature: tx.Signature,
                hash: tx.Hash
            });
        });
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify(result)}}`);
    }
});

app.post("/get/latest/transaction", (req, res) => {
    let {transaction, err} = node.get_latest_transaction(1);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else if (transaction?.ID){
        res.status(200);
        res.send(`{"status":"ok","result":${JSON.stringify(transaction)}}`);
    } else {
        res.status(400);
        res.send("{\"status\":\"error\", \"error\":\"There is no transactions in the blockchain\"}");
    }
});

app.post("/get/block", (req, res)=>{
    let {block,err} = node.get_block(req.body.hash); 
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "msg":"${err.message}"}`);
    } else if (block?.ID) {
        res.status(200);
        res.send(`{"status":"ok","result":${JSON.stringify(block)}}`);
    } else {
        res.status(400);
        res.send(`{"status":"error", "error":"There is no block with the hash ${req.body.hash}"}`);
    }
});

app.post("/get/blocks/date", (req, res)=>{
    let {blocks, err} = node.get_blocks_date(req.body.start, req.body.end);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else {
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify(blocks)}}`);
    }
});

app.post("/get/blocks/height", (req, res)=>{
    let {blocks, err} = node.get_blocks_height(req.body.start, req.body.end);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else {
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify(blocks)}}`);
    }
});

app.post("/get/latest/block", (req, res) => {
    let {block, err} = node.get_latest_blocks(1);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else if (block?.ID){
        res.status(200);
        res.send(`{"status":"ok","result":${JSON.stringify(block)}}`);
    } else {
        res.status(400);
        res.send("{\"status\":\"error\", \"error\":\"There is no transactions in the blockchain\"}");
    }
});

app.post("/get/latest/blocks", (req, res) => {
    let {blocks, err} = node.get_latest_blocks(req.body.limit);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else {
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify(blocks)}}`);
    }
});

app.post("/get/results", (req, res) => {
    let {candidates, err} = node.get_results();
    let {blocks, _err} = node.get_latest_blocks(2);
    if (err) {
        res.status(500);
        res.send(`{"status":"error", "error":"${err.message}"}`);
    } else if (_err){
        res.status(500);
        res.send(`{"status":"error", "error":"${_err.message}"}`);
    } else {
        let file = fs.readFileSync(path.join(__dirname, "../json/parties.json"));
        let parties=JSON.parse(file);
        let party_results = [];
        
        let last_modified = candidates[0].Last_modified;
        let ttm = (blocks[0].Timestamp - blocks[1].Timestamp) / 1000;
        let txs = blocks[1].tx_count/(ttm);
        
        txs = txs.toFixed(2);
        let total_votes = 0;
        
        parties.forEach(party => {
            let party_result = {
                Name: party.Name,
                Color: party.Color,
                Candidates: [],
                Votes: 0,
                Mandates: 0,
                Divisor: 1
            };
            candidates.forEach(candidate => {
                let candidate_result = {
                    Name: "" ,
                    Votes: 0
                };
                if(party.Char == candidate.Candidate[1] ||candidate.Candidate == party.Name){
                    party_result.Votes += candidate.Votes;
                    total_votes += candidate.Votes;
                    if(`[${party.Char}]` != candidate.Candidate && candidate.Candidate != "Blankt"){
                        candidate_result.Name = candidate.Candidate.substring(4);
                        candidate_result.Votes = candidate.Votes;
                        party_result.Candidates.push(candidate_result);
                    }
                }
            });
            party_results.push(party_result);
        });
        res.status(200);
        res.send(`{"status":"ok", "result":${JSON.stringify({parties: party_results, total_votes, ttm, txs, last_modified})}}`);
    }
});

/*
    DEFAULT ROUTE
*/
app.use((req, res) => {
    res.status(404);
    res.send("{status:'404'}");
});

/*
    LAUNCH APP
*/
const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, "../certs/private.key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "../certs/domain.cert.pem")),
}, app);
  
httpsServer.listen(port, () => {
    console.log(`Blockchain is running on ${address}:${port}`);
});

async function run_counter() {
    setInterval(async function(){ 
        if(!is_counting){
            is_counting = true;
            const worker = new Worker(path.join(__dirname,"../helpers/counter.js"), {workerData: {db: "chain.db", start, end, path: "../json/parties.json", chunck_size: 100}});

            //Listen for a message from worker
            worker.once("message", result => {
                console.log(`Updated results at ${new Date(result)}`);
                is_counting = false;
            });
            
            worker.on("error", error => {
                console.log(error);
                is_counting = false;
            });
        }
    }, 1000*60);
}