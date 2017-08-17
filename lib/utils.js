'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getContentLength(file) {
  if (Buffer.isBuffer(file)) {
    return Promise.resolve(file.length);
  } else if (typeof file === 'string') {
    return new Promise((resolve, reject) => {
      _fs2.default.stat(file, (err, stats) => {
        if (err) {
          reject(err);
        }
        resolve(stats.size);
      });
    });
  }
  return Promise.reject('getFileSize: file type error');
}

function getGMTDate() {
  const date = new Date();
  return date.toUTCString().replace('UTC', 'GMT');
}

function parseXML(str) {
  return new Promise((resolve, reject) => {
    let xml = str;
    if (Buffer.isBuffer(xml)) {
      xml = xml.toString();
    }
    _xml2js2.default.parseString(xml, {
      explicitRoot: false,
      explicitArray: false
    }, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

function request(options) {
  return new Promise((resolve, reject) => {
    (0, _request2.default)(options, (error, response, body) => {
      if (error) {
        reject(error);
      }
      const res = {
        response,
        body
      };
      if (body) {
        parseXML(body).then(result => {
          res.body = result;
          resolve(res);
        }).catch(err => {
          reject(err);
        });
      }
      resolve(res);
    });
  });
}

function filterObjectName(name) {
  return name.replace(/^\/+/, '');
}

function getUrl(options, ossPath) {
  const { bucket, https, region, internal, baseUrl } = options;
  if (!baseUrl && !bucket) {
    throw new Error('bucket required!');
  }
  let url;
  const path = filterObjectName(ossPath || '');
  if (baseUrl) {
    url = `${baseUrl}/${path}`;
  } else {
    url = `${https ? 'https://' : 'http://'}${bucket}.${region}${internal ? '-internal' : ''}`;
    url += `.aliyuncs.com/${path}`;
  }
  return url;
}

function delFile(path) {
  return new Promise((resolve, reject) => {
    _fs2.default.access(path, _fs2.default.constants.F_OK, err => {
      if (!err) {
        _fs2.default.unlink(path, error => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      }
    });
  });
}

function contentMD5(content) {
  const md5 = _crypto2.default.createHash('md5').update(new Buffer(content, 'utf8')).digest('base64');
  return md5;
}

const utils = {
  getContentLength,
  getGMTDate,
  request,
  parseXML,
  getUrl,
  delFile,
  contentMD5,
  filterObjectName
};

exports.default = utils;