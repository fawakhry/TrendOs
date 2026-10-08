/* TrendOS Edge Orders Read V1
 * Reads getRowsPageV1931 from the qualified Cloudflare/D1 route first when enabled.
 * Legacy actions use the dispatcher and server-side Cloud transport.
 * Any Edge error or stale required mirror fails closed without a legacy read.
 * 02CV adds read-your-write consistency for updateLine without changing write authority.
 * 02CX repairs Google-Sheets date-coerced Line IDs and persists the write barrier across refresh.
 */
(function () {
  'use strict';

  var VERSION = 'EDGE_ORDERS_T12_CUSTOMER_CLOUD_ONLY_A56_20260929';
  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var QUALIFIED_PAGE_PATH = '/v1/edge/orders/02cr/page';
  var CUSTOMER_SEARCH_PATH = '/v1/edge/customers/search';
  var CUSTOMER_WRITE_PATH = '/v1/t12/customers/write';
  var SERVICE_PAGE_PATH = '/v1/edge/orders/service/page';
  var T12_OVERLAY_PATH = '/v1/t12/orders/read-overlay';
  var T12_RUNTIME_UPDATE_PATH = '/v1/t12/orders/line-runtime/update';
  var T12_LEGACY_RUNTIME_UPDATE_PATH = '/v1/t12/orders/line-runtime/legacy-update';
  var T12_RUNTIME_NOTIFY_PATH = '/v1/t12/orders/line-runtime/notify';
  var T12_GENERAL_CREATE_PATH = '/v1/t12/orders/create';
  var T12_GENERAL_CREATE_HEALTH_PATH = '/v1/t12/orders/create/health';
  var T12_PENDING_CREATE_STORAGE_KEY = 'trendos_t12_pending_create_v1';
  var T12_DURABLE_CREATE_STORAGE_KEY = 'trendos_t12_pending_create_sha256_v2';
  var SESSION_SKEW_MS = 30000;
  var DEFAULT_MAX_MIRROR_AGE_MS = 5 * 60 * 1000;
  var MAX_LOGICAL_FRESHNESS_AGE_MS = 15 * 60 * 1000;
  var DEFAULT_POST_WRITE_BARRIER_MS = 6 * 60 * 1000;
  var MAX_POST_WRITE_BARRIER_MS = 10 * 60 * 1000;
  var DEFAULT_STALE_FALLBACK_COOLDOWN_MS = 2 * 60 * 1000;
  var MAX_STALE_FALLBACK_COOLDOWN_MS = 5 * 60 * 1000;
  var POST_WRITE_BARRIER_STORAGE_KEY = 'trendos_edge_orders_post_write_barrier_v1';
  var GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
  var GOOGLE_SHEETS_SERIAL_DAY_MS = 24 * 60 * 60 * 1000;
  var REQUIRED_MIRRORS = ['بنود الأوردرات', 'العملاء', 'عملاء منع التسليم بالمديونية'];
  var session = { token: '', expiresAt: 0, inflight: null };
  var inflight = new Map();
  var postWriteBarrier = { until: 0, orderId: '', lineId: '', status: '' };
  var staleFallbackUntil = 0;
  var cloudNativeLineIds = new Set();
  var metrics = {
    edgeSuccess: 0,
    fallbacks: 0,
    staleFallbacks: 0,
    staleCooldownBypasses: 0,
    logicalFreshnessAccepted: 0,
    postWriteFallbacks: 0,
    rowNumberStrippedWrites: 0,
    postWriteBarriersOpened: 0,
    postWriteBarrierRecoveries: 0,
    lineIdRepairs: 0,
    writeIdentityRepairs: 0,
    legacyRuntimeWrites: 0,
    hybridOverlaySuccess: 0,
    hybridOverlayFailures: 0,
    hybridOverlayRows: 0,
    customerEdgeSuccess: 0,
    customerFallbacks: 0,
    customerMissFallbacks: 0,
    lastFallbackAt: 0,
    lastFallbackReason: ''
  };

  function text(value) { return String(value == null ? '' : value).trim(); }

  function edgeBase() {
    return text(window.MATBAGY_EDGE_ORDERS_API_URL || window.MATBAGY_EDGE_API_URL || DEFAULT_EDGE_API).replace(/\/+$/, '');
  }

  function maxMirrorAgeMs() {
    var configured = Number(window.MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS);
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_MIRROR_AGE_MS;
  }

  function postWriteBarrierMs() {
    var configured = Number(window.MATBAGY_EDGE_ORDERS_POST_WRITE_BARRIER_MS);
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_POST_WRITE_BARRIER_MS;
    return Math.min(configured, MAX_POST_WRITE_BARRIER_MS);
  }

  function staleFallbackCooldownMs() {
    var configured = Number(window.MATBAGY_EDGE_ORDERS_STALE_FALLBACK_COOLDOWN_MS);
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_STALE_FALLBACK_COOLDOWN_MS;
    return Math.min(configured, MAX_STALE_FALLBACK_COOLDOWN_MS);
  }

  function isKnownMirrorStaleError(err) {
    var code = text(err && err.code).toLowerCase();
    return code === 'edge_mirror_stale' || code === '02cr-mirror-stale';
  }

  function openStaleFallbackCooldown() {
    staleFallbackUntil = Date.now() + staleFallbackCooldownMs();
  }

  function staleFallbackActive() {
    if (!staleFallbackUntil) return false;
    if (staleFallbackUntil <= Date.now()) {
      staleFallbackUntil = 0;
      return false;
    }
    return true;
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

  function zeroGoogleSnapshotStalenessAccepted(body, name, mirror) {
    if (name === 'بنود الأوردرات') {
      var base = body && body.baseSnapshotFreshness;
      var proof = base && base.lines;
      return !!(
        base &&
        base.degraded === true &&
        text(base.mode) === 'stale-structurally-qualified' &&
        text(base.authority) === 'd1-qualified-snapshot+t12-native-overlay' &&
        base.googleHeartbeatRequired === false &&
        proof &&
        proof.structurallyReady === true &&
        Number(proof.sourceLastRow || 0) === Number(mirror.sourceLastRow || 0) &&
        Number(proof.sourceLastCol || 0) === Number(mirror.sourceLastCol || 0) &&
        Number(proof.rowCount || 0) === Number(mirror.rowCount || 0)
      );
    }

    if (name === 'العملاء' || name === 'عملاء منع التسليم بالمديونية') {
      var enrichment = body && body.enrichmentFreshness;
      var part = name === 'العملاء' ? enrichment && enrichment.customers : enrichment && enrichment.restrictions;
      return !!(
        enrichment &&
        enrichment.degraded === true &&
        text(enrichment.mode) === 'stale-structurally-qualified' &&
        part &&
        part.structurallyReady === true &&
        Number(part.sourceLastRow || 0) === Number(mirror.sourceLastRow || 0) &&
        Number(part.sourceLastCol || 0) === Number(mirror.sourceLastCol || 0) &&
        Number(part.rowCount || 0) === Number(mirror.rowCount || 0)
      );
    }
    return false;
  }

  function validateRequiredMirrors(body) {
    var mirrors = body && Array.isArray(body.mirrors) ? body.mirrors : [];
    var maxAge = maxMirrorAgeMs();
    var now = Date.now();
    var logicalAccepted = false;
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
        if (zeroGoogleSnapshotStalenessAccepted(body, name, mirror)) {
          logicalAccepted = true;
          return;
        }
        if (name === 'بنود الأوردرات' && logicalLinesFreshnessValid(body, mirror, now)) {
          logicalAccepted = true;
          return;
        }
        throw mirrorFreshnessError('Required D1 mirror is stale: ' + name, 'EDGE_MIRROR_STALE');
      }
    });
    if (logicalAccepted) metrics.logicalFreshnessAccepted += 1;
    return body;
  }

  function signalEmployeeSessionInvalidV2(source) {
    if (typeof window.dispatchEvent !== 'function') return false;
    try {
      var detail = { status:401, code:'EMPLOYEE_SESSION_REJECTED', source:source || 'trendos-edge-orders-read-v1' };
      if (typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new window.CustomEvent('trendos:employee-session-invalid', { detail:detail }));
      } else {
        window.dispatchEvent({ type:'trendos:employee-session-invalid', detail:detail });
      }
      return true;
    } catch (e) { return false; }
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

  function persistPostWriteBarrier() {
    try {
      if (!postWriteBarrier.until) sessionStorage.removeItem(POST_WRITE_BARRIER_STORAGE_KEY);
      else sessionStorage.setItem(POST_WRITE_BARRIER_STORAGE_KEY, JSON.stringify(postWriteBarrier));
    } catch (e) {}
  }

  function clearPostWriteBarrier() {
    postWriteBarrier.until = 0;
    postWriteBarrier.orderId = '';
    postWriteBarrier.lineId = '';
    postWriteBarrier.status = '';
    persistPostWriteBarrier();
  }

  function restorePostWriteBarrier() {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(POST_WRITE_BARRIER_STORAGE_KEY) || 'null'); } catch (e) {}
    if (!saved || !Number(saved.until) || Number(saved.until) <= Date.now()) {
      try { sessionStorage.removeItem(POST_WRITE_BARRIER_STORAGE_KEY); } catch (e) {}
      return false;
    }
    postWriteBarrier.until = Number(saved.until);
    postWriteBarrier.orderId = text(saved.orderId);
    postWriteBarrier.lineId = text(saved.lineId);
    postWriteBarrier.status = text(saved.status);
    return true;
  }

  function postWriteBarrierActive() {
    if (!postWriteBarrier.until) return false;
    if (postWriteBarrier.until <= Date.now()) {
      clearPostWriteBarrier();
      return false;
    }
    return true;
  }

  function openPostWriteBarrier(params) {
    postWriteBarrier.until = Date.now() + postWriteBarrierMs();
    postWriteBarrier.orderId = text(params && params.orderId);
    postWriteBarrier.lineId = text(params && params.lineId);
    postWriteBarrier.status = text(params && params.status);
    metrics.postWriteBarriersOpened += 1;
    persistPostWriteBarrier();
  }

  function postWriteBarrierProbeParams(params) {
    var target = text(postWriteBarrier.lineId || postWriteBarrier.orderId);
    if (!target) return null;
    var probe = Object.assign({}, params || {});
    probe.page = 1;
    probe.pageSize = Math.max(5, Math.min(20, Number(probe.pageSize) || 20));
    probe.query = target;
    probe.statusFilter = '';
    probe.priorityFilter = '';
    probe.heatPressFilter = '';
    return probe;
  }

  function postWriteBarrierVisible(body) {
    var lineId = text(postWriteBarrier.lineId);
    var orderId = text(postWriteBarrier.orderId);
    var expectedStatus = text(postWriteBarrier.status);
    if (!lineId) return false;
    var rows = body && Array.isArray(body.rows) ? body.rows : [];
    return rows.some(function (row) {
      if (text(row && row.lineId) !== lineId) return false;
      if (orderId && text(row && row.orderId) !== orderId) return false;
      if (expectedStatus && text(row && row.status) !== expectedStatus) return false;
      return true;
    });
  }

  async function recoverPostWriteBarrier(params) {
    if (!postWriteBarrierActive()) return null;
    var probeParams = postWriteBarrierProbeParams(params || {});
    if (!probeParams) return null;
    var probe = await edgePage(probeParams);
    if (!postWriteBarrierVisible(probe)) return null;
    clearPostWriteBarrier();
    metrics.postWriteBarrierRecoveries += 1;
    return edgePage(params || {});
  }

  function repairSerializedLineId(orderId, lineId) {
    var order = text(orderId);
    var line = text(lineId);
    if (!/^\d{3,6}$/.test(order) || !/^\d{5,8}$/.test(line)) return line;
    var serial = Number(line);
    if (!Number.isSafeInteger(serial) || serial <= 0) return line;
    var ms = GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS + (serial * GOOGLE_SHEETS_SERIAL_DAY_MS);
    var d = new Date(ms);
    if (!Number.isFinite(d.getTime())) return line;
    var year = String(d.getUTCFullYear());
    var month = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    if (year !== order || day !== 1 || month < 1 || month > 12) return line;
    return order + '-' + String(month).padStart(2, '0');
  }

  function normalizeEdgeLineIdentities(body) {
    if (!body || !Array.isArray(body.rows)) return body;
    body.rows = body.rows.map(function (row) {
      if (!row || typeof row !== 'object') return row;
      var current = text(row.lineId);
      var repaired = repairSerializedLineId(row.orderId, current);
      var normalized = (!repaired || repaired === current) ? row : Object.assign({}, row, { lineId: repaired });
      if (normalized !== row) metrics.lineIdRepairs += 1;
      if (normalized && normalized.cloudNative === true && text(normalized.lineId)) {
        cloudNativeLineIds.add(text(normalized.lineId));
      }
      return normalized;
    });
    return body;
  }

  function identitySafeUpdateLineParams(params) {
    var safe = Object.assign({}, params || {});
    var originalLineId = text(safe.lineId);
    var repairedLineId = repairSerializedLineId(safe.orderId, originalLineId);
    if (repairedLineId && repairedLineId !== originalLineId) {
      safe.lineId = repairedLineId;
      metrics.writeIdentityRepairs += 1;
    }
    // D1 row_number is a mirror coordinate, not a stable write identity. When a
    // stable Line ID exists, intentionally omit rowNumber so Apps Script resolves
    // the current source row by lineId instead of trusting a possibly shifted row.
    if (text(safe.lineId) && Object.prototype.hasOwnProperty.call(safe, 'rowNumber')) {
      delete safe.rowNumber;
      metrics.rowNumberStrippedWrites += 1;
    }
    return safe;
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
    if (response.status === 401) signalEmployeeSessionInvalidV2('edge-orders-session-exchange');
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

  function isServiceScreen(params) {
    return text(params && params.screen).toLowerCase() === 'service';
  }

  function pagePathFor(params) {
    // Entry 453: all operational screens, including Customer Service, use the
    // qualified line-level 02CR route. It already merges T12 Cloud-native rows
    // before filters/counters/pagination and matches Apps Script getRows_ shape.
    return QUALIFIED_PAGE_PATH;
  }

  function validateServiceResponse(body) {
    if (text(body && body.dataSource) !== 'd1-edge-orders-service-v1') {
      throw mirrorFreshnessError('Service D1 data source mismatch', 'EDGE_SERVICE_SOURCE');
    }
    if (!body || !body.freshness || body.freshness.ok !== true) {
      throw mirrorFreshnessError('Service D1 freshness proof missing', 'EDGE_SERVICE_FRESHNESS');
    }
    return body;
  }

  async function edgePage(params) {
    var key = queryString(params || {});
    var requestKey = pagePathFor(params || {}) + '?' + key;
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
      var body = await jsonResponse(response);
      return normalizeEdgeLineIdentities(validateRequiredMirrors(body));
    })();

    inflight.set(requestKey, task);
    try { return await task; }
    finally { inflight.delete(requestKey); }
  }

  function customerCloudRequestId(raw) {
    var v = text(raw);
    if (/^cust1_\d{13}_[A-Za-z0-9_-]{16,80}$/.test(v)) return v;
    var now = Date.now();
    var suffix = ('ui_' + Math.random().toString(36).slice(2) + '_' + Math.random().toString(36).slice(2) + '_customer').replace(/[^A-Za-z0-9_-]/g, '_');
    while (suffix.length < 16) suffix += '0';
    return 'cust1_' + String(now) + '_' + suffix.slice(0, 80);
  }

  async function edgeCustomerWrite(params) {
    var payload = Object.assign({}, params || {});
    payload.clientRequestId = customerCloudRequestId(payload.clientRequestId);
    var token = await ensureSession();
    var response = await fetch(edgeBase() + CUSTOMER_WRITE_PATH, {
      method: 'POST', cache: 'no-store', credentials: 'omit',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    if (response.status === 401) {
      clearSession();
      token = await ensureSession();
      response = await fetch(edgeBase() + CUSTOMER_WRITE_PATH, {
        method: 'POST', cache: 'no-store', credentials: 'omit',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
    }
    return jsonResponse(response);
  }

  async function edgeCustomerSearch(params) {
    var query = new URLSearchParams();
    var q = text(params && params.q);
    if (q) query.set('q', q);
    var requestKey = CUSTOMER_SEARCH_PATH + (query.toString() ? ('?' + query.toString()) : '');
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
  }

  function rowIdentity(row) {
    var lineId = text(row && row.lineId);
    if (lineId) return 'line:' + lineId;
    var orderId = text(row && row.orderId);
    return orderId ? 'order:' + orderId : '';
  }

  async function t12OverlayPage(params) {
    var key = queryString(params || {});
    var requestKey = T12_OVERLAY_PATH + '?' + key;
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
    var body = await jsonResponse(response);
    if (text(body && body.dataSource) !== 't12-prod-native' || body.readOnly !== true) {
      throw new Error('T12 read overlay response mismatch');
    }
    (body.rows || []).forEach(function (row) {
      if (row && row.cloudNative === true && text(row.lineId)) cloudNativeLineIds.add(text(row.lineId));
    });
    return body;
  }

  async function t12RuntimePost(path, payload) {
    var token = await ensureSession();
    var response = await fetch(edgeBase() + path, {
      method: 'POST', cache: 'no-store', credentials: 'omit',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload || {})
    });
    if (response.status === 401) {
      clearSession();
      token = await ensureSession();
      response = await fetch(edgeBase() + path, {
        method: 'POST', cache: 'no-store', credentials: 'omit',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload || {})
      });
    }
    return jsonResponse(response);
  }

  async function t12CreateFingerprint(params) {
    var p = params || {};
    // Never put clear-text customer names, phones or notes into durable storage.
    var material = JSON.stringify([
      text(p.username), text(p.customerMode), text(p.customerExternalId || p.externalCustomerId),
      text(p.customerName), text(p.customerPhone), text(p.department),
      text(p.heatPress), text(p.flyPrint), text(p.itemName), text(p.qty),
      text(p.priority), text(p.status), text(p.source), text(p.notes)
    ]);
    var digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
    return Array.from(new Uint8Array(digest), function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  function cloudCreateKeyFromLegacy(raw) {
    var value = text(raw);
    if (/^cld1_\d{13}_[A-Za-z0-9_-]{16,80}$/.test(value)) return value;
    var m = value.match(/^co_(\d{13})_([A-Za-z0-9_-]+)$/);
    if (!m) return '';
    var suffix = ('ui_' + m[2] + '_trendos_create').replace(/[^A-Za-z0-9_-]/g, '_');
    if (suffix.length < 16) suffix += '_0000000000000000';
    return 'cld1_' + m[1] + '_' + suffix.slice(0, 80);
  }

  function createStorageKey(fingerprint) {
    return T12_DURABLE_CREATE_STORAGE_KEY + ':' + fingerprint;
  }
  function readPendingCreate(fingerprint) {
    // Per-intent hashed keys avoid overwriting a prior unknown-outcome CREATE.
    if (!/^[a-f0-9]{64}$/.test(text(fingerprint))) return null;
    var parsed;
    try { parsed=JSON.parse(localStorage.getItem(createStorageKey(fingerprint)) || 'null'); }
    catch(e) { parsed=null; }
    if (!parsed) {
      try { parsed=JSON.parse(sessionStorage.getItem(createStorageKey(fingerprint)) || 'null'); }
      catch(e) { parsed=null; }
    }
    if (parsed && parsed.fingerprint===fingerprint &&
        /^cld1_\d{13}_[A-Za-z0-9_-]{16,80}$/.test(text(parsed.cloudKey))) return parsed;
    return null;
  }

  function rememberPendingCreate(fingerprint, cloudKey) {
    var value=JSON.stringify({fingerprint:fingerprint,cloudKey:cloudKey,createdAt:Date.now()});
    try { localStorage.setItem(createStorageKey(fingerprint),value); } catch(e) {
      try { sessionStorage.setItem(createStorageKey(fingerprint),value); } catch(_) {}
    }
    var stored=readPendingCreate(fingerprint);
    return !!stored && text(stored.cloudKey)===cloudKey;
  }

  async function migrateLegacyPendingCreate(fingerprint, username) {
    // Read the old tab-only attempt without extending its plaintext storage.
    // A deploy must not lose an unknown-outcome request merely because its
    // pre-SHA256 fingerprint or the former 20-minute timeout has changed.
    try {
      var old=JSON.parse(sessionStorage.getItem(T12_PENDING_CREATE_STORAGE_KEY)||'null');
      if (!old || !/^cld1_\d{13}_[A-Za-z0-9_-]{16,80}$/.test(text(old.cloudKey))) return null;
      var fields=JSON.parse(old.fingerprint);
      if (!Array.isArray(fields)||fields.length!==13||fields.some(function(x){return typeof x!=='string';})) return null;
      var material=JSON.stringify([text(username)].concat(fields));
      var digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(material));
      var hash=Array.from(new Uint8Array(digest),function(b){return b.toString(16).padStart(2,'0');}).join('');
      return hash===fingerprint?{fingerprint:fingerprint,cloudKey:text(old.cloudKey),legacy:true}:null;
    } catch(e) { return null; }
  }

  function clearPendingCreate(fingerprint) {
    // Remove only the resolved intent. Other unresolved offline orders survive.
    if (!/^[a-f0-9]{64}$/.test(text(fingerprint))) return;
    var resolved=readPendingCreate(fingerprint);
    try { localStorage.removeItem(createStorageKey(fingerprint)); } catch(e) {}
    try { sessionStorage.removeItem(createStorageKey(fingerprint)); } catch(e) {}
    try {
      var old=JSON.parse(sessionStorage.getItem(T12_PENDING_CREATE_STORAGE_KEY)||'null');
      if (resolved&&old&&text(old.cloudKey)===text(resolved.cloudKey)) sessionStorage.removeItem(T12_PENDING_CREATE_STORAGE_KEY);
    } catch(e) {}
  }

  function safeT12CreatePayload(params, cloudKey) {
    var p = params || {};
    return {
      clientRequestId: cloudKey,
      customerMode: text(p.customerMode),
      externalCustomerId: text(p.customerExternalId || p.externalCustomerId),
      customerName: text(p.customerName),
      customerPhone: text(p.customerPhone),
      department: text(p.department),
      heatPress: text(p.heatPress),
      flyPrint: text(p.flyPrint),
      itemName: text(p.itemName) || ('أوردر جديد - ' + (text(p.department) || 'عام')),
      qty: p.qty == null ? 1 : p.qty,
      priority: text(p.priority),
      status: text(p.status) || 'طلب جديد',
      source: text(p.source),
      notes: text(p.notes)
    };
  }

  async function t12GeneralCreateHealth() {
    var response = await fetch(edgeBase() + T12_GENERAL_CREATE_HEALTH_PATH, {
      method: 'GET', cache: 'no-store', credentials: 'omit',
      headers: { 'accept': 'application/json' }
    });
    return jsonResponse(response);
  }

  async function t12JsonAnyStatus(response) {
    var body = {};
    try { body = await response.json(); }
    catch (e) {
      body = {
        success: false,
        code: 'T12_NON_JSON_RESPONSE',
        message: 'رد Cloud غير صالح (HTTP ' + String(response && response.status || '') + ').'
      };
    }
    if (body && typeof body === 'object') {
      body.httpStatus = Number(response && response.status || 0);
      return body;
    }
    return {
      success: false,
      code: 'T12_INVALID_RESPONSE_BODY',
      message: 'رد Cloud غير متوقع.',
      httpStatus: Number(response && response.status || 0)
    };
  }

  function createFailureMessage(body) {
    var reason = text(body && (body.message || body.reason || body.code));
    var errors = body && Array.isArray(body.errors) ? body.errors.map(text).filter(Boolean) : [];
    var labels = {
      'registered-customer-name-required': 'اسم العميل المسجل مطلوب.',
      'registered-customer-phone-required': 'رقم العميل المسجل مطلوب أو لازم تختاره من نتائج البحث.',
      'external-customer-id-min-3-digits': 'للعميل الخارجي اكتب 3 أرقام على الأقل.',
      'supported-department-required': 'اختر قسم صحيح: طباعة أو ليزر أو متعدد الأقسام.',
      'fly-print-requires-print-department': 'طباعة على الطاير متاحة لقسم الطباعة فقط.',
      'item-name-required': 'اسم البند مطلوب.',
      'positive-qty-required': 'الكمية لازم تكون أكبر من صفر.',
      'initial-status-must-be-new': 'الأوردر الجديد لازم يبدأ بحالة طلب جديد.',
      'supported-priority-required': 'الأولوية غير مدعومة.'
    };
    if (reason === 'canonical-business-intent-invalid' && errors.length) {
      return errors.map(function (e) { return labels[e] || e; }).join(' | ');
    }
    if (reason === 'general-create-off') return 'تسجيل الأوردرات الجديدة على Cloud غير مُفعّل بعد.';
    if (reason === 'registered-customer-phone-required') return 'العميل المسجل لازم يكون له رقم هاتف قبل فتح الأوردر.';
    if (reason === 'general-create-canary-not-armed') return 'اختبار إنشاء الأوردر غير مسلح حاليًا.';
    if (reason === 'customer-department-open-order-exists') {
      var blocks = body && Array.isArray(body.blockedDepartments) ? body.blockedDepartments : [];
      return 'لا يمكن إضافة أوردر جديد: العميل لديه أوردر مفتوح في ' +
        blocks.map(function(b){ return text(b.department) + ' رقم ' + text(b.orderId); }).join('، ') +
        '. يمكن إضافة قسم آخر غير مشغول فقط.';
    }
    if (reason === 'duplicate-order-window-active') {
      var existingOrderId = text(body && body.existingOrderId);
      var retrySeconds = Math.max(1, Math.ceil(Number(body && body.retryAfterMs || 0) / 1000));
      return existingOrderId
        ? ('تم منع إنشاء أوردر مكرر. الأوردر الموجود رقم ' + existingOrderId + '. لو تقصد أوردر جديد بنفس البيانات، انتظر حوالي ' + retrySeconds + ' ثانية ثم أعد المحاولة.')
        : ('تم منع إنشاء أوردر مكرر. لو تقصد أوردر جديد بنفس البيانات، انتظر حوالي ' + retrySeconds + ' ثانية ثم أعد المحاولة.');
    }
    if (/unknown|not-verified|unavailable/i.test(reason)) return 'نتيجة تسجيل الأوردر غير مؤكدة. لا تعيد الإرسال تلقائيًا؛ اضغط مرة أخرى بنفس البيانات ليتم التحقق بنفس المفتاح.';
    return reason || 'تعذر تسجيل الأوردر الجديد على Cloud.';
  }

  function normalizeCustomerLookupName(value) {
    return text(value).toLowerCase()
      .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
  }

  async function resolveRegisteredCustomerForCloud(context, original, params) {
    var p = Object.assign({}, params || {});
    var mode = text(p.customerMode).toLowerCase();
    var registered = !mode.includes('خارجي') && !mode.includes('عابر') && mode !== 'external' && mode !== 'transient';
    if (!registered || text(p.customerPhone)) return { success: true, params: p };

    var name = text(p.customerName);
    if (!name) return { success: false, message: 'اسم العميل المسجل مطلوب.' };

    var searchParams = {
      q: name,
      username: p.username,
      token: p.token
    };
    var result;
    try {
      result = await edgeCustomerSearch(searchParams);
    } catch (e) {
      return { success: false, message: 'تعذر التحقق من بيانات العميل على Cloud. لم يتم الرجوع إلى Google.' };
    }

    var customers = result && result.success && Array.isArray(result.customers) ? result.customers : [];
    var key = normalizeCustomerLookupName(name);
    var exact = customers.filter(function (x) {
      return normalizeCustomerLookupName(x && x.name) === key && text(x && x.phone);
    });
    if (exact.length !== 1) {
      return { success: false, message: 'اختار العميل المسجل من قائمة البحث عشان رقم الهاتف يتحدد قبل فتح الأوردر.' };
    }
    p.customerName = text(exact[0].name) || name;
    p.customerPhone = text(exact[0].phone);
    if (!text(p.customerType) && text(exact[0].type)) p.customerType = text(exact[0].type);
    return { success: true, params: p };
  }

  async function t12CreateManualOrder(params) {
    var health = await t12GeneralCreateHealth();
    if (!health || health.success !== true || health.schemaReady !== true) {
      return { success: false, code: 'T12_GENERAL_CREATE_UNAVAILABLE', message: 'مسار تسجيل الأوردرات الجديد غير جاهز. لم يتم الإرسال إلى Apps Script.' };
    }
    if (text(health.mode) === 'OFF') {
      return { success: false, code: 'T12_GENERAL_CREATE_OFF', message: 'تسجيل الأوردرات الجديدة على Cloud غير مُفعّل بعد. لم يتم الإرسال إلى Apps Script.' };
    }

    var fingerprint;
    try { fingerprint = await t12CreateFingerprint(params || {}); }
    catch { return {success:false,code:'T12_FINGERPRINT_UNAVAILABLE',message:'تعذر حماية مفتاح تسجيل الأوردر. لم يتم إرسال الطلب.'}; }
    var pending = readPendingCreate(fingerprint);
    if (!pending) pending=await migrateLegacyPendingCreate(fingerprint,params&&params.username);
    var cloudKey = pending && pending.fingerprint === fingerprint
      ? text(pending.cloudKey)
      : cloudCreateKeyFromLegacy(params && params.clientRequestId);
    if (!cloudKey) {
      return { success: false, code: 'T12_CLOUD_KEY_REQUIRED', message: 'تعذر إنشاء مفتاح آمن للأوردر. لم يتم الإرسال.' };
    }
    if (!rememberPendingCreate(fingerprint, cloudKey)) {
      return {success:false,code:'T12_PENDING_CREATE_STORAGE_UNAVAILABLE',
        message:'تعذر حفظ محاولة التسجيل على هذا الجهاز. لم يتم إرسال الأوردر؛ اسمح بتخزين بيانات الموقع ثم أعد المحاولة.'};
    }
    if (pending&&pending.legacy) {
      try { sessionStorage.removeItem(T12_PENDING_CREATE_STORAGE_KEY); } catch(e) {}
    }

    var payload = safeT12CreatePayload(params || {}, cloudKey);
    var token = await ensureSession();
    var headers = {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': 'Bearer ' + token
    };
    if (text(health.mode) === 'CANARY') {
      headers['x-t12-general-canary-confirm'] = String(Number(health.nextOrderNumber || 0));
    }

    var response;
    try {
      response = await fetch(edgeBase() + T12_GENERAL_CREATE_PATH, {
        method: 'POST', cache: 'no-store', credentials: 'omit',
        headers: headers,
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      return {
        success: false,
        code: 'T12_CREATE_NETWORK_AMBIGUOUS_NO_RETRY',
        message: 'الاتصال انقطع أثناء تسجيل الأوردر. نفس البيانات ستستخدم نفس المفتاح عند المحاولة التالية للتحقق بدون تكرار.',
        retryAutomatically: false
      };
    }

    if (response.status === 401) {
      // A 401 is pre-mutation, so one token refresh is safe.
      clearSession();
      token = await ensureSession();
      headers['authorization'] = 'Bearer ' + token;
      response = await fetch(edgeBase() + T12_GENERAL_CREATE_PATH, {
        method: 'POST', cache: 'no-store', credentials: 'omit',
        headers: headers,
        body: JSON.stringify(payload)
      });
    }

    var body = await t12JsonAnyStatus(response);
    if (body && body.success === true) {
      clearPendingCreate(fingerprint);
      return body;
    }

    var reason = text(body && (body.reason || body.code));
    // Keep unknown-outcome keys. Only a definite business rejection can release it.
    if (['customer-department-open-order-exists','duplicate-order-window-active',
      'canonical-business-intent-invalid',
      'same-key-actor-payload-or-policy-conflict'].includes(reason)) clearPendingCreate(fingerprint);
    if (body && !body.message) body.message = createFailureMessage(body);
    return body || { success: false, code: 'T12_CREATE_FAILED', message: 'تعذر تسجيل الأوردر الجديد على Cloud.' };
  }

  function mergeHybridFallback(appsResult, overlayBody, params) {
    var base = appsResult && typeof appsResult === 'object' ? Object.assign({}, appsResult) : { success: true };
    var legacyRows = Array.isArray(base.rows) ? base.rows.slice() : [];
    var cloudRows = overlayBody && Array.isArray(overlayBody.rows) ? overlayBody.rows.slice() : [];
    if (!cloudRows.length) {
      base.hybridOverlay = { enabled: true, cloudNativeRows: 0, merged: false };
      return base;
    }

    var seen = new Set();
    var merged = [];
    cloudRows.concat(legacyRows).forEach(function (row) {
      var key = rowIdentity(row);
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      merged.push(row);
    });
    base.rows = merged;
    if (base.pagination && typeof base.pagination === 'object') {
      var pg = Object.assign({}, base.pagination);
      var added = Math.max(0, merged.length - legacyRows.length);
      var total = Number(pg.totalRows || 0);
      if (Number.isFinite(total)) pg.totalRows = total + added;
      base.pagination = pg;
    }
    base.dataSource = 'apps-script+t12-native';
    base.hybridOverlay = {
      enabled: true,
      cloudNativeRows: cloudRows.length,
      mergedRows: merged.length,
      control: overlayBody.control || null,
      readOnly: true
    };
    return base;
  }

  async function employeeLegacyFallback(context, original, action, params, args) {
    if (
      window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 === true &&
      typeof window.trendosEmployeeLegacyFallbackV1 === 'function'
    ) {
      return window.trendosEmployeeLegacyFallbackV1(
        action,
        params || {},
        function () { return original.apply(context, args); }
      );
    }
    return original.apply(context, args);
  }

  function ordersUnavailable(reason) {
    return { success: false, code: 'ORDERS_CLOUD_UNAVAILABLE', reason: reason,
      message: 'تعذر تحميل الأوردرات من Cloud بسبب عدم جاهزية البيانات أو الاتصال. الجلسة محفوظة؛ أعد المحاولة لاحقًا.',
      dataSource: 'cloud-unavailable', retryable: true };
  }

  function canaryUserAllowed() {
  if (window.MATBAGY_EDGE_ORDERS_CANARY_ONLY !== true) return true;
  var user = currentUser();
  var username = text(user && user.username).toLowerCase();
  var allowed = Array.isArray(window.MATBAGY_EDGE_ORDERS_CANARY_USERS)
    ? window.MATBAGY_EDGE_ORDERS_CANARY_USERS.map(function (value) { return text(value).toLowerCase(); })
    : [];
  return !!username && allowed.indexOf(username) >= 0;
}

function edgeScreenAllowed(params) {
  var allowed = Array.isArray(window.MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS)
    ? window.MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS.map(function (value) { return text(value).toLowerCase(); })
    : [];
  if (!allowed.length) return true;
  return allowed.indexOf(text(params && params.screen).toLowerCase()) >= 0;
}

function eligible(action, params) {
  if (action !== 'getRowsPageV1931') return false;
  if (text(params && params.statusFilter) === '__DEBT__') return false;
  if (!edgeScreenAllowed(params)) return false;
  if (window.MATBAGY_EDGE_ORDERS_CANARY_ONLY === true && !canaryUserAllowed()) return false;
  return true;
}

  function install() {
    if (window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED !== true) return false;
    var original = window.trendosSecureApiV1922;
    if (typeof original !== 'function') return false;
    if (original.__trendosEdgeOrdersReadV1) return true;

    async function wrapped(action, params) {
      var args = arguments;

      // A56 customer authority: search and create/update are Cloud-only.
      // No browser fallback to Apps Script/Google is allowed for customer actions.
      if (action === 'searchCustomers') {
        var customerQuery = text(params && params.q);
        if (!customerQuery) return { success: true, customers: [], dataSource: 't12-customer-master' };
        try {
          var customerResult = await edgeCustomerSearch(params || {});
          metrics.customerEdgeSuccess += 1;
          return customerResult;
        } catch (customerErr) {
          metrics.customerFallbacks += 1;
          return {
            success: false,
            customers: [],
            code: 'CUSTOMER_CLOUD_SEARCH_UNAVAILABLE',
            message: 'تعذر البحث عن العملاء على Cloud. لم يتم الرجوع إلى Google.'
          };
        }
      }

      if (action === 'createCustomer') {
        try {
          return await edgeCustomerWrite(params || {});
        } catch (customerWriteErr) {
          return {
            success: false,
            code: 'CUSTOMER_CLOUD_WRITE_UNAVAILABLE',
            message: 'تعذر حفظ العميل على Cloud. لم يتم الإرسال إلى Google.'
          };
        }
      }

      // New Order IDs are Cloud-native from 4322 onward. Never fall back to
      // Apps Script CREATE because its legacy allocator may collide with Cloud IDs.
      if (action === 'createManualOrder') {
        var resolved = await resolveRegisteredCustomerForCloud(this, original, params || {});
        if (!resolved.success) return { success: false, code: 'T12_REGISTERED_CUSTOMER_RESOLUTION_REQUIRED', message: resolved.message };
        return t12CreateManualOrder(resolved.params || {});
      }

      // Cloud-native rows and legacy mirror rows have separate D1 runtime tables.
      // Once the legacy runtime flag is armed, updateLine no longer depends on
      // Apps Script/Google identity lookup for rows that have a stable lineId.
      if (action === 'updateLine') {
        if (!canaryUserAllowed()) return original.apply(this, args);
        var safeParams = identitySafeUpdateLineParams(params || {});
        var requestedLineId = text(safeParams && safeParams.lineId);
        if (requestedLineId && cloudNativeLineIds.has(requestedLineId)) {
          return t12RuntimePost(T12_RUNTIME_UPDATE_PATH, {
            orderId: text(safeParams && safeParams.orderId),
            lineId: requestedLineId,
            status: text(safeParams && safeParams.status),
            notes: text(safeParams && safeParams.notes)
          });
        }
        if (requestedLineId && window.MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED === true) {
          var legacyWrite = await t12RuntimePost(T12_LEGACY_RUNTIME_UPDATE_PATH, {
            orderId: text(safeParams && safeParams.orderId),
            lineId: requestedLineId,
            status: text(safeParams && safeParams.status),
            notes: text(safeParams && safeParams.notes)
          });
          if (legacyWrite && legacyWrite.success === true) {
            metrics.legacyRuntimeWrites += 1;
            openPostWriteBarrier(safeParams);
          }
          return legacyWrite;
        }
        var writeResult = await employeeLegacyFallback(
          this,
          original,
          action,
          safeParams,
          [action, safeParams]
        );
        if (writeResult && writeResult.success === true) openPostWriteBarrier(safeParams);
        return writeResult;
      }

      if (action === 'markCustomerNotified') {
        var notifyLineId = text(params && params.lineId);
        if (notifyLineId && cloudNativeLineIds.has(notifyLineId)) {
          return t12RuntimePost(T12_RUNTIME_NOTIFY_PATH, {
            orderId: text(params && params.orderId),
            lineId: notifyLineId,
            whatsappType: text(params && params.whatsappType),
            message: text(params && params.message)
          });
        }
        return employeeLegacyFallback(this, original, action, params || {}, args);
      }

      if (!eligible(action, params || {})) return original.apply(this, args);

      if (postWriteBarrierActive()) {
        try {
          var recovered = await recoverPostWriteBarrier(params || {});
          if (recovered) {
            metrics.edgeSuccess += 1;
            recovered.dashboard = recovered.dashboard || null;
            return recovered;
          }
        } catch (barrierErr) {
          try {
            console.warn('[TrendOS Orders Edge] post-write D1 readback not ready:', barrierErr && barrierErr.message ? barrierErr.message : barrierErr);
          } catch (ignoreBarrierWarn) {}
        }
        metrics.fallbacks += 1;
        metrics.postWriteFallbacks += 1;
        metrics.lastFallbackAt = Date.now();
        metrics.lastFallbackReason = 'EDGE_POST_WRITE_READ_BARRIER';
        return ordersUnavailable(metrics.lastFallbackReason);
      }

      if (staleFallbackActive()) {
        metrics.fallbacks += 1;
        metrics.staleCooldownBypasses += 1;
        metrics.lastFallbackAt = Date.now();
        metrics.lastFallbackReason = 'EDGE_MIRROR_STALE_COOLDOWN';
        return ordersUnavailable(metrics.lastFallbackReason);
      }

      try {
        var result = await edgePage(params || {});
        metrics.edgeSuccess += 1;
        result.dashboard = result.dashboard || null;
        return result;
      } catch (err) {
        metrics.fallbacks += 1;
        metrics.lastFallbackAt = Date.now();
        metrics.lastFallbackReason = text(err && (err.code || err.message));
        if (isKnownMirrorStaleError(err)) {
          metrics.staleFallbacks += 1;
          openStaleFallbackCooldown();
        }
        try {
          console.warn('[TrendOS Orders Edge 02CX] D1 read unavailable/freshness failed; failing closed:', err && err.message ? err.message : err);
        } catch (ignore) {}
        return ordersUnavailable(metrics.lastFallbackReason);
      }
    }

    wrapped.__trendosEdgeOrdersReadV1 = true;
    wrapped.__trendosOriginalSecureApi = original;
    window.trendosSecureApiV1922 = wrapped;
    window.TrendOSEdgeOrdersReadV1 = {
      version: VERSION,
      enabled: true,
      mode: 't12-02cr-cloud-only-fail-closed',
      customerSearchPath: CUSTOMER_SEARCH_PATH,
      customerWritePath: CUSTOMER_WRITE_PATH,
      customerAuthority: 'cloud-only',
      legacyLineRuntimeEnabled: window.MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED === true,
      legacyLineRuntimeUpdatePath: T12_LEGACY_RUNTIME_UPDATE_PATH,
      serviceUsesQualified02CR: true,
      canaryOnly: window.MATBAGY_EDGE_ORDERS_CANARY_ONLY === true,
      canaryUsers: Array.isArray(window.MATBAGY_EDGE_ORDERS_CANARY_USERS) ? window.MATBAGY_EDGE_ORDERS_CANARY_USERS.slice() : [],
      api: edgeBase(),
      pagePath: QUALIFIED_PAGE_PATH,
      maxMirrorAgeMs: maxMirrorAgeMs(),
      postWriteBarrierMs: postWriteBarrierMs(),
      staleFallbackCooldownMs: staleFallbackCooldownMs(),
      clearSession: clearSession,
      clearPostWriteBarrier: clearPostWriteBarrier,
      repairSerializedLineId: repairSerializedLineId,
      stats: function () {
        return {
          inflight: inflight.size,
          sessionExpiresAt: session.expiresAt || 0,
          edgeSuccess: metrics.edgeSuccess,
          fallbacks: metrics.fallbacks,
          staleFallbacks: metrics.staleFallbacks,
          staleCooldownBypasses: metrics.staleCooldownBypasses,
          staleFallbackActive: staleFallbackActive(),
          staleFallbackUntil: staleFallbackUntil || 0,
          logicalFreshnessAccepted: metrics.logicalFreshnessAccepted,
          postWriteFallbacks: metrics.postWriteFallbacks,
          rowNumberStrippedWrites: metrics.rowNumberStrippedWrites,
          postWriteBarriersOpened: metrics.postWriteBarriersOpened,
          postWriteBarrierRecoveries: metrics.postWriteBarrierRecoveries,
          lineIdRepairs: metrics.lineIdRepairs,
          writeIdentityRepairs: metrics.writeIdentityRepairs,
          legacyRuntimeWrites: metrics.legacyRuntimeWrites,
          hybridOverlaySuccess: metrics.hybridOverlaySuccess,
          hybridOverlayFailures: metrics.hybridOverlayFailures,
          hybridOverlayRows: metrics.hybridOverlayRows,
          customerEdgeSuccess: metrics.customerEdgeSuccess,
          customerFallbacks: metrics.customerFallbacks,
          customerMissFallbacks: metrics.customerMissFallbacks,
          cloudNativeLineIds: cloudNativeLineIds.size,
          postWriteBarrierActive: postWriteBarrierActive(),
          postWriteBarrierUntil: postWriteBarrier.until || 0,
          postWriteOrderId: postWriteBarrier.orderId,
          postWriteLineId: postWriteBarrier.lineId,
          lastFallbackAt: metrics.lastFallbackAt,
          lastFallbackReason: metrics.lastFallbackReason
        };
      }
    };
    return true;
  }

  restorePostWriteBarrier();

  window.TrendOSEdgeOrdersReadV1Loader = {
    version: VERSION,
    enabled: window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED === true,
    pagePath: QUALIFIED_PAGE_PATH,
    maxMirrorAgeMs: maxMirrorAgeMs(),
    postWriteBarrierMs: postWriteBarrierMs(),
    staleFallbackCooldownMs: staleFallbackCooldownMs(),
    install: install,
    clearSession: clearSession,
    clearPostWriteBarrier: clearPostWriteBarrier,
    repairSerializedLineId: repairSerializedLineId
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
