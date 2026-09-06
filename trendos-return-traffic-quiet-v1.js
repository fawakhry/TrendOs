/* TrendOS Return Traffic Quiet V1
 * PERF-CF-02CU / NAVIGATION-RETURN-NO-REFRESH
 *
 * Narrow early runtime guard for two residual return-to-tab network triggers:
 * 1) attendance-v1.js visibilitychange -> loadState()
 * 2) employee-manager-strips-v2.js window focus -> refresh({source:'focus'})
 *
 * It intentionally does NOT block:
 * - legacy app.js safeRefresh listeners (handled separately by resume no-auto-refresh guard)
 * - manual refresh
 * - attendance periodic timers / presence timers / prayer timers
 * - employee-manager periodic refresh timer
 * - Customer Feedback focus listener (already gated by AUTO_SCAN=false)
 * - any unrelated focus/visibility listener
 */
(function () {
  'use strict';

  var VERSION = 'TRENDOS_RETURN_TRAFFIC_QUIET_V1_20260906';
  if (window.__TRENDOS_RETURN_TRAFFIC_QUIET_V1__) return;
  window.__TRENDOS_RETURN_TRAFFIC_QUIET_V1__ = true;

  var originalDocumentAdd = document.addEventListener;
  var originalWindowAdd = window.addEventListener;
  if (typeof originalDocumentAdd !== 'function' || typeof originalWindowAdd !== 'function') return;

  var stats = {
    attendanceVisibilitySuppressed: 0,
    employeeManagerFocusSuppressed: 0
  };

  function listenerSource(listener) {
    if (typeof listener !== 'function') return '';
    try { return Function.prototype.toString.call(listener); }
    catch (e) { return ''; }
  }

  function isAttendanceVisibilityRefresh(type, listener) {
    if (type !== 'visibilitychange') return false;
    var src = listenerSource(listener);
    return src.indexOf('loadState()') !== -1 &&
      src.indexOf('currentUser()') !== -1 &&
      src.indexOf('document.hidden') !== -1;
  }

  function isEmployeeManagerFocusRefresh(type, listener) {
    if (type !== 'focus') return false;
    var src = listenerSource(listener).replace(/\s+/g, '');
    return src.indexOf("refresh({source:'focus'})") !== -1 ||
      src.indexOf('refresh({source:"focus"})') !== -1;
  }

  document.addEventListener = function (type, listener, options) {
    if (isAttendanceVisibilityRefresh(type, listener)) {
      stats.attendanceVisibilitySuppressed += 1;
      return;
    }
    return originalDocumentAdd.call(this, type, listener, options);
  };

  window.addEventListener = function (type, listener, options) {
    if (isEmployeeManagerFocusRefresh(type, listener)) {
      stats.employeeManagerFocusSuppressed += 1;
      return;
    }
    return originalWindowAdd.call(this, type, listener, options);
  };

  window.TrendOSReturnTrafficQuietV1 = {
    version: VERSION,
    enabled: true,
    mode: 'suppress-only-known-return-network-listeners',
    stats: function () {
      return {
        attendanceVisibilitySuppressed: stats.attendanceVisibilitySuppressed,
        employeeManagerFocusSuppressed: stats.employeeManagerFocusSuppressed
      };
    }
  };
})();
