var litmus = require('litmus'),
    mock_monk = require('./mock/monk'),
    Store = require('../lian').Store

exports.test = new litmus.Test('store', function () {

    var store = new Store();
    store.setMonk(mock_monk)

    this.is(store.getMonk(), mock_monk, 'Can mock monk');

    var Thing = {}

    this.throwsOk(
        function () {
            store.insert(Thing);
        },
        /name/,
        'Inserting something without a name property throws an error'
    );
});

