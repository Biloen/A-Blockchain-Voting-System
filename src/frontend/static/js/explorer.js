const chunck_size = 10;

window.onload = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let height = urlParams.getAll("height");
    if(height.length > 0){
        height = parseInt(height);
        fetch(`${API}/get/blocks/height`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({start: height-10, end: height})
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.status == "ok"){
                let blocks = data.result;
                if(blocks.length >= 1){
                    window.block_height_max = height;
                    window.current_height = height;
                    document.getElementById("explorer").innerHTML = "<table class='explorer_table' id='explorer'><tr><th>Hash</th><th>Height</th><th>Timestamp</th><th>Nonce</th></tr></table>";
                    for (let i = blocks.length-1; i >= 0; i--){
                        insert_block(blocks[i], height);
                    }
                }
            }
        });
    } else {
        fetch(`${API}/get/latest/blocks`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({limit: 10})
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.status == "ok"){
                let blocks = data.result;
                window.block_height_max = blocks[0].ID;
                for (let i = 0; i < blocks.length; i++){
                    insert_block(blocks[i], get_current_height());
                }
            }
        });
    }
    document.getElementById("next").onclick = next;
    document.getElementById("back").onclick = back;
    document.getElementById("search").onclick = search;
}

function insert_block(block, height){
    let res = `
        <tr>
            <td id="hash"><a href="/transactions?hash=${block.Hash}&back=/explorer?height=${height}">${block.Hash}<a></td>
            <td id="height">${block.ID}</td>
            <td id="timestamp">${new Date(parseFloat(block.Timestamp))}</td>
            <td id="nonce">${block.Nonce}</td>
        </tr>
    `;
    document.getElementById("explorer").innerHTML += res;
}

function next(){
    let start = get_current_height();
    let end = start + chunck_size;
    fetch(`${API}/get/blocks/height`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({start, end})
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status != "ok"){

        } else {
            let blocks = data.result;
            if(blocks.length >= 1){
                document.getElementById("explorer").innerHTML = "<table class='explorer_table' id='explorer'><tr><th>Hash</th><th>Height</th><th>Timestamp</th><th>Nonce</th></tr></table>";
                for (let i = blocks.length-1; i >= 0; i--){
                    insert_block(blocks[i], blocks[blocks.length - 1].ID);
                }
                window.current_height = blocks[blocks.length - 1].ID;
            }
        }
    });
}

function get_current_height() {
    if(window?.current_height){
        return window.current_height;
    } else {
        return window.block_height_max;
    }
}

function back(){
    let end = get_current_height();
    let start = end - chunck_size;
    fetch(`${API}/get/blocks/height`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({start, end})
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status == "ok"){
            let blocks = data.result;
            if(blocks.length >= 1){
                document.getElementById("explorer").innerHTML = "<table class='explorer_table' id='explorer'><tr><th>Hash</th><th>Height</th><th>Timestamp</th><th>Nonce</th></tr></table>";
                for (let i = blocks.length-1; i >= 0; i--){
                    insert_block(blocks[i], blocks[0].ID);
                }
                window.current_height = blocks[0].ID;
            }
        }
    });
}

function search(){
    let hash = document.getElementById("search-input").value;
    let height = get_current_height();
    fetch(`${API}/get/block`, {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({hash: hash})
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status != "ok"){
            fetch(`${API}/get/transaction`, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({hash: hash})
            }).then(response => {
                return response.json();
            }).then(data => {
                if (data.status != "ok"){
                    fetch(`${API}/get/unconfirmed/transaction`,{
                        method: 'post',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({hash: hash})
                    }).then(response => {
                        return response.json();
                    }).then(data => {
                        if (data.status == "ok"){
                            window.location.href = `/transaction?tx=${data.result.Hash}&back=/explorer?height=${height}`;
                        }
                    });
                } else {
                    window.location.href = `/transaction?tx=${data.result.Hash}&back=/explorer?height=${height}`;
                }
            });
        } else {
            window.location.href = `/transactions?hash=${data.result.Hash}&back=/explorer?height=${height}`;
        }
    });
}