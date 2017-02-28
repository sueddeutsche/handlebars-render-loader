/* eslint no-sync: 0 */
const fs = require("fs");
const path = require("path");
const files = fs.readdirSync(__dirname);


files
    .filter((file) => path.extname(file) === ".hbs")
    .forEach((file) => {
        const basename = path.basename(file, ".hbs");
        const content = fs.readFileSync(path.join(__dirname, file), "utf8");
        module.exports[basename] = content;
    });
