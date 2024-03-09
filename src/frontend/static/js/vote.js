// Requires you to import both sha256, elliptic and key-gen
async function send_tx(vote, password) {
    // get vote from site
    let tx = {
        sender: "",
        vote: vote,
        timestamp: Date.now(),
        signature: "",
        hash: ""
    };
    
    let private_key = await decrypt_data(private_key_enc, password);
    tx.sender = await get_public_from_private(private_key);
    
    hash(tx);
    
    sign(tx, private_key);

    fetch(`${API}/new/transaction`,{method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(tx)})
        .then(res => res.json())
        .then(res => {
            if(res.status == "ok"){
                window.location.href = `/transaction?tx=${res.result.hash}&back=/`;
            }
        });
}

window.onload = () => {
    document.getElementById("submit").onclick = () => {
        let password = document.getElementById("show-password").value;
        let vote = "";
        if(document.candidate != null){
            vote = `[${document.char}] ${document.candidate}`;
        } else {
            vote = `[${document.char}]`;
        }
        console.log(vote);
        send_tx(vote, password);
    };
    document.querySelectorAll("input[type='checkbox']").forEach( field => {
        field.addEventListener("change", (event) => {
            document.candidate = event.target.getAttribute("candidate");
            if(document.candidate != null){
                document.char = event.target.parentNode.parentNode.parentNode.getAttribute("party");
            } else {
                document.char = event.target.getAttribute("party");
            }
            document.querySelectorAll(`input[name="${event.target.name}"]`).forEach(item => {
                if(item != event.target){
                    item.checked = false;
                }
            });
        });
    });
};

function show_password() {
    let x = document.getElementById("show-password");
    let y = document.getElementById("show-repeated-password");
    if (x.type === "password") {
        document.getElementById("eye").src = "./media/eye-uncheck.svg";
        x.type = "text";
        if(y){
            y.type ="text";
        }
    } else {
        document.getElementById("eye").src = "./media/eye.svg";
        x.type = "password";
        if(y){
            y.type ="password";
        }
    }
}