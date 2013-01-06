var Store   = require('./store'),
    Promise = require('promised-io/promise').Promise;

function Meta (name, options) {
    this._store = null;
    this.name = name;
    this.options = options;
}

Meta.prototype.getStore = function () {
    return this._store;
};

Meta.prototype.setStore = function (store) {
    this._store = store;
};

Meta.prototype.close = function () {
    var store = this.getStore();
    if (! store) {
        throw new Error('no store to close connection for');
    }
    return store.close();
}

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
                function (err) {
                    ready.reject(err);
                }
            );
            return ready;
        }
        else {
            throw new Error("unexpected type returned from " + methodName + " before callback. Expected boolean or promise.");
        }
    };
}

function addProxyMethods (methods, ob, meta, proxyMethod) {

    var hasBeforeCallbacks = !! meta.options.before;

    var mix = function (methodName, proxyMethod) {

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
            ob[methodName] = proxyMethod(ob, meta, methodName);
        }
    };

    for (var i = 0, l = methods.length; i < l; i++) {
        mix(methods[i], proxyMethod);
    }
}

function hasLian (func) {
    return (func.lian && func.lian instanceof Meta);
}

function mixinStaticOperations (func, meta) {
    addProxyMethods(
        ['find', 'findOne', 'count'],
        func,
        meta,
        function (ob, meta, methodName) {
            return function () {
                var instance = new ob();
                return instance[methodName]();
            }
        }
    );
}

function mixinInstanceOperations (ob, meta) {
    addProxyMethods(
        ['insert', 'update', 'find', 'findOne', 'save', 'count'],
        ob,
        meta,
        function (ob, meta, methodName) {
            return function () {
                return meta.getStore()[methodName](ob);
            }
        }
    );
}

function lian (ob, name, options) {

    var func;
    if (typeof ob == 'function') {
        func = ob;
        ob   = func.prototype;
    }
    else {
        func = ob.constructor;
    }

    var meta;
    if (hasLian(func)) {
        meta = func.lian;
    }
    else {
        meta = new Meta(name, options);

        if (options.store) {
            meta.setStore(options.store);
            mixinStaticOperations(func, meta);
        }

        func.lian = meta;
    }

    if (meta.getStore()) {
        mixinInstanceOperations(ob, meta);
    }

    return meta;
}

function factory (Store) {
    return function (target, name, options) {

        options = options || {};

        /*
         * e.g.
         *     var lian = require('lian')('localhost/mydb');
         */
        if (typeof target == 'string') {
            return function (ob, name, options) {

                options = options || {};
                options['store'] = new Store(target);
                
                return lian(ob, name, options);
            }
        }
        /*
         * e.g. 
         *    function Shape () {
         *        lian(this, 'shape');
         *    }
         */
        else {
            return lian(target, name, options);
        }
    }
};

module.exports = factory(Store);

module.exports.factory   = factory;
module.exports.Store     = Store;
