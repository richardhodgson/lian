var Promise = require('monk/lib/promise');

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

    ob._id = this._lastId;

    for (key in ob) {
        if (! this._data[key]) {
            this._data[key] = {};
        }

        this._data[key][ob[key]] = ob;
    }
    promise.fulfill.call(promise, false, callback);
    return promise
}

module.exports = Db;