const assert = require("chai").assert;
const Queue = require("../src/backend/node/Queue").Queue;

describe("Queue", function() {
    let queue = new Queue();
    
    it("Create queue", function() {
        assert.equal(queue.length(), 0);
        assert.deepEqual(queue.transactions, []);
    });

    it("Enqueue", function() {
        queue.enqueue(1);
        assert.equal(queue.transactions[queue.length()-1], 1);
        queue.enqueue(69);
        assert.equal(queue.transactions[queue.length()-1], 69);
        queue.enqueue(360);
        assert.equal(queue.transactions[queue.length()-1], 360);
        queue.enqueue(420);
        assert.equal(queue.transactions[queue.length()-1], 420);
        queue.enqueue(1337);
        assert.equal(queue.transactions[queue.length()-1], 1337);
    });

    it("Dequeue", function() {
        assert.equal(queue.dequeue(), 1);
        assert.equal(queue.dequeue(), 69);
        assert.equal(queue.dequeue(), 360);
        assert.equal(queue.dequeue(), 420);
        assert.equal(queue.dequeue(), 1337);
    });
});