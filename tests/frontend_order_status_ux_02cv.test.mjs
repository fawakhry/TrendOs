import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.TRENDOS_TEST_ROOT ? path.resolve(process.env.TRENDOS_TEST_ROOT) : process.cwd();
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(app, /function statusBadges\(r\)[\s\S]*?⚡ طباعة على الطاير/);
assert.match(app, /"<td class=\\"status-cell\\">" \+ statusBadges\(r\) \+ statusSelect\(r\.status\) \+ "<\/td>" \+/);

const saveStart = app.indexOf('async function saveLine(row, tr)');
assert.ok(saveStart >= 0, 'saveLine must exist');
const saveEnd = app.indexOf('\n  function ', saveStart + 1);
const saveSource = app.slice(saveStart, saveEnd > saveStart ? saveEnd : saveStart + 6000);
assert.match(saveSource, /row\.status = status;[\s\S]*?applyFiltersAndRender\(false\);[\s\S]*?setLoading\("تم حفظ التعديل في الشيت\."\);/);
assert.doesNotMatch(saveSource, /loadRows\(true\);/);
assert.match(saveSource, /if \(!res\.success\)/, 'failed writes must still be handled before local success render');

assert.match(index, /app\.js\?v=trendos-02cv-statusux-20260906b/);
assert.doesNotMatch(index, /app\.js\?v=trendos-02cu-resume-20260906a/);

console.log('PERF_CF_02CV_ORDER_STATUS_UX_PASS');
