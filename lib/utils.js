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
    return new Promise(function (resolve, reject) {
      _fs2.default.stat(file, function (err, stats) {
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
  var date = new Date();
  return date.toUTCString().replace('UTC', 'GMT');
}

function parseXML(str) {
  return new Promise(function (resolve, reject) {
    var xml = str;
    if (Buffer.isBuffer(xml)) {
      xml = xml.toString();
    }
    _xml2js2.default.parseString(xml, {
      explicitRoot: false,
      explicitArray: false
    }, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

function request(options) {
  return new Promise(function (resolve, reject) {
    (0, _request2.default)(options, function (error, response, body) {
      if (error) {
        reject(error);
      }
      var res = {
        response: response,
        body: body
      };
      if (body) {
        parseXML(body).then(function (result) {
          res.body = result;
          resolve(res);
        }).catch(function (err) {
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
  var bucket = options.bucket,
      https = options.https,
      region = options.region,
      internal = options.internal,
      baseUrl = options.baseUrl;

  if (!baseUrl && !bucket) {
    throw new Error('bucket required!');
  }
  var url = void 0;
  var path = filterObjectName(ossPath || '');
  if (baseUrl) {
    url = baseUrl + '/' + path;
  } else {
    url = '' + (https ? 'https://' : 'http://') + bucket + '.' + region + (internal ? '-internal' : '');
    url += '.aliyuncs.com/' + path;
  }
  return url;
}

function delFile(path) {
  return new Promise(function (resolve, reject) {
    _fs2.default.access(path, _fs2.default.constants.F_OK, function (err) {
      if (!err) {
        _fs2.default.unlink(path, function (error) {
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
  var md5 = _crypto2.default.createHash('md5').update(new Buffer(content, 'utf8')).digest('base64');
  return md5;
}

var utils = {
  getContentLength: getContentLength,
  getGMTDate: getGMTDate,
  request: request,
  parseXML: parseXML,
  getUrl: getUrl,
  delFile: delFile,
  contentMD5: contentMD5,
  filterObjectName: filterObjectName
};

exports.default = utils;