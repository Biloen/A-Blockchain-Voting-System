window.onload = () => {
    fetch(`${API}/get/transactions`, {
        method: "post",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({block_hash: block_hash})
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status != "ok"){
            console.log("[ERROR]: "+data.msg);
        } else {
            let transactions = data.result;
            for (let i = 0; i < transactions.length; i++){
                insert_transaction(transactions[i]);
            }
        }
    });
    document.getElementById("back").onclick = back;
};

function insert_transaction(transaction){
    let res = `
        <tr>
            <td id="hash">${transaction.hash}</td>
            <td id="timestamp">${new Date(parseFloat(transaction.timestamp))}</td>
            <td id="vote">${transaction.vote}</td>
            <td id="signature">${transaction.signature}</td>
        </tr>
    `;
    document.getElementById("transactions").innerHTML += res;
}

function back() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if(urlParams.getAll("back")){
        window.location.href = urlParams.getAll("back");
    }
}