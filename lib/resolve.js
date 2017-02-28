const when = require("when");
const path = require("path");
const onError = require("./onError");

const hasExtension = /\.[^/]+$/;
const defaultExtension = ".hbs";

function single(loaderApi, url, context) {
    return when.promise((resolve, reject) => {
        if (hasExtension.test(url) === false) {
            url += defaultExtension;
        }

        loaderApi.resolve(path.dirname(context), url, (err, absolutePath) => {
            if (err) {
                return reject(
                    new Error(`Cannot resolve partial '${url}' referenced in ${context}: ${err.message}`)
                );
            }
            return resolve(absolutePath);
        });
    }).catch(onError(context));
}

function multiple(loaderApi, urls, context) {
    return when.map(urls, (url) => single(loaderApi, url, context));
}


exports.single = single;
exports.multiple = multiple;
