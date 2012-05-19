var Store = require('./store');

function Meta () {
    this._store = null;
}

Meta.prototype.getStore = function() {
    return this._store;
};

Meta.prototype.setStore = function(store) {
    this._store = store;
};

module.exports = function (target, name) {
    var metaMixin = function (object, name, store) {
        var meta = new Meta();
        object.lian = meta;

        if (store) {
            meta.setStore(store);
        }
    };

    if (typeof target == 'string') {
        return function (object, name) {
            return metaMixin(object, name, new Store(target));
        }
    }
    else {
        return metaMixin;
    }

}