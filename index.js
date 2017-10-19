/* eslint consistent-this: 0, no-invalid-this: 0 */
const when = require("when");
const chalk = require("chalk");
const Handlebars = require("handlebars");
const loaderUtils = require("loader-utils");
const log = require("./lib/log");
const partialsMap = require("./lib/partialsMap");
const helpersMap = require("./lib/helpersMap");
const findPartials = require("./lib/findPartials");

function logTime(enabled, task, start, end) {
    if (enabled) {
        console.log(chalk.blue(`Handlebars-Loader: ${task}`), `${(end - start) / 1000}s`);
    }
}

function getLoaderConfig(context) {
    const query = loaderUtils.getOptions(context) || {};
    const configKey = query.config || "handlebarsRenderLoader";
    const config = context.options && context.options.hasOwnProperty(configKey) ? context.options[configKey] : {};

    delete query.config;

    return Object.assign(query, config);
}

function handlebarsRenderLoader(content) {
    const timeStart = Date.now();

    const loaderApi = this;
    const callback = loaderApi.async();
    const config = Object.assign(
        {
            helpers: {},
            debug: false,
            profile: false
        },
        getLoaderConfig(this) || {}
    );

    log(config.debug, "Starting");

    const partialAliases = Object.keys(config.partialAliases || {});
    const partialAliasesPaths = config.partialAliases ? partialAliases.map((partialAlias) =>
        config.partialAliases[partialAlias]) : [];
    // Stores all partials with their absolute path as key
    let pMap = {};
    // Stores all helpers with their absolute path as key
    let hMap = {};

    function addDependencies() {
        // Please note: Webpack does not follow symlinks
        // so this should be the paths as returned by the file system (not the real paths).
        []
        .concat(
            Object.keys(pMap),
            Object.keys(hMap)
        )
        .forEach((absolutePath) => loaderApi.addDependency(absolutePath));
    }

    this.cacheable();

    const timeStartPrepare = Date.now();

    when
        .all([
            // First we build the helper map by searching the file system for the given globs
            // After that, all helpers are stored with their absolute path as key in the helpers map
            helpersMap.build(hMap, config.helpers),
            // Then we look for all the given partial aliases. These partials need to be parsed to find out
            // if they have references on other partials
            findPartials(partialAliasesPaths, (partialContent, partialPath) =>
                partialsMap.build(loaderApi, pMap, partialContent, partialPath)
            ).then(() =>
                // After we've looked for partial aliases we can examine the actual content. We wait for the partial
                // aliases to finish so we already have a bunch of partials in our map. This way we don't need to
                // parse everything again.
                partialsMap.build(loaderApi, pMap, content, loaderApi.resourcePath)
            )
        ])
        .catch((err) => {
            addDependencies();
            if (err.context) {
                // When there is a context attached to that error, we also add this to the dependencies so
                // that webpack triggers a new compilation after the error has been fixed.
                loaderApi.addDependency(err.context);
            }
            throw err;
        })
        .then(() => {
            const timeStartSetup = Date.now();
            logTime(config.profile, "preparation step (retrieving partials)", timeStartPrepare, timeStartSetup);

            // Now we should have a map with all partials and helpers. We need to add these as dependency
            // so that webpack's watch is working as expected.
            addDependencies();

            // By finalizing the maps, we turn the absolute paths into partialIds and helperIds. If there's
            // an id conflict, we should get an error now.
            hMap = helpersMap.finalize(hMap);
            pMap = partialsMap.finalize(pMap);
            content = pMap[partialsMap.pathToPartialId(loaderApi.resourcePath)];

            // Now we need to store the partial aliases under their actual aliases on the pMap.
            partialAliases.forEach((partialAlias) => {
                const partialPath = config.partialAliases[partialAlias];
                pMap[partialAlias] = pMap[partialsMap.pathToPartialId(partialPath)];
            });

            // Register helpers and partials at Handlebars. Old partials and helpers with the same name
            // will just get overridden, so no need to reset anything.
            Object.keys(hMap).forEach((helperId) => {
                const helper = hMap[helperId];
                if (typeof helper !== "function") {
                    throw new TypeError(`Helper ${helperId} must be a function, instead received ${typeof helper}`);
                }
                Handlebars.registerHelper(helperId, helper);
            });
            Object.keys(pMap).forEach((partialId) => Handlebars.registerPartial(partialId, pMap[partialId]));

            logTime(config.profile, "setup handlebars", timeStartSetup, Date.now());
        })
        .then(() => {
            const partialsString = JSON.stringify(Object.keys(Handlebars.partials), null, 4);
            const helpersString = JSON.stringify(Object.keys(Handlebars.helpers), null, 4);
            log(config.debug, chalk.grey(`loaded Partials:\n ${partialsString}`));
            log(config.debug, chalk.grey(`loaded Helpers:\n ${helpersString}`));
        })
        .then(() => {
            if (config.onPartialsRegistered) {
                config.onPartialsRegistered(Handlebars);
            }
        })
        .then(() => {
            if (config.onBeforeCompile) {
                config.onBeforeCompile(Handlebars);
            }
        })
        .then(() => {
            const startCompilation = Date.now();
            // build template
            var template = Handlebars.compile(content);
            // render html with given data
            var html = template(config.data);
            logTime(config.profile, "compilation took", startCompilation, Date.now());
            logTime(config.profile, "total time", timeStart, Date.now());
            callback(null, html);
        })
        .catch(callback);
}


module.exports = handlebarsRenderLoader;
