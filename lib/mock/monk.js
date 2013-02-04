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

Db.prototype.close = function (callback) {
    callback && callback();
    return this;
}

function Collection (name) {
    this._name = name;
    this._lastId = 0;
    this._data = {};
    this._indexes = {
        'unique': []
    };
}

Collection.prototype.index = function (property, type, callback) {
    if (! 'unique' in type) {
        throw new Error("Mock monk only supports unique indexes");
    }

    var promise = new Promise(this, 'insert');
    promise.complete(callback);

    this._indexes['unique'].push(property);

    promise.fulfill.call(promise, false, undefined);
    return promise;
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

    var canInsert = true;
    if (this._indexes['unique'].length > 0) {
        var index  = this._indexes['unique'],
            unique = {};

        for (var i = 0; i < index.length; i++) {
            var property = index[i];
            unique[property] = dataSet[property];
        }

        this.count(unique, function (err, results) {
            if (results > 0) {
                promise.emit('error', 'duplicate key error index: one of ' + index.join(','));
                canInsert = false;
            }
        });
    }

    if (canInsert) {
        this._data[id] = dataSet;
        promise.fulfill.call(promise, false, copy(dataSet));
    }
    return promise;
}

Collection.prototype.find = function (ob, callback) {

    var promise = new Promise(this, 'find');
    promise.complete(callback);

    var results = [],
        lookup = {};

    var keys = [];
    for (var key in ob) {
        if (ob[key] === null) {
            continue;
        }
        keys.push(key);
    }

    var targetKey = keys.pop();

    for (var id in this._data) {
        var candidate = this._data[id];
        if (candidate[targetKey] && candidate[targetKey] == ob[targetKey]) {
            // test rest of values

            for (var i = 0, l = keys.length; i < l; i++) {
                var key = keys[i];

                if (!key in candidate || candidate[key] != ob[key]) {
                    candidate = null;
                    break;
                }
            }

            if (candidate) {
                results.push(copy(candidate));
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

Collection.prototype.update = function (target, ob, callback) {
    var promise = new Promise(this, 'update');
    promise.complete(callback);

    var id = target._id;

    if (! this._data[id]) {
        throw new Error("cannot find object _id to update, try inserting instead");
    }

    this._data[id] = copy(ob);

    // resolves the callback with number of updates (which without {multi:true} option is always: 1)
    promise.fulfill.call(promise, false, 1);
    return promise;
}

Collection.prototype.count = function (ob, callback) {
    var promise = new Promise(this, 'count');
    promise.complete(callback);

    this.find(ob, function (err, results) {
        promise.fulfill.call(promise, false, results.length);
    });
    return promise;
}

module.exports = Db;
