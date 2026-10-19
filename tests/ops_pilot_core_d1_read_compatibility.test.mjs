import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CORE_READ_VERSION_V1,CORE_READ_SOURCE_V1,CORE_STATUSES_V1,
  inspectCoreD1ReadContractV1,syntheticCoreD1ReadFixtureV1
} from '../tools/ops-pilot-local-v1/core-d1-read-compatibility-v1.mjs';

const fixture=()=>syntheticCoreD1ReadFixtureV1();
const clone=x=>structuredClone(x);

test('source contract matches existing REAL Employee Core handler, not invented frontend statuses',()=>{
  const core=fs.readFileSync('cloudflare-d1/src/employee-core-native-v1.mjs','utf8');
  assert.match(core,/getRowsPageV1931/);
  assert.match(core,/serverPaged:false/);
  assert.ok(core.includes("dataSource:'employee-core-d1'"));
  assert.ok(core.includes("version:'ENTRY650_D1_EMPLOYEE_CORE_PAGE_ALIAS_V1'"));
  assert.equal(CORE_READ_VERSION_V1,'ENTRY650_D1_EMPLOYEE_CORE_PAGE_ALIAS_V1');
  assert.equal(CORE_READ_SOURCE_V1,'employee-core-d1');
  for(const status of CORE_STATUSES_V1)assert.ok(core.includes("'"+status+"'"),status);
  assert.ok(!CORE_STATUSES_V1.includes('جاري التنفيذ'));
  assert.ok(!CORE_STATUSES_V1.includes('جاهز للتسليم'));
  assert.ok(CORE_STATUSES_V1.includes('جاهز للاستلام'));
});
test('fixture aggregates native Core LINES not local order rows and NEVER authorizes production',()=>{
  const q=inspectCoreD1ReadContractV1(fixture());
  assert.equal(q.success,true);
  assert.equal(q.compatible,true);
  assert.equal(q.orderCount,2);
  assert.equal(q.lineCount,3);
  assert.equal(q.byDepartment['الليزر'],1);
  assert.equal(q.byDepartment['الطباعة'],1);
  assert.equal(q.byStatus['تحت التنفيذ'],1);
  assert.equal(q.syntheticDebtRestrictedLines,1);
  assert.equal(q.writeEnabled,false);
  assert.equal(q.statusFlowCompatible,false);
  assert.equal(q.orderToLineWriteMapping,'NOT_IMPLEMENTED');
  assert.equal(q.liveBackendConnected,false);
  assert.equal(q.productionVerified,false);
  assert.equal(q.financeRelease,'NO_GO');
  assert.equal(q.deliveryRelease,'NO_GO');
  assert.equal(q.zeroGoogleComplete,false);
  assert.ok(q.blockers.includes('NO_CROSS_SYSTEM_SINGLE_WRITER'));
  assert.ok(q.blockers.includes('NO_FINANCE_DELIVERY_CLEARANCE'));
  assert.doesNotMatch(JSON.stringify(q),/DEMO-CORE-L|DEMO-CORE-O|customerPhone|customer|debtAmount/);
});
test('wrong version, missing pagination marker, unknown source and empty/oversized rows fail closed',()=>{
  for(const changed of [
    {version:'unknown'},
    {dataSource:'google-sheet'},
    {serverPaged:true},
    {serverPaged:undefined},
    {success:false},
    {rows:[]},
    {rows:Array.from({length:501},()=>fixture().rows[0])}
  ]){
    const x={...fixture(),...changed};
    const q=inspectCoreD1ReadContractV1(x);
    assert.equal(q.success,false,JSON.stringify(changed).slice(0,120));
    assert.equal(q.orderCount,0);
    assert.equal(q.lineCount,0);
    assert.equal(q.writeEnabled,false);
    assert.equal(q.financeRelease,'NO_GO');
  }
});
test('native line provenance and status must be explicit, fail-closed to unsafe or missing fields',()=>{
  const cases=[
    {status:'جاهز للتسليم'},
    {status:'جاري التنفيذ'},
    {status:'UNRECOGNIZED'},
    {sourceKind:'legacy-google'},
    {cloudNative:false},
    {writeAuthority:'apps-script'},
    {deliveryDebtRestricted:undefined},
    {lineId:''},
    {orderId:''},
    {department:''}
  ];
  for(const patch of cases){
    const x=fixture();
    Object.assign(x.rows[0],patch);
    const q=inspectCoreD1ReadContractV1(x);
    assert.equal(q.success,false,JSON.stringify(patch));
    assert.equal(q.code,'CORE_ROW_PROVENANCE_OR_STATE_UNVERIFIED',JSON.stringify(patch));
  }
});
test('duplicate lineId prevents double-counting across one or multiple orders',()=>{
  const x=fixture();
  x.rows[1].lineId=x.rows[0].lineId;
  const q=inspectCoreD1ReadContractV1(x);
  assert.equal(q.success,false);
  assert.equal(q.code,'CORE_DUPLICATE_LINE_ID');
});
test('untrusted personal fields are never included, and positive debt hold does not clear delivery',()=>{
  const x=fixture();
  x.rows[0].customer='SECRET_FAKE_NAME';
  x.rows[0].customerPhone='01000000000';
  x.rows[0].notes='SENSITIVE_FAKE_NOTE';
  x.rows[0].debtAmount=0;
  const q=inspectCoreD1ReadContractV1(x);
  assert.equal(q.success,true);
  const out=JSON.stringify(q);
  assert.doesNotMatch(out,/SECRET_FAKE_NAME|01000000000|SENSITIVE_FAKE_NOTE|DEMO-CORE/);
  assert.equal(q.deliveryRelease,'NO_GO');
  assert.equal(q.syntheticDebtRestrictedLines,1);
});
