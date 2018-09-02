'use strict';

const uuid = require('uuid/v1');
const KV = require('./KV.js');

class KVS {
    constructor (opts) {
        opts = opts || {};

        this._kvs = new Map();
        this._uuid = uuid();
        this._log = opts.logger || function () {};
    }

    /**
     * Delete key
     * @param  {string} key
     */
    delete (key) {
        const kv = this._kvs.get(key);

        if (kv) {
            this._kvs.delete(key);
            this._log('debug', 'Record deleted', { key });
            kv.set(undefined);
        }
    }

    /**
     * Find keys that start with string
     * @param  {string} [range] start string, or undefined to get all keys
     * @return {string[]} array of matching keys
     */
    find (range) {
        if (range === undefined) {
            return Array.from(this._kvs.keys());
        }

        const keys = [];

        for (let key of this._kvs.keys()) {
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
    }

    /**
    * Remove all records
    */
    reset () {
        this._log('warn', 'Store reset');
        this._kvs.clear();
    }

    /**
     * Set value
     * @param   {any}  value
     * @returns {bool} returns true if value was updated
     */
    set (key, value) {
        let kv = this._kvs.get(key);
        let updated = false;

        if (kv) {
            updated = kv.set(value);

        } else {
            kv = new KV(key, value, this._log);
            this._kvs.set(key, kv);
            updated = true;
        }

        return updated;
    }
}

module.exports = KVS;
