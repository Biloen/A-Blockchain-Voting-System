const jwt = require("jsonwebtoken");
const data_manager = require("./data");
const access_token_secret = require("crypto").randomBytes(64).toString("hex");

function validate_email(email) {
    let errors = "";
    /* https://stackoverflow.com/a/201378 OR RFC 5322 */
    if(!email.match(/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)){
        errors = "Please enter a valid email address";
    }
    return errors;
}

function generate_access_token(username, password, expiresIn) {
    return jwt.sign({username, password}, access_token_secret, { expiresIn });
}

function valid_token(req, res, next) {
    const token = req.cookies?.jwt;
    jwt.verify(token, access_token_secret, (err) => {
        if (err) {
            req.is_logged_in = false;
        } else {
            req.is_logged_in = true;
        }
        next();
    });
}

function authenticate_jwt(req, res, next) {
    const token = req.cookies?.jwt;
    if (token) {
        jwt.verify(token, access_token_secret, (err, data) => {
            if (err) {
                res.redirect("/login");
                return;
            }
            let {user, _err} = data_manager.get_user(data.username);
            if(_err){
                let json = JSON.stringify({
                    status: "error",
                    msg: _err.message,
                });
                res.status(200);
                res.send(json);
            } else if(user.Password === data.password){
                req.user = user;
                req.logged_in = true;
                next();
            } else {
                let json = JSON.stringify({
                    status: "error",
                    msg: "Invalid password",
                });
                res.status(200);
                res.send(json);
            }
        });
    } else {
        res.redirect("/login");
    }
}

module.exports = {
    validate_email,
    generate_access_token,
    authenticate_jwt,
    valid_token
};