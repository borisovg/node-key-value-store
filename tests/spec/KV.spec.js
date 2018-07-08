'use strict';

const { expect } = require('chai');
const KV = require('../../lib/KV.js');

describe('lib/KV.js', function () {
    let kv, v, w;

    it('creates KV object with revision=0 if no initial value provided', function () {
        kv = new KV('foo');
        expect(kv.key).to.equal('foo');
        expect(kv.revision).to.equal(0);
        expect(kv.value).to.equal(undefined);
    });

    it('creates KV object with revision=1 if initial value provided', function () {
        kv = new KV('foo', 'bar');
        expect(kv.key).to.equal('foo');
        expect(kv.revision).to.equal(1);
        expect(kv.value).to.equal('bar');
    });

    it('does not update simple type value if unchanged', function () {
        const updated = kv.set('bar');

        expect(updated).to.equal(false);
        expect(kv.revision).to.equal(1);
        expect(kv.value).to.equal('bar');
    });

    it('updates value', function () {
        const updated = kv.set(v = { bar: 'bar' });

        expect(updated).to.equal(true);
        expect(kv.revision).to.equal(2);
        expect(kv.value).to.equal(v);
    });

    it('always updates value of type object', function () {
        v = { bar: 'bar' };
        kv.set(v);
        expect(kv.revision).to.equal(3);
        expect(kv.value).to.equal(v);
    });

    it('watcher gets KV on initial subscription and update', function (done) {
        let i = 0;

        w = function (kv) {
            expect(kv.value).to.equal(v);
            i += 1;
        };

        kv.set(v = 'foo');
        kv.on(undefined, w);

        process.nextTick(function () {
            expect(i).to.equal(1);
            kv.set(v = 'bar');

            process.nextTick(function () {
                expect(i).to.equal(2);
                done();
            });
        });
    });

    it('removes a watcher', function (done) {
        kv.off(w);

        for (let k of Reflect.ownKeys(kv)) {
            if (typeof k === 'symbol' && k.toString() === 'Symbol(watchers)') {
                expect(kv[k].size).to.equal(0);
                return done();
            }
        }
    });

    it('watcher gets no initial KV if opts.noInitial is set, only updates', function (done) {
        let i = 0;

        w = function (kv) {
            expect(kv.value).to.equal(v);
            i += 1;
        };

        kv.on({ noInitial: true }, w);

        process.nextTick(function () {
            expect(i).to.equal(0);
            kv.set(v = 'foo');

            process.nextTick(function () {
                expect(i).to.equal(1);
                kv.off(w);
                done();
            });
        });
    });

    it('watcher gets no initial KV if opts.haveRevision is >= revision number', function (done) {
        let i = 0;

        w = function (kv) {
            expect(kv.value).to.equal(v);
            i += 1;
        };

        kv.on({ haveRevision: kv.revision }, w);

        process.nextTick(function () {
            expect(i).to.equal(0);
            kv.off(w);
            done();
        });
    });
});
