---
layout: singlepost
title: Github Pages服务启用Jekyll 3.0，享受纯净Markdown写作体验
tags: github jekyll
category: lab
---

Github Pages(以下简称GP)服务从今天起正式启用Jekyll 3.0版本，各位博主需要特别注意以下两点

<!-- more -->

  * 2016.5.1起，GP将只支持Kramdown Markdown 引擎，这就意味着你站点的_config.yml中可以移除相关设置了

  * GP现在只支持Rouge型的代码高亮，因此，你可以直接在文章中使用你最熟悉的三个波浪线或重音线来标记高亮代码区间，可以大胆抛弃老的高亮语法规则了

### Github新代码高亮语法测试

```javascript
'use strict';

var gulp = require('gulp');
var uglifycss = require('gulp-uglifycss');

gulp.task('css', function () {
  gulp.src('./assets/css/*.css')
    .pipe(uglifycss())
    .pipe(gulp.dest('./assets/dist/'));
});

gulp.task('debug', function() {
  gulp.src('./assets/css/*.css')
    // .pipe(uglifycss())
    .pipe(gulp.dest('./assets/dist/'));
})

gulp.task('build', ['css'])
gulp.task('default', ['debug']);
```

可以查看Github上的md源文件验证上述规则。
