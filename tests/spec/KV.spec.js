'use strict';

const { expect } = require('chai');
const KV = require('../../lib/KV.js');

describe('lib/KV.js', function () {
    const logs = [];
    let kv, v;

    function logger () {
        if (process.env.DEBUG) {
            console.log.apply(console, arguments);
        }

        logs.push(arguments);
    }

    afterEach(function () {
        logs.splice(0, logs.length);
    });

    it('creates KV object', function () {
        kv = new KV('foo', 'bar', logger);

        expect(kv.data.key).to.equal('foo');
        expect(kv.data.revision).to.equal(0);
        expect(kv.data.value).to.equal('bar');

        expect(logs.length).to.equal(2);
        expect(logs[0][0]).to.equal('debug');
        expect(logs[0][1]).to.equal('Record created');
        expect(logs[0][2].key).to.equal('foo');
        expect(logs[0][2].revision).to.equal(0);
        expect(logs[1][0]).to.equal('trace');
        expect(logs[1][1]).to.equal('Record data');
        expect(logs[1][2].data).to.equal('bar');
        expect(logs[1][2].key).to.equal('foo');
        expect(logs[1][2].revision).to.equal(0);
    });

    it('.set() does not update simple type value if unchanged', function () {
        const updated = kv.set('bar');

        expect(updated).to.equal(false);
        expect(kv.data.revision).to.equal(0);
        expect(kv.data.value).to.equal('bar');

        expect(logs.length).to.equal(0);
    });

    it('.set() updates value', function () {
        const updated = kv.set(v = { bar: 'bar' });

        expect(updated).to.equal(true);
        expect(kv.data.revision).to.equal(1);
        expect(kv.data.value).to.equal(v);

        expect(logs.length).to.equal(2);
        expect(logs[0][0]).to.equal('debug');
        expect(logs[0][1]).to.equal('Record updated');
        expect(logs[0][2].key).to.equal('foo');
        expect(logs[0][2].revision).to.equal(1);
        expect(logs[1][0]).to.equal('trace');
        expect(logs[1][1]).to.equal('Record data');
        expect(logs[1][2].data.bar).to.equal('bar');
        expect(logs[1][2].key).to.equal('foo');
        expect(logs[1][2].revision).to.equal(1);
    });

    it('.set() always updates value of type object', function () {
        kv.set(v = { bar: 'bar' });

        expect(kv.data.revision).to.equal(2);
        expect(kv.data.value).to.equal(v);

        expect(logs.length).to.equal(2);
        expect(logs[0][1]).to.equal('Record updated');
        expect(logs[1][1]).to.equal('Record data');
    });
});
