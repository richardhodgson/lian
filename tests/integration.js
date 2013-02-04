var litmus      = require('litmus'),
    Promise     = require('promised-io/promise').Promise,
    DB_NAME     = 'lian-integration',
    db;

exports.test = new litmus.Test('Main lian api', function () {
    var test = this;

    this.finished.then(function () {
        tearDown();
    });

    test.async('test integration with monk and mongodb', function (complete) {
        setUp().then(function () {
            integrationTests(test, complete);
        });
    });
});

function setUp () {
    db = require('monk')('localhost/' + DB_NAME);
    return cleanDb(db);
}

function tearDown () {
    cleanDb().then(function () {
        db.close();
    });
}

function cleanDb () {
    var ready      = new Promise(),
        collections = ['person', 'colour'],
        wait        = collections.length;

    var dropCollection = function (name) {
        db.get(name).drop(function (err, doc) {
            wait--;
        })
    }

    for (var i = 0; i < collections.length; i++) {
        dropCollection(collections[i]);
    }

    var timeout = setTimeout(
        function () {
            throw new Error('clean up timed out');
        },
        3000
    );

    var check = setInterval(
        function () {
            if (wait == 0) {
                clearTimeout(timeout);
                clearTimeout(check);
                ready.resolve();
            }
        },
        100
    );
    return ready;
}

function integrationTests (test, complete) {
    
    var lian = require('../lib/lian')('localhost/' + DB_NAME);

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    Person.prototype.getGender = function () {
        return this.gender;
    }

    var john = new Person('John Smith');
    john.gender = "male";

    john.save().then(function () {
        
        test.pass('Can save to the Store');

        var john = new Person('John Smith');
        john.find().then(function (results) {

            test.pass('Can find from the Store');

            john = results[0];
            test.is(john.name, 'John Smith', 'Name property populated');
            test.is(john.getGender(), 'male', 'accessor method returns expected value');

            john.name = "John Anthony Smith";
            john.save().then(function (john) {

                test.pass('can save to the store');
                test.is(john.getGender(), 'male', 'save promise is resolved with expected populated object');

                john = new Person('John Anthony Smith');
                john.findOne().then(function (john) {

                    test.pass('can findOne from the store');

                    Person.lian.close();


                    function Colour (name) {
                        lian(this, 'colour', {unique: ['name']});
                        this.name = name;
                    }
        
                    new Colour("orange").insert().then(function () {

                        new Colour("orange").insert().then(
                            function () {
                                test.fail('was able to insert multiple times despite unique index');
                                Colour.lian.close();
                                complete.resolve();
                            },
                            function () {
                                test.pass('unique indexes can be specified with lian meta factory');
                                Colour.lian.close();
                                complete.resolve();
                            }
                        );
                        
                    });
                });

            });

        });
    });


}