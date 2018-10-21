'use strict';

const { expect } = require('chai');
const Watchers = require('../../lib/Watchers.js');

describe('lib/Watchers.js', function () {
    const logs = [];
    let fn, fn1, fn2, watchers;

    function logger () {
        if (process.env.DEBUG) {
            console.log.apply(console, arguments);
        }

        logs.push(arguments);
    }

    afterEach(function () {
        logs.splice(0, logs.length);
    });

    it('creates Watcher object', function () {
        watchers = new Watchers(logger);
        expect(watchers.notifications).to.equal(0);
    });

    it('.add() adds a watcher with an ID', function () {
        fn = function (data) {
            fn1(data);
        };

        watchers.add('foo', 'bar', fn);
        expect(watchers.watchers.size).to.equal(1);
    });

    it('.add() adds a watcher without an ID', function () {
        fn = function (data) {
            fn2(data);
        };

        watchers.add('foo', undefined, fn);
        expect(watchers.watchers.size).to.equal(2);
    });

    it('.add() throws if callback is not provided', function () {
        expect(() => watchers.add('foo')).to.throw('Callback is not a function');
    });

    it('.add() throws if callback is used more than once', function () {
        expect(() => watchers.add('foo', 'bar', fn)).to.throw('Duplicate callback');
    });

    it('.notify() notifies the watchers with data', function (done) {
        const data = { key: 'foo', value: 'bar', revision: 1 };

        fn1 = function (d) {
            expect(d).to.equal(data);
            expect(logs.length).to.equal(1);
            expect(logs[0][0]).to.equal('debug');
            expect(logs[0][1]).to.equal('Notifying watcher');
            expect(logs[0][2].key).to.equal('foo');
            expect(logs[0][2].revision).to.equal(1);
            expect(logs[0][2].watcher_id).to.equal('bar');

            fn2 = function (d) {
                expect(d).to.equal(data);
                expect(logs.length).to.equal(2);
                expect(logs[1][2].watcher_id).to.equal(undefined);
                done();
            };
        };

        watchers.notify(data);
    });

    it('.remove() removes a callback', function () {
        watchers.remove(fn);
        expect(watchers.watchers.size).to.equal(1);
    });

    it('.remove() does nothing if callback not listed', function () {
        watchers.remove(fn);
        expect(watchers.watchers.size).to.equal(1);
    });
});
