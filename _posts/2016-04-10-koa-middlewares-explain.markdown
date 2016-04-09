---
layout: singlepost
title: KOA源码阅读之理解KOA中间件的执行
tags: javascript node
category: work
---

源码阅读系列的开篇就不多废话了，开门见山。

首先看添加中间件的入口app.use的源码

```javascript
/**
 * Use the given middleware `fn`.
 *
 * @param {GeneratorFunction} fn
 * @return {Application} self
 * @api public
 */

app.use = function(fn){
  if (!this.experimental) {
    // es7 async functions are not allowed,
    // so we have to make sure that `fn` is a generator function
    assert(fn && 'GeneratorFunction' == fn.constructor.name, 'app.use() requires a generator function');
  }
  debug('use %s', fn._name || fn.name || '-');

  // 主要就是做这个事情
  // 根据上面的assert，这里的fn均为generator function
  this.middleware.push(fn);
  return this;
};

```

<!-- more -->

接着，来看一下Server是怎么起来的

```javascript
/**
 * Shorthand for:
 *
 *    http.createServer(app.callback()).listen(...)
 *
 * @param {Mixed} ...
 * @return {Server}
 * @api public
 */

app.listen = function(){
  debug('listen');

  // 非常熟悉的createServer
  // 调用的是app.callback
  var server = http.createServer(this.callback());
  return server.listen.apply(server, arguments);
};
```

很显然，app.callback里应该就有我们想要的中间件执行的部分

```javascript
/**
 * Return a request handler callback
 * for node's native http server.
 *
 * @return {Function}
 * @api public
 */

app.callback = function(){
  if (this.experimental) {
    console.error('Experimental ES7 Async Function support is deprecated. Please look into Koa v2 as the middleware signature has changed.')
  }

  var fn = this.experimental
    ? compose_es7(this.middleware)
    : co.wrap(compose(this.middleware)); // 把中间件串起来
  var self = this;

  if (!this.listeners('error').length) this.on('error', this.onerror);

  return function(req, res){
    res.statusCode = 404;
    var ctx = self.createContext(req, res);
    onFinished(res, ctx.onerror);
    fn.call(ctx).then(function () {
      respond.call(ctx);
    }).catch(ctx.onerror);
  }
};
```

这里的compose是关键，我们来到koa-compose的源码，仅仅就这38行代码，就构成了KOA中间件执行的核心部分，这里我们暂且不讨论co.wrap

```javascript
/**
 * Expose compositor.
 */

module.exports = compose;

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose(middleware){
  return function *(next){
    if (!next) next = noop();

    var i = middleware.length;

    while (i--) {
      next = middleware[i].call(this, next);
    }

    return yield *next;
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}
```

这么快就看到这行了？我觉得上面的代码信息量很大，道友们再细细品味一下，确定品味完了，下面的开胃DEMO可以帮助你更好的理解这个执行过程

```javascript
#!/usr/bin/env node

// 中间件 a
function* a(next) {
  yield 1;

  // 执行下一个中间件
  yield* next;

  yield '继续执行A中间件';
}

// 中间件 b
function* b(next) {
  yield 2;
  yield 3;
}


var next = function* (){};
var i = [a, b].length;

// 通过next首尾相连
while(i--) {
  next = [a, b][i].call(null, next);
}

// 包裹第一个middleware
function* start(ne) {
  return yield* ne;
}


// 输出
console.log(start(next).next());
console.log(start(next).next());
console.log(start(next).next());
console.log(start(next).next());
```

输出结果：

```
➜  a-lab ./a
{ value: 1, done: false }
{ value: 2, done: false }
{ value: 3, done: false }
{ value: '继续执行A中间件', done: false }
```

等等，我们的co去哪儿了？大家有没有发现上面Demo中和我们平时写KOA的不同之处，我们来看一下KOA的官方示例代码：

```
var koa = require('koa');
var app = koa();

// x-response-time

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// logger

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

// response

app.use(function *(){
  this.body = 'Hello World';
});

app.listen(3000);
```

有没有发现？如果还没有发现我就公布答案啦：

> 根据上文，我们已经知道，那个负责把所有中间件串起来的next其实本身也是一个generator，但是，如果在Generater函数内部，调用另一个Generator函数，默认情况下是没有效果的，这个时候我们必须使用yield* next

但是，我们写代码的时候明明写的是yield next啊，这就是co的奥秘之处了：

co做的事情就是帮我们"自动管理"了generator的next，并根据调用返回的value做出不同的响应，他的原理其实是自动调用一次generator的next方法，然后通过toPromise方法，如果遇到一个generator就递归一次，这就是为什么我们只要写yield next就可以了，因为co一旦检测到这个next还是个generater，那就再次co.call(this)

```javascript
yield next;
```

```javascript
/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}
```

有了这个函数，如果我们在项目中直接使用了DEMO中的

```javascript
yield 1
```

co就会给我们一个错误

```
You may only yield a function, promise, generator, array, or object.
```

所以，我们一般在项目中如果想要"同步"写法，都会用Promise封装一下，比如这样：

```javascript
let getAuthInfo = function(req) {
  return new Promise((resolve, reject) => {
    rp(req)
    .then((authres) => {
      debug(`用户中心响应结果: ${JSON.stringify(authres)}`);

      if(authres.status === 0 && authres.code === 0) {
        resolve(authres);
      } else {
        resolve(null);
      }
    })
    .catch((err) => {
      reject(err);
    });
  });
};
```

然后，我们就可以愉快地这样使用了：

```
let authinfo = yield getAuthInfo(authReq);
```

### 总结

* KOA通过next将中间件"串"了起来，形成了链表，然后通过最外层的generator function触发整个执行过程

* 在compose的时候，拿取中间件的顺序是FILO的，但是拿出来之后做的操作是循环i--赋值next，因此，依然可以保证正确的顺序执行

* KOA框架中充斥着各种generater的思想，并且通过co来自动管理generater
