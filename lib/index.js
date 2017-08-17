'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _sign = require('./sign');

var _sign2 = _interopRequireDefault(_sign);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AliOSS {
  constructor(options = {}) {
    if (!options.accessKeyId || !options.accessKeySecret) {
      throw new Error('accessKeyId and accessKeySecret required!');
    }
    if (!options.baseUrl && !options.region) {
      throw new Error('region or baseUrl required! region example: oss-cn-hangzhou');
    }
    const defaultOpts = {
      bucket: '',
      internal: false,
      https: false
    };
    Object.assign(this.options = {}, defaultOpts, options);
  }

  async put(src, dst, options = {}) {
    const params = {
      method: 'PUT',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, dst)
    };

    try {
      if (Buffer.isBuffer(src)) {
        params.headers['Content-Length'] = await _utils2.default.getContentLength(src);
        params.headers['Content-Md5'] = _utils2.default.contentMD5(src);
        params.body = src;
      } else if (src instanceof _stream2.default.Stream) {
        if (!(options.headers && options.headers['Content-Length'])) {
          params.headers['Transfer-Encoding'] = 'chunked';
        }
        params.body = src;
      } else if (typeof src === 'string') {
        params.headers['Content-Length'] = await _utils2.default.getContentLength(src);
        params.headers['Content-Type'] = _mime2.default.lookup(src);
        params.body = _fs2.default.createReadStream(src);
      }
      // 回调
      if (options.callback && (!options.headers || !options.headers['x-oss-callback'])) {
        params.headers['x-oss-callback'] = new Buffer(JSON.stringify(options.callback)).toString('base64');
      }
      if (options.callbackVar && (!options.headers || !options.headers['x-oss-callback-var'])) {
        params.headers['x-oss-callback-var'] = new Buffer(JSON.stringify(options.callbackVar)).toString('base64');
      }
      if (options.headers) {
        Object.assign(params.headers, options.headers);
      }
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async copy(src, dst, options = {}) {
    const params = {
      method: 'PUT',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, dst)
    };
    params.headers['x-oss-copy-source'] = src;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async putMeta(src, options = {}) {
    const result = await this.copy(`/${this.options.bucket}/${_utils2.default.filterObjectName(src)}`, `${src}`, options);
    return result;
  }

  async get(src, dst, options = {}) {
    const params = {
      method: 'GET',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    let writeStream;
    let needDestroy = false;
    if (dst instanceof _stream2.default.Stream) {
      writeStream = dst;
    } else if (typeof dst === 'string') {
      writeStream = _fs2.default.createWriteStream(dst);
      needDestroy = true;
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      return new Promise((resolve, reject) => {
        (0, _request2.default)(params).on('response', response => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            if (needDestroy) {
              _utils2.default.delFile(dst);
            }
            reject({ status: response.statusCode, headers: response.headers });
          }
          resolve({ status: response.statusCode, headers: response.headers });
        }).on('error', err => {
          if (needDestroy) {
            _utils2.default.delFile(dst);
          }
          reject(err);
        }).pipe(writeStream);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async head(src, options = {}) {
    const params = {
      method: 'HEAD',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async delete(src, options = {}) {
    const params = {
      method: 'DELETE',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async deleteMulti(objArray, options = {}) {
    const src = '/?delete';
    const params = {
      method: 'POST',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, src)
    };
    const body = `
      <?xml version="1.0" encoding="UTF-8"?>

      <Delete>
        <Quiet>${options.quiet ? 'true' : 'false'}</Quiet>
        ${objArray.map(key => {
      const items = `
          <Object>
            <Key>${key}</Key>
          </Object>`;
      return items;
    })}
      </Delete>
    `;
    params.body = body;
    params.headers['Content-Length'] = body.length;
    params.headers['Content-MD5'] = _utils2.default.contentMD5(body);
    params.headers['Content-Type'] = _mime2.default.lookup('xml');

    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }

    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async putACL(src, acl, options = {}) {
    const acls = ['private', 'public-read', 'public-read-write', 'default'];
    if (!acls.includes(acl)) {
      return Promise.reject('acl error');
    }
    const newSrc = `${src}?acl`;
    const params = {
      method: 'PUT',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, newSrc)
    };
    params.headers['x-oss-object-acl'] = acl;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getACL(src, options = {}) {
    const newSrc = `${src}?acl`;
    const params = {
      method: 'GET',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, newSrc)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async putSymlink(src, dst, options = {}) {
    const newSrc = `${src}?symlink`;
    const params = {
      method: 'PUT',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, newSrc)
    };
    params.headers['x-oss-symlink-target'] = dst;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getSymlink(src, options = {}) {
    const newSrc = `${src}?symlink`;
    const params = {
      method: 'GET',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, newSrc)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await _utils2.default.request(params);
      const rtn = {
        status: res.response.statusCode,
        headers: res.response.headers,
        body: res.body
      };
      if (res.response.statusCode < 200 || res.response.statusCode >= 300) {
        return Promise.reject(rtn);
      }
      return Promise.resolve(rtn);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  signUrl(src, options = {}) {
    const params = {
      method: options.method || 'GET',
      headers: {
        Date: _utils2.default.getGMTDate()
      },
      url: _utils2.default.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    const expires = Math.round(Date.now() / 1000) + (options.expires || 300);
    const signature = (0, _sign.signUrl)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket, expires);
    let url = `OSSAccessKeyId=${this.options.accessKeyId}&Expires=${expires}`;
    url += `&Signature=${encodeURIComponent(signature)}`;
    if (options.stsToken) {
      url += `&security-token=${options.stsToken}`;
    }
    const pathArr = params.url.split('?');
    if (pathArr.length > 1) {
      if (pathArr[1]) {
        url = `${params.url}&${url}`;
      } else {
        url = `${params.url}${url}`;
      }
    } else {
      url = `${params.url}?${url}`;
    }
    return Promise.resolve(url);
  }

  signPost(options = {}) {
    const expiration = (0, _moment2.default)().add(options.expires || 300, 's').utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    const conditions = options.conditions || [{ bucket: this.options.bucket }];
    let callback;
    if (options.callback) {
      callback = new Buffer(JSON.stringify(options.callback)).toString('base64');
      conditions.push({ callback });
    }
    const callbackVar = {};
    if (options.callbackVar && typeof options.callbackVar === 'object') {
      for (const [key, value] of Object.entries(options.callbackVar)) {
        if (key.substr(0, 2) === 'x:') {
          conditions.push({ [key]: value });
          callbackVar[key] = value;
        }
      }
    }
    const policy = { expiration, conditions };
    const policyBase64 = new Buffer(JSON.stringify(policy)).toString('base64');
    const signature = (0, _sign.signPolicy)(this.options.accessKeySecret, policyBase64);
    const rtn = {
      url: _utils2.default.getUrl(this.options),
      OSSAccessKeyId: this.options.accessKeyId,
      policy: policyBase64,
      Signature: signature
    };
    if (callback) {
      rtn.callback = callback;
    }
    if (callbackVar) {
      Object.assign(rtn, callbackVar);
    }
    return Promise.resolve(rtn);
  }
}

exports.default = AliOSS;