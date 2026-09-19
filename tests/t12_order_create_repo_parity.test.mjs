import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../Code.gs', import.meta.url), 'utf8');
const start = source.indexOf('function createManualOrder_(e)');
assert(start >= 0, 'createManualOrder_ missing from repository baseline');
const end = source.indexOf('/************************************************************\n * V1932 Duplicate Line Audit/Repair', start);
assert(end > start, 'createManualOrder_ end marker missing');
const fn = source.slice(start, end);

const markers = {
  auth: /authorize_\(p\.username,\s*p\.token\)/,
  createPermission: /canCreateOrder_\(auth\.user\)/,
  lock: /LockService\.getScriptLock\(\)/,
  lockWait: /waitLock\(30000\)/,
  requestKey: /trendosV1908RequestKey_\(p\)/,
  savedReplay: /trendosV1908ReadSavedResponse_/,
  customerIdentity: /trendosV1903IsExternal_/,
  debtLookup: /findCustomerInfoByName_|debtDeliveryRestrictionMapV1931_/,
  departmentNormalization: /department === 'مكبس'/,
  duplicateGuard: /trendosV1908RecentDuplicate_/,
  openOrderReuse: /trendosV1922FindOpenOrder_/,
  businessOrderAllocation: /makeOrderId_\(lines, now, true\)/,
  lineNumberAllocation: /trendosV1922NextLineNumber_/,
  summaryWrite: /upsertOrderSummary_\(common\)/,
  lineWrite: /appendLine_\(/,
  summaryResync: /syncOrderFromLines_\(orderId\)/,
  activityLog: /appendActivityLog_\(/,
  messageQueue: /queueOrderStatusMessageV1931_\(/,
  dataVersion: /trendosBumpDataVersionV1931_\(\)/,
  savedResponse: /trendosV1908SaveResponse_\(/,
  lockRelease: /releaseLock\(\)/
};
for (const [name, re] of Object.entries(markers)) assert(re.test(fn), 'missing canonical create marker: ' + name);

assert.match(source, /function trendosV1908PropKey_\(requestKey\)/);
assert.match(source, /TRENDOS_CREATE_ORDER_V1908_/);
assert.match(source, /PropertiesService\.getScriptProperties\(\)\.setProperty\(trendosV1908PropKey_/);
assert.equal(/deleteProperty\(trendosV1908PropKey_/.test(source), false,
  'Repository baseline unexpectedly gained cleanup; re-review quota semantics before relying on this assertion.');

const multi = /department === 'متعدد الأقسام'[\s\S]{0,600}?department: 'طباعة'[\s\S]{0,300}?department: 'ليزر'/;
assert(multi.test(fn), 'multi-department split contract missing');
assert.match(fn, /const lineId = orderId \+ '-' \+ lineNo/);
assert.match(fn, /reusedOpenOrder: reusedOrder/);
assert.match(fn, /deliveryDebtRestricted:/);
assert.match(fn, /customerMode:/);

console.log('T12 repository createManualOrder parity markers PASS; markers=' + Object.keys(markers).length);
console.log('T12 repository risk marker: PropertiesService V1908 saved-response has no same-key cleanup in repo baseline.');
