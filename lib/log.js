const chalk = require("chalk");


function log(enableLog) {
    const args = Array.prototype.slice.call(arguments, 1); // eslint-disable-line prefer-rest-params

    if (enableLog) {
        args.unshift(chalk.gray("HandlebarsRenderLoader:"));
        console.log.apply(console, args);
    }
}


module.exports = log;
