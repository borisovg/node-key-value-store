'use strict';

class Watchers extends Set {
    constructor (logger) {
        super();
        this._log = logger;
        this._revision = 0;
    }

    /**
     * Add watcher
     * @param  {string}   id      watcher id (can be undefined)
     * @param  {string}   [key]   key (optional)
     * @param  {Function} callback watcher callback
     * @throws
     */
    add (id, key, callback) {
        if (!callback) {
            callback = key;
            key = undefined;
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback is not a function');
        } else if (this.has(callback)) {
            throw new Error('Duplicate callback');
        }

        callback._id = id;
        super.add(callback);

        if (key) {
            this._log('debug', 'Watcher added', { key, watcher_id: id, watchers: this.size });
        }
    }

    /**
     * Remove watcher
     * @param   {function} callback
     * @returns {boolean}  true if watcher was removed
     */
    remove (callback) {
        return (this.delete(callback));
    }

    /**
     * Notify watchers with KV data in an asynchronous manner
     * @param  {object} data KV data object
     */
    notify (data) {
        const watchers = Array.from(this);

        setImmediate(() => {
            this._revision += 1;

            for (let i = 0; i < watchers.length; i += 1) {
                this._log('debug', 'Notifying watcher', { watcher_id: watchers[i]._id, key: data.key, revision: data.revision });
                watchers[i](data);
            }
        });
    }
}

module.exports = Watchers;
