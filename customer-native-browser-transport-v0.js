/* TrendOS customer-only cloud browser dispatcher. SOURCE ONLY; DEFAULT OFF.
 * Never enable before a qualified independent Native customer login/session
 * issuer, secure order-owner mapping and Worker route have shipped. */
(function () {
  'use strict';
  var API_ORIGIN = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  // Native bearer stays ONLY in memory; old customer state stores a fake
  // truthy marker, never the new bearer or password.
  var nativeToken = '';
  var nativeEpoch = 0;
  var ACTIONS = Object.freeze({
    customerLogin: 1, customerLogout: 1, changeCustomerPassword: 1,
    getCustomerOrders: 1, getCustomerPortalAccountsV1859: 1,
    createCustomerDraft: 1, addCustomerDraftItem: 1,
    submitCustomerDraft: 1, uploadCustomerDraftFile: 1,
    getPlatformSections: 1, getFranchiseBranches: 1
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
    // Testing callback is a source-only seam; a real login always takes
    // precedence through the in-memory token from the verified HTTP response.
    var issuer = window.trendosCustomerNativeBearerV0;
    var token = nativeToken || (nativeEpoch === 0 && typeof issuer === 'function' ? issuer() : '');
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token))
      throw fail('CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE');
    return token;
  }
  async function nativeLoginOnly(params) {
    var origin = exactCloudOrigin();
    var code = params && params.customerCode;
    var password = params && params.password;
    if (typeof code !== 'string' || !code.trim() ||
        code.length > 80 || code !== code.trim() ||
        typeof password !== 'string' || password.length < 12 ||
        password.length > 128)
      throw fail('CUSTOMER_NATIVE_LOGIN_INPUT_INVALID');
    if (typeof window.fetch !== 'function')
      throw fail('CUSTOMER_NATIVE_FETCH_UNAVAILABLE');
    // A fresh login always replaces any prior native bearer; no old Google
    // customer/password/token/identity fields are forwarded.
    nativeToken = '';
    var thisEpoch = ++nativeEpoch;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    var response;
    try {
      response = await window.fetch(origin + '/v1/customer/native/login', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ portalCode: code, password: password }),
        credentials: 'omit', cache: 'no-store', redirect: 'error',
        signal: controller.signal
      });
    } catch (_) { throw fail('CUSTOMER_NATIVE_LOGIN_NETWORK_UNAVAILABLE'); }
    finally { clearTimeout(timeout); }
    if (thisEpoch !== nativeEpoch)
      throw fail('CUSTOMER_NATIVE_LOGIN_RACE_REJECTED');
    if (!response || !response.ok || response.status !== 200)
      throw fail('CUSTOMER_NATIVE_LOGIN_REJECTED');
    var raw;
    try { raw = await response.text(); }
    catch (_) { throw fail('CUSTOMER_NATIVE_LOGIN_RESPONSE_INVALID'); }
    if (typeof raw !== 'string' || raw.length > 4096)
      throw fail('CUSTOMER_NATIVE_LOGIN_RESPONSE_INVALID');
    var data;
    try { data = JSON.parse(raw); }
    catch (_) { throw fail('CUSTOMER_NATIVE_LOGIN_RESPONSE_INVALID'); }
    if (!data || data.success !== true || data.customerSessionIssued !== true ||
        data.source !== 'd1-native-customer-login-v0' ||
        typeof data.token !== 'string' || !/^[a-f0-9]{64}$/i.test(data.token) ||
        !Number.isSafeInteger(data.expiresAtMs) ||
        data.expiresAtMs <= Date.now() || data.expiresAtMs > Date.now() + 28800000)
      throw fail('CUSTOMER_NATIVE_LOGIN_RESPONSE_UNQUALIFIED');
    if (thisEpoch !== nativeEpoch)
      throw fail('CUSTOMER_NATIVE_LOGIN_RACE_REJECTED');
    nativeToken = data.token.toLowerCase();
    // Marker, never genuine Native session token, handed to legacy-shaped UI.
    return {success:true,customer:{
      customerCode:code,token:'NATIVE_SESSION_IN_MEMORY',nativeSession:true,
      mustChange:false
    }};
  }
  async function nativeServerLogoutOnly() {
    // Wipe the browser bearer immediately, even when server revocation is
    // unavailable. Only a VERIFIED D1 CAS response can claim remote logout.
    if (!nativeToken) throw fail('CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE');
    var bearer = nativeToken;
    ++nativeEpoch;
    nativeToken = '';
    var origin = exactCloudOrigin();
    if (typeof window.fetch !== 'function')
      throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    var response;
    try {
      response = await window.fetch(origin + '/v1/customer/native/logout', {
        method: 'POST',
        headers: { accept: 'application/json', authorization: 'Bearer ' + bearer },
        credentials: 'omit', cache: 'no-store', redirect: 'error',
        signal: controller.signal
      });
    } catch (_) {
      throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED');
    } finally { clearTimeout(timeout); }
    if (!response || response.ok !== true || response.status !== 200)
      throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED');
    var raw;
    try { raw = await response.text(); }
    catch (_) { throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'); }
    if (typeof raw !== 'string' || raw.length > 2048)
      throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED');
    var data;
    try { data = JSON.parse(raw); }
    catch (_) { throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'); }
    if (!data || data.success !== true || data.sessionRevoked !== true ||
        data.source !== 'customer-d1-native-logout-v0')
      throw fail('CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED');
    return {success:true,sessionRevoked:true,serverSessionRevoked:true,
      forceRelogin:true,source:'customer-d1-native-logout-v0'};
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
  async function nativePublicContentReadOnly(action) {
    var view=action==='getPlatformSections'?'sections':'branches';
    var origin=exactCloudOrigin();
    var bearer=nativeSessionBearer();
    var response;
    try {
      response=await window.fetch(origin+'/v1/customer/native/public-content?view='+view,{
        method:'GET',
        headers:{accept:'application/json',authorization:'Bearer '+bearer},
        credentials:'omit',cache:'no-store',redirect:'error'
      });
    } catch (_) {throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_NETWORK_UNAVAILABLE');}
    if(!response||response.status!==200||response.ok!==true)
      throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_HTTP_DENIED');
    var raw;
    try {raw=await response.text();}
    catch (_) {throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_RESPONSE_INVALID');}
    if(typeof raw!=='string'||raw.length>65536)
      throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_RESPONSE_INVALID');
    var data;
    try {data=JSON.parse(raw);}
    catch (_) {throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_RESPONSE_INVALID');}
    var key=view==='sections'?'sections':'branches';
    if(!data||data.success!==true||data.readOnly!==true||
       data.source!=='customer-native-public-content-stage-v0'||
       data.view!==view||!Array.isArray(data[key])||data[key].length>40)
      throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_CONTRACT_INVALID');
    var rows=data[key].map(function (v) {
      if(!v||typeof v!=='object'||Array.isArray(v))return null;
      if(view==='sections'){
        if(typeof v.sectionCode!=='string'||!v.sectionCode||
           typeof v.name!=='string'||!v.name||v.active!=='نعم')return null;
        return {sectionCode:v.sectionCode,name:v.name,
          description:typeof v.description==='string'?v.description:'',
          sectionType:typeof v.sectionType==='string'?v.sectionType:'',
          executionType:typeof v.executionType==='string'?v.executionType:'',
          active:'نعم'};
      }
      if(typeof v.branchCode!=='string'||!v.branchCode||
         typeof v.brandName!=='string'||!v.brandName||
         v.active!=='نعم'||v.customerVisibility!=='ظاهر كفرع مطبعجي')
        return null;
      return {branchCode:v.branchCode,brandName:v.brandName,
        governorate:typeof v.governorate==='string'?v.governorate:'',
        city:typeof v.city==='string'?v.city:'',
        publicArea:typeof v.publicArea==='string'?v.publicArea:'',
        publicDescription:typeof v.publicDescription==='string'?v.publicDescription:'',
        active:'نعم',customerVisibility:'ظاهر كفرع مطبعجي'};
    });
    if(rows.some(function (row) {return !row;}))
      throw fail('CUSTOMER_NATIVE_PUBLIC_CONTENT_ROW_INVALID');
    return view==='sections'?{success:true,sections:rows}:{success:true,branches:rows};
  }
  window.trendosCustomerNativeBrowserDispatchV0 = async function (action, params, downstream) {
    // Identity of the employee/original transport stays intact, including
    // all arguments and result. No employee action is intercepted.
    if (!Object.prototype.hasOwnProperty.call(ACTIONS, action)) {
      if (typeof downstream !== 'function') throw fail('CUSTOMER_LEGACY_TRANSPORT_MISSING');
      return downstream(action, params);
    }
    if (!nativeEnabled()) {
      // A native session must never be downgraded to legacy Google, including
      // when the UI still carries its nonsecret marker after local logout.
      if (nativeToken && action === 'customerLogout')
        return nativeServerLogoutOnly();
      if (nativeToken || (params && (params.nativeSession === true ||
          params.token === 'NATIVE_SESSION_IN_MEMORY')))
        throw fail('CUSTOMER_NATIVE_MODE_MISMATCH');
      if (typeof downstream !== 'function') throw fail('CUSTOMER_LEGACY_TRANSPORT_MISSING');
      return downstream(action, params);
    }
    if (action === 'customerLogin') return nativeLoginOnly(params);
    if (action === 'customerLogout') return nativeServerLogoutOnly();
    // Two narrowly public read-only Stage content views only; all employee
    // content and remaining customer writes stay fail-closed.
    if(action==='getPlatformSections'||action==='getFranchiseBranches')
      return nativePublicContentReadOnly(action);
    if (action !== 'getCustomerOrders')
      throw fail('CUSTOMER_NATIVE_ACTION_NOT_WIRED');
    // Ignore customerCode/token/ID in legacy caller params. Only server-side
    // Native D1 bearer fingerprint determines verified customer order ownership.
    return nativeOrdersOnly();
  };
  window.trendosCustomerNativeBrowserPolicyV0 = Object.freeze({
    sourceOnly: true, defaultOff: true, customerActions: Object.keys(ACTIONS).length,
    nativeHttpReadQualifiedForLive: false, customerLoginRouteReady: false,
    nativeLoginSourceHandshakeOnly: true, nativeTokenNeverPersisted: true,
    logoutRequiresServerCasAck: true, clientClearsBearerBeforeLogoutResponse: true,
    googleFallbackWhenEnabled: false, customerMasterMigration: false,
    customerOrderWriterCreated: false, zeroGoogleComplete: false
  });
})();
