import crypto from 'crypto';
import utils from './utils';

function canonicalizedHeaders(headers) {
  const headerArr = [];
  for (const header of Object.keys(headers)) {
    if (header.match(/^x-oss-/i)) {
      headerArr.push(header);
    }
  }

  headerArr.sort((a, b) => {
    const val = a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    return val;
  });

  const parts = headerArr.map(header => `${header.toLowerCase()}:${headers[header]}`);

  return parts.join('\n');
}

function canonicalizedResource(path, bucketName) {
  const pathArr = path.split('?');
  let resource = `${bucketName && `/${bucketName}`}/${utils.filterObjectName(decodeURIComponent(pathArr[0]))}`;

  // 如果有子资源(sub-resource)或者有重写(override)返回请求的header
  if (pathArr.length > 1 && pathArr[1]) {
    const params = pathArr[1].split('&');
    if (params.length > 0) {
      const subResourcesList = [
        'acl',
        'cors',
        'lifecycle',
        'delete',
        'location',
        'logging',
        'notification',
        'partNumber',
        'policy',
        'requestPayment',
        'restore',
        'tagging',
        'torrent',
        'uploadId',
        'uploads',
        'versionId',
        'versioning',
        'versions',
        'website',
        'symlink',
        'callback',
        'callback-var'
      ];
      const responseHeadersList = [
        'response-content-type',
        'response-content-language',
        'response-expires',
        'response-cache-control',
        'response-content-disposition',
        'response-content-encoding'
      ];
      const resources = [];
      for (const param of params.values()) {
        const paramArr = param.split('=');
        const name = paramArr[0].trim();
        const value = paramArr.length > 1 ? paramArr[1].trim() : undefined;
        if (subResourcesList.includes(name) || responseHeadersList.includes(name)) {
          const subresource = { name };
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

      if (resources.length > 0) {
        // 从小到大排序
        resources.sort((a, b) => {
          const val = a.name < b.name ? -1 : 1;
          return val;
        });
        // 重组qs
        const qs = [];
        for (const param of resources.values()) {
          if (param.value) {
            qs.push(`${param.name}=${param.value}`);
          } else {
            qs.push(param.name);
          }
        }

        resource += `?${qs.join('&')}`;
      }
    }
  }

  return resource;
}

function sign(accessKeySecret, method, headers, path, bucketName) {
  const signParts = [];
  signParts.push(method);
  signParts.push(headers['Content-MD5'] || '');
  signParts.push(headers['Content-Type'] || '');
  signParts.push(headers.Date);
  const cHeaders = canonicalizedHeaders(headers);
  if (cHeaders) {
    signParts.push(cHeaders);
  }
  signParts.push(canonicalizedResource(path, bucketName));

  let signature = crypto.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(signParts.join('\n'), 'utf8')).digest('base64');
  return signature;
}

export function signUrl(accessKeySecret, method, headers, path, bucketName, expires) {
  const signParts = [];
  signParts.push(method);
  signParts.push(headers['Content-MD5'] || '');
  signParts.push(headers['Content-Type'] || '');
  signParts.push(expires);
  const cHeaders = canonicalizedHeaders(headers);
  if (cHeaders) {
    signParts.push(cHeaders);
  }
  signParts.push(canonicalizedResource(path, bucketName));

  let signature = crypto.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(signParts.join('\n'), 'utf8')).digest('base64');
  return signature;
}

export function signPolicy(accessKeySecret, policy) {
  let signature = crypto.createHmac('sha1', accessKeySecret);
  signature = signature.update(new Buffer(policy, 'utf8')).digest('base64');
  return signature;
}

export default sign;
