var litmus = require('litmus'),
    mock_monk = require('./mock/monk'),
    Store = require('../lian').Store;

function log (o) {
    console.log(o);
}

exports.test = new litmus.Test('store', function () {

    var test = this;

    var store = new Store();
    store.setMonk(new mock_monk());

    test.is(store.getMonk(), new mock_monk(), 'Can mock monk');

    var Thing = {}

    test.throwsOk(
        function () {
            store.insert(Thing);
        },
        /name/,
        'Inserting something without a name property throws an error'
    );

    Thing = function () {
        this.name = 'Thing';
    }

    test.async('test object is inserted', function (complete) {

        thing = new Thing();

        var result = store.insert(thing);
        test.is(typeof result['then'], 'function', 'insert returns a promise');

        result.then(function (thing) {
            log(thing.toString());

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
});

