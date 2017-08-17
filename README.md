# oss-async-await
使用async/await开发阿里云oss的sdk，返回Promise，可直接使用async/await调用。

注意：暂时只开发了最常用的Object的一些接口。Serive和Bucket的接口暂未开发。

从v0.2.0开始，只支持node8

## 安装
```
npm install oss-async-await --save
```

## 使用
```javascript
import AliOSS from 'oss-async-await';

const oss = new AliOSS({
  accessKeyId: '你的access key',
  accessKeySecret: '你的access secret',
  region: 'oss-cn-shanghai',
  bucket: '你的bucket名称'
});

const file = path.resolve(__dirname, 'test.jpg');
try {
  await oss.put(file, 'your/bucket/path/test.jpg');
} catch (e) {
  console.log(e);
}
```

## 说明
### class AliOSS({ options })
初始化oss对象

#### options

* `accessKeyId` access key (必填)
* `accessKeySecret` access secret (必填)
* `region` oss地区，(baseUrl和region必须填一个) 详情请参考 https://help.aliyun.com/document_detail/31837.html
* `baseUrl` 自定义oss bucket的url，如果设置了baseUrl，则按此url构建访问和签名，不再使用region构建，(baseUrl和region必须填一个)
* `bucket` bucket名称，(必填)
* `internal` 是否是内网访问OSS (默认: false)
* `https` 是否使用https (默认: false)

### put(src, dst, options = {})
上传文件，详情参考官方文档：https://help.aliyun.com/document_detail/31978.html

* `src` 要上传的文件源，可以是 `Buffer` 或 `Stream` 或 `文件路径` (必填)
* `dst` 要上传的oss上的Object目标路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，比如以 `x-oss-meta-` 为前缀的参数，代表自定义meta信息，详情参考官方文档
  - `callback` 上传回调，详情参考官方文档：https://help.aliyun.com/document_detail/31989.html
  - `callbackVar` 上传回调自定义参数，详情参考同上官方文档

### get(src, dst, options = {})
获取某个Object，详情参考官方文档：https://help.aliyun.com/document_detail/31980.html

* `src` 要获取的bucket上的Object源路径 (必填)
* `dst` 要获取的文件的目标, 可以是 `Stream` 或本地要存储的文件路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  
### copy(src, dst, options = {})
拷贝一个在OSS上已经存在的object成另外一个object，详情参考官方文档：https://help.aliyun.com/document_detail/31979.html

* `src` 要拷贝的bucket上的Object源路径 (必填)
* `dst` 要拷贝的bucket上的Object目标路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，比如以 `x-oss-meta-` 为前缀的参数，代表自定义meta信息，详情参考官方文档

### delete(src, options = {})
删除某个Object，详情参考官方文档：https://help.aliyun.com/document_detail/31982.html

* `src` 要删除的bucket上的Object源路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档

### deleteMulti(objArray, options = {})
支持用户通过一个HTTP请求删除同一个Bucket中的多个Object，详情参考官方文档：https://help.aliyun.com/document_detail/31983.html

* `objArray` 要删除的bucket上的Object源路径`数组` (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  - `quiet` 打开返回模式“简单”响应模式的开关 (默认: false)

### signUrl(src, options = {})
在URL中加入签名信息，比如put方式上传文件或者get获取文件时，函数返回签名的url地址，详情参考官方文档：https://help.aliyun.com/document_detail/31952.html

* `src` 要签名的Object路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  - `expires` 过期时间，单位秒，(默认: 300秒)
  - `stsToken` STS临时访问令牌, (默认: 无) 关于STS详情请参考官方文档 https://help.aliyun.com/document_detail/31953.html

### signPost(options)
使用HTML表单上传文件到指定bucket时的签名。Post作为Put的替代品，使得基于浏览器上传文件到bucket成为可能，详情参考官方文档：https://help.aliyun.com/document_detail/31988.html

这里涉及到web post方式直传文件到oss，并可支持服务器回调和oss -> 回调服务器的签名验签相关操作，web上传文件实际使用比较多，详情请查看官方说明文档。

* `options` 选项对象 (部分必填)
  - `expires` 过期时间，单位秒，(默认: 300秒)
  - `conditions` 构建Post Policy的Conditions，(默认: `[{ bucket: this.options.bucket }]`)
  - `callback` 上传回调，详情参考官方文档：https://help.aliyun.com/document_detail/31989.html
  - `callbackVar` 上传回调自定义参数，详情参考同上官方文档

返回的数据 (通过web post表单域设置，详情请参考官方文档)：
```javascript
{
  url: 'http://url', // post发送的url
  OSSAccessKeyId: '你的access key', // access key
  policy: 'policyBase64', // Post Policy
  Signature: 'signature', // 签名
}
```

### getACL(src, options = {})
获取某个Bucket下的某个Object的访问权限，详情参考官方文档：https://help.aliyun.com/document_detail/31987.html

* `src` 要获取访问权限的bucket上的Object源路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档

### putACL(src, acl, options = {})
修改Object的访问权限，详情参考官方文档：https://help.aliyun.com/document_detail/31986.html

* `src` 要修改的Object源路径 (必填)
* `acl` 目前Object有三种访问权限：private, public-read, public-read-write (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  
### getSymlink(src, options = {})
用于获取符号链接，详情参考官方文档：https://help.aliyun.com/document_detail/45146.html

* `src` 要获取符号链接的Object源路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  
### putSymlink(src, dst, options = {})
创建符号链接，详情参考官方文档：https://help.aliyun.com/document_detail/45126.html

* `src` 要创建符号链接的Object源路径 (必填)
* `dst` 要创建符号链接的目标路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  
### head(src, options = {})
返回某个Object的meta信息，详情参考官方文档：https://help.aliyun.com/document_detail/31984.html

* `src` 要返回meta信息的Object源路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，详情参考官方文档
  
### putMeta(src, options = {})
修改OSS上的object的meta信息，详情参考官方文档：https://help.aliyun.com/document_detail/31979.html

* `src` 要修改meta信息的bucket上的Object源路径 (必填)
* `options` 选项对象 (选填)
  - `headers` 自定义http头，比如以 `x-oss-meta-` 为前缀的参数，代表自定义meta信息，详情参考官方文档
