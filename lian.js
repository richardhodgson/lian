var Promise = require('promised-io/promise').Promise;

var OBJECT_NAME_PROPERTY = '$',
    STORED_OBJECT_NAME_PROPERTY = '_lian_name';

function _serialise (ob) {
    ob[STORED_OBJECT_NAME_PROPERTY] = ob[OBJECT_NAME_PROPERTY];
    delete ob[OBJECT_NAME_PROPERTY];

    var dataSet = {};
    for (key in ob) {
        if (typeof ob[key] != 'function') {
            dataSet[key] = ob[key];
        }
    }
    return dataSet;
}

function _deserialise (constructor, dataSet) {
    dataSet[OBJECT_NAME_PROPERTY] = dataSet[STORED_OBJECT_NAME_PROPERTY];
    delete dataSet[STORED_OBJECT_NAME_PROPERTY];

    ob = new constructor();
    for (key in dataSet) {
        ob[key] = dataSet[key];
    }
    return ob;
}

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
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.insert(_serialise(ob), function (err, doc) {
        if (err) {
            promise.fail(err);
        }
        else {
            promise.resolve(_deserialise(ob.constructor, doc));
        }
    });
    return promise;
}

Store.prototype.find = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.find(_serialise(ob), function (err, doc) {
        if (err) {
            promise.fail(err);
            return;
        }

        var results = [];
        for (key in doc) {
            results[key] = _deserialise(ob.constructor, doc[key]);
        }

        promise.resolve(results);
    });
    return promise;
}

exports.Store = Store;