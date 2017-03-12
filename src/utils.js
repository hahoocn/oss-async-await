import fs from 'fs';
import rq from 'request';
import xml2js from 'xml2js';
import crypto from 'crypto';

function getContentLength(file) {
  if (Buffer.isBuffer(file)) {
    return Promise.resolve(file.length);
  } else if (typeof file === 'string') {
    return new Promise((resolve, reject) => {
      fs.stat(file, (err, stats) => {
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
    xml2js.parseString(xml, {
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
    rq(options, (error, response, body) => {
      if (error) {
        reject(error);
      }
      const res = {
        response,
        body,
      };
      if (body) {
        parseXML(body)
        .then((result) => {
          res.body = result;
          resolve(res);
        })
        .catch((err) => {
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
  const path = filterObjectName((ossPath || ''));
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
    fs.access(path, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(path, (error) => {
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
  const md5 = crypto
  .createHash('md5')
  .update(new Buffer(content, 'utf8'))
  .digest('base64');
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

export default utils;
