const https = require('https');
const { URL } = require('url');

class ApiError extends Error {
  constructor(message, { status, body, headers, url, method }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.headers = headers;
    this.url = url;
    this.method = method;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

function request(baseUrl, method, path, { query, headers = {}, json, form, timeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path + buildQuery(query), baseUrl);
    let pkgName = 'amlkyc-sdk-nodejs';
    let pkgVersion = 'dev';
    try {
      const pkg = require('../package.json');
      pkgName = pkg.name || pkgName;
      pkgVersion = pkg.version || pkgVersion;
    } catch (_) { /* ignore */ }
    const finalHeaders = Object.assign({
      Accept: 'application/json',
      'User-Agent': `${pkgName}/${pkgVersion}`
    }, headers);

    let body;
    if (json !== undefined) {
      finalHeaders['Content-Type'] = 'application/json';
      body = Buffer.from(JSON.stringify(json));
    } else if (form !== undefined) {
      finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      const usp = new URLSearchParams();
      Object.entries(form).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        usp.append(k, String(v));
      });
      body = Buffer.from(usp.toString());
    }

    const options = {
      method,
      headers: Object.assign({
        'Content-Length': body ? Buffer.byteLength(body) : 0
      }, finalHeaders)
    };

    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const contentType = res.headers['content-type'] || '';
        let data = raw;
        if (contentType.includes('application/json')) {
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch (e) {
            // keep raw
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        } else {
          reject(new ApiError(`HTTP ${res.statusCode} for ${method} ${url.pathname}`, {
            status: res.statusCode,
            body: data,
            headers: res.headers,
            url: url.toString(),
            method
          }));
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (timeoutMs) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
      });
    }

    if (body) req.write(body);
    req.end();
  });
}

module.exports = {
  request,
  ApiError,
};
