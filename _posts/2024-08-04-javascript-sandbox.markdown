---
layout: single
title: Javascript Sandbox
tags: javascript
category: javascript
excerpt: "今天在整理以前的一些 Research，逐步搬运到博客上来，这篇是关于 Javascript Sandbox（Browser）"
header:
  overlay_color: "#0d1117"
---

> 今天在整理以前的一些 Research，逐步搬运到博客上来，这篇是关于 Javascript Sandbox（Browser）

---

### Something works

* [Iframe + sandbox attribute](https://www.w3.org/TR/2010/WD-html5-20100624/the-iframe-element.html#attr-iframe-sandbox)
* [webworker + Prevent usage of dangerous objects + SCP](https://www.softfluent.com/blog/dev/Executing-untrusted-JavaScript-code-in-a-browser)
* [Further Strict Sandbox (truely sandbox env) - Google Caja](https://github.com/google/caja)

### Lib

> flexible JS sandbox.
> Jailed is a small JavaScript library for running untrusted code in a sandbox. The library is written in vanilla-js and has no dependencies.

Jailed — flexible JS sandbox [https://github.com/asvd/jailed](https://github.com/asvd/jailed)

> Caja is a tool for making third party HTML, CSS and JavaScript safe to embed in your website. It enables rich interaction between the embedding page and the embedded applications. Caja uses an object-capability security model to allow for a wide range of flexible security policies, so that your website can effectively control what embedded third party code can do with user data.

Caja supports most HTML and CSS and the recently standardized "strict mode" JavaScript version of JavaScript -- even on older browsers that do not support strict mode. It allows third party code to use new JavaScript features on older browsers that do not support them.

[https://github.com/google/caja](https://github.com/google/caja)

### Reference

* [is-it-possible-to-sandbox-javascript-running-in-the-browser](https://stackoverflow.com/questions/195149/is-it-possible-to-sandbox-javascript-running-in-the-browser)
