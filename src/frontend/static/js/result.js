window.onload = () => {
    fetch(`${API}/get/results`,{
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status != "ok"){
            console.log("[ERROR]: "+data.msg);
        } else {
            let colors = [];
            let labels = [];
            let values = [];
            data.result.parties.forEach((party)=>{
                values.push(party.Votes);
                labels.push(party.Name);
                colors.push(party.Color);
            });
            console.log(`Total votes: ${data.result.total_votes}`);
            console.log(`TX/s: ${data.result.txs}`);
            console.log(`Time to mine: ${data.result.ttm}s`);
            let mandate_parties = data.result.parties;
            mandates(mandate_parties);
            
            data.result.parties.forEach((party)=>{
                let labels = [];
                let values = [];
                let greaterThanZero = 0;
                if(party.Name != "Blankt"){
                    party.Candidates.forEach((candidate)=>{
                        labels.push(candidate.Name);
                        values.push(candidate.Votes);
                        if(candidate.Votes > 0) greaterThanZero++;
                    });
                    if(greaterThanZero) create_chart(labels, values, colors, party.Name);
                }
            });
            create_chart(labels, values, colors, "Parties");
            document.getElementById("last_modified").innerText = new Date(data.result.last_modified);
            document.getElementById("back").onclick = back;
        }
    });
}

function create_chart(labels, values, colors, title) {
    let element = document.createElement("canvas");
    element.classList.add("chart");
    var ctx = element.getContext('2d');
    
    const data = {
        labels: labels,
        datasets: [{
            label: 'My First Dataset',
            data: values,
            backgroundColor: colors,
            hoverOffset: 4
        }]
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                    onHover: handle_hover,
                    onLeave: handle_leave
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 24
                    }
                }
            }
        }
    });
    
    document.getElementById('charts').appendChild(element);
}

// Append '4d' to the colors (alpha channel), except for the hovered index
function handle_hover(evt, item, legend) {
    legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
        colors[index] = index === item.index || color.length === 9 ? color : color + '4D';
    });
    legend.chart.update();
}

function handle_leave(evt, item, legend) {
    legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
        colors[index] = color.length === 9 ? color.slice(0, -2) : color;
    });
    legend.chart.update();
}

function back() {
    window.location.href = "/";
}

function validate_parties(parties, accumulatedVotes) {
    /*In case each party has not received at least two percent of
    * the total votes, they are removed from the array, since they
    * are not eligible to receive mandates/seats.*/
    for(let i=0; i<parties.length; i++){
        if(parties[i].totalVotes < accumulatedVotes*0.02){
            parties.splice(i,1);
        }
    }
}

function district_mandates(parties, mandatesPerDistrict){
    /*The mandates for each district are distributed by giving them to
    * the party with the highest quotient when dividing the number of votes
    * they received by their divisor*/
    let index=0;
    for(let i=0; i<mandatesPerDistrict; i++){
        for(let j=0; j<parties.length; j++){
            if(parties[j].Votes/parties[j].Divisor >
                parties[index].Votes/parties[index].Divisor){
             index = j;
            }
        }
        parties[index].Mandates++;
        parties[index].Divisor++;
        index = 0;
    }
    reset_divisor(parties)
}

function additional_mandates(parties){
    /*Same principle as when distributing the district mandates
    *  except the number of additional mandates is always 40
    * and the divisor increases by two.*/
    let index=0;
    const additionalMandates = 40;
    for(let i=0; i<additionalMandates; i++){
        for(let j=0; j<parties.length; j++){
            if(parties[j].totalVotes/parties[j].divisor>parties[index].totalVotes/parties[index].divisor){
                index = j;
            }
        }
        parties[index].mandates++;
        parties[index].divisor+=2;
        index = 0;
    }
}

function reset_divisor(parties){
    /*The divisor is reset for each new distict*/
    for(let i=0; i<parties.length; i++){
        parties[i].divisor = 1;
    }
}


function mandates(parties){
    let labels = [];
    let values = [];
    let colors = [];
    parties.splice(13,1); // remove blankt
    district_mandates(parties, 19); // What do i put here ???? 
    validate_parties(parties);

    parties.forEach((party)=>{
        labels.push(party.Name);
        values.push(party.Mandates);
        colors.push(party.Color);
    });

    create_chart(labels, values, colors, "Mandates");
}