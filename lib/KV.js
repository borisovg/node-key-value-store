'use strict';

class KV {
    /**
     * Key-Value object
     * @param {any}    key
     * @param {any}    value
     */
    constructor (key, value, logger) {
        this.data = {
            key,
            revision: 0,
            value,
        };

        this.log = logger;
        this.watchers = undefined;

        this.log('debug', 'Record created', { key: this.data.key, revision: this.data.revision });

        if (value !== undefined) {
            this.log('trace', 'Record data', { key: this.data.key, data: this.data.value, revision: this.data.revision });
        }
    }

    /**
     * Set value
     * @param   {any}  value
     * @returns {bool} returns true if value was updated
     */
    set (value) {
        if (this.data.value !== value || typeof value === 'object') {
            this.data.revision += 1;
            this.data.value = value;

            if (value !== undefined) {
                this.log('debug', 'Record updated', { key: this.data.key, revision: this.data.revision });
                this.log('trace', 'Record data', { key: this.data.key, data: this.data.value, revision: this.data.revision });
            }

            return true;
        }

        return false;
    }
}

module.exports = KV;
