(function () {
  'use strict';

  if (window.__TRENDOS_OPERATOR_TASK_READONLY_CANARY_V1__) return;
  window.__TRENDOS_OPERATOR_TASK_READONLY_CANARY_V1__ = true;
  if (window.MATBAGY_OPERATOR_TASK_READONLY_CANARY_V1 !== true) return;

  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var SESSION_PATH = '/v1/edge/session';
  var STATUS_PATH = '/v1/operator/tasks/status';
  var POLL_MS = 1000;
  var edgeSession = { token: '', expiresAt: 0 };
  var currentUserKey = '';
  var busy = false;
  var root = null;

  function text(v) { return String(v == null ? '' : v).trim(); }
  function norm(v) {
    return text(v).toLowerCase()
      .replace(/[إأآا]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ةه]/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function state() { return window.trendosState || window.state || {}; }
  function liveUser() { return state().user || null; }
  function employeeSession() {
    var u = liveUser() || {};
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('trendos_session') || '{}').user || {}; } catch (e) {}
    return {
      username: text(u.username || u.name || saved.username || saved.name || sessionStorage.getItem('matbagy_username') || sessionStorage.getItem('matbagy_user_name')),
      token: text(u.token || saved.token || window.sessionToken || sessionStorage.getItem('matbagy_session_token'))
    };
  }
  function edgeBase() {
    return text(window.MATBAGY_OPERATOR_TASK_EDGE_API_URL || window.MATBAGY_EDGE_ORDERS_API_URL || window.MATBAGY_EDGE_API_URL || DEFAULT_EDGE_API).replace(/\/+$/, '');
  }
  function allowedUsers() {
    var configured = window.MATBAGY_OPERATOR_TASK_READONLY_CANARY_USERS;
    if (!Array.isArray(configured)) return [];
    return configured.map(norm).filter(Boolean);
  }
  function allowed(username) {
    var key = norm(username);
    return !!key && allowedUsers().indexOf(key) !== -1;
  }
  function expectedRole(username) {
    var key = norm(username);
    if (key === norm('وائل')) return 'WAEL';
    if (key === norm('جابر')) return 'GABER';
    return '';
  }
  function clearEdgeSession() {
    edgeSession.token = '';
    edgeSession.expiresAt = 0;
  }
  function removeRoot() {
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }
  function ensureRoot() {
    if (root && root.isConnected) return root;
    var anchor = document.getElementById('currentOrderBar') || document.getElementById('ordersTable') || document.getElementById('mainView');
    if (!anchor || !anchor.parentNode) return null;
    root = document.createElement('section');
    root.id = 'trendOperatorTaskReadonlyCanaryV1';
    root.style.cssText = 'direction:rtl;margin:12px 0;padding:14px;border:1px solid #c9d8e6;border-radius:14px;background:#f8fbfd;font-family:Tahoma,Arial,sans-serif;color:#153047';
    anchor.parentNode.insertBefore(root, anchor);
    root.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-ot-ro-refresh]') : null;
      if (!button) return;
      event.preventDefault();
      refreshStatus();
    });
    return root;
  }
  function renderMessage(title, body, isError) {
    var box = ensureRoot();
    if (!box) return;
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">' +
      '<div><b style="font-size:17px">Operator Task V2 — تجربة قراءة فقط</b>' +
      '<div style="font-size:12px;color:#607386;margin-top:4px">لا يبدأ ولا يقفل أي تاسك. لا توجد أوامر claim/complete في هذا الـcanary.</div></div>' +
      '<button type="button" data-ot-ro-refresh style="border:0;border-radius:9px;padding:8px 12px;background:#e8eef3;color:#153047;font-weight:700;cursor:pointer">تحديث الحالة</button></div>' +
      '<div style="margin-top:10px;padding:10px;border-radius:10px;background:' + (isError ? '#fff0f0' : '#eef8f4') + '"><b>' + escapeHtml(title) + '</b><div style="font-size:12px;margin-top:4px">' + escapeHtml(body) + '</div></div>';
  }
  function escapeHtml(v) {
    return text(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  async function jsonFetch(url, options) {
    var response = await fetch(url, options || {});
    var raw = await response.text();
    var body = {};
    try { body = JSON.parse(raw || '{}'); } catch (e) {}
    return { response: response, body: body };
  }
  async function exchangeEdgeSession() {
    var current = employeeSession();
    if (!current.username || !current.token) throw new Error('جلسة الموظف غير متاحة لإنشاء Edge session.');
    var result = await jsonFetch(edgeBase() + SESSION_PATH, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ username: current.username, token: current.token })
    });
    if (result.response.status !== 200 || !result.body || result.body.success !== true || !result.body.edgeToken) {
      throw new Error(result.body && result.body.message ? result.body.message : 'تعذر إنشاء Edge session.');
    }
    edgeSession.token = text(result.body.edgeToken);
    edgeSession.expiresAt = Date.parse(result.body.expiresAt || '') || (Date.now() + Math.max(60000, Number(result.body.expiresIn || 600) * 1000));
    return edgeSession.token;
  }
  async function ensureEdgeSession() {
    if (edgeSession.token && edgeSession.expiresAt - 30000 > Date.now()) return edgeSession.token;
    return exchangeEdgeSession();
  }
  async function fetchStatus(retry) {
    var token = await ensureEdgeSession();
    var result = await jsonFetch(edgeBase() + STATUS_PATH, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      headers: { accept: 'application/json', authorization: 'Bearer ' + token }
    });
    if (result.response.status === 401 && retry !== false) {
      clearEdgeSession();
      return fetchStatus(false);
    }
    if (result.response.status !== 200 || !result.body || result.body.success !== true) {
      throw new Error(result.body && result.body.message ? result.body.message : 'تعذر قراءة Operator Task status.');
    }
    return result.body;
  }
  function safeSummary(body, username) {
    var role = text(body && body.role);
    var expected = expectedRole(username);
    if (!expected || role !== expected) throw new Error('Operator Task role لا يطابق مستخدم الـcanary.');
    if (body && body.materialControlEnabled === true) throw new Error('Material Control ظهر مفعّلًا بشكل غير متوقع.');
    return {
      role: role,
      hasActiveTask: !!(body && body.task),
      availableCount: Number(body && body.availableCount || 0),
      exceptionCount: Number(body && body.exceptionCount || 0),
      materialControlEnabled: false
    };
  }
  async function refreshStatus() {
    if (busy) return;
    var current = employeeSession();
    if (!allowed(current.username)) return;
    busy = true;
    renderMessage('جاري قراءة الحالة…', 'GET status فقط.', false);
    try {
      var body = await fetchStatus(true);
      var s = safeSummary(body, current.username);
      renderMessage('الحالة متصلة وآمنة', 'الدور: ' + s.role + ' — تاسك نشط: ' + (s.hasActiveTask ? 'نعم' : 'لا') + ' — المتاح: ' + s.availableCount + ' — الاستثناءات: ' + s.exceptionCount + ' — Material Control: OFF', false);
    } catch (error) {
      renderMessage('تعذر قراءة الحالة', text(error && error.message || error), true);
    } finally {
      busy = false;
    }
  }
  function tick() {
    var current = employeeSession();
    var key = norm(current.username);
    if (!allowed(current.username)) {
      if (currentUserKey) {
        currentUserKey = '';
        clearEdgeSession();
        removeRoot();
      }
      return;
    }
    if (key !== currentUserKey) {
      currentUserKey = key;
      clearEdgeSession();
      refreshStatus();
    }
  }

  window.setInterval(tick, POLL_MS);
  tick();
})();
