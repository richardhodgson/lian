var Store = require('./store');

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

            if (hasBeforeCallbacks && meta.options.before[methodName]) {
                ob[methodName] = function () {

                    if (meta.options.before[methodName](ob)) {
                        return meta.getStore()[methodName](ob);
                    }
                };
            }
            else {
                ob[methodName] = function () {
                    return meta.getStore()[methodName](ob);
                };
            }
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

