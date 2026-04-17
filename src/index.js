const { request, ApiError } = require('./http');

class AmlKycClient {
  constructor(options = {}) {
    const {
      baseUrl = 'https://amlkyc.tech',
      apiKey,
      timeoutMs = 30000,
      authHeader = process.env.AMLKYC_AUTH_HEADER || 'Authorization',
      authScheme = (process.env.AMLKYC_AUTH_SCHEME !== undefined ? process.env.AMLKYC_AUTH_SCHEME : 'Bearer'),
      defaultHeaders = {},
    } = options;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.AMLKYC_API_KEY || null;
    this.timeoutMs = timeoutMs;
    this.authHeader = authHeader;
    this.authScheme = authScheme;
    this.defaultHeaders = defaultHeaders;
  }

  get authHeaders() {
    const headers = { ...this.defaultHeaders };
    if (this.apiKey) {
      if (this.authScheme) {
        headers[this.authHeader] = `${this.authScheme} ${this.apiKey}`;
      } else {
        headers[this.authHeader] = this.apiKey;
      }
    }
    return headers;
  }

  // Low-level
  _request(method, path, opts = {}) {
    const buildHeaders = (authHeaderName, authSchemeValue) => {
      const h = { ...(this.defaultHeaders || {}) };
      if (this.apiKey) {
        if (authSchemeValue) {
          h[authHeaderName] = `${authSchemeValue} ${this.apiKey}`;
        } else {
          h[authHeaderName] = this.apiKey;
        }
      }
      return Object.assign(h, opts.headers || {});
    };

    const primaryAuthHeader = this.authHeader || 'Authorization';
    const primaryAuthScheme = (this.authScheme !== undefined ? this.authScheme : 'Bearer');
    const primaryHeaders = buildHeaders(primaryAuthHeader, primaryAuthScheme);

    const doRequest = (headers) =>
      request(this.baseUrl, method, path, { ...opts, headers, timeoutMs: this.timeoutMs })
        .then(r => r.data);

    return doRequest(primaryHeaders).catch(err => {
      const isPrimaryBearer =
        String(primaryAuthHeader).toLowerCase() === 'authorization' &&
        (primaryAuthScheme === undefined ||
         primaryAuthScheme === null ||
         String(primaryAuthScheme).toLowerCase() === 'bearer');

      if (err && err.status === 401 && this.apiKey && !isPrimaryBearer) {
        const fbHeaders = buildHeaders('Authorization', 'Bearer');
        if (primaryAuthHeader && String(primaryAuthHeader).toLowerCase() !== 'authorization') {
          delete fbHeaders[primaryAuthHeader];
        }
        return doRequest(fbHeaders);
      }
      throw err;
    });
  }

  // Crypto endpoints
  getCryptoAddress({ address, currency, network }) {
    if (!address || !currency) throw new Error('address and currency are required');
    return this._request('GET', '/api/crypto/address', {
      query: { address, currency, network }
    });
  }

  addCryptoAddress({ address, currency, network }) {
    if (!address || !currency) throw new Error('address and currency are required');
    return this._request('PUT', '/api/crypto/address', {
      form: { address, currency, network }
    });
  }

  searchCrypto(address) {
    if (!address) throw new Error('address is required');
    return this._request('GET', '/api/crypto/search', {
      query: { address }
    });
  }

  // Investigations
  listInvestigations() {
    return this._request('GET', '/api/investigations');
  }

  createInvestigation({ target, currency }) {
    if (!target || !currency) throw new Error('target and currency are required');
    return this._request('PUT', '/api/investigations', {
      form: { target, currency }
    });
  }

  getInvestigation(id) {
    if (!id) throw new Error('id is required');
    return this._request('GET', `/api/investigations/${encodeURIComponent(id)}`);
  }

  getInvestigationGraph(id, item) {
    if (!id) throw new Error('id is required');
    return this._request('GET', `/api/investigations/${encodeURIComponent(id)}/graph`, {
      query: { item }
    });
  }

  deepInvestigation(id, address) {
    if (!id || !address) throw new Error('id and address are required');
    return this._request('POST', `/api/investigations/${encodeURIComponent(id)}/deep`, {
      form: { address }
    });
  }

  runInvestigation(id) {
    if (!id) throw new Error('id is required');
    return this._request('GET', `/api/investigations/${encodeURIComponent(id)}/run`);
  }

  // Fast check
  listFastChecks() {
    return this._request('GET', '/api/fast-check');
  }

  addFastCheck({ address, currency, network }) {
    if (!address || !currency) throw new Error('address and currency are required');
    return this._request('PUT', '/api/fast-check', {
      form: { address, currency, network }
    });
  }

  getFastCheck(id) {
    if (!id) throw new Error('id is required');
    return this._request('GET', `/api/fast-check/${encodeURIComponent(id)}`);
  }

  runFastCheck(id) {
    if (!id) throw new Error('id is required');
    return this._request('GET', `/api/fast-check/${encodeURIComponent(id)}/run`);
  }

  // KYC
  createKyc({ email, country_restriction_mode, allowed_countries, allowed_document_types } = {}) {
    if (!email) throw new Error('email is required');
    const body = { email };
    if (country_restriction_mode !== undefined) body.country_restriction_mode = country_restriction_mode;
    if (allowed_countries !== undefined) body.allowed_countries = allowed_countries;
    if (allowed_document_types !== undefined) body.allowed_document_types = allowed_document_types;
    return this._request('PUT', '/webapi/kyc', { json: body });
  }

  listKyc() {
    return this._request('GET', '/webapi/kyc');
  }

  startKycSession(uuid) {
    if (!uuid) throw new Error('uuid is required');
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}`);
  }

  uploadKycDocuments(uuid, { cadrs, passport, document_type, country }) {
    if (!uuid) throw new Error('uuid is required');
    if (!cadrs || !passport || !document_type || !country) {
      throw new Error('cadrs, passport, document_type and country are required');
    }
    return this._request('PUT', `/webapi/kyc/user/${encodeURIComponent(uuid)}`, {
      json: { cadrs, passport, document_type, country }
    });
  }

  getKycDetails(uuid) {
    if (!uuid) throw new Error('uuid is required');
    return this._request('GET', `/webapi/kyc/user/${encodeURIComponent(uuid)}`);
  }

  getKycParams(uuid) {
    if (!uuid) throw new Error('uuid is required');
    return this._request('GET', `/webapi/kyc/user/${encodeURIComponent(uuid)}/params`);
  }

  updateKycStep(uuid, { step, data } = {}) {
    if (!uuid) throw new Error('uuid is required');
    if (step === undefined) throw new Error('step is required');
    const body = { step };
    if (data !== undefined) body.data = data;
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}/step`, { json: body });
  }

  checkKycDocument(uuid, params) {
    if (!uuid) throw new Error('uuid is required');
    const { firstName, lastName, dob } = params || {};
    if (!firstName || !lastName || !dob) throw new Error('firstName, lastName and dob are required');
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}/check`, { json: params });
  }

  startKycLiveness(uuid) {
    if (!uuid) throw new Error('uuid is required');
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}/liveness/start`);
  }

  verifyKycLiveness(uuid, params) {
    if (!uuid) throw new Error('uuid is required');
    const { challengeToken, frames, antiSpoofing, passport, documentType, country } = params || {};
    if (!challengeToken || !frames || !antiSpoofing || !passport || !documentType || !country) {
      throw new Error('challengeToken, frames, antiSpoofing, passport, documentType and country are required');
    }
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}/liveness/verify`, { json: params });
  }

  recognizeKycDocument(uuid, { image, document_type, country }) {
    if (!uuid) throw new Error('uuid is required');
    if (!image || !document_type || !country) throw new Error('image, document_type and country are required');
    return this._request('POST', `/webapi/kyc/user/${encodeURIComponent(uuid)}/recognize-document`, {
      json: { image, document_type, country }
    });
  }

  // User / Balance
  getBalance() {
    return this._request('GET', '/api/user/balance');
  }

  createTopup({ amount, currency }) {
    if (!amount || !currency) throw new Error('amount and currency are required');
    return this._request('PUT', '/api/user/balance', {
      form: { amount, currency }
    });
  }

  getAllowedFiat() {
    return this._request('GET', '/api/user/balance/allowed_fiat');
  }
}

module.exports = {
  AmlKycClient,
  ApiError,
};
