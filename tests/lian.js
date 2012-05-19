var litmus = require('litmus');

exports.test = new litmus.Test('lian', function () {

    var lian = require('../lib/lian')('localhost');

    this.is(typeof lian, 'function', 'shorthand api returns function');

    function Shape () {}

    var circle = new Shape();
    lian(circle, 'circle');

    this.ok(circle.lian, 'lian is added to object');

    var meta = circle.lian;
    this.ok(meta.getStore(), 'meta has a store from shorthand constructor');
});