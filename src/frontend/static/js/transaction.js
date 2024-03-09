window.onload = () => {
    fetch(`${API}/get/transaction`, {
        method: "post",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({hash: tx_hash})
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status != "ok"){
            fetch(`${API}/get/unconfirmed/transaction`, {
                method: "post",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({hash: tx_hash})
            }).then(response => {
                return response.json();
            }).then(data => {
                if (data.status != "ok"){
                    console.log("[ERROR]: "+data.msg);
                } else {
                    insert_vote(data.result, "False");
                }
            });
        } else {
            insert_vote(data.result, "True");
        }
    });
    document.getElementById("back").onclick = back;
};

function insert_vote(tx, tx_confirmed) {
    const timestamp = document.getElementById("timestamp");
    const vote = document.getElementById("vote");
    const signature = document.getElementById("signature");
    const confirmed = document.getElementById("confirmed");
    const block = document.getElementById("block");
    timestamp.innerText = new Date(parseFloat(tx.Timestamp));
    vote.innerText = tx.Vote;
    signature.innerText = tx.Signature;
    confirmed.innerText = tx_confirmed;
    block.innerText = tx_confirmed ? tx.BlockHash : "Null";
}

function back() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if(urlParams.getAll("back")){
        window.location.href = urlParams.getAll("back");
    }
}