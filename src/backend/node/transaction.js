const EC = new require("elliptic").ec("secp256k1");
const SHA256 = new require("../helpers/sha256");
class Transaction {
    constructor(sender, vote, signature, timestamp, hash){
        this.sender = sender; 
        this.vote = vote;
        this.signature = signature;
        this.timestamp = timestamp;
        this.hash = hash;
    }

    // This function checks if a given transaction is of the correct format
    validate(){
        if(!this.sender || this.sender.length === 0){
            console.log("Transaction doesn't have a sender.");
            return false;
        }
        
        if(!(this.hash === this.calculate_hash())){
            console.log("Transaction has been modified.");
            return false;
        }
    
        if(!this.signature || !this.signature.length === 0){
            console.log("Transaction doesn't have a signature.");
            return false;
        }
        try {
            let publicKey = EC.keyFromPublic(this.sender, "hex");
            if(!publicKey.verify(this.hash, this.signature)){
                console.log("Transaction doesn't have a valid signature.");
                return false;
            }
        } catch(e){
            return false;
        }
        return true;
    }

    calculate_hash(){
        return SHA256(this.sender + this.vote + this.timestamp.toString());
    }
}

module.exports.Transaction = Transaction;