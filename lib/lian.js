var Store   = require('./store'),
    Promise = require('promised-io/promise').Promise;

var mixedMethods = ['insert', 'update', 'find', 'save'];

function Meta (name, options) {
    this._store = null;
    this.name = name;
    this.options = options;
}

Meta.prototype.getStore = function() {
    return this._store;
};

Meta.prototype.setStore = function(store) {
    this._store = store;
};

function proxyMixedMethods (ob, meta) {

    var hasBeforeCallbacks = !! meta.options.before;

    for (var i = 0, l = mixedMethods.length; i < l; i++) {
        (function (methodName) {
            if (ob[methodName]) {
                throw new Error("Cannot add '" + methodName + "' method, already defined");
            }

            var proxy;

            if (hasBeforeCallbacks && meta.options.before[methodName]) {

                proxy = function () {

                    var beforeCallback = meta.options.before[methodName](ob)

                    if (beforeCallback === true) {
                        return meta.getStore()[methodName](ob);
                    }
                    else if (typeof beforeCallback === 'object' && beforeCallback.then) {
                        // create a new Promise, rather than re-use the one returned
                        // from the callback.
                        var ready = new Promise();
                        beforeCallback.then(function () {
                            meta.getStore()[methodName](ob).then(function () {
                                ready.resolve.apply(this, arguments);
                            });
                        });
                        return ready;
                    }
                };
            }
            else {
                proxy = function () {
                    return meta.getStore()[methodName](ob);
                };
            }

            ob[methodName] = proxy;

        })(mixedMethods[i]);
    }
}

function metaMixin (ob, name, options) {
    var meta;
    if (ob.constructor.lian && ob.constructor.lian instanceof Meta) {
        meta = ob.constructor.lian;
    }
    else {
        meta = ob.constructor.lian = new Meta(name, options);
        if (options.store) {
            meta.setStore(options.store);
        }
    }

    if (meta.getStore()) {
        proxyMixedMethods(ob, meta);
    }
};

function capitaliseFirstCharacter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports = function (target, name, options) {

    options = options || {};

    if (typeof target == 'string') {
        return function (ob, name, options) {

            options = options || {};
            options['store'] = new Store(target);
            
            return metaMixin(ob, name, options);
        }
    }
    else {
        return metaMixin(target, name, options);
    }

}

module.exports.Store = Store;
module.exports.metaMixin = metaMixin;

