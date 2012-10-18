var Promise = require('monk/lib/promise');

function copy (ob) {
    var dataSet = {};
    for (key in ob) {
        dataSet[key] = ob[key];
    }
    return dataSet;
}

function Db () {
    this._collections = {};
}

Db.prototype.get = function (collectionName) {
    if (! this._collections[collectionName]) {
        this._collections[collectionName] = new Collection(collectionName);
    }
    return this._collections[collectionName];
}

function Collection (name) {
    this._name = name;
    this._lastId = 0;
    this._data = {};
}

Collection.prototype.insert = function (ob, callback) {

    var promise = new Promise(this, 'insert');
    promise.complete(callback);

    this._lastId++;
    var id = this._lastId;

    var dataSet = copy(ob);
    dataSet._id = id;

    if (this._data[id]) {
        throw new Error("cannot insert object, _id already exists");
    }

    this._data[id] = dataSet;
    promise.fulfill.call(promise, false, copy(dataSet));
    return promise;
}

Collection.prototype.find = function (ob, callback) {

    var promise = new Promise(this, 'find');
    promise.complete(callback);

    var results = [],
        lookup = {};

    var keys = [];
    for (var key in ob) {
        keys.push(key);
    }

    var targetKey = keys.pop();

    for (var id in this._data) {
        var candidate = this._data[id];
        if (candidate[targetKey] && candidate[targetKey] == ob[targetKey]) {
            // test rest of values

            for (var i = 0, l = keys.length; i < l; i++) {
                var key = keys[i];
                if (!candidate[key] || candidate[key] != ob[key]) {
                    candidate = null;
                    break;
                }
            }

            if (candidate) {
                results.push(candidate);
            }
        }
    }

    promise.fulfill.call(promise, false, results);
    return promise;
}

Collection.prototype.findOne = function (ob, callback) {
    var promise = new Promise(this, 'findOne');
    promise.complete(callback);

    this.find(ob, function (err, results) {
        promise.fulfill.call(promise, false, (results.length) ? results[0] : null);
    });

    return promise;
}

Collection.prototype.update = function (ob, callback) {
    var promise = new Promise(this, 'update');
    promise.complete(callback);

    var id = ob._id;

    if (! this._data[id]) {
        throw new Error("cannot find object _id to update, try inserting instead");
    }

    this._data[id] = copy(ob);

    promise.fulfill.call(promise, false, copy(this._data[id]));
    return promise;
}

module.exports = Db;
