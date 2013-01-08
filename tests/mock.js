var litmus    = require('litmus'),
    mock_monk = require('../lib/mock/monk'),
    after     = require('promised-io/promise').all;

exports.test = new litmus.Test('Mock lian api, for using with tests', function () {
    var test = this;

    test.plan(20);

    var lian = require('../lib/mock')('localhost'),
        mockStore = require('../lib/mock').Store;

    this.is(typeof lian, 'function', 'shorthand mock api returns function the same as the main lian api');

    this.async('test mock api behaves same as main api', function (complete) {

        function Shape () {
            lian(this, 'circle');    
        }

        var circle = new Shape();
        test.ok(Shape.lian, 'lian is added to object');

        var meta = Shape.lian;
        test.is(meta.name, 'circle', 'name is set on Meta class');
        test.isa(meta.getStore(), mockStore, 'meta has a store from shorthand constructor');
        test.isa(meta.getStore().getMonk(), mock_monk, 'Store is a mock store');

        test.ok(circle.insert, 'Insert method mixed in');
        test.ok(circle.find, 'Find method mixed in');
        test.ok(circle.save, 'Save method mixed in');
        test.ok(circle.update, 'Update method mixed in');

        circle.insert().then(function () {

            var circle2 = new Shape();

            circle2.find().then(function (results) {
                test.is(results.length, 1, 'found the inserted object');
                test.isa(results[0], Shape, 'result instances are mapped to original objects');
                complete.resolve();
            });
        });
    });

    this.async('test multiple objects can be persisted in memory', function (complete) {

        var lian = require('../lib/mock')('localhost');

        function Book () {
            lian(this, 'book');
        }

        var book = new Book();

        Book.count().then(function (count) {
            test.is(count, 0, 'mock is empty');

            book.insert().then(function () {

                Book.count().then(function (count) {
                    test.is(count, 1, 'first item is persisted');

                    var book2 = new Book();
                    book2.insert().then(function () {
                        
                        Book.count().then(function (count) {
                            test.is(count, 2, 'another item is persisted and counted');

                            complete.resolve();
                        });
                    });
                });
            });
        });
    });

    test.async('test mock find', function (complete) {

        function Book () {
            lian(this, 'book');
        }

        var book = new Book();
        book.title = "To kill a mockingbird";
        book.author = "Harper Lee";

        book.insert().then(function () {

            var book2 = new Book();
            book2.title = "To kill a mockingbird";

            book2.findOne().then(function (book3) {
                test.isa(book3, Book, 'Inserted book is found based on title.');
                test.is(book3.author, 'Harper Lee', 'Author key is from mock store');

                complete.resolve();
            });
        });
    });

    test.async('test mock find with nulls', function (complete) {

        function Book () {
            lian(this, 'book');
            this.author = null;
        }

        var book = new Book();
        book.title = "To kill a mockingbird";
        book.author = "Harper Lee";

        book.insert().then(function () {

            var book2 = new Book();
            book2.title = "To kill a mockingbird";

            book2.findOne().then(function (book3) {
                test.ok(book3, 'Inserted book is found based on title.');
                test.is(book3.author, 'Harper Lee', 'Author key is from mock store');

                complete.resolve();
            });
        });
    });

    test.async('test mock can find multiple times', function (complete) {

        function Book () {
            lian(this, 'book');
            this.author = null;
        }

        var book = new Book();
        book.title = "To kill a mockingbird";
        book.author = "Harper Lee";

        book.insert().then(function () {

            var book2 = new Book();
            book2.title = "To kill a mockingbird";

            Book.findOne().then(function (book2) {
                test.ok(book2, 'Inserted book is found with static method.');
                
                Book.findOne().then(function (book3) {
                    test.ok(book3, 'Inserted book is found again.');
                });

                complete.resolve();
            });
        });
    });





});
