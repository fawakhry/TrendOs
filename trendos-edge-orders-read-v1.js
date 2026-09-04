/* TrendOS Edge Orders Read V1
 * Reads getRowsPageV1931 from Cloudflare/D1 first when enabled.
 * Every write and every unsupported/sensitive read stays on Apps Script.
 * Any Edge error fails open to the original Apps Script function.
 */
(function () {
  'use strict';

  var VERSION = 'EDGE_ORDERS_READ_V1_20260904';
  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var SESSION_SKEW_MS = 30000;
  var session = { token: '', expiresAt: 0, inflight: null };
  var inflight = new Map();

  function text(value) { return String(value == null ? '' : value).trim(); }

  function edgeBase() {
    return text(window.MATBAGY_EDGE_ORDERS_API_URL || window.MATBAGY_EDGE_API_URL || DEFAULT_EDGE_API).replace(/\/+$/, '');
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

  async function jsonResponse(response) {
    var raw = await response.text();
    var body;
    try { body = JSON.parse(raw || '{}'); }
    catch (e) {
      var invalid = new Error('Orders Edge returned invalid JSON');
      invalid.status = response.status;
      throw invalid;
    }
    if (!response.ok || !body || body.success === false) {
      var err = new Error((body && body.message) || ('Orders Edge HTTP ' + response.status));
      err.status = response.status;
      err.code = body && body.code;
      err.fallback = body && body.fallback;
      throw err;
    }
    return body;
  }

  function clearSession() {
    session.token = '';
    session.expiresAt = 0;
    session.inflight = null;
  }

  async function exchangeSession() {
    var user = currentUser();
    if (!user.username || !user.token) throw new Error('Employee session is not available');
    var response = await fetch(edgeBase() + '/v1/edge/orders/session', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'accept': 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ username: user.username, token: user.token })
    });
    var body = await jsonResponse(response);
    session.token = text(body.edgeToken);
    session.expiresAt = Date.parse(body.expiresAt || '') || (Date.now() + Math.max(60000, Number(body.expiresIn || 600) * 1000));
    if (!session.token) throw new Error('Orders Edge token was not returned');
    return session.token;
  }

  async function ensureSession() {
    if (session.token && session.expiresAt - SESSION_SKEW_MS > Date.now()) return session.token;
    if (session.inflight) return session.inflight;
    session.inflight = exchangeSession().finally(function () { session.inflight = null; });
    return session.inflight;
  }

  function queryString(params) {
    var query = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      if (key === 'username' || key === 'token') return;
      var value = params[key];
      if (value === undefined || value === null || text(value) === '') return;
      query.set(key, text(value));
    });
    return query.toString();
  }

  async function edgePage(params) {
    var key = queryString(params || {});
    var requestKey = '/v1/edge/orders/page?' + key;
    if (inflight.has(requestKey)) return inflight.get(requestKey);

    var task = (async function () {
      var token = await ensureSession();
      var response = await fetch(edgeBase() + requestKey, {
        method: 'GET', cache: 'no-store', credentials: 'omit',
        headers: { 'accept': 'application/json', 'authorization': 'Bearer ' + token }
      });
      if (response.status === 401) {
        clearSession();
        token = await ensureSession();
        response = await fetch(edgeBase() + requestKey, {
          method: 'GET', cache: 'no-store', credentials: 'omit',
          headers: { 'accept': 'application/json', 'authorization': 'Bearer ' + token }
        });
      }
      return jsonResponse(response);
    })();

    inflight.set(requestKey, task);
    try { return await task; }
    finally { inflight.delete(requestKey); }
  }

  function eligible(action, params) {
    if (action !== 'getRowsPageV1931') return false;
    if (text(params && params.statusFilter) === '__DEBT__') return false;
    return true;
  }

  function install() {
    if (window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED !== true) return false;
    var original = window.trendosSecureApiV1922;
    if (typeof original !== 'function') return false;
    if (original.__trendosEdgeOrdersReadV1) return true;

    async function wrapped(action, params) {
      var args = arguments;
      if (!eligible(action, params || {})) return original.apply(this, args);
      try {
        var result = await edgePage(params || {});
        result.dashboard = result.dashboard || null;
        return result;
      } catch (err) {
        try {
          console.warn('[TrendOS Orders Edge V1] D1 read failed; using Apps Script fallback:', err && err.message ? err.message : err);
        } catch (ignore) {}
        return original.apply(this, args);
      }
    }

    wrapped.__trendosEdgeOrdersReadV1 = true;
    wrapped.__trendosOriginalSecureApi = original;
    window.trendosSecureApiV1922 = wrapped;
    window.TrendOSEdgeOrdersReadV1 = {
      version: VERSION,
      enabled: true,
      mode: 'd1-orders-read-first-apps-script-fallback',
      api: edgeBase(),
      clearSession: clearSession,
      stats: function () { return { inflight: inflight.size, sessionExpiresAt: session.expiresAt || 0 }; }
    };
    return true;
  }

  window.TrendOSEdgeOrdersReadV1Loader = {
    version: VERSION,
    enabled: window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED === true,
    install: install,
    clearSession: clearSession
  };

  if (window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED === true) {
    if (!install()) {
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        if (install() || attempts >= 40) clearInterval(timer);
      }, 250);
    }
  }
})();
