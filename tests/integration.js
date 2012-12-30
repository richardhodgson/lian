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
        collection = db.get('person');

    collection.drop(function (err, doc) {
        ready.resolve();
    });
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
            john.name; // "John Smith"
            john.getGender(); // "male"

            Person.lian.close();
            complete.resolve();
        });
    });
}