'use strict';

const watchers = Symbol('watchers');

class KV {
    /**
     * Key-Value object
     * @param {any}    key
     * @param {any}    value
     */
    constructor (key, value) {
        this.key = key;
        this.revision = (value !== undefined) ? 1 : 0;
        this.value = value;

        this[watchers] = new Set();
    }

    /**
     * Remove a watcher
     * @param  {Function} callback watcher function to remove
     */
    off (callback) {
        this[watchers].delete(callback);
    }

    /**
     * Add a watcher
     * @param  {Object}   opts                options object
     * @param  {number}   [opts.haveRevision] only send initial notification if revision is greater
     * @param  {bool}     [opts.noInitial]    no initial notification if true
     * @param  {Function} callback            watcher callback that will get the KV object
     */
    on (opts, callback) {
        this[watchers].add(callback);

        if (this.value === undefined || opts && opts.noInitial) {
            return;
        }

        process.nextTick(() => {
            if (!opts || opts.haveRevision < this.revision) {
                callback(this);
            }
        });
    }

    /**
     * Notify all watchers
     */
    notify () {
        if (!this[watchers].size) {
            return;
        }

        process.nextTick(() => {
            for (let watcher of this[watchers]) {
                watcher(this);
            }
        });
    }

    /**
     * Set value
     * @param   {any}  value
     * @returns {bool} returns true if value was updated
     */
    set (value) {
        if (this.value !== value || typeof value === 'object') {
            this.revision += 1;
            this.value = value;
            this.notify();

            return true;
        }

        return false;
    }
}

module.exports = KV;
