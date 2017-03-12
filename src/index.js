import fs from 'fs';
import stream from 'stream';
import mime from 'mime';
import request from 'request';
import moment from 'moment';
import sign, { signUrl, signPolicy } from './sign';
import utils from './utils';

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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, dst)
    };

    try {
      if (Buffer.isBuffer(src)) {
        params.headers['Content-Length'] = await utils.getContentLength(src);
        params.headers['Content-Md5'] = utils.contentMD5(src);
        params.body = src;
      } else if (src instanceof stream.Stream) {
        if (!(options.headers && options.headers['Content-Length'])) {
          params.headers['Transfer-Encoding'] = 'chunked';
        }
        params.body = src;
      } else if (typeof src === 'string') {
        params.headers['Content-Length'] = await utils.getContentLength(src);
        params.headers['Content-Type'] = mime.lookup(src);
        params.body = fs.createReadStream(src);
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
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, dst)
    };
    params.headers['x-oss-copy-source'] = src;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
    const result = await this.copy(`/${this.options.bucket}/${utils.filterObjectName(src)}`, `${src}`, options);
    return result;
  }

  async get(src, dst, options = {}) {
    const params = {
      method: 'GET',
      headers: {
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    let writeStream;
    let needDestroy = false;
    if (dst instanceof stream.Stream) {
      writeStream = dst;
    } else if (typeof dst === 'string') {
      writeStream = fs.createWriteStream(dst);
      needDestroy = true;
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      return new Promise((resolve, reject) => {
        request(params)
        .on('response', (response) => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            if (needDestroy) { utils.delFile(dst); }
            reject({ status: response.statusCode, headers: response.headers });
          }
          resolve({ status: response.statusCode, headers: response.headers });
        })
        .on('error', (err) => {
          if (needDestroy) { utils.delFile(dst); }
          reject(err);
        })
        .pipe(writeStream);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async head(src, options = {}) {
    const params = {
      method: 'HEAD',
      headers: {
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, src)
    };
    const body = `
      <?xml version="1.0" encoding="UTF-8"?>

      <Delete>
        <Quiet>${options.quiet ? 'true' : 'false'}</Quiet>
        ${objArray.map((key) => {
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
    params.headers['Content-MD5'] = utils.contentMD5(body);
    params.headers['Content-Type'] = mime.lookup('xml');

    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }

    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
    const acls = [
      'private',
      'public-read',
      'public-read-write',
      'default'
    ];
    if (!acls.includes(acl)) {
      return Promise.reject('acl error');
    }
    const newSrc = `${src}?acl`;
    const params = {
      method: 'PUT',
      headers: {
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, newSrc)
    };
    params.headers['x-oss-object-acl'] = acl;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, newSrc)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, newSrc)
    };
    params.headers['x-oss-symlink-target'] = dst;
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, newSrc)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    try {
      // 签名
      const signature = sign(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);
      params.headers.Authorization = `OSS ${this.options.accessKeyId}:${signature}`;

      const res = await utils.request(params);
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
        Date: utils.getGMTDate(),
      },
      url: utils.getUrl(this.options, src)
    };
    if (options.headers) {
      Object.assign(params.headers, options.headers);
    }
    const expires = Math.round(Date.now() / 1000) + (options.expires || 300);
    const signature = signUrl(this.options.accessKeySecret, params.method,
      params.headers, src, this.options.bucket, expires);
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
    const expiration = moment().add((options.expires || 300), 's').utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');
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
    const signature = signPolicy(this.options.accessKeySecret, policyBase64);
    const rtn = {
      url: utils.getUrl(this.options),
      OSSAccessKeyId: this.options.accessKeyId,
      policy: policyBase64,
      Signature: signature,
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

export default AliOSS;
