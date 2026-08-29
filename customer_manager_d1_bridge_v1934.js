/* TrendOS Customer Manager D1 Read Bridge - V1934
 * Read path: Cloudflare D1 first for inbox/thread.
 * Fallback: existing Apps Script customerManagerV1 on any D1/network failure.
 * Write/actions (suggest/send/handoff/resolve) stay on Apps Script.
 */
(function () {
  'use strict';

  var VERSION = 'V1934_D1_READ_BRIDGE_20260829';
  var D1_API = 'https://trendos.trendmall-contact.workers.dev';

  function text(v) {
    return String(v == null ? '' : v);
  }

  function cleanPhone(value) {
    var digits = text(value).replace(/[^0-9]/g, '');
    if (digits.indexOf('0020') === 0) digits = digits.slice(2);
    if (digits.indexOf('20') === 0 && digits.length === 12) digits = '0' + digits.slice(2);
    if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
    return digits;
  }

  function queryString(params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value !== undefined && value !== null && text(value).trim() !== '') {
        q.set(key, text(value));
      }
    });
    var s = q.toString();
    return s ? ('?' + s) : '';
  }

  async function d1Get(path, params) {
    var res = await fetch(D1_API + path + queryString(params), {
      method: 'GET',
      cache: 'no-store',
      headers: { 'accept': 'application/json' }
    });

    var body = {};
    try { body = await res.json(); }
    catch (e) { throw new Error('D1 returned invalid JSON'); }

    if (!res.ok || !body || body.success === false) {
      throw new Error((body && body.message) || ('D1 HTTP ' + res.status));
    }
    return body;
  }

  async function readInbox(params) {
    var data = await d1Get('/v1/inbox', {
      limit: (params && params.limit) || 120
    });
    return {
      success: true,
      conversations: Array.isArray(data.conversations) ? data.conversations : [],
      dataSource: 'd1'
    };
  }

  async function readThread(params) {
    var phone = cleanPhone(params && params.phone);
    if (!phone) throw new Error('phone is required');

    var messagesData = await d1Get('/v1/messages', {
      phone: phone,
      limit: (params && params.limit) || 200
    });

    var context = {
      phone: phone,
      customerName: '',
      orderId: '',
      orderStatus: '',
      expectedDelivery: '',
      total: '',
      remaining: ''
    };

    try {
      var ordersData = await d1Get('/v1/orders', { phone: phone, limit: 1 });
      var order = Array.isArray(ordersData.orders) && ordersData.orders.length ? ordersData.orders[0] : null;
      if (order) {
        context.customerName = order.customerName || '';
        context.orderId = order.orderId || '';
        context.orderStatus = order.status || '';
        context.expectedDelivery = order.expectedDelivery || '';
        context.total = order.total == null ? '' : order.total;
        context.remaining = order.remaining == null ? '' : order.remaining;
      }
    } catch (orderErr) {
      /* Context is optional; messages can still load from D1. */
    }

    if (!context.customerName) {
      try {
        var customerData = await d1Get('/v1/customer', { phone: phone });
        if (customerData.customer) context.customerName = customerData.customer.customerName || '';
      } catch (customerErr) {
        /* Customer row is optional. */
      }
    }

    return {
      success: true,
      messages: Array.isArray(messagesData.messages) ? messagesData.messages : [],
      context: context,
      dataSource: 'd1'
    };
  }

  function install() {
    var original = window.trendosSecureApiV1922;
    if (typeof original !== 'function') return false;
    if (original.__trendosD1ReadBridgeV1934) return true;

    async function wrapped(action, params) {
      var args = arguments;
      var op = params && text(params.op).trim();

      if (action === 'customerManagerV1' && (op === 'inbox' || op === 'thread')) {
        try {
          return op === 'inbox' ? await readInbox(params) : await readThread(params);
        } catch (err) {
          try {
            console.warn('[TrendOS D1] read failed; Apps Script fallback:', err && err.message ? err.message : err);
          } catch (ignore) {}
          return original.apply(this, args);
        }
      }

      return original.apply(this, args);
    }

    wrapped.__trendosD1ReadBridgeV1934 = true;
    wrapped.__trendosOriginalSecureApiV1922 = original;
    window.trendosSecureApiV1922 = wrapped;
    window.TrendOSCustomerManagerD1BridgeV1934 = {
      version: VERSION,
      api: D1_API,
      mode: 'read-first-with-apps-script-fallback'
    };

    try { console.info('[TrendOS D1] Customer Manager read bridge active', VERSION); }
    catch (ignore) {}
    return true;
  }

  if (!install()) {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (install() || attempts >= 30) clearInterval(timer);
    }, 500);
  }
})();
