import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs'), 'utf8').trimEnd();

const action = 'cloudWriteReconcileDryRunV1';
const routeLine = `    else if (action === "${action}") result = trendosCloudWriteReconcileDryRunV1_(e);`;
const helperFunction = 'function trendosCloudWriteReconcileDryRunV1_(e) {';
const marker = '/*********************** PERF-CF-02AO / APPS SCRIPT V150 DRY-RUN ONLY ***********************/';

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

assert.equal(count(code, routeLine), 1, 'V150 dry-run route must exist exactly once');
assert.equal(count(code, helperFunction), 1, 'V150 dry-run helper must exist exactly once');
assert.equal(count(code, marker), 1, 'V150 append-only marker must exist exactly once');

const doGetStart = code.indexOf('function doGet(e) {');
const doPostStart = code.indexOf('function doPost(e) {');
const routeIndex = code.indexOf(routeLine);
assert.ok(doGetStart >= 0 && doPostStart > doGetStart, 'doGet/doPost boundaries must exist');
assert.ok(routeIndex > doGetStart && routeIndex < doPostStart, 'dry-run route must be inside doGet only');

const healthIndex = code.indexOf('    else if (action === "health") result = healthCheck_();', doGetStart);
assert.ok(healthIndex >= 0 && routeIndex > healthIndex, 'dry-run route must follow the stable health anchor');

assert.ok(code.includes('else if (action) result = doGet({ parameter: Object.assign({}, e.parameter || {}, payload), requestMethod: "POST", __returnRawV1922: true });'), 'doPost fallback must continue routing POST payloads through doGet');
assert.ok(code.trimEnd().endsWith(helper), 'dry-run helper must be appended unchanged at the end of Code.gs');

const helperSection = code.slice(code.lastIndexOf(marker));
const forbiddenMutationPatterns = [
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.clear(?:Content|Format|DataValidations)?\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.insertRow(?:After|Before)?\s*\(/,
  /\.insertRows(?:After|Before)?\s*\(/,
  /\.setNumberFormat\s*\(/,
  /\.setFormula\s*\(/,
  /\.setFormulas\s*\(/,
  /SpreadsheetApp\.flush\s*\(/,
  /\bensureHeader_\s*\(/,
  /\bappendByHeaders_\s*\(/,
  /\bupdateByHeaders_\s*\(/,
  /UrlFetchApp\./,
  /DriveApp\./
];
for (const pattern of forbiddenMutationPatterns) {
  assert.equal(pattern.test(helperSection), false, `V150 helper contains forbidden side effect: ${pattern}`);
}

assert.match(helperSection, /dryRun=true is required/);
assert.match(helperSection, /TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET/);
assert.match(helperSection, /CW-STAGE-/);
assert.match(helperSection, /sheetsWritten:\s*false/);
assert.match(helperSection, /mutationCount:\s*0/);

console.log('Apps Script V150 Dry-Run Router: SINGLE ROUTE + APPEND-ONLY HELPER + POST FALLBACK + NO MUTATIONS PASS');
