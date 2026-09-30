/* Legacy authority is temporary; browser transport is Cloudflare only. */
(function () {
  'use strict';
  var DEFAULT_API = 'https://trendos-d1-api.trendmall-contact.workers.dev';
  // Defense in depth for lazy modules, configured URLs, and stale integrations.
  // Browser redirects fail closed so a Cloud response cannot redirect to Google.
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, options) {
    var target = new URL(typeof input === 'string' ? input : input.url || String(input), window.location.href);
    if (/^(script\.google\.com|script\.googleusercontent\.com)$/i.test(target.hostname)) {
      return Promise.reject(Object.assign(new Error('Browser direct Google transport blocked.'), { code: 'BROWSER_GOOGLE_TRANSPORT_BLOCKED' }));
    }
    return nativeFetch(input, Object.assign({}, options || {}, { redirect: 'error' }));
  };
  function cloudBase() {
    var url = new URL(window.MATBAGY_EMPLOYEE_API_URL || window.MATBAGY_EDGE_ORDERS_API_URL || DEFAULT_API);
    if (url.protocol !== 'https:' || url.username || url.password ||
        /(^|\.)google\.com$|(^|\.)googleusercontent\.com$/i.test(url.hostname)) {
      throw new Error('Cloud API endpoint غير صالح.');
    }
    return url.href.replace(/\/+$/, '');
  }
  window.trendosLegacyApiTransportV1 = async function (action, params, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, (options && options.timeoutMs) || 120000);
    try {
      var response = await fetch(cloudBase() + '/v1/legacy-api', {
        method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(Object.assign({}, params || {}, { action: action })),
        credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal
      });
      var body;
      try { body = JSON.parse(await response.text()); }
      catch (e) { throw Object.assign(new Error('رد Cloud API غير صالح.'), { code: 'CLOUD_API_INVALID_JSON' }); }
      if (!response.ok) {
        throw Object.assign(new Error(body.message || 'تعذر الاتصال بـ Cloud API.'), {
          code: body.code || 'CLOUD_API_UNAVAILABLE', status: response.status
        });
      }
      return body;
    } catch (e) {
      if (e.name === 'AbortError') throw Object.assign(new Error('انتهت مهلة الاتصال بـ Cloud API؛ الجلسة لم تُلغَ.'), { code: 'CLOUD_API_TIMEOUT' });
      throw e;
    } finally { clearTimeout(timer); }
  };
})();
