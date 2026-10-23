/* TrendOS customer-only cloud browser dispatcher. SOURCE ONLY; DEFAULT OFF.
 * Never enable before a qualified independent Native customer login/session
 * issuer, secure order-owner mapping and Worker route have shipped. */
(function () {
  'use strict';
  var API_ORIGIN = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  var ACTIONS = Object.freeze({
    customerLogin: 1, customerLogout: 1, changeCustomerPassword: 1,
    getCustomerOrders: 1, getCustomerPortalAccountsV1859: 1,
    createCustomerDraft: 1, addCustomerDraftItem: 1,
    submitCustomerDraft: 1, uploadCustomerDraftFile: 1
  });
  function fail(code) {
    var err = new Error('خدمة العملاء السحابية لم تُفعّل بعد. لم يتم إرسال الطلب إلى جوجل.');
    err.code = code;
    return err;
  }
  function nativeEnabled() {
    return window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED === true;
  }
  function exactCloudOrigin() {
    var candidate = window.MATBAGY_EDGE_ORDERS_API_URL;
    if (typeof candidate !== 'string' || candidate !== API_ORIGIN)
      throw fail('CUSTOMER_NATIVE_API_ORIGIN_UNTRUSTED');
    return API_ORIGIN;
  }
  function nativeSessionBearer() {
    // The existing customer.token is a LEGACY Google credential, NOT Native.
    // No native token issuer/callback is installed in production.
    var issuer = window.trendosCustomerNativeBearerV0;
    if (typeof issuer !== 'function') throw fail('CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE');
    var token = issuer();
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token))
      throw fail('CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE');
    return token;
  }
  function safeRow(row) {
    if (!row || Array.isArray(row) || typeof row !== 'object') return null;
    var names = ['orderId', 'lineId', 'department', 'itemName', 'status'];
    for (var i = 0; i < names.length; i++) {
      var value = row[names[i]];
      if (typeof value !== 'string' || !value.trim() || value.length > 250)
        return null;
    }
    if (!Number.isSafeInteger(row.ordinal) || row.ordinal < 1 ||
        typeof row.qty !== 'number' || !Number.isFinite(row.qty) || row.qty <= 0)
      return null;
    // Deliberate minimal compatibility shape: NO notes, identity, finances,
    // private files or client-chosen customerId. The UI escapes displayed text.
    return {
      orderId: row.orderId, lineId: row.lineId,
      department: row.department, itemName: row.itemName,
      status: row.status, qty: row.qty
    };
  }
  async function nativeOrdersOnly() {
    var origin = exactCloudOrigin();
    var bearer = nativeSessionBearer();
    if (typeof window.fetch !== 'function')
      throw fail('CUSTOMER_NATIVE_FETCH_UNAVAILABLE');
    var url = origin + '/v1/customer/native/orders?limit=40&offset=0';
    var response;
    try {
      response = await window.fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json', authorization: 'Bearer ' + bearer },
        credentials: 'omit', cache: 'no-store', redirect: 'error'
      });
    } catch (_) { throw fail('CUSTOMER_NATIVE_ORDER_NETWORK_UNAVAILABLE'); }
    if (!response || response.ok !== true || response.status !== 200)
      throw fail('CUSTOMER_NATIVE_ORDER_HTTP_DENIED');
    var raw;
    try { raw = await response.text(); }
    catch (_) { throw fail('CUSTOMER_NATIVE_ORDER_RESPONSE_UNAVAILABLE'); }
    if (typeof raw !== 'string' || raw.length > 65536)
      throw fail('CUSTOMER_NATIVE_ORDER_RESPONSE_INVALID');
    var data;
    try { data = JSON.parse(raw); }
    catch (_) { throw fail('CUSTOMER_NATIVE_ORDER_RESPONSE_INVALID'); }
    // Prevent silently showing a partial list as "all your orders".
    if (!data || data.success !== true || data.readOnly !== true ||
        data.source !== 'customer-d1-native-read-v0' ||
        data.hasMore !== false || !Array.isArray(data.lines) ||
        data.lines.length > 40)
      throw fail('CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED');
    var orders = data.lines.map(safeRow);
    if (orders.some(function (row) { return !row; }))
      throw fail('CUSTOMER_NATIVE_ORDER_ROW_INVALID');
    return {
      success: true, orders: orders, source: 'customer-d1-native-read-v0',
      nativeCustomerPreviewOnly: true
    };
  }
  window.trendosCustomerNativeBrowserDispatchV0 = async function (action, params, downstream) {
    // Identity of the employee/original transport stays intact, including
    // all arguments and result. No employee action is intercepted.
    if (!Object.prototype.hasOwnProperty.call(ACTIONS, action) || !nativeEnabled()) {
      if (typeof downstream !== 'function') throw fail('CUSTOMER_LEGACY_TRANSPORT_MISSING');
      return downstream(action, params);
    }
    // Fail CLOSED on all eight actions without qualified cloud HTTP handlers.
    // No Google retry, even on failure, bad auth, malformed JSON or timeout.
    if (action !== 'getCustomerOrders')
      throw fail('CUSTOMER_NATIVE_ACTION_NOT_WIRED');
    // Ignore customerCode/token/ID in legacy caller params. Only server-side
    // Native D1 bearer fingerprint determines verified customer order ownership.
    return nativeOrdersOnly();
  };
  window.trendosCustomerNativeBrowserPolicyV0 = Object.freeze({
    sourceOnly: true, defaultOff: true, customerActions: Object.keys(ACTIONS).length,
    nativeHttpReadQualifiedForLive: false, customerLoginRouteReady: false,
    googleFallbackWhenEnabled: false, customerMasterMigration: false,
    customerOrderWriterCreated: false, zeroGoogleComplete: false
  });
})();
