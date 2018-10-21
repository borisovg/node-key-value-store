'use strict';

const { expect } = require('chai');
const KVS = require('../../lib/KVS.js');

describe('lib/KVS.js - basic CRUD', function () {
    const logs = [];

    function logger () {
        if (process.env.DEBUG) {
            console.log.apply(console, arguments);
        }

        logs.push(arguments);
    }

    const kvs = new KVS({ logger });

    afterEach(function () {
        logs.splice(0, logs.length);
    });

    it('constructor options argument is optional', function () {
        const kvs = new KVS();
        expect(typeof kvs.uuid).to.equal('string');
        kvs._log();
    });

    it('.get() returns undefined if key does not exist', function () {
        expect(kvs.get('foo')).to.equal(undefined);
    });

    it('.set() adds a new key and returns true', function () {
        expect(kvs.set('foo', 123)).to.equal(true);
        expect(kvs.get('foo').key).to.equal('foo');
        expect(kvs.get('foo').revision).to.equal(0);
        expect(kvs.get('foo').value).to.equal(123);

        expect(logs.length).to.equal(2);
        expect(logs[0][0]).to.equal('debug');
        expect(logs[0][1]).to.equal('Record created');
        expect(logs[0][2].key).to.equal('foo');
        expect(logs[0][2].revision).to.equal(0);
        expect(logs[1][0]).to.equal('trace');
        expect(logs[1][1]).to.equal('Record data');
        expect(logs[1][2].key).to.equal('foo');
        expect(logs[1][2].data).to.equal(123);
        expect(logs[1][2].revision).to.equal(0);
    });

    it('.set() updates existing key value and returns true', function () {
        expect(kvs.set('foo', 456)).to.equal(true);
        expect(kvs.get('foo').key).to.equal('foo');
        expect(kvs.get('foo').revision).to.equal(1);
        expect(kvs.get('foo').value).to.equal(456);

        expect(logs.length).to.equal(2);
        expect(logs[0][0]).to.equal('debug');
        expect(logs[0][1]).to.equal('Record updated');
        expect(logs[0][2].key).to.equal('foo');
        expect(logs[0][2].revision).to.equal(1);
        expect(logs[1][0]).to.equal('trace');
        expect(logs[1][1]).to.equal('Record data');
        expect(logs[1][2].key).to.equal('foo');
        expect(logs[1][2].data).to.equal(456);
        expect(logs[1][2].revision).to.equal(1);
    });

    it('.set() returns false if value has not changed', function () {
        expect(kvs.set('foo', 456)).to.equal(false);
        expect(kvs.get('foo').key).to.equal('foo');
        expect(kvs.get('foo').revision).to.equal(1);
        expect(kvs.get('foo').value).to.equal(456);
    });

    it('.find() returns matching keys', function () {
        expect(kvs.set('bar', 123)).to.equal(true);
        expect(kvs.set('baz', 123)).to.equal(true);

        let list = kvs.find('f');
        expect(list.length).to.equal(1);
        expect(list[0]).to.equal('foo');

        list = kvs.find('ba');
        expect(list.length).to.equal(2);
        expect(list[0]).to.equal('bar');
        expect(list[1]).to.equal('baz');
    });

    it('.find() returns all keys if start range is undefined', function () {
        expect(kvs.find().length).to.equal(3);
    });

    it('.delete() removes the key', function () {
        expect(kvs.delete('foo')).to.equal(true);
        expect(kvs.get('foo')).to.equal(undefined);

        expect(logs.length).to.equal(1);
        expect(logs[0][0]).to.equal('debug');
        expect(logs[0][1]).to.equal('Record deleted');
        expect(logs[0][2].key).to.equal('foo');
    });

    it('.delete() does nothing if key does not exist', function () {
        expect(kvs.delete('foo')).to.equal(false);
        expect(logs.length).to.equal(0);
    });

    it('.reset() removes all keys', function () {
        kvs.reset();
        expect(kvs.find().length).to.equal(0);
        expect(logs.length).to.equal(1);
        expect(logs[0][0]).to.equal('warn');
        expect(logs[0][1]).to.equal('Store reset');
        expect(logs[0][2]).to.equal(undefined);
    });
});
