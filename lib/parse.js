const dynamicPartial = /^\(/;


function parse(content) {
    // It's important that this regular expression is not cached.
    // Since we're using exec and the global flag, we need fresh instance for every call.
    const matchPartialReference = /(\{\{>\s*?)([^\s}]+)/g;
    const partials = [];
    const source = [];
    let previousIndex = 0;
    let currentPartial;
    let match;

    function Source() {
        this.partials = partials;
    }

    Source.prototype.toString = function () {
        return source.reduce((result, chunk, index) => {
            let partial = this.partials[index];
            if (partial === undefined) {
                partial = "";
            }
            return result + chunk + partial;
        }, "");
    };

    while ((match = matchPartialReference.exec(content))) {
        currentPartial = match[2];
        if (dynamicPartial.test(currentPartial)) {
            continue;
        }
        source.push(
            content.slice(previousIndex, match.index) + match[1]
        );
        currentPartial = match[2];
        partials.push(currentPartial);
        previousIndex = matchPartialReference.lastIndex;
    }

    source.push(content.slice(previousIndex));

    return new Source();
}


module.exports = parse;
