import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = process.env.TRENDOS_TEST_ROOT || process.cwd();
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(app, /function preserveFlyPrintAcrossMissingFields\(previousRows, nextRows\)/);
assert.match(app, /state\.rows = preserveFlyPrintAcrossMissingFields\(state\.rows, nextRows\);/);
assert.match(index, /app\.js\?v=trendos-02cv-flylane-20260906c/);
assert.doesNotMatch(index, /app\.js\?v=trendos-02cv-statusux-20260906b/);

const start = app.indexOf('  function preserveFlyPrintAcrossMissingFields(');
const end = app.indexOf('\n\n  function numericAmount', start);
assert.ok(start >= 0 && end > start, 'helper source boundaries');
const helperSource = app.slice(start, end);

const ctx = {
  text: (v) => String(v == null ? '' : v),
  isFlyPrint: (value) => {
    const v = String(value == null ? '' : value).trim().toLowerCase();
    return ['نعم','true','1','on','طباعة على الطاير','طباعة ع الطاير','على الطاير','ع الطاير'].includes(v);
  }
};
vm.createContext(ctx);
vm.runInContext(helperSource + '\nthis.preserve = preserveFlyPrintAcrossMissingFields;', ctx);
const preserve = ctx.preserve;

const previous = [
  { lineId: '1001', flyPrint: 'نعم', quickPrint: 'نعم' },
  { lineId: '1002', flyPrint: 'لا', quickPrint: 'لا' },
  { lineId: '1003', flyPrint: 'نعم' }
];

const missingFields = preserve(previous, [
  { lineId: '1001', status: 'تحت التنفيذ' },
  { lineId: '1002', status: 'تحت التنفيذ' },
  { lineId: '9999', status: 'تحت التنفيذ' }
]);
assert.equal(missingFields[0].flyPrint, 'نعم', 'known affirmative marker survives a source lane that omits fly fields');
assert.equal(missingFields[0].quickPrint, 'نعم');
assert.equal(Object.prototype.hasOwnProperty.call(missingFields[1], 'flyPrint'), false, 'negative previous state is not invented');
assert.equal(Object.prototype.hasOwnProperty.call(missingFields[2], 'flyPrint'), false, 'unmatched identity is not invented');

const explicitNo = preserve(previous, [{ lineId: '1001', flyPrint: 'لا', quickPrint: 'لا' }]);
assert.equal(explicitNo[0].flyPrint, 'لا', 'explicit new source value remains authoritative');
assert.equal(explicitNo[0].quickPrint, 'لا');

const explicitBlank = preserve(previous, [{ lineId: '1001', flyPrint: '', quickPrint: '' }]);
assert.equal(explicitBlank[0].flyPrint, '', 'explicit blank is respected and not overwritten');

const noStableId = preserve([{ orderId: 'O1', flyPrint: 'نعم' }], [{ orderId: 'O1' }]);
assert.equal(Object.prototype.hasOwnProperty.call(noStableId[0], 'flyPrint'), false, 'rowNumber/orderId fallback is not used for marker carry-forward');

const arabicExplicit = preserve(previous, [{ lineId: '1003', 'طباعة على الطاير': 'لا' }]);
assert.equal(Object.prototype.hasOwnProperty.call(arabicExplicit[0], 'flyPrint'), false, 'Arabic explicit source field is respected');

console.log('PERF_CF_02CV_FLYPRINT_LANE_STABILITY_PASS');
