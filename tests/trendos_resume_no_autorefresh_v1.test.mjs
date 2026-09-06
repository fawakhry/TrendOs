import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('trendos-resume-no-autorefresh-v1.js', 'utf8');
let nativeClicks = 0;
let timers = [];

function HTMLElement() {}
HTMLElement.prototype.click = function () { nativeClicks += 1; };

const liveStatus = { textContent: 'تحديث آمن تلقائي كل 3 دقائق عند عدم وجود نموذج مفتوح' };
const context = {
  window: {
    HTMLElement,
    MATBAGY_DISABLE_RETURN_AUTO_REFRESH_V1: true
  },
  document: {
    readyState: 'complete',
    getElementById(id) { return id === 'liveStatus' ? liveStatus : null; },
    addEventListener() {}
  },
  HTMLElement,
  Date,
  Error,
  String,
  setTimeout(fn) { timers.push(fn); return timers.length; }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.Date = Date;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'trendos-resume-no-autorefresh-v1.js' });

const refreshButton = Object.create(HTMLElement.prototype);
refreshButton.id = 'refreshBtn';
const otherButton = Object.create(HTMLElement.prototype);
otherButton.id = 'otherBtn';

function safeRefresh() { refreshButton.click(); }
function requiredAfterSaveRefresh() { refreshButton.click(); }

safeRefresh();
assert.equal(nativeClicks, 0, 'legacy safeRefresh must be suppressed');
assert.ok(context.window.__TRENDOS_LAST_SUPPRESSED_SAFE_REFRESH__, 'suppression marker must be set');

requiredAfterSaveRefresh();
assert.equal(nativeClicks, 1, 'non-safeRefresh programmatic refresh must still work');

refreshButton.click();
assert.equal(nativeClicks, 2, 'normal refresh button click method must still work');

otherButton.click();
assert.equal(nativeClicks, 3, 'other buttons must be untouched');

assert.equal(context.window.TrendOSResumeNoAutoRefreshV1.enabled, true);
assert.equal(context.window.TrendOSResumeNoAutoRefreshV1.mode, 'suppress-legacy-safeRefresh-only');
assert.ok(liveStatus.textContent.includes('التحديث التلقائي عند الرجوع متوقف'));

console.log('TRENDOS_RESUME_NO_AUTO_REFRESH_V1_PASS');
