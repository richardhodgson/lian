var Promise = require('promised-io/promise').Promise;

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

Store.prototype.insert = function (ob) {
    if (! ob.name) {
        throw new Error('Expected object passed to have name property');
    }
    var monk = this.getMonk(),
        promise = new Promise();

    var collection = monk.get(ob.name);

    collection.insert(ob, function (err, doc) {
        if (err) {
            promise.fail(err);
        }
        else {
            promise.resolve(doc);
        }
    });
    return promise;
}

exports.Store = Store;
