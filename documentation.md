# Lian

## Annotating objects

Lian uses a meta object to describe your objects in order to persist them with it's `Store`.

This meta object is added using the function returned when `require()`ing Lian. This factory method comes in two flavours, with a predefined `Store` and without.

With a `Store` for the DB at 'localhost/mydb', use:

    var lian = require('lian')('localhost/mydb');

For those wanting to dealing with the `Store` themselves, try:

    var lian = require('lian');

Both have now reference `lian` with a factory method that will create a meta object for your objects. This can be used with any object that does not already define the 'lian' key.

If your `lian` factory was referenced using the first example (with the 'localhost/mydb' DB string), then Lian will also add shortcut methods to the operations provided by their `Store` instance.

    function Book () {
        lian(this, 'book');
    }

    var book = new Book();
    typeof book.insert // 'function'

In the example above, the `lian` factory is invoked only when the `Book` function is instantiated. The factory will also accept a function, adding these shortcut methods to the `prototype`.

    function Book () {
    }
    lian(Book, 'book');

    var book = new Book();
    typeof book.insert // 'function'

In both cases, the factory method will also add some static shortcut methods, for example:

    function Book () {
    }
    lian(Book, 'book');

    typeof Book.count // 'function'    

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

## Closing connections

Lian creates connections to the database which need to be explicitly closed. The connection can be closed using the `close()` method.

    var lian = require('lian')('localhost/mydb');

    function Shape () {
        lian(this, 'shape');
    }

    Shape.lian.close();

The method can also be called directly on the instance of `Store`.

    var Store = require('lian').Store;

    var store = new Store('localhost/mydb');
    store.close();

## Count

Persisted objects can be counted.

    function Shape () {
        lian(this, 'shape');
    }

    var shape = new Shape();

    shape.count().then(function (count) {
        // count is the total number of 'shape' objects found.
    });

Setting attributes filters the objects that will be counted.

    shape.colour = 'green';
    shape.count().then(function (count) {
        // count is the number of 'shape' objects with 'colour' set to 'green'.
    });

## Indexes

Lian supports defining properties on your object as unique indexes.

    function Colour (name) {
        lian(this, 'colour', {unique: ['name']});

        this.name = name;
    }

    new Colour("red").insert();
    new Colour("red").insert(); // will fail

If a property is defined as an unique index, but not defined on the object when persisting it, MongoDB will consider this as `null`. As this still qualifies as a value, only one object without this property is allowed to be inserted. Multiple `null` entries for the same property would invalidate the index.
