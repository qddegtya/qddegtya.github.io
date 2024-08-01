---
layout: single
title: 微信 JS-SDK 签名接入 flask 版
tags: weixin flask python
category: work
---

相信很多做前端的朋友都已经注意到了微信今年的一系列大动作，当然，对于前端开发工作来讲，我觉得这本身就是一种非常不错的开放机会，
能够让我们更好地利用好微信这个平台，每次写博客都要废话一段前言...... 好吧，下面说说最近的 JS-SDK 那些事儿。

![](/assets/blog-images/2015-02-01-flaskweixin/jssdk.png)

<!-- more -->

### 前端部分

在前端部分，我们重点来看下 JS-SDK 的接入流程，从前端角度而言，大致是如下三个步骤：
wx.pre-wx.ready-wx.apicall (实际上没有这个 apicall 方法)。
我把它翻译成：接入 - 就绪 - 调用。
OK，如果这么说的话，嗯......So easy......But，当我们用代码的方式写出来，可能是这样一种情况：

```javascript
var jsTool = {};

// Get Access Token
// Need APPID & APPSECRET
jsTool.getAccessToken = function (callback){
    $.ajax ({}, function (result){
         callback (result);
    });
};

// Get jsapi_ticket
jsTool.getApiTicket = function (callback){
    this.getAccessToken (function (acCode){
            $.ajax ({}, function (result){
                callback (result);
                // 立即存下 ticket
            });
    });
};

// Throw args to backend to checksign
jsTool.getSignFromBackEnd = function (callback){
     $ajax ({
          // 扔给后端参数中的 timestamp 和 nonceStr 必须跟 wx.config 一致
          timestamp: 145672831,
          noncestr: "Wm3WZYTPz0wzccnW"
          jsapi_ticket: "sM4AOVdWfPE4DxkX" // 上面存下的 ticket
          url: "https://mp.weixin.qq.com"
     }, function (sign){
         wx.config ({
            debug: true, // 开启调试模式
            appId: '', // 必填，公众号的唯一标识
            timestamp: , // 必填，生成签名的时间戳
            nonceStr: '', // 必填，生成签名的随机串
            signature: sign,// 必填，签名
            jsApiList: [xxx,xxx,xxx,xxx,xxx] // 必填，需要使用的 JS 接口列表
         });
     });
}
```

没错，如果按照官方文档的说明进行开发还是稍微显得有些复杂，主要是因为微信这次加入了签名策略。
那么，我们再来梳理一遍带签名的处理流程：

1. 拿下全局 token
2. 根据全局 token 拿到 ticket
3. 一顿签名规则
4. 拿到签名
5. wx.pre
6. wx.ready
7. wx.apicall

我们只要想办法把 wx.config 需要的参数直接扔给前端，让他继续处理下面的事情就可以了，官方推荐的做法也是如此：
token 和 ticket 建议存储，必要时签名等做成中置服务，让所有应用服务器都只用一个全局 token。

说干就干，上 flask 版的代码：
我最终的思路是：让前端专心处理前端，让后端专心处理后端，通过 restful 风格的 /all 接口，我可以将 wx.config 需要的一系列参数全部直接返回给前端使用。
全局的 token 和 ticket 使用 job 的方式去单独处理他们的更新。
与官方推荐做法基本吻合：

```python
# -*- coding:utf-8 -*-
from flask import Flask,  make_response, request
from config import CONFIG
import json
import random
import string
import hashlib
import time
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask (__name__)
app.config ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///main.db'  # 相对路径写法
db = SQLAlchemy (app)


class TokenAndTicket (db.Model):

    id = db.Column (db.Integer, primary_key=True)
    token = db.Column (db.String (200), unique=True)
    ticket = db.Column (db.String (200), unique=True)

    def __init__(self, token, ticket):
        self.token = token
        self.ticket = ticket

    def __repr__(self):
        return "<TICKET % r>" % self.ticket


current_token_ticket = TokenAndTicket.query.first ()

# error code
DONE = 200

# weixin token
WX_TOKEN_REQ = (
    "https://api.weixin.qq.com/cgi-bin/token?grant_type=% s&appid=% s&secret=% s"
    % (CONFIG ['client_credential'], CONFIG ["app_id"], CONFIG ["secret"])
)

# weixin js_ticket
WX_TICKET_REQ = lambda x: "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=% s&type=jsapi" % x


@app.route ('/nonce', methods=['GET', 'POST'])
def ge_nonce_str ():
    """ 随机串单拿接口
    """
    return json_response (
        {
            "nonce_str": ''.join (random.sample (string.ascii_letters, 12))
        }
    )


def _ge_nonce_str ():
    """all in one 接口用
    """
    return ''.join (random.sample (string.ascii_letters, 12))


def error_res_obj (code, msg):
    """ 错误响应
    """
    return {
        "errcode": code,
        "errmsg": msg
    }


def json_response (res):
    """ 包装 response 为 json
    """
    if isinstance (res, dict) or isinstance (res, list):
        json_response_body = make_response (json.dumps (res))
    else:
        json_response_body = make_response (res)
    json_response_body.headers ['Content-Type'] = "application/json;charset=UTF-8"  # 设置
    # json_response_body.headers ['Access-Control-Allow-Origin'] = "*"  # 跨域
    return json_response_body


@app.route ('/token', methods=['POST', 'GET'])
def get_access_token ():
    """token 单拿接口
    """
    token = current_token_ticket.token
    return json_response ({
        "token": token
    })


@app.route ('/ticket', methods=['POST', 'GET'])
def js_ticket ():
    """ticket 单拿接口
    """
    ticket = current_token_ticket.ticket
    return json_response ({
        "ticket": ticket
    })


def _sign_ticket (nonce_str, j_ticket, timestamp, url):
    """ 私有签名方法
    """
    sign_dict = {
        "jsapi_ticket": j_ticket,
        "noncestr": nonce_str,
        "timestamp": timestamp,
        "url": url
    }

    tmp = []

    # 字典排序
    sign_sorted_list = sorted (sign_dict.iteritems (), key=lambda x: x [0], reverse=False)
    for item in sign_sorted_list:
        tmp.append (str (item [0]) + "=" + str (item [1]))

    _url_string = '&'.join (tmp)
    final_sign = hashlib.sha1 (_url_string).hexdigest ()
    return final_sign


@app.route ('/all', methods=['POST', 'GET'])
def all_in_one ():
    """all in one 数据返回
    """
    _time_stamp = int (time.time ())
    _random_str = _ge_nonce_str ()
    _js_ticket = current_token_ticket.ticket
    _url = request.host_url [:-1]  # 去除 /

    return json_response ({
        'appId': CONFIG ['app_id'],
        'timestamp': _time_stamp,
        'nonceStr': _random_str,
        'signature': _sign_ticket (_random_str, _js_ticket, _time_stamp, _url),
        'url': _url  # POST 过来什么，返回什么
    })


def _detect_request ():
    with app.test_request_context ('/all', method=['POST', 'GET']):
        print dir (request)
        print request.host_url


if __name__ == '__main__':
    app.run (debug=True, host="0.0.0.0")
    # _detect_request ()

```

冬天写博客手真冷......

### Github

[Weixin-Flask](https://github.com/qddegtya/Weixin-Flask)
