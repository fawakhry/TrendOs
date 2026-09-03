/* TrendOS Edge Read V1
 * Default OFF. This file is not loaded by config.js.
 * When explicitly enabled later, Customer Manager inbox/thread use the secure
 * Cloudflare edge lane first and fall back to the existing Apps Script API.
 * All writes remain on Apps Script.
 */
(function () {
  'use strict';

  var VERSION = 'EDGE_READ_V1_20260903';
  var DEFAULT_API = 'https://trendos.trendmall-contact.workers.dev';
  var CACHE_TTL_MS = 10000;
  var HIDDEN_CACHE_TTL_MS = 120000;
  var SESSION_SKEW_MS = 30000;
  var inflight = new Map();
  var cache = new Map();
  var edgeSession = { token: '', expiresAt: 0, inflight: null };

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function cleanPhone(value) {
    var digits = String(value || '').replace(/[^0-9]/g, '');
    if (digits.indexOf('0020') === 0) digits = digits.slice(2);
    if (digits.indexOf('20') === 0 && digits.length === 12) digits = '0' + digits.slice(2);
    if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
    return digits;
  }

  function apiBase() {
    return text(window.MATBAGY_EDGE_API_URL || DEFAULT_API).replace(/\/+$/, '');
  }

  function currentUser() {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('trendos_session') || '{}').user || {}; } catch (e) {}
    var stateUser = (window.state && window.state.user) || (window.trendosState && window.trendosState.user) || {};
    return {
      username: text(stateUser.username || stateUser.name || saved.username || saved.name || sessionStorage.getItem('matbagy_username') || sessionStorage.getItem('matbagy_user_name')),
      token: text(stateUser.token || saved.token || window.sessionToken || sessionStorage.getItem('matbagy_session_token'))
    };
  }

  function cacheGet(key, ttl) {
    var entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > ttl) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  }

  function cacheSet(key, value) {
    cache.set(key, { at: Date.now(), value: value });
    return value;
  }

  function queryString(params) {
    var query = new URLSearchParams();
    Object.keys(params || {}).sort().forEach(function (key) {
      var value = params[key];
      if (value !== undefined && value !== null && text(value) !== '') query.set(key, text(value));
    });
    var out = query.toString();
    return out ? ('?' + out) : '';
  }

  async function parseJsonResponse(response) {
    var raw = await response.text();
    var body;
    try { body = JSON.parse(raw || '{}'); }
    catch (e) { throw new Error('Edge returned invalid JSON'); }
    if (!response.ok || !body || body.success === false) {
      var error = new Error((body && body.message) || ('Edge HTTP ' + response.status));
      error.status = response.status;
      error.code = body && body.code;
      throw error;
    }
    return body;
  }

  async function exchangeSession() {
    var user = currentUser();
    if (!user.username || !user.token) throw new Error('Employee session is not available');

    var response = await fetch(apiBase() + '/v1/edge/session', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ username: user.username, token: user.token })
    });
    var body = await parseJsonResponse(response);
    edgeSession.token = text(body.edgeToken);
    edgeSession.expiresAt = Date.parse(body.expiresAt || '') || (Date.now() + Math.max(60000, Number(body.expiresIn || 600) * 1000));
    if (!edgeSession.token) throw new Error('Edge session token was not returned');
    return edgeSession.token;
  }

  async function ensureEdgeSession() {
    if (edgeSession.token && edgeSession.expiresAt - SESSION_SKEW_MS > Date.now()) return edgeSession.token;
    if (edgeSession.inflight) return edgeSession.inflight;
    edgeSession.inflight = exchangeSession().finally(function () { edgeSession.inflight = null; });
    return edgeSession.inflight;
  }

  function clearEdgeSession() {
    edgeSession.token = '';
    edgeSession.expiresAt = 0;
    edgeSession.inflight = null;
  }

  async function edgeGet(path, params) {
    var key = path + queryString(params);
    var hidden = typeof document !== 'undefined' && document.hidden === true;
    var cached = cacheGet(key, hidden ? HIDDEN_CACHE_TTL_MS : CACHE_TTL_MS);
    if (cached) return cached;
    if (inflight.has(key)) return inflight.get(key);

    var task = (async function () {
      var token = await ensureEdgeSession();
      var response = await fetch(apiBase() + key, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'accept': 'application/json',
          'authorization': 'Bearer ' + token
        }
      });
      if (response.status === 401) {
        clearEdgeSession();
        token = await ensureEdgeSession();
        response = await fetch(apiBase() + key, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'omit',
          headers: {
            'accept': 'application/json',
            'authorization': 'Bearer ' + token
          }
        });
      }
      return cacheSet(key, await parseJsonResponse(response));
    })();

    inflight.set(key, task);
    try { return await task; }
    finally { inflight.delete(key); }
  }

  async function readInbox(params) {
    return edgeGet('/v1/edge/customer-manager/inbox', {
      limit: (params && params.limit) || 120
    });
  }

  async function readThread(params) {
    var phone = cleanPhone(params && params.phone);
    if (!phone) throw new Error('phone is required');
    return edgeGet('/v1/edge/customer-manager/thread', {
      phone: phone,
      limit: (params && params.limit) || 200
    });
  }

  function eligible(action, params) {
    var op = params && text(params.op);
    return action === 'customerManagerV1' && (op === 'inbox' || op === 'thread');
  }

  function install() {
    if (window.MATBAGY_EDGE_READ_V1_ENABLED !== true) return false;
    var original = window.trendosSecureApiV1922;
    if (typeof original !== 'function') return false;
    if (original.__trendosEdgeReadV1) return true;

    async function wrapped(action, params) {
      var args = arguments;
      if (!eligible(action, params)) return original.apply(this, args);

      var op = text(params && params.op);
      var hidden = typeof document !== 'undefined' && document.hidden === true;
      var fallbackKey = op === 'thread'
        ? '/v1/edge/customer-manager/thread' + queryString({ phone: cleanPhone(params && params.phone), limit: (params && params.limit) || 200 })
        : '/v1/edge/customer-manager/inbox' + queryString({ limit: (params && params.limit) || 120 });

      if (hidden) {
        var hiddenCached = cacheGet(fallbackKey, HIDDEN_CACHE_TTL_MS);
        if (hiddenCached) {
          var cachedCopy = Object.assign({}, hiddenCached, { dataSource: 'd1-edge-cache-hidden' });
          return cachedCopy;
        }
      }

      try {
        return op === 'inbox' ? await readInbox(params) : await readThread(params);
      } catch (err) {
        try {
          console.warn('[TrendOS Edge V1] secure read failed; Apps Script fallback:', err && err.message ? err.message : err);
        } catch (ignore) {}
        return original.apply(this, args);
      }
    }

    wrapped.__trendosEdgeReadV1 = true;
    wrapped.__trendosOriginalSecureApi = original;
    window.trendosSecureApiV1922 = wrapped;
    window.TrendOSEdgeReadV1 = {
      version: VERSION,
      mode: 'secure-edge-read-first-with-apps-script-fallback',
      enabled: true,
      api: apiBase(),
      clearSession: clearEdgeSession,
      clearCache: function () { cache.clear(); },
      stats: function () { return { inflight: inflight.size, cacheEntries: cache.size, sessionExpiresAt: edgeSession.expiresAt || 0 }; }
    };
    return true;
  }

  window.TrendOSEdgeReadV1Loader = {
    version: VERSION,
    enabled: window.MATBAGY_EDGE_READ_V1_ENABLED === true,
    install: install,
    clearSession: clearEdgeSession
  };

  if (window.MATBAGY_EDGE_READ_V1_ENABLED === true) {
    if (!install()) {
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        if (install() || attempts >= 30) clearInterval(timer);
      }, 500);
    }
  }
})();
