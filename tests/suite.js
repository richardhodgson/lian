var litmus = require('litmus');

exports.test = new litmus.Suite('Lian Test Suite', [
    require('./lian.js').test,
    require('./store.js').test
]);
