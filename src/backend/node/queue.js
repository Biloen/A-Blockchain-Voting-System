// The queue class is used for helping with transaction management
class Queue { 
    constructor(){
        this.transactions = [];
    }

    enqueue(tx){
        this.transactions.push(tx);
    }

    dequeue(){
        return this.transactions.shift();
    }

    length(){
        return this.transactions.length;
    }
}

module.exports.Queue = Queue;