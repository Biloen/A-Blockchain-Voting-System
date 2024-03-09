const express = require("express");
const useragent = require("express-useragent");
const handlebars  = require("express-handlebars");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fs = require("fs");
const arg = require("arg");
const https = require("https");
const hbs_helpers = require("./helpers/handlebar");
const data_manager = require("./helpers/data");
const auth = require("./helpers/authentication");
const hbs = handlebars.create({
    extname      :"hbs",
});

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../frontend/views"));

const args = arg({
    "--address": String,
    "--port": Number,
    "--api": String,
    "--help": Boolean,
    "-h": "--help"
});

if (args["--help"]) {
    let help = `        --help: Shows this help message
        --address: The ip address to listen on.
        --port: The port to listen on.
        --api: The address and port of the API server. FORMAT "PROTOCOL://IP:PORT"
        -h: A shorthand alias for --help.`;
    console.log(help);
    process.exit(1);
}

if (!args["--api"]) {
    console.log("missing required argument: --api");
    process.exit(1);
}
/* CONST VALUES */
const address = "https://" + (args["--address"] ? args["--address"] : "127.0.0.1");
const port = args["--port"] ? args["--port"] : 3050;
const API = args["--api"];
/* Helper functions */

hbs_helpers.register_helpers(hbs, hbs_helpers.helpers);

function render_device(req, res, view, options) {
    let source = req.headers["user-agent"];
    let device_info = useragent.parse(source);
    let device = "desktop";
    
    if(device_info.isMobile) device = "mobile";
    if(device_info.isTablet) device = "tablet";
    options.layout = device;
    res.render(view+"/"+device, options);
}


/*
    STATIC ROUTES
*/
/* 
    This makes it so that every file in the /frontend/static folder and subfolders
    is accesible. SAMPLE /css/styles.css 
*/
app.use(express.static(__dirname + "/../frontend/static"));

data_manager.initialise_database();

/*
    GET ROUTES
    ROUTES are based on the miro board atm https://miro.com/app/board/o9J_lMFkjVo=/ 
*/


app.use(auth.valid_token);

app.get("/", (req, res) => {  
    /*
        res render generates a html file based on the 
        content of the default layout "main" and the view
        specified by the first parameter. These files can be
        found in "/fronted/views/". The ".hbs" is 
        automatically added so you dont need to specify it.
        You can added as many custom json parameters to the template
        these can be accessed using {{"name of variable"}}.
        json parameters can be accesed by layouts, views and partials.
        Look here for default helper functions https://handlebarsjs.com/guide/builtin-helpers.html
    */

        
    let events=fs.readFileSync(path.join(__dirname, "/json/events.json"));
    let politicians=fs.readFileSync(path.join(__dirname,"/json/politicians.json"));

    politicians=JSON.parse(politicians);
    events=JSON.parse(events);

    render_device(req, res, "index", {
        Title:"index",
        Event:events,
        Politician:politicians,
        logged_in: req.is_logged_in
    });
});

app.get("/results", (req, res)=>{
    render_device(req, res, "results", {
        Title:"results",
        API: API,
        logged_in: req.is_logged_in
    });
});

app.get("/contact", (req, res) => {
    render_device(req, res, "contact", {
        Title:"contact",
        logged_in: req.is_logged_in
    });
});

app.get("/login", (req, res) => {
    render_device(req, res, "login", {
        Title:"login",
    });
});

app.get("/logout", (req, res) => {
    render_device(req, res, "logout", {
        Title:"logout",
    });
});

/*
    These paths should be protected!
    If a user that is not logged in tries
    to go this page they should be redirected to the login
    page. 
*/

app.get("/vote", auth.authenticate_jwt,(req, res) => {
    let file = fs.readFileSync(path.join(__dirname, "/json/parties.json"));
    let parties=JSON.parse(file);
    render_device(req, res, "vote", {
        Title:"vote",
        Party:parties,
        Privatekey: req.user.Privatekey,
        API: API,
        logged_in: req.is_logged_in
    });
});

app.get("/accountsettings", auth.authenticate_jwt, (req, res) => {
    render_device(req, res, "settings", {
        Title: "Account Settings",
        logged_in: req.is_logged_in
    });
});

app.get("/transaction/", auth.authenticate_jwt, (req, res) => {  
    if(req.query?.tx){
        render_device(req, res, "transaction", {
            Title:"Transaction",
            Hash: req.query.tx,
            Back: req.query.back,
            API: API,
            logged_in: req.is_logged_in
        });
    } else {
        res.status(404);
        res.send(`You are trying to access the path: "${req.path}" using the method "${req.method}" and this is<h1>No, no. Very bad!</h1>`);
    }
});

app.get("/transactions/", auth.authenticate_jwt, (req, res) => {
    if(req.query?.hash){
        render_device(req, res, "transactions", {
            Title:"Transactions",
            Hash: req.query.hash,
            Back: req.query.back,
            API: API,
            logged_in: req.is_logged_in
        });
    } else {
        res.status(404);
        res.send(`You are trying to access the path: "${req.path}" using the method "${req.method}" and this is<h1>No, no. Very bad!</h1>`);
    }
});

app.get("/explorer/", auth.authenticate_jwt, (req, res) => {
    if(req.query?.start & req.query?.end){
        render_device(req, res, "explorer", {
            Title:"Explorer",
            Start: req.params.start,
            End: req.params.end,
            API: API,
            logged_in: req.is_logged_in
        });
    } else {
        render_device(req, res, "explorer", {
            Title:"Explorer",
            Start: 0,
            End: 10,
            API: API,
            logged_in: req.is_logged_in
        });
    }
});

/*
    POST ROUTES
*/

app.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        let json = JSON.stringify({
            status: "error",
            msg: "Either username or password was not provided",
        });
        res.status(400).send(json);
    } else {
        let {user, err} = data_manager.get_user(username);
        if (err){
            let json = JSON.stringify({
                status: "error",
                msg: err.message,
            });
            res.status(200).send(json);
        } else if (user){
            if(user.Password === password) {
                let json = JSON.stringify({
                    status: "ok",
                    msg: "Logged in successfully",
                });
                res.cookie("jwt", auth.generate_access_token(user.Email, user.Password, "1d"));
                res.status(200).send(json);
            } else {
                let json = JSON.stringify({
                    status: "error",
                    msg: "Wrong username or password was provided",
                });
                res.status(400).send(json);
            }
        } else {
            let json = JSON.stringify({
                status: "error",
                msg: "Wrong username or password was provided",
            });
            res.status(400).send(json);
        }
    }
});

app.post("/signup", (req, res) => {
    let user = {
        name: req.body.name,
        address: req.body.address,
        dateOfBirth: req.body.dateOfBirth,
        verification: req.body.verification,
        email: req.body.email,
        password: req.body.password,
        cpassword: req.body.cpassword,
        privateKey: req.body.privateKey
    };
    let {_user, err} = data_manager.get_user(user.email);
    if(err){
        let json = JSON.stringify({
            status: "error",
            msg: err.message,
        });
        res.status(500).send(json);
    } else if(_user?.ID) {
        let json = JSON.stringify({
            status: "error",
            msg: "User is already in the database",
        });
        res.status(400).send(json);
    } else {
        let error = auth.validate_email(user.email);
        if (error) {
            let json = JSON.stringify({
                status: "error",
                msg: error,
            });
            res.status(400).send(json);
        } else {
            delete user.cpassword;
            let err = data_manager.add_user(user);
            if(err) {
                let json = JSON.stringify({
                    status: "error",
                    msg: err.message,
                });
                res.status(500).send(json);
            } else {
                let json = JSON.stringify({
                    status: "ok",
                    msg: "Succesfully added the user to the database",
                });
                res.status(200).send(json);
            }
        }
    }
});

app.post("/logout", (req, res) => {
    res.status(200);
    res.header("set-cookie", "jwt=; max-age=0");
    res.send("{\"status\":\"ok\", \"msg\":\"Successfully loggedout\"}");
});

/*
    DEFAULT ROUTE
*/
app.use((req, res) => {
    res.status(404);
    res.send(`You are trying to access the path: "${req.path}" using the method "${req.method}" and this is<h1>No, no. Very bad!</h1>`);
});


/*
    LAUNCH APP
*/
const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, "./certs/private.key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "./certs/domain.cert.pem")),
}, app);
  
httpsServer.listen(port, () => {
    console.log(`Big boi voting system ${address}:${port}`);
});