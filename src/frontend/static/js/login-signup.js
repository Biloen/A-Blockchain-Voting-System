function login_singup_change(event) {
    let login = document.getElementById("login");
    let signup = document.getElementById("signup");
    let gridcontainer = document.getElementById("grid-container");

    if(event.target == signup){
        if(!signup.classList.contains("active")){
            gridcontainer.innerHTML = signupform;
        }
    }
    else if(!login.classList.contains("active")){
        gridcontainer.innerHTML = loginform;
    }
}

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

function back_to_login() {
    let gridcontainer = document.getElementById("grid-container");
    gridcontainer.innerHTML = loginform;
}

function login() {
    let password = document.getElementById("show-password").value;
    let username = document.querySelector("[placeholder='Username']").value;

    let errors = validate_password(password, password);
    let uerrors = validate_email(username);
    errors.concat(uerrors);
    
    if(errors.length > 0){
        print_errors(errors, document.getElementById("grid-container"));
    } else {
        let hpassword = sha256(password);
        let user = {
            username: username,
            password: hpassword
        };
        fetch("/login",{
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(user)
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.status != "ok"){
                console.log("[ERROR]: "+data.msg);
            } else {
                console.log("[INFO]: "+data.msg);
                document.location.href = "/";
            }
        });
    }
}

async function signup() {
    let user = {
        name: {
            first: document.querySelector("[placeholder='First name']").value,
            last: document.querySelector("[placeholder='First name']").value,
        },
        address: {
            line1: document.querySelector("[placeholder='Address line 1']").value,
            line2: document.querySelector("[placeholder='Address line 2']").value,
        },
        dateOfBirth: document.querySelector("[type='date']").value,
        verification: {
            ssn: document.querySelector("[placeholder='Social security number']").value,
            passport: document.querySelector("[placeholder='Passport number']").value,
            driverslicense: document.querySelector("[placeholder='Drivers license number']").value,
        },
        email: document.querySelector("[placeholder='E-mail']").value,
        password: document.getElementById("show-password").value,
        cpassword: document.getElementById("show-repeated-password").value,
        privateKey: ""
    };
    let keys = await export_keys(generate_keys(), user.password);
    user.privateKey = keys.privateKey;

    // now verify each field
    
    let uerrors = validate_email(user.email);
    let perrors = validate_password(user.password, user.cpassword);
    let errors = uerrors.concat(perrors);

    if (errors.length > 0) {
        print_errors(errors, document.getElementById("grid-container"));
    } else {
        user.password = sha256(user.password);
        user.cpassword = sha256(user.cpassword);

        fetch("/signup",{
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(user)
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.status != "ok"){
                console.log("[ERROR]: "+data.msg);
            } else {
                console.log("[INFO]: "+data.msg);
                let gridcontainer = document.getElementById("grid-container");
                gridcontainer.innerHTML = registered;
            }
        });
    }
}

function validate_email(email) {
    let errors = [];
    /* https://stackoverflow.com/a/201378 OR RFC 5322 */
    if(!email.match(/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)){
        errors.push("Please enter a valid email address");
    }
    return errors;
}

function validate_password(password, cpassword) {
    let errors = [];
    if(!(password === cpassword)){
        errors.push("Passwords must match.");
    }
    if(password.length > 15 || password.length < 7){
        errors.push("Password should be between 7 and 15 characters.");
    }
    if(!password.match(/^(?=.*[a-z])/)){
        errors.push("Password must contain at least one lowercase character.");
    }
    if(!password.match(/^(?=.*[A-Z])/)){
        errors.push("Password must contain at least one uppercase character.");
    }
    if(!password.match(/^(?=.*[0-9])/)){
        errors.push("Password must contain at least one number.");
    }
    if(!password.match(/^(?=.*[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-])/)){
        errors.push("Password must contain at least one special character.");
    }
    return errors;
}

function print_errors(errors, element){
    let errorsString = "";
    for(let i = 0; i < errors.length; i++){
        errorsString += errors[i] + "<br>";
    }
    errorsStringFull  = `<div class="error" id="error"> 
                        ${errorsString}
                    </div>`;
    let errorsElement = document.getElementById("error");
    if(!errorsElement){
        element.innerHTML = errorsStringFull + element.innerHTML;
    } else {
        errorsElement.innerHTML = errorsString;
    }
}