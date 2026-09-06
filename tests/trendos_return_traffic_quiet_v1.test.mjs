import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('trendos-return-traffic-quiet-v1.js', 'utf8');
const documentListeners = [];
const windowListeners = [];

const document = {
  hidden: false,
  addEventListener(type, listener, options) {
    documentListeners.push({ type, listener, options });
  }
};
const window = {
  addEventListener(type, listener, options) {
    windowListeners.push({ type, listener, options });
  }
};
window.window = window;
window.document = document;

const context = { window, document, Function, String };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'trendos-return-traffic-quiet-v1.js' });

function safeRefresh() { return 'legacy-safe-refresh'; }
function attendanceResumeListener() {
  if (!document.hidden && currentUser() && currentUser().token) loadState();
}
function employeeManagerFocusListener() { refresh({ source: 'focus' }); }
function customerFeedbackFocusListener() { scan({ source: 'focus' }); }
function unrelatedVisibilityListener() { render(); }

// Legacy safeRefresh registration must NOT be touched by this guard.
document.addEventListener('visibilitychange', function () { if (!document.hidden) safeRefresh(); });
window.addEventListener('focus', safeRefresh);

// Only the two known residual return-network listeners are suppressed.
document.addEventListener('visibilitychange', attendanceResumeListener);
window.addEventListener('focus', employeeManagerFocusListener);

// Customer Feedback listener and unrelated listeners remain intact.
window.addEventListener('focus', customerFeedbackFocusListener);
document.addEventListener('visibilitychange', unrelatedVisibilityListener);
window.addEventListener('blur', function () {});

assert.equal(documentListeners.filter(x => x.type === 'visibilitychange').length, 2,
  'legacy safeRefresh + unrelated visibility listener must remain registered');
assert.equal(windowListeners.filter(x => x.type === 'focus').length, 2,
  'legacy safeRefresh + customer feedback focus listener must remain registered');
assert.equal(windowListeners.filter(x => x.type === 'blur').length, 1,
  'unrelated window listeners must remain registered');

const stats = window.TrendOSReturnTrafficQuietV1.stats();
assert.equal(stats.attendanceVisibilitySuppressed, 1);
assert.equal(stats.employeeManagerFocusSuppressed, 1);
assert.equal(window.TrendOSReturnTrafficQuietV1.enabled, true);
assert.equal(window.TrendOSReturnTrafficQuietV1.mode, 'suppress-only-known-return-network-listeners');

// Static regression gates for the production safety contract.
const config = fs.readFileSync('config.js', 'utf8');
const edge = fs.readFileSync('trendos-edge-orders-read-v1.js', 'utf8');
const attendance = fs.readFileSync('attendance-v1.js', 'utf8');
const employee = fs.readFileSync('employee-manager-strips-v2.js', 'utf8');
const feedback = fs.readFileSync('customer-feedback-v1.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

assert.match(config, /MATBAGY_EDGE_ORDERS_READ_V1_ENABLED\s*=\s*true/);
assert.match(config, /MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
assert.match(config, /MATBAGY_TREND_MASTER_RESILIENCE_V1\s*=\s*true/);
assert.match(config, /MATBAGY_TREND_MASTER_MAX_CONCURRENCY\s*=\s*2/);
assert.match(config, /MATBAGY_TREND_MASTER_MAX_ATTEMPTS\s*=\s*1/);
assert.match(config, /MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1\s*=\s*false/);
assert.match(config, /MATBAGY_GO_LIVE_AUTOPILOT_AUTO_SWEEP_V1\s*=\s*false/);
assert.match(config, /MATBAGY_DISABLE_DEMO_OPERATIONS\s*=\s*true/);

assert.match(edge, /action\s*!==\s*'getRowsPageV1931'/);
assert.match(edge, /statusFilter\)\s*===\s*'__DEBT__'/);
assert.match(edge, /return original\.apply\(this, args\)/);
assert.match(edge, /EDGE_MIRROR_STALE/);

assert.match(attendance, /document\.addEventListener\("visibilitychange"/);
assert.match(attendance, /ui\.timers\.state\s*=\s*setInterval/);
assert.match(attendance, /60000/);
assert.match(employee, /setInterval\(function\(\)\{refresh\(\{source:'interval'\}\);\},REFRESH_MS\)/);
assert.match(employee, /window\.addEventListener\('focus'/);
assert.match(feedback, /if\(timer\|\|!AUTO_SCAN\)return/);

// The root cause remains explicit and separately guarded; do not accidentally hide it in legacy app.js.
assert.match(app, /document\.addEventListener\('visibilitychange',function\(\)\{if\(!document\.hidden\)safeRefresh\(\);\}\);/);
assert.match(app, /window\.addEventListener\('focus',safeRefresh\);/);
assert.match(app, /setInterval\(safeRefresh,180000\)/);

console.log('TRENDOS_RETURN_TRAFFIC_QUIET_V1_PASS');
