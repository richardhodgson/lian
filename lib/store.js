var Promise = require('promised-io/promise').Promise;

var OBJECT_NAME_PROPERTY = 'lian',
    STORED_OBJECT_NAME_PROPERTY = '_lian_name';

function getMeta (ob) {
    if (! ob.constructor[OBJECT_NAME_PROPERTY]) {

        if (! ob[OBJECT_NAME_PROPERTY]) {
            throw new Error('Expected object constructor passed to have ' + OBJECT_NAME_PROPERTY + ' property');
        }
        return ob[OBJECT_NAME_PROPERTY];
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
    this.setReady();
}

/**
 * Takes a promise as argument, allowing the consumer to
 * control when operations are acted on.
 * 
 * For example:
 *     
 *     var store = new Store('localhost/mydb'),
 *         ready = new Promise();
 *     
 *     store.setReady(ready);
 *     
 *     store.insert(myObject);
 *     
 *     ready.resolve(); // insert is now performed.
 * 
 * @param Promise the promise that must be resolved before
 * operations will be performed.
 * @return void
 */
Store.prototype.setReady = function(promise) {
    if (!promise) {
        promise = new Promise();
        promise.resolve();
    }

    this._whenReady = function (callback) {
        promise.then(callback);
    }
};

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

Store.prototype.createIndex = function (ob, property, type) {
    if (type != 'unique') {
        throw new Error('only unique indexes are supported');
    }

    var ready = new Promise();
    this.setReady(ready);

    this.getCollectionForObject(ob).index(property, {'unique': true}, function (err, doc) {
        if (err) {
            ready.reject(err);
        }
        ready.resolve();
    });

    return ready;
}

Store.prototype.insert = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    this._whenReady(function () {
        collection.insert(_serialise(ob), function (err, doc) {
            if (err) {
                promise.reject(err);
                return;
            }

            promise.resolve(_deserialise(ob.constructor, doc));
        });
    });
    return promise;
}

Store.prototype.find = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    this._whenReady(function () {
        collection.find(_serialise(ob), function (err, doc) {
            if (err) {
                promise.reject(err);
                return;
            }

            var results = [];
            for (key in doc) {
                results[key] = _deserialise(ob.constructor, doc[key]);
            }

            promise.resolve(results);
        });
    });
    return promise;
}

Store.prototype.findOne = function (ob) {
    var promise = new Promise(),
        collection = this.getCollectionForObject(ob);

    this._whenReady(function () {
        collection.findOne(_serialise(ob), function (err, doc) {
            if (err) {
                promise.reject(err);
                return;
            }

            if (doc) {
                promise.resolve(_deserialise(ob.constructor, doc));
                return;
            }

            promise.resolve(null);
        });
    });

    return promise;
}

Store.prototype.update = function (ob) {
    if (! ob._id) {
        throw new Error("cannot update an object without an _id property");
    }

    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    var target = {
        _id: ob._id
    }

    this._whenReady(function () {
        collection.update(target, _serialise(ob), function (err, doc) {
            if (err) {
                promise.reject(err);
                return;
            }
            
            promise.resolve(_deserialise(ob.constructor, ob));
        });
    });

    return promise;
}

Store.prototype.save = function (ob) {
    var methodName = (ob._id) ? 'update' : 'insert';
    return this[methodName](ob);
}

Store.prototype.close = function () {
    var promise = new Promise(),
        self    = this;

    this._whenReady(function () {
        self.getMonk().close(function () {
            promise.resolve();
        });
    });
    return promise;
}

Store.prototype.count = function (ob) {
    var promise    = new Promise(),
        collection = this.getCollectionForObject(ob);

    this._whenReady(function () {
        collection.count(_serialise(ob), function (err, count) {
            if (err) {
                promise.reject(err);
                return;
            }
            
            promise.resolve(count);
        });
    });
    return promise;
}

module.exports = Store;