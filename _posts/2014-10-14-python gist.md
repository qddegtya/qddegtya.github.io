---
layout: singlepost
title: python gist
tags: python
category: 实验
---

fdsafdasfdasdsafa

### 代码片段

{% highlight python linenos %}
import urllib
import urllib2
import re
import time

def grabSubdomain(popurl):
    #deal the popurl
    popurl = popurl.strip()
    if (popurl[:5] == 'http:'):
        popurl=popurl[7:]     #get right URL
    numT = popurl.find('/')
    if (numT != -1):
        popurl=popurl[:numT]
    numDot = popurl.find('.')
    popurl=popurl[numDot+1:]
 
 
if __name__ == '__main__':
    print 'Start grab subdomain from i.links.cn...'
{% endhighlight %}

fdasfdasfadsfdasfsadsa
fdasfdasfdsafdsaf
dsafdsafdsafasdfdsa
fdsafadssa

### 测试一下