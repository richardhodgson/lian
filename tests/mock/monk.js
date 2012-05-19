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

    ob._id = this._lastId;

    var dataSet = copy(ob);

    for (key in ob) {
        var value = ob[key];
        if (! this._data[key]) {
            this._data[key] = {};
        }

        if (! this._data[key][value]) {
            this._data[key][value] = [];
        }

        this._data[key][value].push(dataSet);
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

            var value = ob[key];

            if (this._data[key][value]) {

                var candidates = this._data[key][value];

                for (c in candidates) {
    
                    var candidate = candidates[c];
        
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
                        results.push(copy(candidate));
                    }
                }
            }
        }
    }

    promise.fulfill.call(promise, false, results);
    return promise;
}

Collection.prototype.update = function (ob, callback) {
    var promise = new Promise(this, 'update');
    promise.complete(callback);

    var id = ob._id,
        candidate = this._data['_id'][id];

    if (! candidate) {
        throw new Error("todo");
    }

    var data = this._data;

    for (var key in data) {
        for (var value in data[key]) {
            var candidates = data[key][value];
            for (var i = 0, l = candidates.length; i < l; i++) {
                var candidate = candidates[i];
                if (candidate._id == id) {

                    if (ob[key] && ob[key] == value) {
                        data[key][value][i] = ob;
                    }
                    else {
                        // delete candidate
                        delete data[key][value][i];
                    }
                }
            }
        }
    }

    promise.fulfill.call(promise, false, {});
    return promise;
}

module.exports = Db;
