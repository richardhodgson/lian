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

function createMixedMethodsProxyHandler (ob, meta, methodName, beforeCallback) {
    return function () {

        var result = beforeCallback(ob);

        if (result === true) {
            return meta.getStore()[methodName](ob);
        }
        else if (result === false) {
            var reject = new Promise();
            reject.reject();
            return reject;
        }
        else if (typeof result === 'object' && result.then) {
            // create a new Promise, rather than re-use the one returned
            // from the callback.
            var ready = new Promise();
            result.then(
                function () {
                    meta.getStore()[methodName](ob).then(function () {
                        ready.resolve.apply(this, arguments);
                    });
                },
                function () {
                    ready.reject();
                }
            );
            return ready;
        }
        else {
            throw new Error("unexpected type returned from " + methodName + " before callback. Expected boolean or promise.");
        }
    };
}

function proxyMixedMethods (ob, meta) {

    var hasBeforeCallbacks = !! meta.options.before;

    var mix = function (methodName) {

        if (ob[methodName]) {
            throw new Error("Cannot add '" + methodName + "' method, already defined");
        }

        if (hasBeforeCallbacks && meta.options.before[methodName]) {
            ob[methodName] = createMixedMethodsProxyHandler(
                ob,
                meta,
                methodName,
                meta.options.before[methodName]
            );
        }
        else {
            ob[methodName] = function () {
                console.log(methodName);
                return meta.getStore()[methodName](ob);
            };
        }
    };

    for (var i = 0, l = mixedMethods.length; i < l; i++) {
        mix(mixedMethods[i]);
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

