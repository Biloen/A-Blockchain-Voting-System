const db = require("better-sqlite3")("login.db");

function add_user(user){
    let err = undefined;
    try{
        let user_array = [user.name.first, user.name.last, user.email, user.password, user.address.line1,  user.address.line2,  user.dateOfBirth,  user.verification.ssn, user.verification.passport, user.verification.driverslicense, user.privateKey, Date.now()];
        let placeholders = user_array.map(() => "(?)").join(",");
        let query = "INSERT INTO Users (Firstname, Lastname, Email, Password, Address1, Address2, DateOfBirth, SSN, Passport, DriversLicense, Privatekey, Timestamp) VALUES (" + placeholders + ")";
        let statement = db.prepare(query);
        statement.run(...user_array);
    } catch (e) {
        err = e;
    }
    return err;
}

function get_user(email) {
    let err = undefined;
    let user = undefined;
    try {
        let sql = "SELECT * FROM Users WHERE Email = (?)";
        // first row only
        let statement = db.prepare(sql);
        user = statement.get(email);
    } catch (e) {
        err = e;
    }
    return {user, err};
}

function initialise_database(){
    try {
        let query = "CREATE TABLE IF NOT EXISTS Users(ID INTEGER not null PRIMARY KEY AUTOINCREMENT, Firstname TEXT NOT NULL, Lastname text not null, Email TEXT NOT NULL, Password text not null , Address1 TEXT NOT NULL, Address2 TEXT NOT NULL, DateOfBirth DATE NOT NULL , SSN TEXT NOT NULL, Passport TEXT NOT NULL, DriversLicense TEXT NOT NULL, Privatekey TEXT NOT NULL, Timestamp DATE NOT NULL)";
        let statement = db.prepare(query);
        statement.run();
    } catch (e) {
        console.error(e.message);
    }
}

module.exports = {
    get_user,
    add_user,
    initialise_database
};