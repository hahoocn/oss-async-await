'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signUrl = signUrl;
exports.signPolicy = signPolicy;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function canonicalizedHeaders(headers) {
  var headerArr = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(headers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var header = _step.value;

      if (header.match(/^x-oss-/i)) {
        headerArr.push(header);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  headerArr.sort(function (a, b) {
    var val = a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    return val;
  });

  var parts = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = headerArr.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _header = _step2.value;

      parts.push(_header.toLowerCase() + ':' + headers[_header]);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return parts.join('\n');
}

function canonicalizedResource(path, bucketName) {
  var pathArr = path.split('?');
  var resource = (bucketName && '/' + bucketName) + '/' + _utils2.default.filterObjectName(decodeURIComponent(pathArr[0]));

  // 如果有子资源(sub-resource)或者有重写(override)返回请求的header
  if (pathArr.length > 1 && pathArr[1]) {
    var params = pathArr[1].split('&');
    if (params.length > 0) {
      var subResourcesList = ['acl', 'cors', 'lifecycle', 'delete', 'location', 'logging', 'notification', 'partNumber', 'policy', 'requestPayment', 'restore', 'tagging', 'torrent', 'uploadId', 'uploads', 'versionId', 'versioning', 'versions', 'website', 'symlink', 'callback', 'callback-var'];
      var responseHeadersList = ['response-content-type', 'response-content-language', 'response-expires', 'response-cache-control', 'response-content-disposition', 'response-content-encoding'];
      var resources = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = params.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _param = _step3.value;

          var paramArr = _param.split('=');
          var name = paramArr[0].trim();
          var value = paramArr.length > 1 ? paramArr[1].trim() : undefined;
          if (subResourcesList.includes(name) || responseHeadersList.includes(name)) {
            var subresource = { name: name };
            if (value) {
              if (subResourcesList.includes(name)) {
                subresource.value = value;
              } else {
                subresource.value = decodeURIComponent(value);
              }
            }
            resources.push(subresource);
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      if (resources.length > 0) {
        // 从小到大排序
        resources.sort(function (a, b) {
          var val = a.name < b.name ? -1 : 1;
          return val;
        });
        // 重组qs
        var qs = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = resources.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var param = _step4.value;

            if (param.value) {
              qs.push(param.name + '=' + param.value);
            } else {
              qs.push(param.name);
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        resource += '?' + qs.join('&');
      }
    }
  }

  return resource;
}

function sign(accessKeySecret, method, headers, path, bucketName) {
  var signParts = [];
  signParts.push(method);
  signParts.push(headers['Content-MD5'] || '');
  signParts.push(headers['Content-Type'] || '');
  signParts.push(headers.Date);
  var cHeaders = canonicalizedHeaders(headers);
  if (cHeaders) {
    signParts.push(cHeaders);
  }
  signParts.push(canonicalizedResource(path, bucketName));

  var signature = _crypto2.default.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(signParts.join('\n'), 'utf8')).digest('base64');
  return signature;
}

function signUrl(accessKeySecret, method, headers, path, bucketName, expires) {
  var signParts = [];
  signParts.push(method);
  signParts.push(headers['Content-MD5'] || '');
  signParts.push(headers['Content-Type'] || '');
  signParts.push(expires);
  var cHeaders = canonicalizedHeaders(headers);
  if (cHeaders) {
    signParts.push(cHeaders);
  }
  signParts.push(canonicalizedResource(path, bucketName));

  var signature = _crypto2.default.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(signParts.join('\n'), 'utf8')).digest('base64');
  return signature;
}

function signPolicy(accessKeySecret, policy) {
  var signature = _crypto2.default.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(policy, 'utf8')).digest('base64');
  return signature;
}

exports.default = sign;