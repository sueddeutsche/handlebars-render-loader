/**
 * Returns a error callback which attaches the given context to the error and re-throws the error.
 *
 * @param {string} context
 * @returns {function}
 */
function onError(context) {
    return function (err) {
        err.context = context;
        throw err;
    };
}

module.exports = onError;
