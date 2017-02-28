/* eslint max-nested-callbacks: 0*/
const chai = require("chai");
const parse = require("../lib/parse");
const fixtures = require("./fixtures");

const expect = chai.expect;


describe("parse(content): Source", () => {

    it("should return an object", () => {
        expect(parse(fixtures.noPartial)).to.be.an("object");
    });

    it("should also return an object when an empty string was passed", () => {
        expect(parse("")).to.be.an("object");
    });

    describe("Source", () => {

        describe(".partials", () => {

            it("should be an empty array when the source did not include another partial", () => {
                var source = parse(fixtures.noPartial);

                expect(source.partials).to.eql([]);
            });

            it("should contain the partial when the source did include one partial", () => {
                var source = parse(fixtures.onePartial);

                expect(source.partials).to.eql(["noPartial"]);
            });

            it("should contain the partial when the source did include one partial", () => {
                var source = parse(fixtures.onePartial);

                expect(source.partials).to.eql(["noPartial"]);
            });

            it("should ignore dynamic partials", () => {
                var source = parse(fixtures.dynamicPartial);

                expect(source.partials).to.eql([]);
            });

        });

        describe(".toString()", () => {

            it("should return the source code again", () => {
                Object.keys(fixtures).forEach((fixtureName) => {
                    const fixture = fixtures[fixtureName];
                    const source = parse(fixture);

                    expect(source.toString()).to.eql(fixture);
                });
            });

            it("should return the source code again with changed partial references", () => {
                var source = parse(fixtures.multiplePartials);

                source.partials = source.partials.map((partial, index) => index);
                source = source.toString();

                expect(source).to.contain("{{> 0 }");
                expect(source).to.contain("{{> 1 }");
                expect(source).to.contain("{{> 2 }");
                expect(source).to.contain("{{> 3 }");
                expect(source).to.contain("{{> 4 }");
            });
        });
    });
});
