/* TrendOS T12 A61 Employee API Dispatcher V1
 * Default-OFF frontend routing foundation.
 * When native employee auth is disabled, behavior is unchanged.
 * When enabled:
 * - employee auth control-plane -> Cloudflare/D1 native auth routes;
 * - approved temporary employee legacy actions -> Cloudflare legacy bridge;
 * - customer-session actions remain on their existing authority;
 * - Cloud-native/hybrid customer/order actions remain on the Edge router;
 * - unapproved employee actions fail closed.
 */
(function () {
  'use strict';

  var VERSION = 'T12_A61_EMPLOYEE_API_DISPATCHER_V1_20260929';
  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';

  var AUTH_PATHS = {
    login: '/v1/employee/auth/login',
    logout: '/v1/employee/auth/logout',
    verifyEmployeeSession: '/v1/employee/auth/session',
    changePassword: '/v1/employee/auth/password/change'
  };

  var BRIDGE_PATH = '/v1/employee/legacy-action';

  var CUSTOMER_SESSION_ACTIONS = new Set([
    'customerLogin',
    'customerLogout',
    'changeCustomerPassword',
    'getCustomerOrders',
    'getCustomerPortalAccountsV1859',
    'createCustomerDraft',
    'addCustomerDraftItem',
    'submitCustomerDraft',
    'uploadCustomerDraftFile'
  ]);

  var CLOUD_EDGE_ACTIONS = new Set([
    'searchCustomers',
    'createCustomer',
    'createManualOrder',
    'getRowsPageV1931',
    'updateLine',
    'markCustomerNotified'
  ]);

  var OP_SCOPED_ACTIONS = new Set([
    'attendanceV1',
    'attendanceClockinV1',
    'cleaningV1',
    'customerFeedbackV1',
    'customerManagerV1',
    'goLiveAutopilotV1',
    'hrV1',
    'pressControlV1'
  ]);

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function nativeEnabled() {
    return window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 === true;
  }

  function bridgeEnabled() {
    return window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 === true;
  }

  function edgeBase() {
    return text(
      window.MATBAGY_EMPLOYEE_API_URL ||
      window.MATBAGY_EDGE_ORDERS_API_URL ||
      DEFAULT_EDGE_API
    ).replace(/\/+$/, '');
  }

  function configuredPolicies() {
    return new Set(
      (Array.isArray(window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES)
        ? window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES
        : []
      ).map(text).filter(Boolean)
    );
  }

  function policyKey(action, params) {
    action = text(action);
    if (OP_SCOPED_ACTIONS.has(action)) {
      var op = text(params && params.op);
      return op ? action + ':' + op : '';
    }
    return action;
  }

  function policyAllowed(action, params) {
    var key = policyKey(action, params || {});
    return !!key && configuredPolicies().has(key);
  }

  function routeError(code, message, detail) {
    var err = new Error(message);
    err.code = code;
    if (detail) err.detail = detail;
    return err;
  }

  async function readJson(response) {
    var raw = await response.text();
    var body = {};
    try { body = JSON.parse(raw || '{}'); }
    catch (err) {
      throw routeError('EMPLOYEE_API_INVALID_JSON', 'رد Cloud Employee API غير صالح.');
    }
    if (!response.ok) {
      var e = routeError(
        body.code || 'EMPLOYEE_API_HTTP_' + response.status,
        body.message || 'فشل طلب Cloud Employee API (' + response.status + ').'
      );
      e.status = response.status;
      e.body = body;
      throw e;
    }
    return body;
  }

  async function cloudPost(path, body, bearerToken) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);
    var headers = {
      'accept': 'application/json',
      'content-type': 'application/json'
    };
    if (bearerToken) headers.authorization = 'Bearer ' + bearerToken;
    try {
      var response = await fetch(edgeBase() + path, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body || {}),
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });
      return await readJson(response);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw routeError('EMPLOYEE_API_TIMEOUT', 'انتهت مهلة الاتصال بـ Cloud Employee API.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function nativeAuth(action, params) {
    var path = AUTH_PATHS[action];
    if (!path) throw routeError('EMPLOYEE_AUTH_ACTION_UNKNOWN', 'إجراء مصادقة الموظف غير معروف.');
    var p = Object.assign({}, params || {});
    var token = text(p.token);
    return cloudPost(path, p, token);
  }

  async function legacyBridge(action, params) {
    if (!bridgeEnabled()) {
      throw routeError(
        'EMPLOYEE_LEGACY_BRIDGE_DISABLED',
        'جسر تشغيل وظائف الموظفين القديمة غير مفعل.'
      );
    }
    if (!policyAllowed(action, params || {})) {
      throw routeError(
        'EMPLOYEE_LEGACY_POLICY_DENIED',
        'الإجراء غير مصرح به في جسر الموظفين الانتقالي.',
        policyKey(action, params || {}) || text(action)
      );
    }

    var p = Object.assign({}, params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_NATIVE_SESSION_REQUIRED',
        'جلسة الموظف السحابية مطلوبة.'
      );
    }

    delete p.token;
    delete p.password;
    delete p.oldPassword;
    delete p.newPassword;
    delete p.confirmPassword;
    delete p.employeePassword;

    p.action = text(action);
    p.username = username;
    return cloudPost(BRIDGE_PATH, p, token);
  }

  function currentSecureApi() {
    return typeof window.trendosSecureApiV1922 === 'function'
      ? window.trendosSecureApiV1922
      : null;
  }

  function edgeRouterReady(fn) {
    return !!(fn && fn.__trendosEdgeOrdersReadV1);
  }

  async function dispatchNative(action, params, downstream, context, args) {
    action = text(action);
    params = params || {};

    if (Object.prototype.hasOwnProperty.call(AUTH_PATHS, action)) {
      return nativeAuth(action, params);
    }

    if (CUSTOMER_SESSION_ACTIONS.has(action)) {
      if (typeof downstream !== 'function') {
        throw routeError('CUSTOMER_AUTHORITY_UNAVAILABLE', 'مسار حساب العميل غير متاح.');
      }
      return downstream.apply(context, args || [action, params]);
    }

    if (CLOUD_EDGE_ACTIONS.has(action)) {
      if (!edgeRouterReady(downstream)) {
        throw routeError(
          'EMPLOYEE_CLOUD_ROUTER_NOT_READY',
          'مسار Cloud للأوردرات/العملاء لم يجهز بعد. أعد المحاولة.'
        );
      }
      return downstream.apply(context, args || [action, params]);
    }

    return legacyBridge(action, params);
  }

  function install() {
    var original = currentSecureApi();
    if (!original) return false;
    if (original.__trendosEmployeeApiDispatcherV1) return true;

    async function wrapped(action, params) {
      if (!nativeEnabled()) return original.apply(this, arguments);
      return dispatchNative(action, params || {}, original, this, arguments);
    }

    wrapped.__trendosEmployeeApiDispatcherV1 = true;
    wrapped.__trendosEmployeeApiDownstream = original;
    window.trendosSecureApiV1922 = wrapped;
    return true;
  }

  window.trendosEmployeeApiV1 = async function (action, params, legacyInvoker) {
    var actionText = text(action);
    var p = params || {};

    if (!nativeEnabled()) {
      if (typeof legacyInvoker === 'function') return legacyInvoker();
      var current = currentSecureApi();
      if (!current) throw routeError('EMPLOYEE_API_NOT_READY', 'Employee API غير جاهز.');
      return current(actionText, p);
    }

    if (Object.prototype.hasOwnProperty.call(AUTH_PATHS, actionText)) {
      return nativeAuth(actionText, p);
    }

    if (CUSTOMER_SESSION_ACTIONS.has(actionText)) {
      var customerApi = currentSecureApi();
      if (!customerApi) throw routeError('CUSTOMER_AUTHORITY_UNAVAILABLE', 'مسار حساب العميل غير متاح.');
      return customerApi(actionText, p);
    }

    if (CLOUD_EDGE_ACTIONS.has(actionText)) {
      var edgeApi = currentSecureApi();
      if (!edgeRouterReady(edgeApi)) {
        throw routeError('EMPLOYEE_CLOUD_ROUTER_NOT_READY', 'مسار Cloud للأوردرات/العملاء لم يجهز بعد.');
      }
      return edgeApi(actionText, p);
    }

    return legacyBridge(actionText, p);
  };

  window.trendosEmployeeLegacyFallbackV1 = async function (action, params, legacyInvoker) {
    if (!nativeEnabled()) {
      if (typeof legacyInvoker !== 'function') {
        throw routeError('LEGACY_EMPLOYEE_FALLBACK_MISSING', 'Legacy employee fallback غير متاح.');
      }
      return legacyInvoker();
    }
    return legacyBridge(action, params || {});
  };

  window.TrendOSEmployeeApiDispatcherV1 = {
    version: VERSION,
    nativeEnabled: nativeEnabled,
    bridgeEnabled: bridgeEnabled,
    policyKey: policyKey,
    policyAllowed: policyAllowed,
    install: install,
    edgeBase: edgeBase
  };

  if (!install()) {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (install() || attempts >= 80) clearInterval(timer);
    }, 125);
  }
})();
