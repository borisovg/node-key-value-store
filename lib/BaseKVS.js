'use strict';

const uuid = require('uuid/v1');
const KV = require('./KV.js');

class BaseKVS {
    constructor (opts) {
        opts = opts || {};
        this._log = opts.logger || function () {};

        this._kvs = new Map();
        this.uuid = uuid();
    }

    /**
     * Delete key
     * @param  {string} key
     * @returns {bool} returns true if key was deleted
     */
    delete (key) {
        const changed = (this._kvs.delete(key));

        if (changed) {
            this._log('debug', 'Record deleted', { key });
        }

        return changed;
    }

    /**
     * Find keys that start with string
     * @param  {string} [range] start string, or undefined to get all keys
     * @return {string[]}       array of matching keys
     */
    find (range) {
        if (range === undefined) {
            return Array.from(this._kvs.keys());
        }

        const keys = [];

        for (const key of this._kvs.keys()) {
            if (key.indexOf(range) === 0) {
                keys.push(key);
            }
        }

        return keys;
    }

    /**
     * Get KV data
     * @param  {string} key
     * @return {object} returns the KV data object
     */
    get (key) {
        const kv = this._kvs.get(key);

        if (kv) {
            return kv.data;
        }
    }

    /**
    * Remove all records and watchers
    */
    reset () {
        this._log('warn', 'Store reset');
        this._kvs = new Map();
    }

    /**
     * Set value
     * @param   {any}    value
     * @returns {number} returns 1 if key was created and 2 existing key was updated
     */
    set (key, value) {
        let kv = this._kvs.get(key);
        let updated = 0;

        if (!kv) {
            kv = new KV(key, value, this._log);
            this._kvs.set(key, kv);
            updated = 1;

        } else if (kv.set(value)) {
            updated = 2;
        }

        return updated;
    }
}

module.exports = BaseKVS;
