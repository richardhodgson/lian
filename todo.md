# Todo

- delete() an object
- `lian` constructor takes a function and mixes in static `count`, `find` and `findOne` methods.

For example:
    
    function Person () {
    }

    lian(Person, 'person');

    Person.find().then(function (results) {
        // etc
    });
