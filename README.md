# Lian

Simple object persistence for node.js with MongoDB.

    var lian = require('lian')('localhost/mydb');

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    Person.prototype.getGender = function () {
        return this.gender;
    }

    var john = new Person('John Smith');
    john.gender = "male";

    john.save();

Create a projection of `Person` to find the instance saved above.

    var john = new Person('John Smith');
    john.find().then(function (results) {

        john = results[0];
        john.name; // "John Smith"
        john.getGender(); // "male"
    });

Make some changes to persist.

    john.name = "John Anthony Smith";
    john.save();

Decoupled, lian's `Store` object can be used directly.

    var lian  = require('lian'),
        Store = lian.Store;

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    var steve = new Person('steve');

    typeof steve.insert // "undefined"

    var store = new Store('localhost/mydb');
    store.insert(steve);

Easy to mock with, for testing. Require the `lian/lib/mock` module path instead of `lian`.

    var lian = require('lian/lib/mock')('localhost/mydb');

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    var john = new Person('John Smith');
    john.gender = "male";

    // saved in memory
    john.save().then(function () {

        var john2 = new Person('John Smith');
        john2.findOne().then(function (result) {
            result.gender; // "male"
        });
    });

Hooks for validation.

    var lian = require('lian')('localhost/mydb');

    function Person (name) {
        lian(this, 'person', {
            before: {
                'insert': function (person) {
                    // check the person has a gender set
                    return (person.gender);
                }
            }
        });

        this.name = name;
    }

    var john = new Person('John Smith');

    john.insert().then(
        function () {
            // promise is rejected, see next callback
        },
        function () {
            throw new Error("failed to pass validation");
        }
    );

Learn more about [validation](https://github.com/richardhodgson/lian/blob/master/manual.md#validation).

## Goals

- Avoid writing result to object mapping code over and over.
- Instance based connections, multiple connections within the same process.
- All asynchronous operations should return a promise.
- Store provides an in-memory alternative, for testing.

## Install

Install with [npm](http://npmjs.org).

    npm install lian

## Development [![Build Status](https://secure.travis-ci.org/richardhodgson/lian.png)](http://travis-ci.org/richardhodgson/lian)

Lian uses [monk](https://github.com/LearnBoost/monk) to talk to MongoDB and [promised-io](https://github.com/kriszyp/promised-io) for futures.

Clone the repo...

    git clone git://github.com/richardhodgson/lian.git

Use [npm](http://npmjs.org) to install dependencies.

    cd lian && \
    npm install --dev

Run the tests.

    make test

The tests mock out monk, there are integration tests expecting a MongoDB instance running on `localhost:27017`. They will create a `lian-integration` database.

    make integration-test
