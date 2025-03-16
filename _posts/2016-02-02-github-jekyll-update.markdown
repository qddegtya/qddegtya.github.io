---
layout: single
title: Github Pages 服务启用 Jekyll 3.0，享受纯净 Markdown 写作体验
tags: github jekyll
category: lab
excerpt: "Github Pages (以下简称 GP) 服务从今天起正式启用 Jekyll 3.0 版本。"
header:
  overlay_color: "#0d1117"
---

Github Pages (以下简称 GP) 服务从今天起正式启用 Jekyll 3.0 版本，各位博主需要特别注意以下两点

- 2016.5.1 起，GP 将只支持 Kramdown Markdown 引擎，这就意味着你站点的 \_config.yml 中可以移除相关设置了

- GP 现在只支持 Rouge 型的代码高亮，因此，你可以直接在文章中使用你最熟悉的三个波浪线或重音线来标记高亮代码区间，可以大胆抛弃老的高亮语法规则了

### Github 新代码高亮语法测试

{% highlight javascript linenos %}
"use strict";

var gulp = require("gulp");
var uglifycss = require("gulp-uglifycss");

gulp.task("css", function () {
  gulp
    .src("./assets/css/*.css")
    .pipe(uglifycss())
    .pipe(gulp.dest("./assets/dist/"));
});

gulp.task("debug", function () {
  gulp
    .src("./assets/css/*.css")
    //.pipe (uglifycss ())
    .pipe(gulp.dest("./assets/dist/"));
});

gulp.task("build", ["css"]);
gulp.task("default", ["debug"]);
{% endhighlight %}

可以查看 Github 上的 md 源文件验证上述规则。
