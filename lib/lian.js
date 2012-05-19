var Store = require('./store');

var mixedMethods = ['insert', 'update', 'find', 'save'];

function Meta (name) {
    this._store = null;
    this.name = name;
}

Meta.prototype.getStore = function() {
    return this._store;
};

Meta.prototype.setStore = function(store) {
    this._store = store;
};

function proxyMixedMethods (ob, meta) {
    for (var i = 0, l = mixedMethods.length; i < l; i++) {
        (function (methodName) {                    
            if (ob[methodName]) {
                throw new Error("Cannot add '" + methodName + "' method, already defined");
            }
            ob[methodName] = function () {
                return meta.getStore()[methodName](ob);
            };
        })(mixedMethods[i]);
    }
}

function metaMixin (ob, name, store) {
    var meta;
    if (ob.constructor.lian && ob.constructor.lian instanceof Meta) {
        meta = ob.constructor.lian;
    }
    else {
        meta = ob.constructor.lian = new Meta(name);
        if (store) {
            meta.setStore(store);
        }
    }

    if (meta.getStore()) {
        proxyMixedMethods(ob, meta);
    }
};

module.exports = function (target, name) {

    if (typeof target == 'string') {
        return function (ob, name) {
            return metaMixin(ob, name, new Store(target));
        }
    }
    else {
        return metaMixin(target, name);
    }

}