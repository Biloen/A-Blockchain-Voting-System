function logout(){
    fetch("./logout",{
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
            console.log("[INFO]: "+data.msg);
            document.getElementById("logout").style.display="none";
            document.getElementById("loggedout").style.display="block";
            document.getElementById("headerid").style.display="none";
        }
    });
}	

window.addEventListener('load',(event) =>{
    document.getElementById("loggedout").style.display="none";
});

function back () {
    window.location.href = "/"
}