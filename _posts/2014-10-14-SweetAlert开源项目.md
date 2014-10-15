---
layout: singlepost
title: SweetAlert
tags: jekyll 博客
category: 极客工具
---

#SweetAlert

1/2 An awesome replacement for JavaScript's alert.

[See it in action!](http://tristanedwards.me/sweetalert)

![A success modal](http://ww4.sinaimg.cn/mw690/7cc829d3gw1el8siw95rjj20f00aaaat.jpg)

#Usage

You can install SweetAlert through bower:

```bash
bower install sweetalert
```

Alternatively, download the package and reference the JavaScript and CSS files manually:

```html
<script src="lib/sweet-alert.min.js"></script>
<link rel="stylesheet" type="text/css" href="lib/sweet-alert.css">
```

#SASS
The css is built with the `--style compressed` and `--sourcemap=none` options:

    sass --style compressed --sourcemap=none sweet-alert.scss sweet-alert.css