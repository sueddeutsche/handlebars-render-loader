const when = require("when");
const fs = require("fs");
const nodefn = require("when/node");

const readFile = nodefn.lift(fs.readFile);

/**
 * Reads the given partial paths from the file system and calls buildPartialMap for every partial.
 *
 * @param {Array} partialPaths - an array with absolute paths to the partials
 * @param {function} buildPartialMap
 * @returns {Promise}
 */
function findPartials(partialPaths, buildPartialMap) {
    return when
        .map(partialPaths, (partialPath) => readFile(partialPath, "utf8")
        .then((fileContent) => buildPartialMap(fileContent, partialPath))
    );
}


module.exports = findPartials;
