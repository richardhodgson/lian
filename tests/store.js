var litmus = require('litmus'),
    mock_monk = require('./mock/monk'),
    Store = require('../lian').Store

exports.test = new litmus.Test('store', function () {

    var store = new Store();
    store.setMonk(mock_monk)

    console.log(store);

    this.is(store.getMonk(), mock_monk, 'Can mock monk');
});

