var Promise = require('promised-io/promise').Promise;

var OBJECT_NAME_PROPERTY = 'lian',
    STORED_OBJECT_NAME_PROPERTY = '_lian_name';

function getMeta (ob) {
    if (! ob.constructor[OBJECT_NAME_PROPERTY]) {
        throw new Error('Expected object constructor passed to have ' + OBJECT_NAME_PROPERTY + ' property');
    }
    return ob.constructor[OBJECT_NAME_PROPERTY];
};

function _serialise (ob) {
    var dataSet = {};
    for (key in ob) {
        if (typeof ob[key] != 'function') {
            dataSet[key] = ob[key];
        }
    }
    dataSet[STORED_OBJECT_NAME_PROPERTY] = getMeta(ob).name;
    delete dataSet[OBJECT_NAME_PROPERTY];
    return dataSet;
}

function _deserialise (constructor, dataSet) {
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
    return this.getMonk().get(getMeta(ob)['name']);
}

Store.prototype.insert = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.insert(_serialise(ob), function (err, doc) {
        if (err) {
            promise.fail(err);
            return;
        }

        promise.resolve(_deserialise(ob.constructor, doc));
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

Store.prototype.findOne = function (ob) {
    var promise = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.findOne(_serialise(ob), function (err, doc) {
        if (err) {
            promise.fail(err);
            return;
        }

        if (doc) {
            promise.resolve(_deserialise(ob.constructor, doc));
            return;
        }

        promise.resolve(null);
    });

    return promise;
}

Store.prototype.update = function (ob) {
    if (! ob._id) {
        throw new Error("cannot update an object without an _id property");
    }

    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.update(_serialise(ob), function (err, doc) {
        if (err) {
            promise.fail(err);
            return;
        }
        
        promise.resolve(_deserialise(ob.constructor, doc));
    });
    return promise;
}

Store.prototype.save = function (ob) {
    var methodName = (ob._id) ? 'update' : 'insert';
    return this[methodName](ob);
}

Store.prototype.close = function () {
    var promise = new Promise();
    this.getMonk().close(function () {
        promise.resolve();
    });
    return promise;
}

Store.prototype.count = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    collection.count(_serialise(ob), function (err, count) {
        if (err) {
            promise.fail(err);
            return;
        }
        
        promise.resolve(count);
    });
    return promise;
}

module.exports = Store;