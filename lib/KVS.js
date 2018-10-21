'use strict';

const uuid = require('uuid/v1');

const KV = require('./KV.js');
const Watchers = require('./Watchers.js');

class KVS {
    constructor (opts) {
        opts = opts || {};
        this._log = opts.logger || function () {};

        this._kvs = new Map();
        this._range_watchers = new Map();
        this.uuid = uuid();
    }

    /**
     * @private
     */
    _add_range_watcher (range, opts, callback) {
        let watchers = this._range_watchers.get(range);

        if (!watchers) {
            watchers = new Map();
            this._range_watchers.set(range, watchers);
        }

        watchers.set(callback, opts.id);
        this._log('debug', 'Range watcher added', { key_start: range, watcher_id: opts.id, watchers: watchers.size });

        const keys = this.find(range);

        for (let i = 0; i < keys.length; i += 1) {
            this._add_watcher(keys[i], opts, callback);
        }

        return () => {
            if (!watchers.delete(callback)) {
                throw new Error('Unknown watcher');
            }

            this._log('debug', 'Range watcher removed', { key_start: range, watcher_id: opts.id, watchers: watchers.size });

            if (!watchers.size) {
                this._range_watchers.delete(range);
            }

            const keys = this.find(range);

            for (let i = 0; i < keys.length; i += 1) {
                const kv = this._kvs.get(keys[i]);

                kv.watchers.remove(callback);

                if (!kv.watchers.watchers.size) {
                    kv.watchers = undefined;
                }
            }
        };
    }

    /**
     * @private
     */
    _add_watcher (key, opts, callback) {
        let kv = this._kvs.get(key);

        if (!kv) {
            kv = this._new_key(key);
        }

        kv.watchers = kv.watchers || new Watchers(this._log);
        kv.watchers.add(key, opts.id, callback);

        if (kv.data.value !== undefined && !opts.noInitial) {
            setImmediate(() => {
                this._log('debug', 'Notifying watcher with initial data', { watcher_id: opts.id, key });
                callback(kv.data);
            });
        }

        return () => {
            if (!kv.watchers || !kv.watchers.remove(callback)) {
                throw new Error('Unknown watcher');
            }

            this._log('debug', 'Watcher removed', { key, watcher_id: opts.id, watchers: kv.watchers.watchers.size });

            if (!kv.watchers.watchers.size) {
                if (kv.data.value === undefined) {
                    this.delete(kv.data.key);
                } else {
                    kv.watchers = undefined;
                }
            }
        };
    }

    /**
     * @private
     */
    _new_key (key, value) {
        let kv = new KV(key, value, this._log);

        this._kvs.set(key, kv);

        for (const [range, watchers] of this._range_watchers) {
            if (key.indexOf(range) === 0) {
                kv.watchers = kv.watchers || new Watchers(this._log);

                for (const [callback, id] of watchers) {
                    kv.watchers.add(key, id, callback);
                }
            }
        }

        if (kv.watchers && value !== undefined) {
            kv.watchers.notify(kv.data);
        }

        return kv;
    }

    /**
     * Delete key
     * @param  {string} key
     * @returns {bool} returns true if key was deleted
     */
    delete (key) {
        const kv = this._kvs.get(key);

        if (kv) {
            this.set(key, undefined);

            if (kv.watchers && kv.watchers.watchers.size) {
                this._log('debug', 'Record cleared', { key });

            } else {
                this._kvs.delete(key);
                this._log('debug', 'Record deleted', { key });
            }

            return true;
        }

        return false;
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

    on (key, opts, callback) {
        if (arguments.length === 2) {
            callback = opts;
            opts = undefined;
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback is not a function');
        }

        opts = opts || {};

        if (opts.isRange) {
            return this._add_range_watcher(key, opts, callback);
        } else {
            return this._add_watcher(key, opts, callback);
        }
    }

    once (key, opts, callback) {
        if (arguments.length === 2) {
            callback = opts;
            opts = undefined;
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback is not a function');
        }

        const off = this.on(key, opts, function (data) {
            // don't remove watcher if callback returns true - very useful for testing
            if (!callback(data)) {
                off();
            }
        });

        return off;
    }

    /**
    * Remove all records and watchers
    */
    reset () {
        this._log('warn', 'Store reset');

        this._range_watchers = new Map();
        this._kvs = new Map();
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

            setImmediate(function () {
                if (kv.watchers) {
                    kv.watchers.notify(kv.data);
                }
            });

        } else {
            kv = this._new_key(key, value);
            updated = true;
        }

        return updated;
    }
}

module.exports = KVS;
