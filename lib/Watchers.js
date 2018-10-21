'use strict';

class Watchers {
    constructor (logger) {
        this.log = logger;
        this.notifications = 0;
        this.watchers = new Set();
    }

    /**
     * Add watcher
     * @param  {Function} callback watcher callback
     * @throws
     */
    add (key, id, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback is not a function');
        } else if (this.watchers.has(callback)) {
            throw new Error('Duplicate callback');
        }

        callback._id = id;
        this.watchers.add(callback);
        this.log('debug', 'Watcher added', { key, watcher_id: id, watchers: this.watchers.size });
    }

    /**
     * Remove watcher
     * @param  {Function} callback watcher callback
     * @returns {boolean} true if watcher was removed
     */
    remove (callback) {
        return (this.watchers.delete(callback));
    }

    /**
     * Notify watchers with KV data
     * @param  {object} data KV data object
     */
    notify (data) {
        this.notifications += 1;

        for (const callback of this.watchers) {
            this.log('debug', 'Notifying watcher', { watcher_id: callback._id, key: data.key, revision: data.revision });
            callback(data);
        }
    }
}

module.exports = Watchers;
