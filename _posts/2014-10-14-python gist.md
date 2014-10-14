---
layout: singlepost
title: python gist
tags: python
category: python
---



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


{% highlight javascript linenos %}
var b = 1;
var c = true;

function fade(){
if(document.all);

if(c == true) {
b++;
}
if(b==100) {
b--;
c = false
}

if(b==10) {
b++;
c = true;
}

if(c == false) {
b--;
}
u.width=150 + b;
u.height=125 - b;
setTimeout("fade()",50);
}
{% endhighlight %}