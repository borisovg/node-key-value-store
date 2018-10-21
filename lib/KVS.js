'use strict';

const uuid = require('uuid/v1');

const BaseKVS = require('./BaseKVS.js');
const Watchers = require('./Watchers.js');

class KVS extends BaseKVS {
    constructor (opts) {
        super(opts);

        this._kvs = new Map();
        this._range_watchers = new Map();
        this._watchers = new Map();
        this.uuid = uuid();
    }

    /**
     * @private
     */
    _add_range_watcher (range, opts, callback) {
        let watchers = this._range_watchers.get(range);

        if (!watchers) {
            watchers = new Watchers(this._log);
            this._range_watchers.set(range, watchers);
        }

        watchers.add(opts.id, callback);
        this._log('debug', 'Range watcher added', { key_start: range, watcher_id: opts.id, watchers: watchers.size });

        const keys = this.find(range);

        for (let i = 0; i < keys.length; i += 1) {
            this._add_watcher(keys[i], opts, callback);
        }

        return () => {
            if (!watchers.remove(callback)) {
                throw new Error('Unknown watcher');
            }

            this._log('debug', 'Range watcher removed', { key_start: range, watcher_id: opts.id, watchers: watchers.size });

            if (!watchers.size) {
                this._range_watchers.delete(range);
            }

            const keys = this.find(range);

            for (let i = 0; i < keys.length; i += 1) {
                this._remove_watcher(keys[i], callback);
            }
        };
    }

    /**
     * @private
     */
    _add_watcher (key, opts, callback) {
        let watchers = this._watchers.get(key);

        if (!watchers) {
            watchers = new Watchers(this._log);
            this._watchers.set(key, watchers);
        }

        watchers.add(opts.id, key, callback);

        if (!opts.noInitial) {
            const data = this.get(key);

            if (data && data.value !== undefined) {
                const value = data.value;
                const revision = data.revision;

                setImmediate(() => {
                    this._log('debug', 'Notifying watcher with initial data', { watcher_id: opts.id, key });
                    callback({ key, value, revision });
                });
            }
        }

        return () => {
            this._remove_watcher(key, callback);
        };
    }

    _remove_watcher (key, callback) {
        const watchers = this._watchers.get(key);

        if (!watchers || !watchers.remove(callback)) {
            throw new Error('Unknown watcher');
        }

        this._log('debug', 'Watcher removed', { key, watcher_id: callback._id, watchers: watchers.size });

        if (!watchers.size) {
            this._watchers.delete(key);
        }
    }

    delete (key) {
        if (this._watchers.get(key)) {
            const changed = this.set(key, undefined);

            if (changed) {
                this._log('debug', 'Record cleared', { key });
            }

        } else {
            return super.delete(key);
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
    * Schedule notifications for a key's watchers
    */
    notify (key) {
        const data = this.get(key);

        if (!data) {
            throw new Error('Unknown key');
        }

        let watchers = this._watchers.get(key);

        if (watchers) {
            const value = data.value;
            const revision = data.revision;

            watchers.notify({ key, value, revision });
        }
    }

    /**
    * Remove all records and watchers
    */
    reset () {
        super.reset();
        this._range_watchers = new Map();
        this._watchers = new Map();
    }

    /**
     * Set value
     * @param   {any}  value
     * @returns {bool} returns true if value was updated
     */
    set (key, value) {
        var result = super.set(key, value);

        if (!result) {
            return false;

        } else if (result === 1) {
            for (const [range, callbacks] of this._range_watchers) {
                if (key.indexOf(range) !== 0) {
                    continue;
                }

                for (const callback of callbacks) {
                    this._add_watcher(key, { id: callback._id, noInitial: true }, callback);
                }
            }
        }

        this.notify(key);
        return true;
    }
}

module.exports = KVS;
