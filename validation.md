# Lian

## Validation

Lian provides hooks for validation an object before changes to it are persisted.

These only work when `lian` adds the shortcut methods to the object. There are no hooks when using the decoupled `Store` on its own. A callback can be specified for each shortcut method added, e.g. `insert`, `update`, `save`, `find` etc.

A `before` callback can return either a `boolean` or a `Promise`. Any other type returned will throw an exception.

### Boolean

Return `false` to halt an operation, and reject the promise it returns. 

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

### Promise

Promises allow the `before` callback to pass back information to the reject callback passed to the operation.

    var lian = require('lian')('localhost/mydb');
    var Promise = require('promise');

    function Person (name) {
        lian(this, 'person', {
            before: {
                'insert': function (person) {

                    var valid = new Promise();

                    if (! person.gender) {
                        valid.reject('missing gender');
                    }
                    else if (person.gender != 'male' && person.gender != 'female') {
                        valid.reject('unknown gender, expected male or female');
                    }
                    else {
                        valid.resolve();
                    }

                    return valid;
                }
            }
        });

        this.name = name;
    }

    var john = new Person('John Smith');

    john.insert().then(
        function () {
            // passed validation
        },
        function (err) {
            throw new Error("failed to insert: " + err);
        }
    );
