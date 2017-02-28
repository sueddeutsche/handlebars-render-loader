const parse = require("./parse");
const resolve = require("./resolve");
const fs = require("fs");
const when = require("when");
const nodefn = require("when/node");

const forbiddenPartialIdChars = /^\//;
const readFile = nodefn.lift(fs.readFile);

function build(loaderApi, map, content, context) {
    const source = parse(content);

    return resolve.multiple(loaderApi, source.partials, context)
        .then((absolutePaths) => {
            source.partials = absolutePaths;
            map[context] = source;

            return when
                .map(removeDuplicates(map, source.partials.slice()), (currentPath) =>
                    readFile(currentPath, "utf8")
                        .then((fileContent) => build(loaderApi, map, fileContent, currentPath))
                );
        });
}

function finalize(map) {
    var serialized = {};

    Object.keys(map).forEach((partialId) => {
        const source = map[partialId];
        source.partials = source.partials.map(pathToPartialId);
        // TODO Check for conflict. These conflicts are *very* unlikely to occur as the id is based on the absolute
        // path. But there is the possibility.
        serialized[pathToPartialId(partialId)] = source.toString();
    });

    return serialized;
}

function pathToPartialId(absolutePath) {
    return absolutePath.replace(forbiddenPartialIdChars, "");
}

function removeDuplicates(map, paths) {
    return paths.filter((path) => path in map === false);
}

exports.build = build;
exports.finalize = finalize;
exports.pathToPartialId = pathToPartialId;
