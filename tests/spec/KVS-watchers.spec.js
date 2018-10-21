'use strict';

const { expect } = require('chai');
const KVS = require('../../lib/KVS.js');

describe('lib/KVS.js - watcher pub/sub', function () {
    const logs = [];
    let off;

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

    it('.on() adds a watcher', function (done) {
        const off1 = kvs.on('foo', function (data) {
            expect(data.key).to.equal('foo');
            expect(data.value).to.equal(123);
            expect(data.revision).to.equal(1);
        });

        kvs.set('foo', 123);
        kvs.set('bar', 123);

        const off2 = kvs.on('bar', function (data) {
            expect(data.key).to.equal('bar');
            expect(data.value).to.equal(123);
            expect(data.revision).to.equal(0);

            const off3 = kvs.on('foo', function (data) {
                expect(data.key).to.equal('foo');
                expect(data.value).to.equal(123);
                expect(data.revision).to.equal(1);

                off = function () {
                    off1();
                    off2();
                    off3();
                };

                setImmediate(done);
            });
        });
    });

    it('.on() returns function to remove watcher', function () {
        off();
        kvs.set('bar', 456);
    });

    it('remove watcher function throws if run more that once', function () {
        expect(() => off()).to.throw('Unknown watcher');
    });

    it('.delete() clears value of KV with watchers instead of removing it', function (done) {
        let semaphore = 2;

        const off = kvs.on('foo', { noInitial: true }, function (data) {
            semaphore -= 1;

            if (semaphore) {
                expect(data.value).to.equal(undefined);
                kvs.set('foo', 123);

            } else {
                expect(data.value).to.equal(123);
                off();
                setImmediate(done);
            }
        });

        kvs.delete('foo');
    });

    it('.on() respects the "noInitial" option', function (done) {
        const off = kvs.on('foo', { noInitial: true }, function (data) {
            expect(data.value).to.equal(1234);
            off();
            setImmediate(done);
        });

        kvs.set('foo', 1234);
    });

    it('.on() adds a range watcher if "isRange" option is set', function (done) {
        let counter = 0;

        const cb1 = function (data) {
            expect(data.key).to.equal('foo');
            expect(data.value).to.equal(1234);
            counter += 1;
        };

        const cb2 = function (data) {
            expect(data.key).to.equal('fooo');
            expect(data.value).to.equal(123);
            counter += 1;
        };

        const off1 = kvs.on('foo', { id: 'a', isRange: true }, function (data) {
            if (counter > 1) {
                cb2(data);
            } else {
                cb1(data);
            }
        });

        const off2 = kvs.on('foo', { id: 'b', isRange: true }, function (data) {
            if (counter > 2) {
                cb2(data);
            } else {
                cb1(data);
            }
        });

        setImmediate(function () {
            kvs.set('fooo', 123);

            setImmediate(function () {
                expect(counter).to.equal(4);
                off1();
                off2();
                expect(() => off1()).to.throw('Unknown watcher');
                done();
            });
        });
    });

    it('.on() throws if callback is not provided', function () {
        expect(() => kvs.on('foo')).to.throw('Callback is not a function');
    });

    it('.once() adds a one-time watcher', function (done) {
        let cb = function (data) {
            expect(data.key).to.equal('foo');
            expect(data.value).to.equal(1234);

            cb = function () {
                throw new Error('This should not happen');
            };

            kvs.set('foo', 456);

            setImmediate(done);
        };

        kvs.once('foo', function (data) {
            cb(data);
        });
    });

    it('.once() returns function to remove watcher', function (done) {
        kvs.delete('foo');

        kvs.once('foo', function () {
            throw new Error('This should not happen');
        })();

        // check that key with undefined value is cleaned up
        expect(kvs.get('foo')).to.equal(undefined);

        kvs.set('foo', 123);
        setImmediate(done);
    });

    it('.once() respects the "noInitial" option', function (done) {
        kvs.once('foo', { noInitial: true }, function (data) {
            expect(data.value).to.equal(456);
            setImmediate(done);
        });

        kvs.set('foo', 456);
    });

    it('.once() does not remove watcher if callback returns truthy value', function (done) {
        let semaphore = 2;

        kvs.once('foo', function () {
            semaphore -= 1;

            if (semaphore) {
                return true;
            } else {
                setImmediate(done);
            }
        });

        kvs.set('foo', 4567);
    });

    it('.once() throws if callback is not provided', function () {
        expect(() => kvs.once('foo')).to.throw('Callback is not a function');
    });

    it('range watcher picks up keys created later', function (done) {
        kvs.once('baz', { isRange: true, noInitial: true }, function (data) {
            expect(data.key).to.equal('bazz');
            expect(data.value).to.equal(123);
            setImmediate(done);
        });

        setImmediate(function () {
            kvs.set('barr', 123);
            kvs.set('bazz', 123);
        });
    });

    it('no notification of range watches key created with undefined value', function (done) {
        kvs.delete('foo');
        kvs.delete('fooo');

        kvs.on('foo', { isRange: true }, function () {
            throw new Error('This should not happen');
        });

        kvs.on('foo', function () {
            throw new Error('This should not happen');
        });

        setImmediate(done);
    });

    it('.reset() removes all keys', function () {
        kvs.reset();
        expect(kvs.find().length).to.equal(0);
        expect(kvs._range_watchers.size).to.equal(0);
        expect(logs.length).to.equal(1);
        expect(logs[0][0]).to.equal('warn');
        expect(logs[0][1]).to.equal('Store reset');
        expect(logs[0][2]).to.equal(undefined);
    });
});
