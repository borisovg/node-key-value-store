# Key-value store

An in-memory key-value store for Node.js apps, inspired by Etcd.

## Usage

Installation:

```
npm install @borisovg/key-value-store
```

Basic usage examples:

```
const KVS = require('@borisovg/key-value-store');
const store = new KVS();

store.set('foo', 'bar');
// true

store.get('foo');
// { key: 'foo', revision: 0, value: 'bar' }

store.set('foo', 123);
store.get('foo');
// { key: 'foo', revision: 1, value: 123 }

store.find('f');
// [ 'foo' ]

store.find('foo');
// true

store.delete('foo');
// true
```

Pub/sub for single keys:

```
// initial data will be sent
store.set('foo', 123);

const off = store.on('foo', function (data) {
    console.log(data);
    // { key: 'foo', revision: 0, value: 123 }
    // { key: 'foo', revision: 1, value: 456 }
});

store.set('foo', 456);

// notification happens in async manner
setImmediate(off);
```

Pub/sub for range of keys:

```
// initial data will be sent
store.set('bar1', 123);

const off2 = store.on('bar', { isRange: true }, function (data) {
    console.log(data);
    // { key: 'bar1', revision: 0, value: 123 }
    // { key: 'bar1', revision: 1, value: 456 }
    // { key: 'bar2', revision: 0, value: 456 }
});

store.set('bar1', 456);
store.set('bar2', 456);

// notification happens in async manner
setImmediate(off2);
```

## Logging

The KVS is capable of producing detailed logging.
The example below uses my own [structured JSON logger](https://github.com/borisovg/poleno), but you can use anything.

```
const KVS = require('@borisovg/key-value-store');
const poleno = require('poleno');

poleno.configure({
    streams: [
        { level: 'trace', stream: process.stdout }
    ]
});

const log = poleno('KVS');

const store = new KVS({
    logger: function (level, msg, params) {
        log[level](msg, params);
    }
});

store.set('foo', 'bar');
// {"time":"2018-09-02T21:34:41.896Z","hostname":"glossy","pid":"26634","name":"KVS","level":"debug","key":"foo","revision":0,"msg":"Record created"}
// {"time":"2018-09-02T21:34:41.896Z","hostname":"glossy","pid":"26634","name":"KVS","level":"trace","key":"foo","data":"bar","revision":0,"msg":"Record data"}

store.set('foo', 123);
// {"time":"2018-09-02T21:35:32.343Z","hostname":"glossy","pid":"26634","name":"KVS","level":"debug","key":"foo","revision":1,"msg":"Record updated"}
// {"time":"2018-09-02T21:35:32.343Z","hostname":"glossy","pid":"26634","name":"KVS","level":"trace","key":"foo","data":123,"revision":1,"msg":"Record data"}

store.delete('foo');
// {"time":"2018-09-02T21:36:56.670Z","hostname":"glossy","pid":"26634","name":"KVS","level":"debug","key":"foo","msg":"Record deleted"}
```

## API

### new KVS([options])

Creates a KVS instance.

- *options.logger* Logger function (level, msg, params)
