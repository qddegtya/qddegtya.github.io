---
layout: singlepost
title: jython+ddmlib 安卓屏幕截图并在web展示demo
tags: python jython
category: experiments
---

> 部分代码思路来源于互联网

### 需求

之前一直在寻找一种完美的移动设备屏幕流回传方案，这种尝试一旦成功即可运用于多种平台，比如云端测试Portal中对机器设备屏幕的实时监控，再辅以html5强大的特性，可以直接在web上模拟手机操作，达到"远程监控"的目的，本demo的部分思路来源于互联网，我尝试用jython全部重写了一遍，这种方式实现起来虽然比较"土鳖"，但是效果基本可以符合需求，下面是效果图和代码清单。


### 代码

{% highlight python linenos %}
#!/usr/bin/env python
# -*- coding:utf-8 -*-
# Android_ScreenSream by Archer
# Based on Jython,ddmlib

#import jar
import sys,os
sys.path.append(r'C:\\ddmlib.jar')
sys.path.append(r'C:\\guava17.jar')
sys.path.append(r'C:\\rt.jar')
from threading import Thread

#import lib
from java.awt.image import *
from java.io import *
from javax.imageio import *
from com.android.ddmlib import *
from time import sleep

class AndroidScreenStream(object):

    def __init__(self):
        super(AndroidScreenStream,self).__init__()
        self.devices=[]
        self.currentdevice=None
        self.rawimgdata=None
        self.rawscreen=None

    def wait_device_lists(self,bridge):
        """获取设备列表信息"""
        count=0
        while(bridge.hasInitialDeviceList()==False):
            try:
                sleep(0.5)
                count+=1
            except:
                pass
            if(count>60):
                print "获取设备列表信息超时！"
                break

    def get_devices(self):
        """获取所有已连接设备"""
        AndroidDebugBridge.init(False)
        mybridge=AndroidDebugBridge.createBridge()
        self.wait_device_lists(mybridge) #get
        self.devices.append(mybridge.getDevices())
        return self

    def get_device_by_index(self,index):
        """根据index获取单个当前设备"""
        AndroidDebugBridge.init(False)
        mybridge=AndroidDebugBridge.createBridge()
        self.wait_device_lists(mybridge) #get
        try:
            self.currentdevice=mybridge.getDevices()[index]
            return self
        except IndexError:
            print "不存在序号为"+str(index)+"的设备,请检查USB连接!"
            sys.exit()

    def get_current_screen_imgbyes(self):
        """获取当前屏幕图像的字节数据"""
        self.rawimgdata=self.currentdevice.getScreenshot().data #保存图像字节数据
        return self

    def get_current_rawscreen(self):
        """保存当前屏幕screen对象"""
        self.rawscreen=self.currentdevice.getScreenshot()
        return self

    def save_screen_img(self,path=os.path.join(os.getcwd(),'current_frame.jpeg'),islandscape=False):
        """将当前屏幕图像数据保存为图片"""
        if self.rawscreen is not None:
            landscape=islandscape
            #横屏尺寸处理
            imgwidth=self.rawscreen.height if landscape else self.rawscreen.width
            imgheight=self.rawscreen.width if landscape else self.rawscreen.height
            image=BufferedImage(imgwidth,imgheight,BufferedImage.TYPE_INT_RGB)
            if image.getHeight()!=imgheight or image.getWidth()!=imgwidth:
                image=BufferedImage(imgwidth,imgheight,BufferedImage.TYPE_INT_RGB)
            index=0
            indexInc=self.rawscreen.bpp>>3
            for y in range(self.rawscreen.height):
                for x in range(self.rawscreen.width):
                    value=self.rawscreen.getARGB(index)
                    if landscape:
                        image.setRGB(y,self.rawscreen.width-x-1,value)
                    else:
                        image.setRGB(x,y,value)
                    index+=indexInc
            try:
                ImageIO.write(image,"JPEG",File(path))
            except IOError:
                print "发生异常!"
                sys.exit()
        else:
            print "rawscreen为空!"
            sys.exit()

if __name__=="__main__":
    ASS=AndroidScreenStream()
    ShotDevice=ASS.get_device_by_index(0)
    while True:
        ShotDevice.get_current_rawscreen().save_screen_img()
{% endhighlight %}

### Github

[Android_Screen_Stream](https://github.com/qddegtya/Android_Screen_Stream "Android_Screen_Stream")

  [1]: /img/bVc3Tu