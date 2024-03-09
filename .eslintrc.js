module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "plugins": [
        "snakecasejs"
    ],
    "settings":
    {
        "snakecasejs/filter": ["ClassDeclaration", "NewExpression"],
        "snakecasejs/whitelist": ["readFileSync", "createServer", "httpsServer", "isMobile", "isTablet", "registerHelper", "bodyParser", "postMessage", "workerData", "parentPort", "cookieParser", "randomBytes", "expiresIn", "dateOfBirth", "privateKey", "keyFromPublic", "publicKey", "PreviousHash", "BlockHash", "hasOwnProperty"]
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "snakecasejs/snakecasejs": "error"
    }
};
