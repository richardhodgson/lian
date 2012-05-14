# Lian

Simple object persistence for node.js with MongoDB.

    var store = require('lian').Store('localhost');
    
    function Person () {
        this.$ = 'person';
    }

    Person.prototype.getGender = function () {
        return this.gender;
    }

    var john = new Person();
    john.name = "John Smith";
    john.gender = "male";

    // returns a promise
    store.insert(john);

Create a projection of `Person` to find the instance saved above.

    var john = new Person();
    john.name = "John Smith";
    store.find(john).then(function (results) {

        john = results[0];
        john.name; // "John Smith"
        john.getGender(); // "male"
    });

