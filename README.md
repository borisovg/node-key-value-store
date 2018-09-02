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

