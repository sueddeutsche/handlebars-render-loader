# Handlebars Render Loader

Loads and compiles handlebars-files to html and returns it as a string. Additionally resolves and register all missing
partials as a webpack-url (relative or absolute from a module). A missing partial must either be
    
    - a relative path, starting with "./" or "../" or
    - an absolute path within a module, which has no starting "/". i.e. {{> szig-frontend-toolkit/components/..}}


## Usage


in your webpack config add the loader i.e.

```javascript
var HTMLExtractPlugin = new ExtractTextPlugin("html", "index.html");

var webpackConfig = {

    module: {
        loaders: [
            {
                loader: `file-loader?name=[name].html!extract-loader!html-loader!handlebars-render-loader`,
                test: /\.hbs$/
            }
        ]
    },

    handlebarsRenderLoader: {

        // debug registered partials
        debug: false,

        // data used to render hbs template
        data: require("./data/project.json"),

        // partials are usually resolved via webpack.
        // You may specify a map of partial aliases.
        // This is usually necessary when you have dynamic partials.
        partialAliases: {
            "partial-one": require.resolve("path/to/partial-one"),
            "partial-two": require.resolve("path/to/partial-two")
        },

        // register custom helpers with file globs
        // The file name is used as helper id. The .helper postfix will be removed.
        helpers: [
            path.join(process.cwd(), "app", "helpers", "*.helper.js")
        ],

        // hooks
        onBeforeCompile: function (Handlebars, templateContent) {},
    }
};
```
