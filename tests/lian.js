var litmus    = require('litmus'),
    mock_monk = require('../lib/mock/monk'),
    Promise   = require('promised-io/promise').Promise,
    after     = require('promised-io/promise').all;

exports.test = new litmus.Test('Main lian api', function () {
    var test = this;

    test.plan(58);

    var lian = require('../lib/lian')('localhost');

    this.is(typeof lian, 'function', 'shorthand api returns function');

    this.async('test common api', function (complete) {

        var lian = require('../lib/lian')('localhost');

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
        test.ok(circle.findOne, 'findOne method mixed in');

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

        var lian = require('../lib/lian')('localhost');

        var inserted = false,
            updated  = false,
            found    = false,
            saved    = false;

        function Shape () {
            lian(this, 'triangle', {
                'before': {
                    'insert': function (ob) {
                        test.isa(ob, Shape, "callback is passed a reference to the object");
                        test.nok(inserted, 'beforeInsert must return true before insert() will be invoked');
                        return true;
                    },
                    'update': function (ob) {
                        test.isa(ob, Shape, "callback is passed a reference to the object");
                        test.nok(updated, 'beforeUpdate must return true before update() will be invoked');
                        return true;
                    },
                    'find': function (ob) {
                        test.isa(ob, Shape, "callback is passed a reference to the object");
                        test.nok(found, 'beforeFind must return true before find() will be invoked');
                        return true;
                    },
                    'save': function (ob) {
                        test.isa(ob, Shape, "callback is passed a reference to the object");
                        test.nok(saved, 'beforeSave must return true before save() will be invoked');
                        return true;
                    }
                    
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

    test.async('test before callbacks can halt operation', function (complete) {

        var lian = require('../lib/lian')('localhost');

        function Shape () {
            lian(this, 'shape', {
                'before': {
                    'insert': function (ob) {
                        return false;
                    }
                }
            });
        }

        var triangle = new Shape();
        Shape.lian.getStore().setMonk(new mock_monk());

        function Shape2 () {
            lian(this, 'shape2', {
                'before': {
                    'update': function (ob) {
                        return false;
                    },
                    'find': function (ob) {
                        return false;
                    },
                    'save': function (ob) {
                        return false;
                    }
                }
            });
        }

        triangle.insert().then(
            function(triangle) {
                test.fail("insert() not halted by before callback");
            },
            function () {
                test.pass('insert() is rejected by before callback');

                var square = new Shape2();
                Shape2.lian.getStore().setMonk(new mock_monk());

                square.insert().then(function(square) {

                    var callbacksRejected = [new Promise(), new Promise(), new Promise()];

                    square.find().then(
                        function() {
                            test.fail("find() not halted by before callback");
                        },
                        function () {
                            test.pass("find() is rejected by before callback");
                            callbacksRejected[0].resolve();
                        }
                    );

                    square.update().then(
                        function() {
                            test.fail("update() not halted by before callback");
                        },
                        function () {
                            test.pass("update() is rejected by before callback");
                            callbacksRejected[1].resolve();
                        }
                    );

                    square.save().then(
                        function() {
                            test.fail("save() not halted by before callback");
                        },
                        function () {
                            test.pass("save() is rejected by before callback");
                            callbacksRejected[2].resolve();
                        }
                    );

                    after(callbacksRejected).then(function () {
                        complete.resolve();
                    });
                });
            }
        );
    });

    test.async('test before hooks can modify object', function (complete) {

        var lian = require('../lib/lian')('localhost');

        var inserted = false,
            updated  = false,
            found    = false,
            saved    = false;

        function Shape () {

            lian(this, 'triangle', {
                'before': {
                    'insert': function (ob) {
                        ob.colour = 'red';
                        return true;
                    }
                    
                }
            });
        }

        var triangle = new Shape();
        triangle.points = 3;
        triangle.colour = 'green';

        Shape.lian.getStore().setMonk(new mock_monk());

        triangle.insert().then(function() {
            test.pass('insert() executed');
            test.is(ob.colour, 'red', "object can be modified by beforeInsert callback");

            var findTriangle = new Shape();
            findTriangle.find().then(function (result) {
                test.is(result[0].colour, 'red', 'object was persisted modified');
                complete.resolve();
            });
        });
    });
    
    test.async('test before callbacks can return promises and resolve', function (complete) {

        var lian = require('../lib/lian')('localhost');

        var inserted = false,
            updated  = false,
            found    = false,
            saved    = false;

        function Shape () {
            lian(this, 'triangle', {
                'before': {
                    'insert': function (ob) {
                        var done = new Promise();
                        setTimeout(function () {
                            test.nok(inserted, 'Promise must be resolved before insert() is invoked');
                            done.resolve();
                        }, 30);
                        return done;
                    },
                    'update': function (ob) {
                        var done = new Promise();
                        setTimeout(function () {
                            test.nok(updated, 'Promise must be resolved before update() is invoked');
                            done.resolve();
                        }, 30);
                        return done;
                    },
                    'find': function (ob) {
                        var done = new Promise();
                        setTimeout(function () {
                            test.nok(found, 'Promise must be resolved before find() is invoked');
                            done.resolve();
                        }, 30);
                        return done;
                    },
                    'save': function (ob) {
                        var done = new Promise();
                        setTimeout(function () {
                            test.nok(saved, 'Promise must be resolved before save() is invoked');
                            done.resolve();
                        }, 30);
                        return done;
                    }
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

test.async('test before callbacks can return promises and reject', function (complete) {

    var lian = require('../lib/lian')('localhost');

        function Shape () {
            lian(this, 'shape', {
                'before': {
                    'insert': function (ob) {
                        var promise = new Promise();
                        promise.reject(1);
                        return promise;
                    }
                }
            });
        }

        var triangle = new Shape();
        Shape.lian.getStore().setMonk(new mock_monk());

        function Shape2 () {
            lian(this, 'shape2', {
                'before': {
                    'update': function (ob) {
                        var promise = new Promise();
                        promise.reject(2);
                        return promise;
                    },
                    'find': function (ob) {
                        var promise = new Promise();
                        promise.reject(3);
                        return promise;
                    },
                    'save': function (ob) {
                        var promise = new Promise();
                        promise.reject(4);
                        return promise;
                    }
                }
            });
        }

        triangle.insert().then(
            function(triangle) {
                test.fail("insert() not halted by before callback");
            },
            function (err) {
                test.pass('insert() is rejected by promise returned by before callback');
                test.is(err, 1, 'insert() rejected callback is passed expected argument');

                var square = new Shape2();
                Shape2.lian.getStore().setMonk(new mock_monk());

                square.insert().then(function(square) {

                    var callbacksRejected = [new Promise(), new Promise(), new Promise()];

                    square.find().then(
                        function() {
                            test.fail("find() not halted by before callback");
                        },
                        function (err) {
                            test.pass("find() is rejected by promise returned by before callback");
                            test.is(err, 3, 'find() rejected callback is passed expected argument');
                            callbacksRejected[0].resolve();
                        }
                    );

                    square.update().then(
                        function() {
                            test.fail("update() not halted by before callback");
                        },
                        function (err) {
                            test.pass("update() is rejected by promise returned by before callback");
                            test.is(err, 2, 'update() rejected callback is passed expected argument');
                            callbacksRejected[1].resolve();
                        }
                    );

                    square.save().then(
                        function() {
                            test.fail("save() not halted by before callback");
                        },
                        function (err) {
                            test.pass("save() is rejected by promise returned by before callback");
                            test.is(err, 4, 'save() rejected callback is passed expected argument');
                            callbacksRejected[2].resolve();
                        }
                    );

                    after(callbacksRejected).then(function () {
                        complete.resolve();
                    });
                });
            }
        );
    });

    test.async('close connection shortcut', function (complete) {

        var lian = require('../lib/lian')('localhost');

        function Shape () {
            lian(this, 'shape');
        }

        var triangle = new Shape();
        Shape.lian.getStore().setMonk(new mock_monk());

        triangle.insert().then(function () {

            Shape.lian.close().then(function () {
                test.pass('connection can be closed from main api')
                complete.resolve();
            });

        });
    });

    test.async('close connection shortcut', function (complete) {

        var lian = require('../lib/lian');

        function Shape () {
            lian(this, 'shape');
        }

        new Shape();

        test.throwsOk(
            function () {
                Shape.lian.close();
            },
            /no store/,
            'Cannot close a connection without a store instance'
        );

        complete.resolve();
    });
});
