var litmus = require('litmus'),
    mock_monk = require('../lib/mock/monk'),
    after = require('promised-io/promise').all;

exports.test = new litmus.Test('Main lian api', function () {
    var test = this;

    test.plan(28)

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


        function Car () {
            lian(this, 'car');
        }
        Car.prototype.insert = function() {};

        test.throwsOk(
            function () {
                new Car();
            },
            /already defined/,
            'Cannot add mixin methods if one is already defined'
        );
    });

    this.async('test decoupled api', function (complete) {

        var Store = require('../lib/lian').Store,
            lian  = require('../lib/lian');

        var store = new Store('localhost');
        store.setMonk(new mock_monk());

        function Shape () {
            lian(this, 'circle');
        }

        var circle = new Shape();
        test.ok(Shape.lian, 'lian is added to object');

        var meta = Shape.lian;
        test.is(meta.name, 'circle', 'name is set on Meta class');
        test.nok(meta.getStore(), 'meta has no store');

        test.nok(circle.insert, 'Insert method is not mixed in without a store');
        test.nok(circle.find, 'Find method is not mixed in without a store');
        test.nok(circle.save, 'Save method is not mixed in without a store');
        test.nok(circle.update, 'Update method is not mixed in without a store');

        store.insert(circle).then(function () {

            var circle2 = new Shape();

            store.find(circle2).then(function (results) {
                test.is(results.length, 1, 'found the inserted object');
                test.isa(results[0], Shape, 'result instances are mapped to original objects');
                complete.resolve();
            });
        });
    });

    test.async('test api hooks', function (complete) {

        var inserted = false,
            updated  = false,
            found    = false,
            saved    = false;

        function Shape () {
            lian(this, 'triangle', {
                'beforeInsert': function (ob) {
                    test.isa(ob, Shape, "callback is passed a reference to the object");
                    test.nok(inserted, 'beforeInsert must return true before insert() will be invoked');
                    return true;
                },
                'beforeUpdate': function (ob) {
                    test.isa(ob, Shape, "callback is passed a reference to the object");
                    test.nok(updated, 'beforeUpdate must return true before update() will be invoked');
                    return true;
                },
                'beforeFind': function (ob) {
                    test.isa(ob, Shape, "callback is passed a reference to the object");
                    test.nok(found, 'beforeFind must return true before find() will be invoked');
                    return true;
                },
                'beforeSave': function (ob) {
                    test.isa(ob, Shape, "callback is passed a reference to the object");
                    test.nok(saved, 'beforeSave must return true before save() will be invoked');
                    return true;
                }
            });
        }

        var triangle = new Shape();

        Shape.lian.getStore().setMonk(new mock_monk());

        triangle.insert().then(function(triangle) {

            inserted = true;
            test.pass('insert() executed');

            after(
                triangle.find().then(function() {
                    found = true;
                    test.pass('find() executed');
                }),
                triangle.update().then(function() {
                    updated = true;
                    test.pass('update() executed');
                }),
                triangle.save().then(function() {
                    saved = true;
                    test.pass('save() executed');
                })
            )
            .then(function () {
                complete.resolve();
            });
        });


    });
});
