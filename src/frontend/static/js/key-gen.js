const EC = new elliptic.ec('secp256k1');

function hash(tx) {
    tx.hash = sha256(tx.sender + tx.vote + tx.timestamp.toString());
}

function sign(tx, privateKey) {
    let key = EC.keyFromPrivate(privateKey);
    tx.signature = key.sign(tx.hash, 'base64').toDER('hex');
}

async function get_public_from_private(privateKey) {
    let priv = EC.keyFromPrivate(privateKey);
    let pub = await priv.getPublic('hex');
    return pub;
}

function generate_keys() {
    var keys = EC.genKeyPair();
    return keys;
}

async function export_keys(keys, password) {
    if(password){
        let encrypted = await encrypt(keys.getPrivate('hex'), password);
        return {publicKey: keys.getPublic('hex'), privateKey: encrypted};
    }
    return {publicKey: keys.getPublic('hex'), privateKey: keys.getPrivate('hex')};
}