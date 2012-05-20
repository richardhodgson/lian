var litmus = require('litmus'),
    mock_monk = require('./mock/monk'),
    Store = require('../lib/store'),
    after = require('promised-io/promise').all;

function log (o) {
    console.log(o);
}

exports.test = new litmus.Test('Store module tests', function () {

    var test = this;

    var store = new Store();
    store.setMonk(new mock_monk());

    test.is(store.getMonk(), new mock_monk(), 'Can mock monk');

    var Thing = {}

    test.throwsOk(
        function () {
            store.insert(Thing);
        },
        /property/,
        'Inserting something without a $ property throws an error'
    );

    Thing = function () {
        Thing.lian = {name: 'Thing'};
    }

    test.async('test object is inserted', function (complete) {

        thing = new Thing();

        var result = store.insert(thing);
        test.is(typeof result['then'], 'function', 'insert returns a promise');

        result.then(function (thing) {
            test.ok(thing._id, 'object now has an id');

        });

        result.then(function () {
            
            var otherThing = new Thing();

            store.insert(otherThing).then(function (otherThing) {
                test.not(thing._id, otherThing._id, "Inserting multiple things return different id's");
                complete.resolve();
            });
        });

    });

    test.async('test object can be found', function (complete) {

        var store = new Store();
        store.setMonk(new mock_monk());

        function Person () {
            Person.lian = {name: 'person'};
        }
        Person.prototype.getName = function () {
            return this.name;
        }

        var jack = new Person(),
            john = new Person(),
            jill = new Person();

        jack.name = "jack";
        john.name = "john";
        jill.name = "jill";

        jack.gender = "male";
        john.gender = "male";
        jill.gender = "female";

        after(
            store.insert(jack),
            store.insert(john),
            store.insert(jill)
        ).then(function () {

            var man = new Person();
            man.gender = "male";

            var result = store.find(man);

            test.is(typeof result['then'], 'function', 'find returns a promise');

            result.then(function (results) {
                test.is(results.length, 2, 'Expected number of results are returned');
                
                test.is(results[0]._id, '1', 'Result has id populated from db');
                test.is(results[0].gender, 'male', 'Data is retrieved from store and returned as object');
                test.isa(results[0], Person, 'Result is expected type');
                test.is(results[0].getName(), 'jack', 'Returned object instance methods are populate');
                test.is(results[1].getName(), 'john', 'Multiple results are mapped to an object instance');

                complete.resolve();
            }); 
        });
    });

    test.async('test object can be updated', function (complete) {

        var store = new Store();
        store.setMonk(new mock_monk());

        function Person () {
            Person.lian = {name: 'person'};
        }
        
        var jack = new Person();
        jack.name = "jack";
        jack.gender = "male";

        test.throwsOk(
            function () {
                store.update(jack);
            },
            /cannot update/,
            'Cannot call update with an object without an id'
        );

        store.insert(jack).then(function () {

            var man = new Person();
            man.name = "jack";

            store.find(man).then(function (results) {
                test.is(results.length, 1, 'Expected number of results are returned');

                var jack_found = results[0];
                jack_found.name = "john";

                var result = store.update(jack_found);

                test.is(typeof result['then'], 'function', 'update returns a promise');

                result.then(function () {
                    store.find(man).then(function (results) {
                        test.is(results.length, '0', 'Old object cannot be found anymore');

                        man = new Person();
                        man.name = "john";

                        store.find(man).then(function (results) {
                            test.is(results.length, 1, 'Updated object can be found');
                            test.is(results[0].gender, 'male', 'gender key is still the same');

                            complete.resolve();
                        });
                    });
                });
            }); 
        });
    });

    test.async('test object can be saved', function (complete) {

        var store = new Store();
        store.setMonk(new mock_monk());

        function Person () {
            Person.lian = {name: 'person'};
        }
        
        var jack = new Person();
        jack.name = "jack";

        store.save(jack).then(function (result) {

            test.ok(result._id, 'object is inserted');

            store.find(jack).then(function (results) {
                test.is(results.length, 1, 'Expected number of results are returned');

                results[0].gender = "male";

                store.update(results[0]).then(function () {
                    store.find(jack).then(function (results) {

                        test.is(results[0].gender, 'male', 'gender key is saved');
                        complete.resolve(); 
                    });
                });
            }); 
        });
    });
});