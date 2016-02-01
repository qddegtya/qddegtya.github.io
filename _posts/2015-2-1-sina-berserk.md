---
layout: singlepost
title: 前端测试自动化工具 + 页面性能分析工具 BerserkJS 试用小记
tags: fe tool
category: tool
---

> berserkJS 是新形态的前端测试自动化工具 + 页面性能分析工具 ，同时也是个使用 JS 语法控制的命令行浏览器。可用 JS 编写前端自动测试用例 + 页面性能分析用例。

> 已知bug：
当加载的页面样式中存在font-size:0;时，由于QT存在这个【QFont::setPixelSize: Pixel size <= 0(0) 】（官方bug链接 http://qt-project.org/forums/viewthread/17097）问题，导致berserkJS无论在界面模式下还是command模式下都会直接崩溃，已向作者提交issue。

以上引用来自于 BerserkJS 官方github 的大标题，那么，BerserkJS究竟好用在哪里？

[https://github.com/tapir-dream/berserkJS](https://github.com/tapir-dream/berserkJS)

__以上内容是文章摘要__

> 环境：Windows

下面我根据我试用的心得给官方的介绍贴上“注释”

### 使用案例

无界面浏览器测试：在不依赖本地任何浏览器的情况下，运行测试框架，如 QUnit，Capybara, QUnit, Mocha, WebDriver, YUI Test, BusterJS, FuncUnit, Robot Framework 等。

（确实如此，berserJS自带command模式，可以进行无界面的浏览器测试）

页面自动化：可以无障碍访问和操作网页的标准 DOM API 以及页面所用 JS 变量、对象、属性等内容。

主要是因为这个实用的API：

App.webview.execScript(sandbox <function> [, argObject <Object>|<Array>|<string>|<number>])

{% highlight javascript linos%}
// 执行当前页面中的console.log方法打印在控制台中打印 'hello'
App.webview.execScript(function(msg) {
    console.log(msg);
}, 'hello');

// 执行当前页面中的console.log方法在控制台中打印 'width: 100, height:100''
App.webview.execScript(function(size) {
    console.log('width: ' + size.width + ", " + "height: " +  size.height);
}, {width:100, height:300});
{% endhighlight %}

屏幕捕获：以编程方式获取网页全部或部分内容，可根据 Selector 截取指定 DOM 元素渲染情况；包括 CSS，SVG 和 Canvas。可将截取图片 base64 化，以便发送给远端服务器保存。

（也有API进行捕获）

网络监控：自动化的网络性能监控，跟踪页面所有资源加载情况并可简便的将输出结果格式化为标准HAR格式。

(var data=JSON.stringify(App.networkData(),undefined,2); 一句话搞定格式化和收集)

页面性能监控：自动化的页面渲染监控，可获取 CPU、 内存使用情况数据，根据页面整体情况可简便的输出首次渲染时间、首屏渲染时间等关键数据。

(现成API)

### 工具特性

跨平台性：基于 Qt 开发，可跨平台编译，部署。内置基于 QtWebkit 的浏览器环境。源码需在目标系统中编译后，可产生运行于 Windows / Linux / Mac 系统的可执行文件。

(界面稍粗糙一点而已....⊙﹏⊙，功能很强大！)

功能性：工具内置 webkit 浏览器内核，可响应浏览器内核事件回调、支持发送鼠标消息给浏览器、包装浏览器网络请求数据为JS数据格式、可与浏览器内JS做数据交互。

(不得不感叹webkit的强大~)

开放性：工具将主要操作均包装为JS语法与数据格式，采用JS语法包装，前端工程师可根据API组装出符合各自预期的检测功能。

(确实是JS语法，前端躁动.......)

接口性：工具本身支持命令行参数，可带参调用。API支持处理外部进程读取输出流、支持HTTP发送数据。可由 WEB 程序远程调用后获取测试的返回结果。

(看源码可知，确实支持command模式)

标准性：完全真实的浏览器环境内 DOM，CSS，JavaScript，Canvas，SVG 可供使用，绝无仿真模拟。

(这点确实是绝无。)

### 特点差异

与 PhantomJS 相比具有以下不同：

API 简易: 更直接的 API，如获取网络性能数据，仅需 3 行代码，而非 PhantomJS 的几十行，且信息量比 PhantomJS 丰富。

API 标准化： 常用 API 均采用 W3 规范标准命名，事件处理代码可重复绑定而不相互覆盖，可以无缝兼容 Wind.JS 等异步流程处理库来解决自动化时异步流程控制问题。

页面性能信息丰富：具有页面渲染和 CPU、 内存使用情况数据获取能力，可输出首次渲染时间、首屏渲染时间等页面性能关键数据。

调试便利: 具有 GUI 界面与命令行状态两种形式，开发调试期可使用 GUI 模式定位问题，此模式中可开启 WebKit 的 Inspector 工具辅助调试页面代码与 DOM 。实际运行时可开启命令行状态避免自动执行时 GUI 界面干扰。

### 应用企业

新浪微博：已使用 berserkJS 构建前端性能监测数据分析平台，防止微博主要产品在不停开发迭代时，页面性能产生退化。

Cisco: 用于 WebEx 项目的自动化测试

### 试用示例

我们的目标：

1. 采集页面加载过程中的所有性能数据并序列化之后进行存储
2. 在界面上显示加载进度。

![](http://segmentfault.com/img/bVc5aK)

### 根据API用JS完成我们此次的目标

{% highlight javascript linos%}
/*
berserkJS 验证XXX页面加载问题
 */
//打开网络监听
App.netListener(true);

//打开Tujia
App.webview.open("xxxxxxxxxxxx");

//监听加载进度
App.webview.addEventListener("loadProgress",function(cur){
    console.log("当前加载进度: %" + cur);
});

//页面load完成后回调获取数据
App.webview.addEventListener("load",function(){
    var data=JSON.stringify(App.networkData(),undefined,2);
    //写入文件
    App.writeFile(App.path + "xxxx.txt",data);

    //关闭监听
    App.netListener(false);

    //退出App
    //App.close();
});
{% endhighlight %}

berserkJS提供了很多可以监听的事件类型，满足你各种要求，每个回调函数的参数不一样，看一下官方api就知道了。

上述脚本中，我们记录下了页面加载的数据，利用这个数据我们可以做很多事情，开发一个前端性能对比平台应该就不是什么难事了。

### Run！GO~GO~GO

{% highlight bash linos%}
berserkJS --script=xxx.js
{% endhighlight %}

### 采集下来的序列化数据

{% highlight json linos %}
  {
    "StatusCode": 302,
    "ReasonPhrase": "Found",
    "FromCache": false,
    "url": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "RequestStartTime": 1411711232386,
    "RequestEndTime": 1411711232542,
    "ResponseSize": 0,
    "ResponseDuration": 156,
    "ResponseWaitingDuration": 155,
    "ResponseDownloadDuration": 1,
    "ResponseDNSLookupDuration": 0,
    "ResponseMethod": "GET",
    "UserAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Qt/4.8.0 Safari/534.34 berserkJS",
    "Accept": "*/*",
    "Referer": "xxxxxxxxxxxxxxxxxxxxxxxxx",
    "AcceptRanges": "",
    "Age": "",
    "AccessControlAllowOrigin": "",
    "CacheControl": "",
    "Connection": "close",
    "ContentType": "text/html",
    "ContentLength": 0,
    "ContentEncoding": "",
    "ContentLanguange": "",
    "Cookie": "",
    "Date": "Fri, 26 Sep 2014 06:00:32 GMT",
    "ETag": "",
    "Expires": "",
    "IfModifiedSince": "",
    "LastModified": "",
    "Location": "xxxxxxxxxxxxxxxxxxxx",
    "Server": "Apache",
    "SetCookie": "ALLYESID4=08E83680AC344512; expires=Wednesday, 02-Nov-2099 00:00:00 GMT; path=/; domain=allyes.com",
    "P3P": "",
    "Vary": "",
    "TransferEncoding": "",
    "Via": "",
    "XVia": "",
    "XDEBUGIDC": "",
    "XPoweredBy": "",
    "XCache": "",
    "XCacheLookup": "",
    "XCacheVarnish": "",
    "PoweredByChinaCache": "",
    "SINALB": "",
    "width": -1,
    "height": -1,
    "hasKeepAlive": false,
    "hasGZip": false,
    "hasCookie": false,
    "hasCache": false,
    "hasExpires": false,
    "isFromCDN": false,
    "isImgFile": false,
    "isPng": false,
    "isJpg": false,
    "isGif": false,
    "isIco": false,
    "isSvg": false,
    "isCssFile": false,
    "isJsFile": false,
    "isDocFile": true,
    "isAudioFile": false,
    "isVideoFile": false,
    "isFontFile": false,
    "isOtherFile": false,
    "isHttp200": false,
    "isHttp301": false,
    "isHttp302": true,
    "isHttp304": false,
    "isHttp404": false
  }
{% endhighlight %}

### 其他一些前端性能采集框架推荐

[Bucky.js](http://github.hubspot.com/bucky/ "bucky.js")
