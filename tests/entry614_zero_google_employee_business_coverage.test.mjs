import assert from 'node:assert/strict';
import fs from 'node:fs';

const inv=fs.readFileSync('tests/entry609_native_auth_cutover_inventory.test.mjs','utf8');
const core=fs.readFileSync('cloudflare-d1/src/employee-core-native-v1.mjs','utf8');
const coreSql=fs.readFileSync('cloudflare-d1/migrations/0016_employee_core_zero_google_v1.sql','utf8');
const currentOrdersSql=fs.readFileSync('cloudflare-d1/migrations/0017_employee_core_current_orders_v1.sql','utf8');
const ops=fs.readFileSync('cloudflare-d1/src/employee-ops-native-v1.mjs','utf8');
const content=fs.readFileSync('tests/entry614_employee_content_native.test.mjs','utf8');
const comms=fs.readFileSync('tests/entry614_employee_comms_native.test.mjs','utf8');
const accounting=fs.readFileSync('tests/entry614_employee_accounting_native.test.mjs','utf8');
const edge=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const runtime=fs.readFileSync('cloudflare-d1/src/t12-operational-runtime-handler.mjs','utf8');
const index=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');

function arrayFrom(source,name){
  const m=source.match(new RegExp('const\\s+'+name+'\\s*=\\s*\\[([\\s\\S]*?)\\];'));
  assert.ok(m,'missing '+name);
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);
}
const active=arrayFrom(inv,'activeLegacy');
assert.equal(active.length,46);

const opsActions=['attendanceV1','attendanceClockinV1','hrV1','cleaningV1','pressControlV1'];
const contentActions=arrayFrom(content,'actions');
const commsActions=arrayFrom(comms,'actions');
const accountingActions=arrayFrom(accounting,'actions');
const coreActions=[
  'archiveDeliveredDepartmentV1926','bulkUpdateDepartmentStatusV1926',
  'getActivityLog','getDashboard','getRows','getTrendMasterCenterV1931'
];
const covered=new Set([...opsActions,...contentActions,...commsActions,...accountingActions,...coreActions]);
assert.equal(covered.size,46);
assert.deepEqual(active.filter(a=>!covered.has(a)),[]);

for(const a of coreActions) assert.ok(core.includes("'"+a+"'"),'core action missing: '+a);
for(const a of opsActions) assert.ok(ops.includes("'"+a+"'"),'ops action missing: '+a);

assert.match(coreSql,/ENTRY614_EMPLOYEE_CORE_V1/,'core control marker missing');
assert.match(coreSql,/mode TEXT NOT NULL CHECK\(mode IN \('OFF','READONLY','GENERAL'\)\)/);
assert.match(coreSql,/VALUES\(1,'ENTRY614_EMPLOYEE_CORE_V1','OFF',0,1\)/);
assert.match(coreSql,/employee_core_archive_orders_v1/);
assert.match(coreSql,/employee_core_archive_lines_v1/);
assert.match(coreSql,/employee_core_delivery_restrictions_v1/);
assert.match(coreSql,/employee_core_request_ledger_v1/);

for(const [name,source] of [['ops',ops],['core',core]]) {
  assert.doesNotMatch(source,/sheet_rows|sheet_catalog|sheet_staging/,name+': runtime sheet mirror dependency must be zero');
  assert.doesNotMatch(source,/script\.google\.com|docs\.google\.com|SpreadsheetApp|DriveApp|UrlFetchApp|APPS_SCRIPT_API_URL/,name+': direct Google dependency must be zero');
}
assert.match(currentOrdersSql,/employee_core_orders_v1/);
assert.match(currentOrdersSql,/employee_core_lines_v1/);
assert.match(core,/googleBusinessCalls:0/);
assert.match(core,/appsScriptBusinessAuthority:false/);
assert.doesNotMatch(core,/DELETE FROM t12_prod_orders|DELETE FROM t12_prod_lines/);

assert.match(index,/employee-core-native-v1\.mjs/);
assert.match(index,/isEmployeeCoreNativePath\(path\)/);

assert.match(edge,/action === 'updateLine'/);
assert.match(edge,/action === 'markCustomerNotified'/);
assert.match(runtime,/const UPDATE_PATH=BASE\+'\/update'/);
assert.match(runtime,/const NOTIFY_PATH=BASE\+'\/notify'/);
assert.doesNotMatch(runtime,/script\.google\.com|SpreadsheetApp|DriveApp/);

console.log('ENTRY614_ZERO_GOOGLE_EMPLOYEE_BUSINESS_COVERAGE=PASS');
console.log('ENTRY614_ACTIVE_LEGACY_TOP_LEVEL=46');
console.log('ENTRY614_NATIVE_FAMILY_COVERED_TOP_LEVEL=46');
console.log('ENTRY614_UNCOVERED_ACTIVE_TOP_LEVEL=0');
console.log('ENTRY614_HYBRID_UPDATE_NOTIFY_CLOUD_RUNTIME=YES');
console.log('ENTRY614_CORE_GOOGLE_BUSINESS_CALLS=0');
console.log('ENTRY614_RUNTIME_SHEET_MIRROR_DEPENDENCY=0');
console.log('ENTRY614_CURRENT_ORDER_AUTHORITY=D1_NATIVE');
console.log('ENTRY614_CORE_CONTROL_DEFAULT=OFF');
console.log('ENTRY614_PRODUCTION_MUTATION=NO');
