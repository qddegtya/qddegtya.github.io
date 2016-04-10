---
layout: singlepost
title: Flask中让api实现客户端授权
tags: flask python
category: work
---

> 后端API通常需要对发送请求的客户端进行合法验证，以确保这些API是被"保护"起来的。
前段时间给一个移动应用做Flask的Restful-API正好涉及到了这方面的内容，其中有用到python元编程的相关技巧。

### 如何认证？

对于崇尚标准的工程师来说，http标准的auth是一个不错的选择，或者直接选择oAuth也可以。
但本着研究的精神，我们自己来实现一个api签名机制，并且patch到需要认证的api对应的资源类上。

<!-- more -->

**认证思路**

我们需要知道的大概认证背景和思路：

1. 合法客户端拥有服务端下发的app_id和app_key;
2. 服务端知道每个app_id对应的app_key;
3. 客户端请求接口数据时，必须用本地的app_key，时间戳，以及app_id进行指定规则的加密，得到一个签名串;
4. 每一次请求带上app_id，时间戳，签名串和业务数据提交给后端API;
5. 后端API根据提交上来app_id，时间戳，签名串就可以确认是否为合法的客户端;

废话不多说，上代码和详细的注释：

### 我们先伪造一个颁证服务key_gen.py

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
import hashlib
import random
from string import digits
def sign_api(time_stamp, _id, _key):
    """
    签名算法测试
    """
    print hashlib.sha1(''.join([
        str(time_stamp),
        _id,
        _key
    ])).hexdigest()
def ge_app_id():
    """
    :return: app_id
    """
    return ''.join(random.sample(digits, 9))
def ge_app_key(_id):
    """
    :return: app_key
    """
    return hashlib.sha1(_id).hexdigest()
if __name__ == '__main__':
    app_id = ge_app_id()
    app_key = ge_app_key(app_id)
    sign_api(159874265148, '710628459', 'bd7d14ed5e0b9bf3c3ac28c224b322d271f6ae6c')
```

### Flask中利用元类进行授权包装auth.py

```python
#!/usr/bin/python
# -*- coding:utf-8 -*-
import hashlib
from types import FunctionType
from flask.views import MethodViewType
from flask import request
from flask_restful import Resource, abort
from app.setting import ACCESS_CLIENT, ENV_DEBUG
def check_sign_api(args):
    """
    :param args: 认证参数
    :return: 是否签名成功
    """
    global PRE_TIMESTAMP
    # 为了正确传递KeyError错误
    _time_stamp = args['timestamp']
    _app_id = args['app_id']
    _signature = args['signature']
    if _time_stamp <= PRE_TIMESTAMP:
        return False
    PRE_TIMESTAMP = _time_stamp
    return (
        _signature == hashlib.sha1(''.join([
            str(_time_stamp),
            _app_id,
            ACCESS_CLIENT[_app_id]
        ])).hexdigest()
    )
def _get_resource_base():
    """
    :return: 获取资源Restful基类
    """
    if ENV_DEBUG:
        return Resource
    else:
        return with_meta_class(RequireAuthClass, Resource)
def with_meta_class(meta, *bases):
    """
    :param meta: 指定元类
    :param bases: 指定基类
    :return: 继承自按照指定元类创建的基类的临时类
    """
    class MetaClass(meta):
        __call__ = type.__call__
        __init__ = type.__init__
        def __new__(cls, name, this_bases, d):
            if this_bases is None:
                return type.__new__(cls, name, (), d)
            return meta(name, bases, d)
    return MetaClass('temporary_class', None, {})
def api_require_auth(http_handler):
    """
    :param http_handler: 业务接口处理方法
    :return: 包装了认证逻辑的包装方法
    """
    def wrapper(self, *params, **kwargs):
        try:
            args = request.get_json()
            if check_sign_api(args):
                return http_handler(self, *params, **kwargs)
            else:
                abort(500, message='access fail')
        except KeyError as error:
            abort(500, message=u'access need a {} param'.format(error.message))
    return wrapper
class RequireAuthClass(MethodViewType):
    """
    接口授权统一处理类
    基本思想是：所有指定RequireAuthClass为元类的类，在type.__new__为其实例化时
    会自动将其下的post,put,delete等方法包装上api_require_auth
    为了解决元类冲突问题，RequireAuthClass必须是MethodViewType的子类
    而不是type的子类
    """
    def __new__(mcs, name, bases, dct):
        for name, value in dct.iteritems():
            if (
                name in ['post', 'put', 'delete', 'get']  # restful methods
                and type(value) == FunctionType
            ):
                value = api_require_auth(value)
            dct[name] = value
        return MethodViewType.__new__(mcs, name, bases, dct)
```

### 业务层的api就好办多了

小Tip：

app.auth模块导出的_get_resource_base方法由环境变量控制

如果在调试模式下，则不启用授权

```python
# -*- coding:utf-8 -*-
# Flask 引入
from flask import Flask, jsonify
from flask_restful import Api, reqparse
from flask import g
from werkzeug.local import LocalProxy
from app.auth import _get_resource_base
# 配置
from app.setting import (
    CURRENT_API_VERSION,
    SET_VERSION_ROUTE,
    _db_settings
)
from util.mongo_util import Mongo, close_db, json_serializable
app = Flask(__name__)
api = Api(app)
# 获取db实例
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = Mongo(_db_settings)
    return db
# 全局db实例
db = LocalProxy(get_db)
# 应用环境销毁的时候
@app.teardown_appcontext
def teardown_db(exception):
    # 意外退出日志
    db = getattr(g, '_database', None)
    if db is not None:
        # 确保db立即关闭
        db.connect.close
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'code': error.code,
        'message': error.description
    }), 404
class WelcomeToApi(_get_resource_base()):
    """
    业务api根入口
    用于检查版本等用途
    """
    def get(self):
        return jsonify({
            'name': 'ZhiYuanHelper Api',
            'version': CURRENT_API_VERSION
        })
class User(_get_resource_base()):
    """
    用户管理类
    """
    def post(self, user_id):
        return jsonify({
            'user_id': user_id,
            'name': '测试账号'
        })
class Register(_get_resource_base()):
    """
    用户注册接口
    """
    pass
class Login(_get_resource_base()):
    """
    用户登录接口
    """
    pass
# todo 等待前段定义所需数据
class HigherVocationalCollege(_get_resource_base()):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        '''
        Defaults to :class:`unicode`
        in python2 and :class:`str` in python3.
        '''
        self.reqparse.add_argument('province', type = unicode, required = True, location = 'json')
        self.reqparse.add_argument('description', type = unicode, default = "", location = 'json')
        self.args = self.reqparse.parse_args()
    @close_db('db')
    def post(self):
        res = db.hvc.find()
        res = json_serializable(res)
        return jsonify({
            'args':self.args,
            'data':res
        })

# API 列表
api.add_resource(WelcomeToApi, '/api')
api.add_resource(User, SET_VERSION_ROUTE('/user/<int:user_id>'))
api.add_resource(HigherVocationalCollege, SET_VERSION_ROUTE('/hvc'))
```

欢迎拍砖~
