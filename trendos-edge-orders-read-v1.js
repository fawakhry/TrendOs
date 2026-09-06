/* TrendOS Edge Orders Read V1
 * Reads getRowsPageV1931 from the qualified Cloudflare/D1 route first when enabled.
 * Every write and every unsupported/sensitive read stays on Apps Script.
 * Any Edge error or stale required mirror fails open to the original Apps Script function.
 */
(function () {
  'use strict';

  var VERSION = 'EDGE_ORDERS_READ_02CU_IDLE_LOGICAL_FRESHNESS_20260906';
  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var QUALIFIED_PAGE_PATH = '/v1/edge/orders/02cr/page';
  var SESSION_SKEW_MS = 30000;
  var DEFAULT_MAX_MIRROR_AGE_MS = 5 * 60 * 1000;
  var MAX_LOGICAL_FRESHNESS_AGE_MS = 15 * 60 * 1000;
  var REQUIRED_MIRRORS = ['بنود الأوردرات', 'العملاء', 'عملاء منع التسليم بالمديونية'];
  var session = { token: '', expiresAt: 0, inflight: null };
  var inflight = new Map();
  var metrics = { edgeSuccess: 0, fallbacks: 0, staleFallbacks: 0, logicalFreshnessAccepted: 0, lastFallbackAt: 0, lastFallbackReason: '' };

  function text(value) { return String(value == null ? '' : value).trim(); }

  function edgeBase() {
    return text(window.MATBAGY_EDGE_ORDERS_API_URL || window.MATBAGY_EDGE_API_URL || DEFAULT_EDGE_API).replace(/\/+$/, '');
  }

  function maxMirrorAgeMs() {
    var configured = Number(window.MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS);
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_MIRROR_AGE_MS;
  }

  function parseMirrorTime(value) {
    var raw = text(value);
    if (!raw) return NaN;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)) raw = raw.replace(' ', 'T') + 'Z';
    return Date.parse(raw);
  }

  function mirrorFreshnessError(message, code) {
    var err = new Error(message);
    err.code = code || 'EDGE_MIRROR_NOT_READY';
    err.fallback = 'apps-script';
    return err;
  }

  function logicalLinesFreshnessValid(body, mirror, now) {
    var proof = body && body.logicalFreshness;
    if (!proof || proof.ok !== true || text(proof.mode) !== 'verified-idle-source-unchanged') return false;
    if (Array.isArray(proof.failedChecks) && proof.failedChecks.length) return false;
    var checkedAt = parseMirrorTime(proof.checkedAt);
    if (!Number.isFinite(checkedAt)) return false;
    var age = now - checkedAt;
    if (age < -2 * 60 * 1000 || age > MAX_LOGICAL_FRESHNESS_AGE_MS) return false;
    var advertisedMax = Number(proof.maxAgeSeconds);
    if (!Number.isFinite(advertisedMax) || advertisedMax < 300 || advertisedMax > MAX_LOGICAL_FRESHNESS_AGE_MS / 1000) return false;
    if (age > advertisedMax * 1000) return false;
    var source = proof.source && proof.source.lines;
    if (!source) return false;
    if (Number(source.sourceLastRow || 0) !== Number(mirror.sourceLastRow || 0)) return false;
    if (Number(source.sourceLastCol || 0) !== Number(mirror.sourceLastCol || 0)) return false;
    if (source.displayHashPresent !== true) return false;
    return true;
  }

  function validateRequiredMirrors(body) {
    var mirrors = body && Array.isArray(body.mirrors) ? body.mirrors : [];
    var maxAge = maxMirrorAgeMs();
    var now = Date.now();
    REQUIRED_MIRRORS.forEach(function (name) {
      var mirror = mirrors.find(function (item) { return text(item && item.sheetName) === name; });
      if (!mirror) throw mirrorFreshnessError('Required D1 mirror metadata missing: ' + name, 'EDGE_MIRROR_MISSING');
      if (text(mirror.status).toLowerCase() !== 'ready') throw mirrorFreshnessError('Required D1 mirror is not ready: ' + name, 'EDGE_MIRROR_NOT_READY');
      if (Number(mirror.rowCount || 0) !== Number(mirror.sourceLastRow || 0)) throw mirrorFreshnessError('Required D1 mirror row parity failed: ' + name, 'EDGE_MIRROR_PARITY');
      var syncedAt = parseMirrorTime(mirror.syncedAt);
      if (!Number.isFinite(syncedAt)) throw mirrorFreshnessError('Required D1 mirror timestamp missing: ' + name, 'EDGE_MIRROR_TIMESTAMP');
      var age = now - syncedAt;
      if (age < -2 * 60 * 1000) throw mirrorFreshnessError('Required D1 mirror timestamp is in the future: ' + name, 'EDGE_MIRROR_CLOCK');
      if (age > maxAge) {
        if (name === 'بنود الأوردرات' && logicalLinesFreshnessValid(body, mirror, now)) {
          metrics.logicalFreshnessAccepted += 1;
          return;
        }
        throw mirrorFreshnessError('Required D1 mirror is stale: ' + name, 'EDGE_MIRROR_STALE');
      }
    });
    return body;
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
    var requestKey = QUALIFIED_PAGE_PATH + '?' + key;
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
      return validateRequiredMirrors(await jsonResponse(response));
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
        metrics.edgeSuccess += 1;
        result.dashboard = result.dashboard || null;
        return result;
      } catch (err) {
        metrics.fallbacks += 1;
        metrics.lastFallbackAt = Date.now();
        metrics.lastFallbackReason = text(err && (err.code || err.message));
        if (err && err.code === 'EDGE_MIRROR_STALE') metrics.staleFallbacks += 1;
        try {
          console.warn('[TrendOS Orders Edge 02CU] D1 read unavailable/freshness failed; using Apps Script fallback:', err && err.message ? err.message : err);
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
      mode: 'qualified-d1-orders-read-first-dual-signal-freshness-gated-apps-script-fallback',
      api: edgeBase(),
      pagePath: QUALIFIED_PAGE_PATH,
      maxMirrorAgeMs: maxMirrorAgeMs(),
      clearSession: clearSession,
      stats: function () {
        return {
          inflight: inflight.size,
          sessionExpiresAt: session.expiresAt || 0,
          edgeSuccess: metrics.edgeSuccess,
          fallbacks: metrics.fallbacks,
          staleFallbacks: metrics.staleFallbacks,
          logicalFreshnessAccepted: metrics.logicalFreshnessAccepted,
          lastFallbackAt: metrics.lastFallbackAt,
          lastFallbackReason: metrics.lastFallbackReason
        };
      }
    };
    return true;
  }

  window.TrendOSEdgeOrdersReadV1Loader = {
    version: VERSION,
    enabled: window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED === true,
    pagePath: QUALIFIED_PAGE_PATH,
    maxMirrorAgeMs: maxMirrorAgeMs(),
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
