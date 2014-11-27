---
layout: singlepost
title: Brew Python 与 Xcode Plugin 加载Python的冲突问题
tags: 实验 Python
category: experiments
---

> 通过brew安装的python会提示移除mac os自带的python版本，除非你忽略这个warning，但同时又会带来一系列package的安装问题，由于xcode的某些ideplugin默认会加载python，故经常导致的不能启动xcode问题可以尝试用一句话解决。

### 查看xcodebuild出错信息


{% highlight bash linenos %}
xcodebuild
{% endhighlight %}

### 首先通过brew安装python

{% highlight bash linenos %}
brew install python
{% endhighlight %}

### 接着直接copy -R


{% highlight bash linenos %}
cd /usr/local/Cellar/python/2.7.7_2/Frameworks/
{% endhighlight %}

{% highlight bash linenos %}
sudo copy -R Python.framework /Library/Frameworks/
{% endhighlight %}


Done，这个时候Xcodebuild就可以成功了，Xcode顺利启动。