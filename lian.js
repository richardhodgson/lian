function Store () {
    //this._monk = null;
}

Store.prototype.getMonk = function () {
    if (! this._monk) {
        this._monk = require('monk');
    }
    return this._monk;
}

Store.prototype.setMonk = function (monk) {
    this._monk = monk;
}

Store.prototype.insert = function (ob) {
    if (! ob.name) {
        throw new Error('Expected object passed to have name property');
    }
}

exports.Store = Store;
