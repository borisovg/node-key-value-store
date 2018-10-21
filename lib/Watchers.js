'use strict';

class Watchers extends Set {
    constructor (logger) {
        super();
        this._log = logger;
        this._revision = 0;
    }

    /**
     * Add watcher
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
     * @param  {Function} callback watcher callback
     * @returns {boolean} true if watcher was removed
     */
    remove (callback) {
        return (this.delete(callback));
    }

    /**
     * Notify watchers with KV data
     * @param  {object} data KV data object
     */
    notify (data) {
        this._revision += 1;

        for (const callback of this) {
            this._log('debug', 'Notifying watcher', { watcher_id: callback._id, key: data.key, revision: data.revision });
            callback(data);
        }
    }
}

module.exports = Watchers;
