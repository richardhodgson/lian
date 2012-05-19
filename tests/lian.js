var litmus = require('litmus'),
    mock_monk = require('./mock/monk');

exports.test = new litmus.Test('lian', function () {
    var test = this;

    var lian = require('../lib/lian')('localhost');

    this.is(typeof lian, 'function', 'shorthand api returns function');

    this.async('test common api', function (complete) {

        function Shape () {
            lian(this, 'circle');    
        }

        var circle = new Shape();
        test.ok(Shape.lian, 'lian is added to object');

        var meta = Shape.lian;
        test.is(meta.name, 'circle', 'name is set on Meta class');
        test.ok(meta.getStore(), 'meta has a store from shorthand constructor');

        test.ok(circle.insert, 'Insert method mixed in');
        test.ok(circle.find, 'Find method mixed in');
        test.ok(circle.save, 'Save method mixed in');
        test.ok(circle.update, 'Update method mixed in');

        meta.getStore().setMonk(new mock_monk());

        circle.insert().then(function () {

            var circle2 = new Shape();

            circle2.find().then(function (results) {
                test.is(results.length, 1, 'found the inserted object');
                test.isa(results[0], Shape, 'result instances are mapped to original objects');
                complete.resolve();
            });
        });

    });
});
