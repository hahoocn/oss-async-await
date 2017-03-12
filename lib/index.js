'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AliOSS = function () {
  function AliOSS() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AliOSS);

    if (!options.accessKeyId || !options.accessKeySecret) {
      throw new Error('accessKeyId and accessKeySecret required!');
    }
    if (!options.baseUrl && !options.region) {
      throw new Error('region or baseUrl required! region example: oss-cn-hangzhou');
    }
    var defaultOpts = {
      bucket: '',
      internal: false,
      https: false
    };
    Object.assign(this.options = {}, defaultOpts, options);
  }

  _createClass(AliOSS, [{
    key: 'put',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(src, dst) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                params = {
                  method: 'PUT',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, dst)
                };
                _context.prev = 1;

                if (!Buffer.isBuffer(src)) {
                  _context.next = 10;
                  break;
                }

                _context.next = 5;
                return _utils2.default.getContentLength(src);

              case 5:
                params.headers['Content-Length'] = _context.sent;

                params.headers['Content-Md5'] = _utils2.default.contentMD5(src);
                params.body = src;
                _context.next = 21;
                break;

              case 10:
                if (!(src instanceof _stream2.default.Stream)) {
                  _context.next = 15;
                  break;
                }

                if (!(options.headers && options.headers['Content-Length'])) {
                  params.headers['Transfer-Encoding'] = 'chunked';
                }
                params.body = src;
                _context.next = 21;
                break;

              case 15:
                if (!(typeof src === 'string')) {
                  _context.next = 21;
                  break;
                }

                _context.next = 18;
                return _utils2.default.getContentLength(src);

              case 18:
                params.headers['Content-Length'] = _context.sent;

                params.headers['Content-Type'] = _mime2.default.lookup(src);
                params.body = _fs2.default.createReadStream(src);

              case 21:
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
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context.next = 28;
                return _utils2.default.request(params);

              case 28:
                res = _context.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context.next = 32;
                  break;
                }

                return _context.abrupt('return', Promise.reject(rtn));

              case 32:
                return _context.abrupt('return', Promise.resolve(rtn));

              case 35:
                _context.prev = 35;
                _context.t0 = _context['catch'](1);
                return _context.abrupt('return', Promise.reject(_context.t0));

              case 38:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 35]]);
      }));

      function put(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return put;
    }()
  }, {
    key: 'copy',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(src, dst) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                params = {
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
                _context2.prev = 3;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, dst, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context2.next = 8;
                return _utils2.default.request(params);

              case 8:
                res = _context2.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt('return', Promise.reject(rtn));

              case 12:
                return _context2.abrupt('return', Promise.resolve(rtn));

              case 15:
                _context2.prev = 15;
                _context2.t0 = _context2['catch'](3);
                return _context2.abrupt('return', Promise.reject(_context2.t0));

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 15]]);
      }));

      function copy(_x5, _x6) {
        return _ref2.apply(this, arguments);
      }

      return copy;
    }()
  }, {
    key: 'putMeta',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(src) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var result;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.copy('/' + this.options.bucket + '/' + _utils2.default.filterObjectName(src), '' + src, options);

              case 2:
                result = _context3.sent;
                return _context3.abrupt('return', result);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function putMeta(_x8) {
        return _ref3.apply(this, arguments);
      }

      return putMeta;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(src, dst) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var params, writeStream, needDestroy, signature;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                params = {
                  method: 'GET',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, src)
                };

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }
                writeStream = void 0;
                needDestroy = false;

                if (dst instanceof _stream2.default.Stream) {
                  writeStream = dst;
                } else if (typeof dst === 'string') {
                  writeStream = _fs2.default.createWriteStream(dst);
                  needDestroy = true;
                }
                _context4.prev = 5;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                return _context4.abrupt('return', new Promise(function (resolve, reject) {
                  (0, _request2.default)(params).on('response', function (response) {
                    if (response.statusCode < 200 || response.statusCode >= 300) {
                      if (needDestroy) {
                        _utils2.default.delFile(dst);
                      }
                      reject({ status: response.statusCode, headers: response.headers });
                    }
                    resolve({ status: response.statusCode, headers: response.headers });
                  }).on('error', function (err) {
                    if (needDestroy) {
                      _utils2.default.delFile(dst);
                    }
                    reject(err);
                  }).pipe(writeStream);
                }));

              case 11:
                _context4.prev = 11;
                _context4.t0 = _context4['catch'](5);
                return _context4.abrupt('return', Promise.reject(_context4.t0));

              case 14:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[5, 11]]);
      }));

      function get(_x10, _x11) {
        return _ref4.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'head',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(src) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                params = {
                  method: 'HEAD',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, src)
                };

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }
                _context5.prev = 2;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context5.next = 7;
                return _utils2.default.request(params);

              case 7:
                res = _context5.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context5.next = 11;
                  break;
                }

                return _context5.abrupt('return', Promise.reject(rtn));

              case 11:
                return _context5.abrupt('return', Promise.resolve(rtn));

              case 14:
                _context5.prev = 14;
                _context5.t0 = _context5['catch'](2);
                return _context5.abrupt('return', Promise.reject(_context5.t0));

              case 17:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[2, 14]]);
      }));

      function head(_x13) {
        return _ref5.apply(this, arguments);
      }

      return head;
    }()
  }, {
    key: 'delete',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(src) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                params = {
                  method: 'DELETE',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, src)
                };

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }
                _context6.prev = 2;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context6.next = 7;
                return _utils2.default.request(params);

              case 7:
                res = _context6.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context6.next = 11;
                  break;
                }

                return _context6.abrupt('return', Promise.reject(rtn));

              case 11:
                return _context6.abrupt('return', Promise.resolve(rtn));

              case 14:
                _context6.prev = 14;
                _context6.t0 = _context6['catch'](2);
                return _context6.abrupt('return', Promise.reject(_context6.t0));

              case 17:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[2, 14]]);
      }));

      function _delete(_x15) {
        return _ref6.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'deleteMulti',
    value: function () {
      var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(objArray) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var src, params, body, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                src = '/?delete';
                params = {
                  method: 'POST',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, src)
                };
                body = '\n      <?xml version="1.0" encoding="UTF-8"?>\n\n      <Delete>\n        <Quiet>' + (options.quiet ? 'true' : 'false') + '</Quiet>\n        ' + objArray.map(function (key) {
                  var items = '\n          <Object>\n            <Key>' + key + '</Key>\n          </Object>';
                  return items;
                }) + '\n      </Delete>\n    ';

                params.body = body;
                params.headers['Content-Length'] = body.length;
                params.headers['Content-MD5'] = _utils2.default.contentMD5(body);
                params.headers['Content-Type'] = _mime2.default.lookup('xml');

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }

                _context7.prev = 8;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context7.next = 13;
                return _utils2.default.request(params);

              case 13:
                res = _context7.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context7.next = 17;
                  break;
                }

                return _context7.abrupt('return', Promise.reject(rtn));

              case 17:
                return _context7.abrupt('return', Promise.resolve(rtn));

              case 20:
                _context7.prev = 20;
                _context7.t0 = _context7['catch'](8);
                return _context7.abrupt('return', Promise.reject(_context7.t0));

              case 23:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this, [[8, 20]]);
      }));

      function deleteMulti(_x17) {
        return _ref7.apply(this, arguments);
      }

      return deleteMulti;
    }()
  }, {
    key: 'putACL',
    value: function () {
      var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(src, acl) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var acls, newSrc, params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                acls = ['private', 'public-read', 'public-read-write', 'default'];

                if (acls.includes(acl)) {
                  _context8.next = 3;
                  break;
                }

                return _context8.abrupt('return', Promise.reject('acl error'));

              case 3:
                newSrc = src + '?acl';
                params = {
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
                _context8.prev = 7;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context8.next = 12;
                return _utils2.default.request(params);

              case 12:
                res = _context8.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context8.next = 16;
                  break;
                }

                return _context8.abrupt('return', Promise.reject(rtn));

              case 16:
                return _context8.abrupt('return', Promise.resolve(rtn));

              case 19:
                _context8.prev = 19;
                _context8.t0 = _context8['catch'](7);
                return _context8.abrupt('return', Promise.reject(_context8.t0));

              case 22:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[7, 19]]);
      }));

      function putACL(_x19, _x20) {
        return _ref8.apply(this, arguments);
      }

      return putACL;
    }()
  }, {
    key: 'getACL',
    value: function () {
      var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(src) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var newSrc, params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                newSrc = src + '?acl';
                params = {
                  method: 'GET',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, newSrc)
                };

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }
                _context9.prev = 3;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context9.next = 8;
                return _utils2.default.request(params);

              case 8:
                res = _context9.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context9.next = 12;
                  break;
                }

                return _context9.abrupt('return', Promise.reject(rtn));

              case 12:
                return _context9.abrupt('return', Promise.resolve(rtn));

              case 15:
                _context9.prev = 15;
                _context9.t0 = _context9['catch'](3);
                return _context9.abrupt('return', Promise.reject(_context9.t0));

              case 18:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this, [[3, 15]]);
      }));

      function getACL(_x22) {
        return _ref9.apply(this, arguments);
      }

      return getACL;
    }()
  }, {
    key: 'putSymlink',
    value: function () {
      var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(src, dst) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var newSrc, params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                newSrc = src + '?symlink';
                params = {
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
                _context10.prev = 4;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context10.next = 9;
                return _utils2.default.request(params);

              case 9:
                res = _context10.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context10.next = 13;
                  break;
                }

                return _context10.abrupt('return', Promise.reject(rtn));

              case 13:
                return _context10.abrupt('return', Promise.resolve(rtn));

              case 16:
                _context10.prev = 16;
                _context10.t0 = _context10['catch'](4);
                return _context10.abrupt('return', Promise.reject(_context10.t0));

              case 19:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this, [[4, 16]]);
      }));

      function putSymlink(_x24, _x25) {
        return _ref10.apply(this, arguments);
      }

      return putSymlink;
    }()
  }, {
    key: 'getSymlink',
    value: function () {
      var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(src) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var newSrc, params, signature, res, rtn;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                newSrc = src + '?symlink';
                params = {
                  method: 'GET',
                  headers: {
                    Date: _utils2.default.getGMTDate()
                  },
                  url: _utils2.default.getUrl(this.options, newSrc)
                };

                if (options.headers) {
                  Object.assign(params.headers, options.headers);
                }
                _context11.prev = 3;

                // 签名
                signature = (0, _sign2.default)(this.options.accessKeySecret, params.method, params.headers, newSrc, this.options.bucket);

                params.headers.Authorization = 'OSS ' + this.options.accessKeyId + ':' + signature;

                _context11.next = 8;
                return _utils2.default.request(params);

              case 8:
                res = _context11.sent;
                rtn = {
                  status: res.response.statusCode,
                  headers: res.response.headers,
                  body: res.body
                };

                if (!(res.response.statusCode < 200 || res.response.statusCode >= 300)) {
                  _context11.next = 12;
                  break;
                }

                return _context11.abrupt('return', Promise.reject(rtn));

              case 12:
                return _context11.abrupt('return', Promise.resolve(rtn));

              case 15:
                _context11.prev = 15;
                _context11.t0 = _context11['catch'](3);
                return _context11.abrupt('return', Promise.reject(_context11.t0));

              case 18:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this, [[3, 15]]);
      }));

      function getSymlink(_x27) {
        return _ref11.apply(this, arguments);
      }

      return getSymlink;
    }()
  }, {
    key: 'signUrl',
    value: function signUrl(src) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var params = {
        method: options.method || 'GET',
        headers: {
          Date: _utils2.default.getGMTDate()
        },
        url: _utils2.default.getUrl(this.options, src)
      };
      if (options.headers) {
        Object.assign(params.headers, options.headers);
      }
      var expires = Math.round(Date.now() / 1000) + (options.expires || 300);
      var signature = (0, _sign.signUrl)(this.options.accessKeySecret, params.method, params.headers, src, this.options.bucket, expires);
      var url = 'OSSAccessKeyId=' + this.options.accessKeyId + '&Expires=' + expires;
      url += '&Signature=' + encodeURIComponent(signature);
      if (options.stsToken) {
        url += '&security-token=' + options.stsToken;
      }
      var pathArr = params.url.split('?');
      if (pathArr.length > 1) {
        if (pathArr[1]) {
          url = params.url + '&' + url;
        } else {
          url = '' + params.url + url;
        }
      } else {
        url = params.url + '?' + url;
      }
      return Promise.resolve(url);
    }
  }, {
    key: 'signPost',
    value: function signPost() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var expiration = (0, _moment2.default)().add(options.expires || 300, 's').utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');
      var conditions = options.conditions || [{ bucket: this.options.bucket }];
      var callback = void 0;
      if (options.callback) {
        callback = new Buffer(JSON.stringify(options.callback)).toString('base64');
        conditions.push({ callback: callback });
      }
      var callbackVar = {};
      if (options.callbackVar && _typeof(options.callbackVar) === 'object') {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.entries(options.callbackVar)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _step$value = _slicedToArray(_step.value, 2),
                key = _step$value[0],
                value = _step$value[1];

            if (key.substr(0, 2) === 'x:') {
              conditions.push(_defineProperty({}, key, value));
              callbackVar[key] = value;
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
      }
      var policy = { expiration: expiration, conditions: conditions };
      var policyBase64 = new Buffer(JSON.stringify(policy)).toString('base64');
      var signature = (0, _sign.signPolicy)(this.options.accessKeySecret, policyBase64);
      var rtn = {
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
  }]);

  return AliOSS;
}();

exports.default = AliOSS;