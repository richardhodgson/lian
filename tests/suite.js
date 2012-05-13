var litmus = require('litmus');

exports.test = new litmus.Suite('Lian Test Suite', [
    require('./store.js').test
]);
