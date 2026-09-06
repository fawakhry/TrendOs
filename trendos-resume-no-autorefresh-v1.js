/* TrendOS Resume No-Auto-Refresh V1
 * Prevents the legacy V1921 safeRefresh() helper from auto-clicking
 * the main refresh button on focus/visibility return or its timer.
 * Manual refresh and non-safeRefresh programmatic refreshes remain intact.
 */
(function () {
  'use strict';

  var VERSION = 'TRENDOS_RESUME_NO_AUTO_REFRESH_V1_20260906';
  if (window.MATBAGY_DISABLE_RETURN_AUTO_REFRESH_V1 === false) return;

  var proto = window.HTMLElement && window.HTMLElement.prototype;
  if (!proto || typeof proto.click !== 'function') return;

  var currentClick = proto.click;
  if (currentClick && currentClick.__trendosResumeNoAutoRefreshV1) {
    window.TrendOSResumeNoAutoRefreshV1 = window.TrendOSResumeNoAutoRefreshV1 || {
      version: VERSION,
      enabled: true
    };
    return;
  }

  function isLegacySafeRefreshStack() {
    try {
      return String(new Error().stack || '').indexOf('safeRefresh') !== -1;
    } catch (e) {
      return false;
    }
  }

  function updateStatusLabel() {
    try {
      var live = document.getElementById('liveStatus');
      if (!live) return;
      var value = String(live.textContent || '');
      if (value.indexOf('تحديث آمن تلقائي') !== -1) {
        live.textContent = 'التحديث التلقائي عند الرجوع متوقف — استخدم تحديث البيانات عند الحاجة';
      }
    } catch (e) {}
  }

  function guardedClick() {
    if (this && this.id === 'refreshBtn' && isLegacySafeRefreshStack()) {
      updateStatusLabel();
      try {
        window.__TRENDOS_LAST_SUPPRESSED_SAFE_REFRESH__ = Date.now();
      } catch (e) {}
      return;
    }
    return currentClick.apply(this, arguments);
  }

  guardedClick.__trendosResumeNoAutoRefreshV1 = true;
  guardedClick.__trendosOriginalClick = currentClick;
  proto.click = guardedClick;

  function boot() {
    updateStatusLabel();
    [300, 1000, 3000, 7000].forEach(function (ms) {
      setTimeout(updateStatusLabel, ms);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.TrendOSResumeNoAutoRefreshV1 = {
    version: VERSION,
    enabled: true,
    mode: 'suppress-legacy-safeRefresh-only'
  };
})();
