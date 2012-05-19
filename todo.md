# Todo

- `findOne()`
- move store to own module (i.e. 'lian/store')
- main lian module will return a function that expects either a...
    - server address / replica set string, which creates new `store` and returns `meta` mixin method
    - an `object` to be mixed in and collection name, which creates new `meta` and assigns to `object.lian` (probably a dupe of method below).
- `meta` mixin method will take an `object` and collection name
    - creates a new `meta`
    - `object` -> `meta` is many-to-one.
    - `meta` constructor is passed colection name.
    - if there is a `store` reference, add `insert`, `find`, etc methods to `object`.
        - throw error if any of store dsl already exists on `object`.

## Future api

Mixed objects...

    var lian = require('lian')('localhost');

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    var john = new Person('john');

    john.insert();

Decoupled should still work:

    var store = require('lian/store')('localhost'),
        lian  = require('lian');

    function Person (name) {
        lian(this, 'person');
        this.name = name;
    }

    var steve = new Person('steve');

    typeof steve.insert // "undefined"

    store.insert(steve);


Serialise hooks ..?

    var lian = require('lian');

    function Person (name) {
        lian(
            this,
            'person',
            {
                'serialise': function (done) {
                    this.dob = this.dob.toString();
                    done.resolve();
                },
                'deserialise': function (done) {
                    this.dob = new Date(this.dob);
                    done.resolve();
                }
            }
        );
        this.name = name;
    }
