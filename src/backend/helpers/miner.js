const Block = require("../node/block").Block;
const {parentPort, workerData} = require("worker_threads");

parentPort.postMessage(mine(workerData.tx_queue, workerData.previous_block_hash, workerData.difficulty));

function mine(tx_queue, previous_block_hash, difficulty) {
    let block = new Block(Date.now(), tx_queue, previous_block_hash);
    block.mine_block(difficulty);
    return block;
}