'use strict';

class KV {
    /**
     * Key-Value object
     * @param {any} key
     * @param {any} value
     */
    constructor (key, value) {
        this.data = {
            key,
            revision: 0,
            value,
        };
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
            return true;
        }

        return false;
    }
}

module.exports = KV;
