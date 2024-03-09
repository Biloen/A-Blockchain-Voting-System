function toarray() {
    return Array.prototype.slice.call(arguments,0,-1);
}

function not_contained(value, list, options){
    return (!list.includes(value)) ? options.fn(this) : options.inverse(this);
}

const helpers = [
    {name:"NotContained",fn: not_contained},
    {name:"toArray",fn: toarray}
];

function register_helpers(hbs, functions) {
    functions.forEach(func => {
        hbs.handlebars.registerHelper(func.name, func.fn);
    });
}

module.exports = {
    helpers,
    register_helpers
};