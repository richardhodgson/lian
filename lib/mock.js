var Store = require('./lian').Store,
    metaMixin = require('./lian').metaMixin;

/**
 * @function Make a constructor extend another.
 * Makes a subclass by creating a prototype for the child that shares the
 * prototype of the parent. Addionally sets the base property of the child
 * function to point to the parent function (useful for calling
 * `arguments.callee.base.apply(this, arguments)` in the top of the child
 * function to allow use of parent constructor).
 *
 * @param {Function} child
 *   Child constructor.
 * @param {Function} parent
 *   Parent constructor.
 */

function extend (child, parent) {
    var p = function () {};
    p.prototype = parent.prototype;
    child.prototype = new p();
    child.base = parent;
};


function MemoryStore () {
    arguments.callee.base.apply(this, arguments);
}

extend(MemoryStore, Store);

MemoryStore.prototype.getMonk = function () {
    if (! this._monk) {
        var Monk = require('./mock/monk');
        this._monk = new Monk(this._uri);
    }
    return this._monk;
}

/**
 * 
 */
module.exports = function (target, name) {
    if (typeof target == 'string') {
        return function (ob, name) {
            return metaMixin(ob, name, new MemoryStore(target));
        }
    }
    else {
        return metaMixin(target, name);
    }
}

module.exports.Store = MemoryStore;