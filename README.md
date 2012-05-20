# Lian

Simple object persistence for node.js with MongoDB.

    var lian = require('lian')('localhost');

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

    var Store = require('lian/store'),
        lian  = require('lian');

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    var steve = new Person('steve');

    typeof steve.insert // "undefined"

    var store = new Store('localhost');
    store.insert(steve);

# Goals

- Avoid writing result to object mapping code over and over.
- Instance based connections, multiple connections within the same process.
- All asynchronous operations should return a promise.
- Store provides an in-memory alternative, for testing.