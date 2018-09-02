'use strict';

const { expect } = require('chai');
const KVS = require('../../index.js');

describe('index.js', function () {
    it('exports KVS class', function () {
        const store = new KVS();

        expect(typeof store.delete).to.equal('function');
        expect(typeof store.get).to.equal('function');
        expect(typeof store.find).to.equal('function');
        expect(typeof store.reset).to.equal('function');
        expect(typeof store.set).to.equal('function');
    });
});
