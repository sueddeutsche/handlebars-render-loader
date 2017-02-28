const chai = require("chai");
const resolve = require("../lib/resolve");
const expect = chai.expect;


describe("resolve", () => {

    describe(".single(loaderApi, url, context)", () => {

        it("should return a promise that resolves with the resolved path", () => {
            var loaderApi = {
                resolve: function (context, url, callback) {
                    expect(context).to.equal("some");
                    expect(url).to.equal("some/url.hbs");
                    setImmediate(callback, null, "/some/absolute/path");
                }
            };

            return resolve
                .single(loaderApi, "some/url.hbs", "some/context.hbs")
                .then((resolvedPath) => expect(resolvedPath).to.equal("/some/absolute/path"));
        });

        it("should automatically append .hbs to the url when there is no extension", () => {
            var loaderApi = {
                resolve: function (context, url, callback) {
                    expect(url).to.equal("some/url.hbs");
                    setImmediate(callback, null, "/some/absolute/path");
                }
            };

            return resolve
                .single(loaderApi, "some/url", "some/context.hbs");
        });

        it("should not automatically append .hbs to the url when there is another extension", () => {
            var loaderApi = {
                resolve: function (context, url, callback) {
                    expect(url).to.equal("some/url.html");
                    setImmediate(callback, null, "/some/absolute/path");
                }
            };

            return resolve
                .single(loaderApi, "some/url.html", "some/context.hbs");
        });

        it("should reject the promise with a helpful error message when there was an error", () => {
            var loaderApi = {
                resolve: (context, url, callback) => {
                    setImmediate(callback, new Error("Some awful error"));
                }
            };

            return resolve
                .single(loaderApi, "some/url", "some/context.hbs")
                .catch((err) => {
                    expect(err.message).to.eql("Cannot resolve partial 'some/url.hbs' referenced in " +
                        "some/context.hbs: Some awful error");
                });
        });

        it("should attach context information to the error", () => {
            var loaderApi = {
                resolve: function (context, url, callback) {
                    setImmediate(callback, new Error("Some awful error"));
                }
            };

            return resolve
                .single(loaderApi, "some/url", "some/context.hbs")
                .catch((err) => expect(err.context).to.eql("some/context.hbs"));
        });
    });

    describe(".multiple(loaderApi, urls, context)", () => {

        it("should resolve every url inside the array", () => {
            const urls = [
                "a",
                "b.hbs",
                "c.html"
            ];
            const processedUrls = [];
            const loaderApi = {
                resolve: function (context, url, callback) {
                    expect(context).to.eql("some");
                    processedUrls.push(url);
                    setImmediate(callback, null, "some/absolute/path");
                }
            };

            return resolve
                .multiple(loaderApi, urls, "some/context.hbs")
                .then(() => {
                    processedUrls.sort();
                    expect(processedUrls).to.eql(["a.hbs", "b.hbs", "c.html"]);
                });
        });

        it("should reject the promise when there was an error with one url", () => {
            const urls = [
                "a",
                "b.hbs",
                "c.html"
            ];
            let counter = 0;
            const loaderApi = {
                resolve: function (context, url, callback) {
                    if (counter === 2) {
                        setImmediate(callback, new Error("Some aweful error"));
                        return;
                    }
                    counter++;

                }
            };

            return resolve
                .multiple(loaderApi, urls, "some/context.hbs")
                .catch((err) => {
                    expect(err.message).to.contain("Some aweful error");
                    expect(err.message).to.contain("in some");
                });
        });
    });
});
