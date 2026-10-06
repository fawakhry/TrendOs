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

  var VERSION = 'T12_ENTRY635_NATIVE_ONLY_BRIDGE_FREE_PREFLIGHT_V1_20261006';
  var DEFAULT_EDGE_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var AUTH_HEALTH_PATH = '/v1/employee/auth/health';
  var BRIDGE_HEALTH_PATH = '/v1/employee/legacy-action/health';
  var CANARY_PREFLIGHT_CACHE_MS = 30000;
  var canarySessionUserKey = '';
  var canaryPreflightCache = { key: '', at: 0 };
  var canaryPreflightPromise = null;

  var AUTH_PATHS = {
    login: '/v1/employee/auth/login',
    logout: '/v1/employee/auth/logout',
    verifyEmployeeSession: '/v1/employee/auth/session',
    changePassword: '/v1/employee/auth/password/change'
  };

  var BRIDGE_PATH = '/v1/employee/legacy-action';
  var OPS_PATH = '/v1/employee/ops';
  var ACCOUNTING_PATH = '/v1/employee/accounting';
  var CORE_PATH = '/v1/employee/core';
  var CONTENT_PATH = '/v1/employee/content';
  var COMMS_PATH = '/v1/employee/comms';

  var OPS_ACTIONS = new Set([
    'attendanceV1',
    'attendanceClockinV1',
    'hrV1',
    'cleaningV1',
    'pressControlV1'
  ]);

  var OPS_READ_ONLY_KEYS = new Set([
    'attendanceV1:state',
    'attendanceV1:config',
    'hrV1:myRequests',
    'hrV1:requests',
    'hrV1:employees',
    'cleaningV1:status',
    'pressControlV1:status'
  ]);

  // Entry619 begins Accounting as READONLY only. Do not route writes until
  // legacy action parity gaps (including init/recalculate) are closed.
  var ACCOUNTING_READ_ACTIONS = new Set([
    'getAccounting',
    'getDeptInvoiceDraftV1887',
    'getPartyAccountV1858'
  ]);

  // Entry628: first bridge-retirement family. Read-only only.
  var CORE_READ_ACTIONS = new Set([
    'getRows',
    'getDashboard',
    'getActivityLog',
    'getTrendMasterCenterV1931'
  ]);

  // Entry629: second bridge-retirement family. Read-only only.
  var CONTENT_READ_ACTIONS = new Set([
    'getPlatformSections',
    'getFranchiseBranches',
    'getServiceProviderRoutes',
    'getMarketplace',
    'getWhiteLabelSettings',
    'getLeadPhoneNumbers',
    'getPlatformAds',
    'getKnowledge',
    'getMatbagyNotes'
  ]);

  // Entry630: final business bridge-retirement family. Read-only only.
  var COMMS_READ_KEYS = new Set([
    'customerManagerV1:inbox',
    'customerManagerV1:thread',
    'getOrderConversation',
    'goLiveAutopilotV1:listDrafts'
  ]);

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

  function userKey(value) {
    return text(value).toLowerCase();
  }

  var NATIVE_USERNAME_CANONICAL = new Map([
    ['ضياء','ضياء'], ['diaa','ضياء'],
    ['وائل','وائل'], ['wael','وائل'],
    ['جابر','جابر'], ['gaber','جابر'], ['jaber','جابر'],
    ['رحمه','رحمه'], ['رحمة','رحمه'], ['rahma','رحمه'],
    ['ريفان','ريفان'], ['ريڤان','ريفان'], ['revan','ريفان'], ['rivan','ريفان']
  ]);

  function nativeCanonicalUsername(value) {
    var raw = text(value);
    var key = userKey(raw);
    return NATIVE_USERNAME_CANONICAL.get(key) || raw;
  }

  function canonicalizeNativeParams(params) {
    var p = Object.assign({}, params || {});
    var explicit = text(p.username || p.name);
    if (!explicit) return p;
    var canonical = nativeCanonicalUsername(explicit);
    p.username = canonical;
    if (Object.prototype.hasOwnProperty.call(p, 'name')) p.name = canonical;
    return p;
  }

  function canaryConfigEnabled() {
    return window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 === true;
  }

  function configuredCanaryUsers() {
    return new Set(
      (Array.isArray(window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS)
        ? window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS
        : []
      ).map(userKey).filter(Boolean)
    );
  }

  function canaryUserKey(params) {
    var explicit = userKey(params && (params.username || params.name));
    return explicit || canarySessionUserKey;
  }

  function canaryUserSelected(params) {
    if (!canaryConfigEnabled()) return false;
    var key = canaryUserKey(params || {});
    return !!key && configuredCanaryUsers().has(key);
  }

  function canaryRouteEnabled(params) {
    return !nativeEnabled() && canaryUserSelected(params || {});
  }

  function nativeRouteEnabled(params) {
    return nativeEnabled() || canaryUserSelected(params || {});
  }

  function rememberCanaryUser(params, body) {
    if (!canaryConfigEnabled()) return;
    var key = userKey(
      (body && body.user && (body.user.username || body.user.name)) ||
      (params && (params.username || params.name))
    );
    if (key && configuredCanaryUsers().has(key)) canarySessionUserKey = key;
  }

  function clearCanaryUser(params) {
    var explicit = userKey(params && (params.username || params.name));
    if (!explicit || explicit === canarySessionUserKey) canarySessionUserKey = '';
  }

  function bridgeEnabled() {
    return window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 === true;
  }

  function employeeOpsMode() {
    var mode = text(window.MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE || 'OFF').toUpperCase();
    return mode === 'READONLY' || mode === 'GENERAL' ? mode : 'OFF';
  }

  function opsPolicyKey(action, params) {
    return text(action) + ':' + text(params && params.op);
  }

  function shouldRouteOpsNative(action, params) {
    action = text(action);
    if (!OPS_ACTIONS.has(action)) return false;
    var mode = employeeOpsMode();
    if (mode === 'OFF') return false;
    if (mode === 'GENERAL') return true;
    return OPS_READ_ONLY_KEYS.has(opsPolicyKey(action, params || {}));
  }

  function employeeAccountingMode() {
    var mode = text(window.MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE || 'OFF').toUpperCase();
    return mode === 'READONLY' ? mode : 'OFF';
  }

  function shouldRouteAccountingNative(action) {
    if (employeeAccountingMode() !== 'READONLY') return false;
    return ACCOUNTING_READ_ACTIONS.has(text(action));
  }

  function employeeCoreMode() {
    var mode = text(window.MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE || 'OFF').toUpperCase();
    return mode === 'READONLY' ? mode : 'OFF';
  }

  function shouldRouteCoreNative(action, params) {
    if (employeeCoreMode() !== 'READONLY') return false;
    if (!nativeRouteEnabled(params || {})) return false;
    return CORE_READ_ACTIONS.has(text(action));
  }

  function employeeContentMode() {
    var mode = text(window.MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE || 'OFF').toUpperCase();
    return mode === 'READONLY' ? mode : 'OFF';
  }

  function shouldRouteContentNative(action, params) {
    if (employeeContentMode() !== 'READONLY') return false;
    if (!nativeRouteEnabled(params || {})) return false;
    return CONTENT_READ_ACTIONS.has(text(action));
  }

  function employeeCommsMode() {
    var mode = text(window.MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE || 'OFF').toUpperCase();
    return mode === 'READONLY' ? mode : 'OFF';
  }

  function shouldRouteCommsNative(action, params) {
    if (employeeCommsMode() !== 'READONLY') return false;
    if (!nativeRouteEnabled(params || {})) return false;
    return COMMS_READ_KEYS.has(policyKey(action, params || {}));
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
        redirect: 'error',
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

  async function cloudGet(path) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(edgeBase() + path, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        signal: controller.signal
      });
      return await readJson(response);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw routeError('EMPLOYEE_API_TIMEOUT', 'انتهت مهلة فحص جاهزية Cloud Employee API.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function canaryMinimumBridgePolicies() {
    var raw = window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES;
    if (raw == null || raw === '') return 69;
    var n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 69;
  }

  function canaryRequiredNativeReadyCount() {
    var n = Number(window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  function bridgeFreeCanaryConfigured() {
    return !bridgeEnabled() &&
      configuredPolicies().size === 0 &&
      canaryMinimumBridgePolicies() === 0 &&
      canaryRequiredNativeReadyCount() > 0;
  }

  function canaryPreflightKey() {
    return [
      edgeBase(),
      bridgeEnabled() ? 'bridge-on' : 'bridge-off',
      configuredPolicies().size,
      canaryMinimumBridgePolicies(),
      canaryRequiredNativeReadyCount()
    ].join('|');
  }

  function validateCanaryPreflight(auth, bridge) {
    var minimum = canaryMinimumBridgePolicies();
    var requiredReady = canaryRequiredNativeReadyCount();
    if (!auth || auth.success !== true || auth.schemaReady !== true ||
        auth.mode !== 'TRANSITIONAL' || auth.envEnabled !== true ||
        auth.plaintextStored === true ||
        !(auth.legacyBootstrapEnabled === true || Number(auth.nativeReadyCount || 0) > 0)) {
      throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز على Cloud.', 'auth-health');
    }

    if (bridgeFreeCanaryConfigured()) {
      if (Number(auth.nativeReadyCount || 0) < requiredReady) {
        throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز: عدد الموظفين Native-ready أقل من المطلوب.', 'native-ready-count');
      }
      return true;
    }

    if (auth.nativeOnly === true) {
      throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Native-only لا يعمل مع Compatibility Bridge.', 'native-only-with-bridge');
    }

    if (!bridgeEnabled()) {
      throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز: Bridge frontend مغلق بدون Bridge-free qualification.', 'frontend-bridge-disabled');
    }
    if (configuredPolicies().size < minimum) {
      throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز: سياسات Bridge غير مكتملة.', 'frontend-bridge-policies');
    }
    if (!bridge || bridge.success !== true || bridge.enabled !== true ||
        bridge.upstreamConfigured !== true || bridge.secretConfigured !== true ||
        Number(bridge.allowedPolicyCount || 0) < minimum ||
        bridge.rawNativeTokenForwarded === true || bridge.plaintextPasswordForwarded === true ||
        bridge.assertionBoundToAction !== true || bridge.assertionBoundToPayload !== true ||
        bridge.replayNonceIssued !== true) {
      throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Compatibility Bridge غير جاهز.', 'bridge-health');
    }
    return true;
  }

  async function ensureCanaryPreflight(action, params) {
    if (!canaryRouteEnabled(params || {})) return true;
    action = text(action);
    // Revocation/password recovery must remain available to an already-native
    // canary even if the compatibility bridge later becomes unhealthy.
    if (action === 'logout' || action === 'changePassword') return true;

    var bridgeFree = bridgeFreeCanaryConfigured();
    var minimum = canaryMinimumBridgePolicies();
    if (!bridgeFree) {
      if (!bridgeEnabled()) {
        throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز: Bridge frontend مغلق بدون Bridge-free qualification.', 'frontend-bridge-disabled');
      }
      if (configuredPolicies().size < minimum) {
        throw routeError('EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED', 'Canary Native Auth غير جاهز: سياسات Bridge غير مكتملة.', 'frontend-bridge-policies');
      }
    }

    var key = canaryPreflightKey();
    if (canaryPreflightCache.key === key && Date.now() - canaryPreflightCache.at < CANARY_PREFLIGHT_CACHE_MS) {
      return true;
    }
    if (!canaryPreflightPromise) {
      var healthPromise = bridgeFree
        ? cloudGet(AUTH_HEALTH_PATH).then(function (auth) { return [auth, null]; })
        : Promise.all([cloudGet(AUTH_HEALTH_PATH), cloudGet(BRIDGE_HEALTH_PATH)]);
      canaryPreflightPromise = healthPromise.then(function (parts) {
        validateCanaryPreflight(parts[0], parts[1]);
        canaryPreflightCache = { key: key, at: Date.now() };
        return true;
      }).catch(function (err) {
        if (err && err.code === 'EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED') throw err;
        throw routeError(
          'EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED',
          'تعذر إثبات جاهزية Canary Native Auth. لم يتم تحويل الدخول إلى Legacy.',
          text(err && err.code) || 'health-unavailable'
        );
      }).finally(function () {
        canaryPreflightPromise = null;
      });
    }
    return canaryPreflightPromise;
  }

  async function employeeOpsNative(action, params) {
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_OPS_SESSION_REQUIRED',
        'جلسة الموظف الحالية مطلوبة لمسار Ops السحابي.'
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
    return cloudPost(OPS_PATH, p, token);
  }

  async function employeeAccountingNative(action, params) {
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_ACCOUNTING_SESSION_REQUIRED',
        'جلسة الموظف الحالية مطلوبة لمسار الحسابات السحابي.'
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
    return cloudPost(ACCOUNTING_PATH, p, token);
  }

  async function employeeCoreNative(action, params) {
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_CORE_SESSION_REQUIRED',
        'جلسة الموظف الحالية مطلوبة لمسار Core السحابي.'
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
    return cloudPost(CORE_PATH, p, token);
  }

  async function employeeContentNative(action, params) {
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_CONTENT_SESSION_REQUIRED',
        'جلسة الموظف الحالية مطلوبة لمسار Content السحابي.'
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
    return cloudPost(CONTENT_PATH, p, token);
  }

  async function employeeCommsNative(action, params) {
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var username = text(p.username || p.name);
    if (!username || !token) {
      throw routeError(
        'EMPLOYEE_COMMS_SESSION_REQUIRED',
        'جلسة الموظف الحالية مطلوبة لمسار Comms السحابي.'
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
    return cloudPost(COMMS_PATH, p, token);
  }

  async function nativeAuth(action, params) {
    var path = AUTH_PATHS[action];
    if (!path) throw routeError('EMPLOYEE_AUTH_ACTION_UNKNOWN', 'إجراء مصادقة الموظف غير معروف.');
    var p = canonicalizeNativeParams(params || {});
    var token = text(p.token);
    var canary = canaryRouteEnabled(p);
    var out = await cloudPost(path, p, token);
    if (canary && out && out.success !== false) {
      if (action === 'login' || action === 'verifyEmployeeSession') rememberCanaryUser(p, out);
      if (action === 'logout' || (action === 'changePassword' && out.forceRelogin === true)) clearCanaryUser(p);
    }
    return out;
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
    var username = text(p.username || p.name) || canarySessionUserKey;
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
      var p = params || {};
      if (shouldRouteOpsNative(action, p)) return employeeOpsNative(action, p);
      if (shouldRouteAccountingNative(action)) return employeeAccountingNative(action, p);
      if (shouldRouteCoreNative(action, p)) return employeeCoreNative(action, p);
      if (shouldRouteContentNative(action, p)) return employeeContentNative(action, p);
      if (shouldRouteCommsNative(action, p)) return employeeCommsNative(action, p);
      if (!nativeRouteEnabled(p)) return original.apply(this, arguments);
      await ensureCanaryPreflight(action, p);
      return dispatchNative(action, p, original, this, arguments);
    }

    wrapped.__trendosEmployeeApiDispatcherV1 = true;
    wrapped.__trendosEmployeeApiDownstream = original;
    window.trendosSecureApiV1922 = wrapped;
    return true;
  }

  window.trendosEmployeeApiV1 = async function (action, params, legacyInvoker) {
    var actionText = text(action);
    var p = params || {};

    if (shouldRouteOpsNative(actionText, p)) {
      return employeeOpsNative(actionText, p);
    }

    if (shouldRouteAccountingNative(actionText)) {
      return employeeAccountingNative(actionText, p);
    }

    if (shouldRouteCoreNative(actionText, p)) {
      return employeeCoreNative(actionText, p);
    }

    if (shouldRouteContentNative(actionText, p)) {
      return employeeContentNative(actionText, p);
    }

    if (shouldRouteCommsNative(actionText, p)) {
      return employeeCommsNative(actionText, p);
    }

    if (!nativeRouteEnabled(p)) {
      var current = currentSecureApi();
      if (!current) throw routeError('EMPLOYEE_API_NOT_READY', 'Employee API غير جاهز.');
      return current(actionText, p);
    }

    await ensureCanaryPreflight(actionText, p);

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
    var p = params || {};
    if (!nativeRouteEnabled(p)) {
      if (typeof window.trendosLegacyApiTransportV1 !== 'function') throw routeError('CLOUD_API_NOT_READY', 'Cloud API غير جاهز.');
      return window.trendosLegacyApiTransportV1(action, p);
    }
    await ensureCanaryPreflight(action, p);
    return legacyBridge(action, p);
  };

  window.TrendOSEmployeeApiDispatcherV1 = {
    version: VERSION,
    nativeEnabled: nativeEnabled,
    nativeRouteEnabled: nativeRouteEnabled,
    nativeCanonicalUsername: nativeCanonicalUsername,
    canonicalizeNativeParams: canonicalizeNativeParams,
    canaryConfigEnabled: canaryConfigEnabled,
    canaryUserSelected: canaryUserSelected,
    canaryRouteEnabled: canaryRouteEnabled,
    canaryMinimumBridgePolicies: canaryMinimumBridgePolicies,
    canaryRequiredNativeReadyCount: canaryRequiredNativeReadyCount,
    bridgeFreeCanaryConfigured: bridgeFreeCanaryConfigured,
    ensureCanaryPreflight: ensureCanaryPreflight,
    bridgeEnabled: bridgeEnabled,
    employeeOpsMode: employeeOpsMode,
    opsPolicyKey: opsPolicyKey,
    shouldRouteOpsNative: shouldRouteOpsNative,
    employeeOpsNative: employeeOpsNative,
    employeeAccountingMode: employeeAccountingMode,
    shouldRouteAccountingNative: shouldRouteAccountingNative,
    employeeAccountingNative: employeeAccountingNative,
    employeeCoreMode: employeeCoreMode,
    shouldRouteCoreNative: shouldRouteCoreNative,
    employeeCoreNative: employeeCoreNative,
    employeeContentMode: employeeContentMode,
    shouldRouteContentNative: shouldRouteContentNative,
    employeeContentNative: employeeContentNative,
    employeeCommsMode: employeeCommsMode,
    shouldRouteCommsNative: shouldRouteCommsNative,
    employeeCommsNative: employeeCommsNative,
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

