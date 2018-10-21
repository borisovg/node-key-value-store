'use strict';

const { expect } = require('chai');
const KV = require('../../lib/KV.js');

describe('lib/KV.js', function () {
    let kv, v;

    it('creates KV object', function () {
        kv = new KV('foo', 'bar');

        expect(kv.data.key).to.equal('foo');
        expect(kv.data.revision).to.equal(0);
        expect(kv.data.value).to.equal('bar');
    });

    it('.set() does not update simple type value if unchanged', function () {
        const updated = kv.set('bar');

        expect(updated).to.equal(false);
        expect(kv.data.revision).to.equal(0);
        expect(kv.data.value).to.equal('bar');
    });

    it('.set() updates value', function () {
        const updated = kv.set(v = { bar: 'bar' });
        expect(updated).to.equal(true);
        expect(kv.data.revision).to.equal(1);
        expect(kv.data.value).to.equal(v);
    });

    it('.set() always updates value of type object', function () {
        kv.set(v = { bar: 'bar' });
        expect(kv.data.revision).to.equal(2);
        expect(kv.data.value).to.equal(v);
    });
});
