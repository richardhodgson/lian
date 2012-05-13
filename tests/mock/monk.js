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

    var dataSet = {};
    for (key in ob) {
        dataSet[key] = ob[key];
    }

    for (key in ob) {
        if (! this._data[key]) {
            this._data[key] = {};
        }
        this._data[key][ob[key]] = dataSet;
    }

    promise.fulfill.call(promise, false, ob);

    return promise;
}

Collection.prototype.find = function (ob, callback) {

    var promise = new Promise(this, 'find');
    promise.complete(callback);

    var results = [],
        lookup = {};



    for (key in ob) {
        if (this._data[key]) {
            if (this._data[key][ob[key]]) {

                var candidate = this._data[key][ob[key]];

                if (lookup[candidate._id]) {
                    break;
                }

                for (k in ob) {
                    if (!candidate[k] || candidate[k] != ob[k]) {
                        
                        candidate = null;
                        break;
                    }
                }

                if (candidate) {
                    lookup[candidate._id] = true;
                    results.push(candidate);
                }
            }
        }
    }

    promise.fulfill.call(promise, false, results);
    return promise;
}

module.exports = Db;