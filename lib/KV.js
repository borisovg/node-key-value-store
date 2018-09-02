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

        this._log = logger;

        this._log('debug', 'Record created', { key: this.data.key, revision: this.data.revision });
        this._log('trace', 'Record data', { key: this.data.key, data: this.data.value, revision: this.data.revision });

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

            this._log('debug', 'Record updated', { key: this.data.key, revision: this.data.revision });
            this._log('trace', 'Record data', { key: this.data.key, data: this.data.value, revision: this.data.revision });

            return true;
        }

        return false;
    }
}

module.exports = KV;
