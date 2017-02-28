const when = require("when");
const nodefn = require("when/node");
const fs = require("fs");
const glob = nodefn.lift(require("glob"));
const pathUtil = require("path");
const onError = require("./onError");

const getRealPath = nodefn.lift(fs.realpath);

function pathToHelperId(path) {
    const fileName = pathUtil.basename(path, ".js");
    return fileName.replace(/\.helper$/, "");
}

function build(map, helpers) {
    return when
        .map(helpers, (helper) => glob(helper)
            .then((absolutePaths) => when
                // We need to translate absolutePaths in real paths because require.cache
                // does not use symlinked paths
                .map(absolutePaths, (absolutePath) => getRealPath(absolutePath)
                    .then((realPath) => {
                        // Get a fresh copy of the helper
                        delete require.cache[realPath];
                        return require(realPath);
                    })
                    .catch(onError(absolutePath))
                )
                .then((helperFunctions) => {
                    absolutePaths.forEach((absolutePath, i) => {
                        map[absolutePath] = {
                            path: absolutePath,
                            fn: helperFunctions[i]
                        };
                    });
                })
            )
        );
}

function finalize(map) {
    const finalized = {};

    Object
        .keys(map)
        .forEach((absolutePath) => {
            const helperId = pathToHelperId(absolutePath);
            const helper = map[absolutePath];
            const otherHelper = finalized[helperId];

            if (otherHelper && otherHelper.path !== helper.path) {
                throw new Error(
                    `There are two helpers with the id "${helperId}":\n - ${otherHelper.path}\n - ${helper.path}`
                );
            }
            finalized[helperId] = helper;
        });
    Object.keys(finalized).forEach((helperId) => {
        finalized[helperId] = finalized[helperId].fn;
    });

    return finalized;
}

module.exports = {
    build,
    finalize,
    pathToHelperId
};
