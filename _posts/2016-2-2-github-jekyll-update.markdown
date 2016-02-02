---
layout: singlepost
title: Github Pages服务启用Jekyll 3.0，享受纯净Markdown写作体验
tags: github jekyll
category: lab
---

Github Pages(以下简称GP)服务从今天起正式启用Jekyll 3.0版本，以下几点需要特别注意

<!-- more -->

  * 2016.5.1起，GP将只支持Kramdown Markdown 引擎，这就意味着你站点的_config.yml中可以移除相关设置了

  * GP目前只支持Rouge型的代码高亮，而且，再也不用{% highlight %}等语法了

### 新代码语法高亮测试

```javascript
var gulp = require('gulp');
```
