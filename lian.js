var Promise = require('promised-io/promise').Promise;

var OBJECT_NAME_PROPERTY = '$';

function Store (uri) {
    this._uri = uri;
}

Store.prototype.getMonk = function () {
    if (! this._monk) {
        var Monk = require('monk');
        this._monk = new Monk(this._uri);
    }
    return this._monk;
}

Store.prototype.setMonk = function (monk) {
    this._monk = monk;
}

Store.prototype.getCollectionForObject = function (ob) {
    if (! ob[OBJECT_NAME_PROPERTY]) {
        throw new Error('Expected object passed to have ' + OBJECT_NAME_PROPERTY + ' property');
    }
    return this.getMonk().get(ob[OBJECT_NAME_PROPERTY]);
}

Store.prototype.insert = function (ob) {
    var promise = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.insert(ob, function (err, doc) {
        if (err) {
            promise.fail(err);
        }
        else {
            promise.resolve(ob);
        }
    });
    return promise;
}

exports.Store = Store;