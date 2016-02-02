---
layout: singlepost
title: AOP实现一个vue中带验证的$http模块
tags: vue fe javascript
category: work
---

> 在软件业，AOP为Aspect Oriented Programming的缩写，意为：面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。AOP是OOP的延续，是软件开发中的一个热点，也是Spring框架中的一个重要内容，是函数式编程的一种衍生范型。利用AOP可以对业务逻辑的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高了开发的效率。

事实上在js中，我们不止一次地会用到AOP，这不，我们又遇到了：

现在有一个需求是这样的：在我们的某个SPA项目中需要模拟Native侧的登录效果以增强用户体验，
大概思路是，不管哪个View拉取了哪个接口的数据，只要接口返回403，那么就要"快速"跳转到登录页。
开发人员在调用$http方法拉取数据时不需要关心这个逻辑，全程由拦截逻辑透明代理。

### 思路分析

经过分析可以得出：

1. 所有涉及拉取数据的视图必先要经过一次主动的fetchData调用，因此，我们需要拦截调用侧的逻辑，
并且最好能够保证这个拦截逻辑对于调用侧来讲是透明的；

2. 为了增强用户体验，我们需要在视图还没进入渲染之前就完成这个跳转，因此，这个跳转逻辑不能推迟。

<!-- more -->

### 实现

我们项目落地的选型是：vue+es6，想要达到的目的是让开发不关心拦截逻辑，
像这样：

{% highlight javascript  %}
import header from '../components/header.vue';
import hotsale from '../components/hotsale.vue';
import banner from '../components/banner.vue';

export default {
    // 路由勾子
    // 增强体验的推荐做法
    route: {
        data() {
            return {
                // 因为AOP实现的$httpWithAuth方法有性能损耗
                // 有一些职责清晰的业务可能还是需要直接调用$http
                // 所以，通过将$httpWithAuth这个全新方法挂载到上下文来解决
                'testData': this.$httpWithAuth
                    .get('http://api.test.com/test')
                    .then(function(res) {
                        return {
                            'testData': res
                        }
                    })
            }
        }
    },
    ready() {
        console.dir(this.$http);
        console.dir(this.$route);
    },
    data() {
        return {
            'testData': {}
        }
    },
    methods: {

    },
    components: {
        // 注册组件实例
        header,
        hotsale,
        banner
    }
};
{% endhighlight %}

**$httpWithAuth的实现**

{% highlight javascript  %}
function install(Vue) {
  var _ = require('./util')(Vue);

  // $httpWithAuth
  // 代理Vue.$http
  // Vue.$resource是$http的上层
  Object.defineProperties(Vue.prototype, {
    $httpWithAuth: {
      get: function() {
        return _handleWrapper(this, this.$http);
      }
    }
  });

  // 代理$http模块
  function _handleWrapper(vm, originModule) {
    // 验证方法
    function _auth(promise) {
      promise.then(function(rs) {
        // 返回promise
        // 这里需要返回Promise给组件实例的route选项用
        return promise;
      }, function(err){
        // 重定向到某个业务path
        // 一般为/login登陆业务
        vm.$route.router.go('/login');
      });
    }

    for(var method in originModule) {
      if(originModule.hasOwnProperty(method) &&
      _.isFunction(originModule[method])
    ) {
        // 模块原方法
        var _oF = originModule[method];
        originModule[method] = function() {
          // 绑定验证
          return _auth(_oF.apply(this, arguments));
        }.bind(originModule);
      }
    }

    return originModule;
  }

}

if (window.Vue) {
  Vue.use(install);
}

module.exports = install;
{% endhighlight %}

1. 通过Vue.use勾子我们将$httpWithAuth挂载到上下文供业务侧使用，这样可以保证在各个地方都可以按需调用这个模块
2. 通过简单的AOP，我们就把$http模块的方法进行了验证代理，这样就基本完成了我们的需求。
