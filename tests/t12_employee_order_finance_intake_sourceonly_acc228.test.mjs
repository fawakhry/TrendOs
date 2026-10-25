import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ACC235_ISOLATED_SCHEMA as OUTBOX_SCHEMA,ACC235_SIGNED_OUTBOX_POLICY as OUTBOX_POLICY,persistOriginalSignedFixtureOnly as persistSigned,reserveSignedFixtureForSimulatedRetry as reserveSigned,releaseUnconfirmedFixtureLease as releaseSigned,isolateDeadLetterFixtureOnly as deadSigned} from '../cloudflare-d1/src/t12-finance-signed-outbox-acc235-offline.mjs';

import {
 buildT12SignedOrderCreatedSourceOnly as signOrder,
 verifyT12SignedOrderCreatedSourceOnly as verifyOrder,
 T12_FINANCE_ORDER_CREATED_POLICY as SIGNER_POLICY
} from '../cloudflare-d1/src/t12-finance-connector-v1-order-created-sourceonly.mjs';
import {
 inspectT12EmployeeOrderFinanceCandidate as inspect,
 T12_EMPLOYEE_INTAKE_ORDER_SQL as ORDER,
 T12_EMPLOYEE_INTAKE_LINES_SQL as LINES,
 T12_EMPLOYEE_INTAKE_ACTIVITY_SQL as ACTIVITY,
 T12_EMPLOYEE_INTAKE_OUTBOX_SQL as OUTBOX,
 T12_EMPLOYEE_INTAKE_RUNTIME_SQL as RUNTIME,
 T12_EMPLOYEE_FINANCE_INTAKE_POLICY as POLICY
} from '../cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs';
import {
 previewOriginalT12AccountingLineageACC242 as previewLineage,
 ACC242_POLICY,ACC242_MAX_ACCOUNTING_ROWS
} from '../cloudflare-d1/src/t12-easystore-dept-lineage-preview-acc242-sourceonly.mjs';
import {
 verifyACC243FakeSignedLineApprovals as verifyFakeLineApprovals,
 ACC243_POLICY
} from '../cloudflare-d1/src/t12-finance-line-approved-acc243-fixture-verify.mjs';
import {
 storeACC244FakeLineApprovals as storeFakeApprovals,
 ACC244_FIXTURE_SCHEMA,ACC244_POLICY
} from '../cloudflare-d1/src/t12-finance-approval-inbox-acc244-fixture.mjs';
const C='CUS-FAKE-228',ORDER_ID='4323',KEY='cld1_1800000000000_EMPLOYEE228_TEST0001';
const A='service-actor-228';
function fixture(lanes=2,skipCapture=false){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0005_t12_production_create_canary.sql',
    '0006_t12_operational_runtime.sql',
    '0008_t12_customer_master.sql',
    '0035_t12_order_customer_at_create_sourceonly_v1.sql']){
  raw.exec(readFileSync('cloudflare-d1/migrations/'+file,'utf8'));
 }
 raw.prepare("INSERT INTO t12_customers (customer_id,customer_name,customer_name_key,source,version) VALUES (?,'FAKE CLIENT','fake client','cloud-native',1)").run(C);
 raw.prepare("INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,?, 'FAKE_POLICY','{}',?,'COMMITTED')").run(KEY,A,ORDER_ID);
 raw.prepare("INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,source,notes,actor) VALUES (?,?,'external','FAKE CLIENT','01000000000','999002',?,'عادي','طلب جديد','T12 General Create','',?)").run(ORDER_ID,KEY,lanes===2?'متعدد الأقسام':'طباعة',A);
 const rows=[
   {department:'طباعة',who:'وائل',name:'FAKE MUG - طباعة'},
   {department:'ليزر',who:'جابر',name:'FAKE MUG - ليزر'}];
 for(let i=0;i<lanes;i++){
  const l=rows[i];
  raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES (?,?,?,?,?,?,?,1,'عادي','طلب جديد',0,0)")
   .run(ORDER_ID+'-'+String(i+1).padStart(2,'0'),ORDER_ID,KEY,i+1,l.department,l.who,l.name);
 }
 if(!skipCapture){
 raw.exec("UPDATE t12_order_customer_at_create_control_v1 SET mode='ISOLATED'");
 raw.prepare("INSERT INTO t12_order_customer_at_create_v1 (order_id,request_key,customer_id,external_customer_id,customer_version,actor_subject,evidence_ref,selector_role,selector_session_sha256,selector_issued_at,selector_expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  .run(ORDER_ID,KEY,C,'999002',1,A,'FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE',
      'service','a'.repeat(64),1800000000,1800000600);
 }


 // ACC229: emulate the ORIGINAL T12 writer's existing canonical_json shape,
 // including at-create signed selector source and exact old order line payload.
 const canonical={
  actor:A,policyEpoch:'FAKE_POLICY',requestKey:KEY,
  identity:{mode:'external',customerName:'FAKE CLIENT',customerPhone:'01000000000',externalCustomerId:'999002'},
  order:{department:lanes===2?'متعدد الأقسام':'طباعة',priority:'عادي',status:'طلب جديد',
   source:'T12 General Create',notes:'',heatPress:'لا',flyPrint:'لا'},
  lines:rows.slice(0,lanes).map((l,i)=>({
    ordinal:i+1,department:l.department,assignedTo:l.who,itemName:l.name,
    qty:1,priority:'عادي',status:'طلب جديد',heatPress:'لا',flyPrint:'لا'
  })),
  activityPlan:{requestKey:KEY,eventType:'order-create-intent'},
  queuePlans:rows.slice(0,lanes).map(l=>({
   requestKey:KEY,department:l.department,assignedTo:l.who,
   eventType:'trend-master-status-intent'
  }))
 };
 if(!skipCapture)canonical.sourceCapture={
  customerId:C,externalCustomerId:'999002',customerVersion:1,
  evidenceRef:'FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE',
  selectorRole:'service',selectorSessionSha256:'a'.repeat(64),
  selectorIssuedAt:1800000000,selectorExpiresAt:1800000600
 };
 raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?')
  .run(JSON.stringify(canonical),KEY);

 // The ORIGINAL T12 writer inserts one matching operational activity and
 // one per-line outbox row within its existing atomic create transaction.
 raw.prepare("INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create',?)")
  .run(KEY,ORDER_ID,JSON.stringify(canonical.activityPlan));
 for(let i=0;i<lanes;i++){
  raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,?,? ,?,'trend-master-status-intent','pending',?)")
   .run(KEY,'queue:'+String(i+1).padStart(2,'0'),ORDER_ID,
    ORDER_ID+'-'+String(i+1).padStart(2,'0'),JSON.stringify(canonical.queuePlans[i]));
 }
 // ACC234: fixed original create-time in disposable SQLite test fixture.
 for(const table of ['t12_prod_request_ledger','t12_prod_orders',
  't12_prod_lines','t12_prod_events','t12_prod_outbox']){
  raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'");
 }
 let batches=0;
 const db={
  prepare(sql){
   assert.ok([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME].includes(sql),'no arbitrary SQL');
   return {bind(...args){
    return {kind:sql,params:args,first(){throw Error('UNSAFE_SEPARATE_FIRST')},
      all(){throw Error('UNSAFE_SEPARATE_ALL')}};
   }};
  },
  async batch(list){
   batches++;
   raw.exec('SAVEPOINT acc228_read');
   try{return list.map(x=>({success:true,results:raw.prepare(x.kind).all(...x.params)}));}
   finally{raw.exec('RELEASE SAVEPOINT acc228_read');}
  }
 };
 return {raw,db,batches:()=>batches,dispose(){raw.close()}};
}
async function withFixture(fn,lanes=2,skipCapture=false){
 const x=fixture(lanes,skipCapture);try{return await fn(x);}finally{x.dispose();}
}
const request=x=>inspect({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C});
// ACC242: the ORIGINAL T12 five-query inspector on one SQLite, and the
// ORIGINAL finance migrations on a DIFFERENT disposable SQLite. These are
// accounting-side approval row snapshots, NOT signed operational line events.
function acc242FinanceFixture(orderId=ORDER_ID){
 const raw=new DatabaseSync(':memory:');
 const migrations=[
   '0015_employee_accounting_zero_google_v1.sql',
   '0020_employee_accounting_party_master_v1.sql',
   '0021_employee_accounting_material_dimensions_v1.sql',
   '0022_employee_accounting_day_ops_v1.sql',
   '0023_employee_accounting_command_audit_v1.sql',
   '0024_employee_accounting_party_balances_v1.sql',
   '0025_employee_accounting_final_reversal_day_close_v1.sql',
   '0026_employee_accounting_tx_guard_v1.sql',
   '0027_employee_accounting_direct_sale_cost_v1.sql',
   '0028_employee_accounting_write_canary_v1.sql',
   '0029_employee_accounting_canary_mode_v1.sql',
   '0030_employee_accounting_write_canary_budget_v1.sql',
   '0031_employee_accounting_customer_advance_credit_v1.sql'
 ];
 for(const name of migrations)raw.exec(readFileSync('cloudflare-d1/migrations/'+name,'utf8'));
 let reads=0;
 const financeDb={prepare(sql){
   assert.match(sql,/^SELECT accounting_line_id AS accountingLineId,/);
   assert.match(sql,/FROM employee_accounting_dept_lines_v1 WHERE order_id=/);
   assert.doesNotMatch(sql,/customer_name|sale_price|amount|password|session_token|raw_json|UPDATE|INSERT|DELETE/i);
   reads++;
   return {bind(...args){return {
     async all(){return {results:raw.prepare(sql).all(...args)};}
   };}};
 }};
 function add({accountingId='FAKE-ACC242-P-1',sourceLine=orderId+'-01',
   dept='طباعة',order=orderId,status='معتمد من القسم',
   actor='FAKE-WAEL',batch='FAKE-APPROVAL-BATCH',invoice='',
   approvedAt=1800000500000}={}){
   raw.prepare(`INSERT INTO employee_accounting_dept_lines_v1
    (accounting_line_id,order_id,line_id,department,approval_status,approved_by,
     approved_at_ms,approval_batch_id,stock_deducted,final_invoice_no,version)
    VALUES(?,?,?,?,?,?,?,?,1,?,2)`)
    .run(accountingId,order,sourceLine,dept,status,actor,approvedAt,batch,invoice);
 }
 return {raw,financeDb,add,reads:()=>reads,dispose:()=>raw.close()};
}
async function acc242WithBoth(fn,lanes=2){
 return withFixture(async x=>{
   const fin=acc242FinanceFixture();
   try{return await fn(x,fin);}finally{fin.dispose();}
 },lanes);
}
test('ACC242 original source + ORIGINAL isolated finance migrations match exact Print/Laser rows WITHOUT finance grant',()=>acc242WithBoth(async(x,fin)=>{
 fin.add();fin.add({accountingId:'FAKE-ACC242-L-1',sourceLine:ORDER_ID+'-02',dept:'ليزر',actor:'FAKE-GABER'});
 const source=await request(x);
 const sourceChanges=x.raw.prepare('SELECT total_changes() AS n').get().n;
 const financeChanges=fin.raw.prepare('SELECT total_changes() AS n').get().n;
 const r=await previewLineage({sourceResponse:source,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.originalSourceLineCount,2);
 assert.equal(r.originalAccountingRowCount,2);
 assert.equal(r.originalAccountingLineageShapeMatched,true);
 assert.equal(r.nativeDepartmentApprovalRowsObserved,true);
 for(const k of ['signedLineApprovalsVerified','ownerAttested','independentSourceAuthentication',
   'customerIdentityFinanciallyVerified','canRequestInvoice','canPostCash','financeAuthorized','connectorEventPublished'])
   assert.equal(r[k],false,k);
 assert.equal(r.financeRelease,'NO_GO');
 assert.equal(ACC242_POLICY.workerWired,false);
 assert.equal(ACC242_POLICY.financeWrites,false);
 assert.equal(ACC242_MAX_ACCOUNTING_ROWS,100);
 assert.equal(fin.reads(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() AS n').get().n,sourceChanges);
 assert.equal(fin.raw.prepare('SELECT total_changes() AS n').get().n,financeChanges);
 assert.equal(fin.raw.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='t12_customers'").get().n,0);
 assert.equal(x.raw.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='employee_accounting_dept_lines_v1'").get().n,0);
 assert.doesNotMatch(JSON.stringify(r),/FAKE CLIENT|FAKE-WAEL|FAKE-GABER|01000000000/);
}));
test('ACC242 original 2 lanes permit multiple accounting rows per ONE exact source line, no money',()=>acc242WithBoth(async(x,fin)=>{
 fin.add();fin.add({accountingId:'FAKE-ACC242-P-2'});
 fin.add({accountingId:'FAKE-ACC242-L-1',sourceLine:ORDER_ID+'-02',dept:'ليزر'});
 const r=await previewLineage({sourceResponse:await request(x),financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.originalAccountingRowCount,3);
 assert.equal(r.canRequestInvoice,false);
}));
test('ACC242 refuses missing department and unmapped accounting source lines',()=>acc242WithBoth(async(x,fin)=>{
 fin.add();
 const src=await request(x);
 const missing=await previewLineage({sourceResponse:src,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(missing.code,'FINANCE_APPROVAL_MISSING_FOR_SOURCE_LINE');
 fin.add({accountingId:'FAKE-ACC242-X',sourceLine:'UNRELATED_LINE',dept:'ليزر'});
 const extra=await previewLineage({sourceResponse:src,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(extra.code,'FINANCE_ROW_CROSS_ORDER_OR_LINEAGE_MISMATCH');
}));
test('ACC242 refuses swapped departments and another order borrowing same source line',()=>acc242WithBoth(async(x,fin)=>{
 fin.add({dept:'ليزر'});
 const src=await request(x);
 assert.equal((await previewLineage({sourceResponse:src,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C})).code,
  'FINANCE_ROW_CROSS_ORDER_OR_LINEAGE_MISMATCH');
 fin.raw.exec('DELETE FROM employee_accounting_dept_lines_v1');
 fin.add({order:'OTHER_ORDER'});
 assert.equal((await previewLineage({sourceResponse:src,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C})).code,
  'FINANCE_ROW_CROSS_ORDER_OR_LINEAGE_MISMATCH');
}));
test('ACC242 refuses unapproved, already invoiced, or unqualified department approval metadata',()=>acc242WithBoth(async(x,fin)=>{
 fin.add();fin.add({accountingId:'FAKE-ACC242-L-1',sourceLine:ORDER_ID+'-02',dept:'ليزر'});
 const src=await request(x);
 const inspectFinance=()=>previewLineage({sourceResponse:src,financeDb:fin.financeDb,
   orderId:ORDER_ID,expectedOfficialCustomerId:C});
 const cases=[
   ["UPDATE employee_accounting_dept_lines_v1 SET approval_status='قيد المراجعة' WHERE accounting_line_id='FAKE-ACC242-L-1'"],
   ["UPDATE employee_accounting_dept_lines_v1 SET approval_status='معتمد من القسم',final_invoice_no='FAKE-INVOICE-9' WHERE accounting_line_id='FAKE-ACC242-L-1'"],
   ["UPDATE employee_accounting_dept_lines_v1 SET final_invoice_no='',approved_by='' WHERE accounting_line_id='FAKE-ACC242-L-1'"],
   ["UPDATE employee_accounting_dept_lines_v1 SET approved_by='FAKE-GABER',stock_deducted=0 WHERE accounting_line_id='FAKE-ACC242-L-1'"]
 ];
 for(const [sql] of cases){
   fin.raw.exec(sql);
   const r=await inspectFinance();
   assert.equal(r.code,'FINANCE_LINE_NOT_NATIVE_APPROVED_OPEN',JSON.stringify(r));
 }
}));
test('ACC242 blocks forged source claims, unexpected ID and finance database failures',()=>acc242WithBoth(async(x,fin)=>{
 fin.add();fin.add({accountingId:'FAKE-ACC242-L-1',sourceLine:ORDER_ID+'-02',dept:'ليزر'});
 const src=await request(x);
 const read=(source,customer=C,db=fin.financeDb)=>previewLineage({sourceResponse:source,
   financeDb:db,orderId:ORDER_ID,expectedOfficialCustomerId:customer});
 assert.equal((await read(src,'WRONG-CUSTOMER')).code,'ORIGINAL_T12_SOURCE_PREVIEW_NOT_QUALIFIED');
 assert.equal((await read({status:200,body:{...src.body,officialCustomerOwnershipAttested:true}})).code,
  'ORIGINAL_T12_SOURCE_PREVIEW_NOT_QUALIFIED');
 assert.equal((await read({status:200,body:{...src.body,canRequestInvoice:true}})).code,
  'ORIGINAL_T12_SOURCE_PREVIEW_NOT_QUALIFIED');
 assert.equal((await read(src,C,{prepare(){throw new Error('offline')}})).code,
  'ORIGINAL_FINANCE_METADATA_READ_UNAVAILABLE');
 assert.equal((await read(src,C,{prepare(){return {bind(){return {all:async()=>({results:{}})}}}}})).code,
  'ORIGINAL_FINANCE_METADATA_READ_UNAVAILABLE');
}));
// ACC243: Fake signer lives ONLY inside the test. It is NOT Wael/Gaber's
// operational approver or financial authority. Distinct fake HMAC key.
const ACC243_NOW=1800000700000,ACC243_KEY_ID='ACC243_FAKE_SIGNER_ONLY';
function acc243Canonical(v){
 if(Array.isArray(v))return '['+v.map(acc243Canonical).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>
  JSON.stringify(k)+':'+acc243Canonical(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
async function acc243FakeKey(){
 return webcrypto.subtle.importKey('raw',new TextEncoder().encode(
  'FAKE_ACC243_NOT_AN_OPERATIONAL_SIGNER_'.repeat(3)),{
  name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function acc243FakeMessage({lineId,dept,actor,approvalRef,
 orderId=ORDER_ID,customerId=C,key,when=ACC243_NOW}){
 const envelope={
  contract_version:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  event_id:'t12:order_line_approved:'+lineId+':'+approvalRef,
  event_type:'order_line_approved',
  occurred_at:new Date(when).toISOString().slice(0,19)+'Z',
  source_system:'TrendOS',source_entity_type:'line',source_entity_id:lineId,
  correlation_id:orderId,
  idempotency_key:'t12:order_line_approved:'+lineId+':'+approvalRef,
  evidence_refs:['acc243:fake-approval:'+approvalRef],
  payload:{order_id:orderId,line_id:lineId,customer_id:customerId,
   department:dept,approval_ref:approvalRef,actor_ref:actor,
   fixture_only:true,financial_authority:false}
 };
 const signed=await webcrypto.subtle.sign('HMAC',key,
  new TextEncoder().encode(acc243Canonical(envelope)));
 return {key_id:ACC243_KEY_ID,algorithm:'HMAC-SHA256',envelope,
  signature:Buffer.from(signed).toString('base64url')};
}
async function acc243Context(x,fin){
 fin.add();fin.add({accountingId:'FAKE-ACC242-L-1',sourceLine:ORDER_ID+'-02',
  dept:'ليزر',actor:'FAKE-GABER'});
 const source=await request(x);
 const lineage=await previewLineage({sourceResponse:source,financeDb:fin.financeDb,
  orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(lineage.status,200,JSON.stringify(lineage));
 const key=await acc243FakeKey();
 const messages=[
  await acc243FakeMessage({lineId:ORDER_ID+'-01',dept:'طباعة',
   actor:'FAKE-WAEL',approvalRef:'FAKE-APPROVAL-PRINT-001',key}),
  await acc243FakeMessage({lineId:ORDER_ID+'-02',dept:'ليزر',
   actor:'FAKE-GABER',approvalRef:'FAKE-APPROVAL-LASER-001',key})
 ];
 const run=(changes={})=>verifyFakeLineApprovals({
  sourceResponse:source,lineagePreview:lineage,messages,verifyKey:key,
  expectedKeyId:ACC243_KEY_ID,nowMs:ACC243_NOW,
  mode:'ISOLATED_FAKE_APPROVAL_FIXTURE',...changes
 });
 return {key,source,lineage,messages,run};
}
const clone243=v=>structuredClone(v);
test('ACC243 signed fake Print/Laser V1 messages pass crypto but never grant real finance authority',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 const t12Changes=x.raw.prepare('SELECT total_changes() AS n').get().n;
 const financeChanges=fin.raw.prepare('SELECT total_changes() AS n').get().n;
 const r=await ctx.run();
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(r.fixtureSignaturesVerified,true);
 assert.equal(r.syntheticSignedLineCount,2);
 assert.equal(r.contractVersion,'ACCOUNTING_CONNECTOR_CONTRACT_V1');
 for(const k of ['independentSignerVerified','realSignedLineApprovalsVerified',
  'ownerAttested','independentEmployeeGrantsVerified','consumerReplayLedgerVerified',
  'financeAuthorized','canRequestInvoice','canPostCash','connectorEventPublished'])
   assert.equal(r[k],false,k);
 assert.equal(r.financeRelease,'NO_GO');
 assert.equal(ACC243_POLICY.workerWired,false);
 assert.equal(ACC243_POLICY.sourceRuntimeApprovalAvailable,false);
 assert.equal(x.raw.prepare('SELECT total_changes() AS n').get().n,t12Changes);
 assert.equal(fin.raw.prepare('SELECT total_changes() AS n').get().n,financeChanges);
 assert.doesNotMatch(JSON.stringify(r),/FAKE-WAEL|FAKE-GABER|FAKE-APPROVAL-|FAKE CLIENT/);
}));
test('ACC243 rejects signature tampering and valid signature with cross-order or wrong customer',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 const changed=clone243(ctx.messages);
 changed[0].envelope.payload.department='ليزر';
 assert.equal((await ctx.run({messages:changed})).code,'ORDER_CUSTOMER_DEPARTMENT_SOURCE_BINDING_MISMATCH');
 const switched=clone243(ctx.messages);
 switched[0].envelope.payload.actor_ref='FORGED-WAEL';
 assert.equal((await ctx.run({messages:switched})).code,'ACC243_SIGNATURE_TAMPERED');
 const fakeForeign=await acc243FakeMessage({lineId:ORDER_ID+'-01',dept:'طباعة',
  actor:'FAKE-WAEL',approvalRef:'FAKE-APPROVAL-PRINT-001',
  orderId:'ANOTHER_ORDER',key:ctx.key});
 assert.equal((await ctx.run({messages:[fakeForeign,ctx.messages[1]]})).code,
  'ORDER_CUSTOMER_DEPARTMENT_SOURCE_BINDING_MISMATCH');
 const fakeOtherCustomer=await acc243FakeMessage({lineId:ORDER_ID+'-01',dept:'طباعة',
  actor:'FAKE-WAEL',approvalRef:'FAKE-APPROVAL-PRINT-001',
  customerId:'CUS-OTHER',key:ctx.key});
 assert.equal((await ctx.run({messages:[fakeOtherCustomer,ctx.messages[1]]})).code,
  'ORDER_CUSTOMER_DEPARTMENT_SOURCE_BINDING_MISMATCH');
}));
test('ACC243 refuses duplicate line, duplicate approval reference and missing department',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 assert.equal((await ctx.run({messages:[ctx.messages[0],ctx.messages[0]]})).code,
  'DUPLICATED_LINE_OR_APPROVAL_IDEMPOTENCY_KEY');
 assert.equal((await ctx.run({messages:[ctx.messages[0]]})).code,
  'ACC242_ORIGINAL_LINEAGE_PREVIEW_NOT_QUALIFIED');
 const sameApproval=await acc243FakeMessage({lineId:ORDER_ID+'-02',dept:'ليزر',
  actor:'FAKE-GABER',approvalRef:'FAKE-APPROVAL-PRINT-001',key:ctx.key});
 assert.equal((await ctx.run({messages:[ctx.messages[0],sameApproval]})).code,
  'DUPLICATED_LINE_OR_APPROVAL_IDEMPOTENCY_KEY');
}));
test('ACC243 rejects unsigned, unknown fields, invoice prices and nonfixture claims',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 for(const altered of [
  m=>{m[0].signature='invalid';},
  m=>{m[0].algorithm='none';},
  m=>{m[0].envelope.payload.price=99999;},
  m=>{m[0].envelope.payload.financial_authority=true;},
  m=>{m[0].envelope.payload.fixture_only=false;},
  m=>{m[0].envelope.event_type='order_created';},
  m=>{m[0].envelope.evidence_refs=['t12:fake-masquerading-real-approval'];},
  m=>{m[0].envelope.password='fake-password';},
  m=>{m[0].key_id='untrusted-key';}
 ]){
  const bad=clone243(ctx.messages);altered(bad);
  assert.equal((await ctx.run({messages:bad})).success,false);
 }
}));
test('ACC243 enforces 5m clock window and fixture mode OFF by default',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 assert.equal((await ctx.run({mode:undefined})).code,'ACC243_DEFAULT_OFF');
 assert.equal((await ctx.run({nowMs:ACC243_NOW+301000})).code,
  'ACC243_FIXTURE_ENVELOPE_UNTRUSTED');
 assert.equal((await ctx.run({nowMs:ACC243_NOW-61000})).code,
  'ACC243_FIXTURE_ENVELOPE_UNTRUSTED');
 const old=await acc243FakeMessage({lineId:ORDER_ID+'-01',dept:'طباعة',
  actor:'FAKE-WAEL',approvalRef:'FAKE-APPROVAL-PRINT-001',
  key:ctx.key,when:ACC243_NOW-301000});
 assert.equal((await ctx.run({messages:[old,ctx.messages[1]]})).code,
  'ACC243_FIXTURE_ENVELOPE_UNTRUSTED');
}));
test('ACC243 rejects forged ACC242 success and untrusted key',()=>acc242WithBoth(async(x,fin)=>{
 const ctx=await acc243Context(x,fin);
 assert.equal((await ctx.run({lineagePreview:{...ctx.lineage,ownerAttested:true}})).code,
  'ACC242_ORIGINAL_LINEAGE_PREVIEW_NOT_QUALIFIED');
 assert.equal((await ctx.run({lineagePreview:{...ctx.lineage,financeAuthorized:true}})).code,
  'ACC242_ORIGINAL_LINEAGE_PREVIEW_NOT_QUALIFIED');
 const wrongKey=await webcrypto.subtle.importKey('raw',
  new TextEncoder().encode('DIFFERENT_FAKE_ACC243_KEY_'.repeat(3)),
  {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 assert.equal((await ctx.run({verifyKey:wrongKey})).code,'ACC243_SIGNATURE_TAMPERED');
 assert.equal((await ctx.run({sourceResponse:{...ctx.source,body:{...ctx.source.body,
  officialCustomerOwnershipAttested:true}}})).code,
  'ACC242_ORIGINAL_LINEAGE_PREVIEW_NOT_QUALIFIED');
}));
// ACC244: disposable fake ONLY consumer, separate from BOTH T12 and
// original accounting databases. A persisted record is NOT a finance write.
function acc244Db(path=':memory:'){
 const db=new DatabaseSync(path);
 db.exec(ACC244_FIXTURE_SCHEMA);
 return db;
}
async function acc244Context(x,fin,db){
 const a=await acc243Context(x,fin);
 return {a,db,store:(changes={})=>storeFakeApprovals({
  sourceResponse:a.source,lineagePreview:a.lineage,messages:a.messages,
  verifyKey:a.key,expectedKeyId:ACC243_KEY_ID,nowMs:ACC243_NOW,
  mode:'ISOLATED_FAKE_SQLITE_INBOX',fakeDb:db,...changes
 })};
}
test('ACC244 isolated inbox inserts fake approvals once and same retry changes ZERO rows',()=>acc242WithBoth(async(x,fin)=>{
 const db=acc244Db();
 try{
  const {store}=await acc244Context(x,fin,db);
  const sourceBefore=x.raw.prepare('SELECT total_changes() AS n').get().n;
  const financeBefore=fin.raw.prepare('SELECT total_changes() AS n').get().n;
  const first=await store();
  assert.equal(first.success,true,JSON.stringify(first));
  assert.equal(first.newFakeRows,2);
  assert.equal(first.deduplicatedFakeRows,0);
  assert.equal(first.canPostInvoice,false);
  assert.equal(first.canPostCash,false);
  assert.equal(first.consumerAcknowledged,false);
  assert.equal(first.productionRelease,'NO_GO');
  const second=await store();
  assert.equal(second.success,true,JSON.stringify(second));
  assert.equal(second.newFakeRows,0);
  assert.equal(second.deduplicatedFakeRows,2);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n,2);
  assert.equal(x.raw.prepare('SELECT total_changes() AS n').get().n,sourceBefore);
  assert.equal(fin.raw.prepare('SELECT total_changes() AS n').get().n,financeBefore);
  assert.equal(ACC244_POLICY.workerWired,false);
  assert.equal(ACC244_POLICY.realD1Touched,false);
  assert.equal(ACC244_POLICY.mode,'OFF');
 }finally{db.close();}
}));
test('ACC244 persistent fake inbox survives close/reopen without duplicate rows',()=>acc242WithBoth(async(x,fin)=>{
 const dir=mkdtempSync(join(tmpdir(),'acc244-fake-inbox-')),file=join(dir,'fixture-only.sqlite');
 let db;
 try{
  db=acc244Db(file);
  const ctx=await acc244Context(x,fin,db);
  assert.equal((await ctx.store()).newFakeRows,2);
  db.close();db=new DatabaseSync(file);
  const repeat=await ctx.store({fakeDb:db});
  assert.equal(repeat.success,true,JSON.stringify(repeat));
  assert.equal(repeat.newFakeRows,0);
  assert.equal(repeat.deduplicatedFakeRows,2);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n,2);
 }finally{try{db?.close();}catch{}rmSync(dir,{recursive:true,force:true});}
}));
test('ACC244 fixture signed bytes are immutable and cannot be deleted after insert',()=>acc242WithBoth(async(x,fin)=>{
 const db=acc244Db();
 try{
  const ctx=await acc244Context(x,fin,db);
  assert.equal((await ctx.store()).success,true);
  assert.throws(()=>db.exec("UPDATE acc244_fake_line_approval_inbox SET message_json='{}'"),
   /ACC244_FAKE_SIGNED_BYTES_IMMUTABLE/);
  assert.throws(()=>db.exec('DELETE FROM acc244_fake_line_approval_inbox'),
   /ACC244_FAKE_INBOX_NO_DELETE/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n,2);
 }finally{db.close();}
}));
test('ACC244 fake inbox rollback is atomic when a source line ID conflicts with stored bytes',()=>acc242WithBoth(async(x,fin)=>{
 const db=acc244Db();
 try{
  const ctx=await acc244Context(x,fin,db);
  // Prepare malicious conflicting accounting-inbox record for second line
  // only. The first line would be new; failure MUST roll it back.
  const conflicting=ctx.a.messages[1],e=conflicting.envelope,p=e.payload;
  db.prepare(`INSERT INTO acc244_fake_line_approval_inbox
    (event_id,idempotency_key,order_id,line_id,customer_id,department,
     message_json,sha256,state,created_at_ms)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    'OTHER_EVENT_FOR_SAME_SOURCE_LINE','OTHER_IDEMPOTENCY_KEY',p.order_id,
    p.line_id,p.customer_id,p.department,'{}','0'.repeat(64),
    'FAKE_STORED_NO_POST',ACC243_NOW);
  const beforeChanges=db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n;
  const result=await ctx.store();
  assert.equal(result.success,false);
  assert.equal(result.code,'ACC244_FAKE_INBOX_CONFLICT_OR_TX_FAILED');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n,beforeChanges);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox WHERE line_id=?')
    .get(ORDER_ID+'-01').n,0);
 }finally{db.close();}
}));
test('ACC244 fake inbox never accepts unverified HMAC or unknown databases/modes',()=>acc242WithBoth(async(x,fin)=>{
 const db=acc244Db(),other=new DatabaseSync(':memory:');
 try{
  const ctx=await acc244Context(x,fin,db);
  assert.equal((await ctx.store({mode:undefined})).code,'ACC244_DEFAULT_OFF');
  assert.equal((await ctx.store({fakeDb:other})).code,'ACC244_FAKE_SQLITE_MARKER_MISSING');
  const forged=clone243(ctx.a.messages);
  forged[0].envelope.payload.actor_ref='FAKE-OTHER-ACTOR';
  assert.equal((await ctx.store({messages:forged})).code,'ACC243_FAKE_SIGNED_SET_REJECTED');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM acc244_fake_line_approval_inbox').get().n,0);
 }finally{db.close();other.close();}
}));
test('new source has no HTTP endpoint, T12/finance creation, or direct D1 finance link',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const source=readFileSync('cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs','utf8');
 assert.doesNotMatch(worker,/t12-employee-order-finance-intake-sourceonly/);
 assert.doesNotMatch(source,/createT12GeneralOrder\s*\(|saveAccountingFinalInvoice\s*\(|fetch\s*\(|INSERT INTO|UPDATE\s+(employee_accounting|t12_prod)/);
 assert.equal(POLICY.workerEntryWired,false);
 assert.equal(POLICY.httpRouteAvailable,false);
 assert.equal(POLICY.usesOfficialNativeCustomerId,true);
 assert.equal(POLICY.departmentApprovalsVerified,false);
 assert.equal(POLICY.comparesOriginalT12ActivityAndOutbox,true);
 assert.equal(POLICY.comparesCurrentT12RuntimeAndLastMutation,true);
 assert.equal(POLICY.validatesOriginalCreateTimestamps,true);
 assert.equal(POLICY.financeWriteAuthorized,false);
 assert.equal(POLICY.productionRelease,'NO_GO');
});
test('committed employee T12 with immutable at-create source and 2 full lanes yields NON-FINANCIAL preview',()=>withFixture(async x=>{
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const res=await request(x);
 assert.equal(res.status,200,JSON.stringify(res));
 assert.equal(res.body.operationalSourceShapeVerified,true);
 assert.equal(res.body.officialCustomerId,C);
 assert.equal(res.body.orderId,ORDER_ID);
 assert.equal(res.body.lineCount,2);
 assert.equal(res.body.sourceCreatedAt,'2026-09-21T14:13:20Z');
 assert.deepEqual(res.body.lines.map(l=>l.department),['طباعة','ليزر']);
 assert.deepEqual(res.body.lines.map(l=>l.lineId),['4323-01','4323-02']);
 assert.equal(res.body.officialCustomerOwnershipAttested,false);
 assert.equal(res.body.canRequestInvoice,false);
 assert.equal(res.body.financeAuthorized,false);
 assert.equal(res.body.departmentApprovalsVerified,false);
 assert.equal(res.body.connectorEventPublished,false);
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 for(const secret of ['FAKE CLIENT','01000000000','999002','FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE','a'.repeat(64)]){
  assert.equal(JSON.stringify(res).includes(secret),false);
 }
}));
test('single Print department source is valid, but still no finance release',()=>withFixture(async x=>{
 const r=await request(x);
 assert.equal(r.status,200);
 assert.equal(r.body.lineCount,1);
 assert.equal(r.body.canRequestInvoice,false);
},1));
test('same-name committed T12 order without immutable customer capture is denied',()=>withFixture(async x=>{
 const r=await request(x);
 assert.equal(r.status,409);
 assert.equal(r.body.code,'OFFICIAL_CUSTOMER_CAPTURE_NOT_MATCHING_OR_UNATTESTED');
 assert.equal(r.body.financeAuthorized,false);
},1,true));
test('immutable T12 at-create source evidence cannot be removed or reassigned',()=>withFixture(async x=>{
 assert.throws(()=>x.raw.exec("DELETE FROM t12_order_customer_at_create_v1"),/ACC223_SOURCE_CAPTURE_IMMUTABLE/);
 assert.equal((await request(x)).status,200);
},1));
test('wrong exact customer ID, missing session-bound capture and wrong version fail closed',()=>withFixture(async x=>{
 assert.equal((await inspect({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:'CUS-OTHER'})).status,409);
 x.raw.exec("UPDATE t12_customers SET version=2 WHERE customer_id='CUS-FAKE-228'");
 const r=await request(x);
 assert.equal(r.status,409);
 assert.equal(r.body.code,'OFFICIAL_CUSTOMER_CAPTURE_NOT_MATCHING_OR_UNATTESTED');
}));
test('PREPARED, changed original actor, modified external customer ID are blocked',()=>withFixture(async x=>{
 for(const [sql,code] of [
  ["UPDATE t12_prod_request_ledger SET status='PREPARED'",'T12_ORDER_NOT_COMMITTED_OR_ACTOR_CONFLICT'],
  ["UPDATE t12_prod_request_ledger SET status='COMMITTED'; UPDATE t12_prod_orders SET actor='FAKE-SWAP'",'T12_ORDER_NOT_COMMITTED_OR_ACTOR_CONFLICT'],
  ["UPDATE t12_prod_orders SET actor='service-actor-228'; UPDATE t12_prod_orders SET external_customer_id='123456'",'T12_IMMUTABLE_SELECTOR_EVIDENCE_MISMATCH']
 ]){
  x.raw.exec(sql);
  const res=await request(x);
  assert.equal(res.status,409);
  assert.equal(res.body.code,code);
 }
}));
test('missing/extra/cross-order/incorrectly assigned Print+Laser lines fail closed',()=>withFixture(async x=>{
 x.raw.exec("UPDATE t12_prod_lines SET assigned_to='دخيل' WHERE line_id='4323-02'");
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
 x.raw.exec("UPDATE t12_prod_lines SET assigned_to='جابر' WHERE line_id='4323-02'");
 // The original outbox FK protects lines; remove only its fake dependent
 // record first to model a truly partial/contradictory disposable database.
 x.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:01'");
 x.raw.exec("DELETE FROM t12_prod_lines WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-01',?,?,1,'طباعة','وائل','FAKE MUG - طباعة',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 x.raw.exec("UPDATE t12_prod_lines SET created_at='2026-09-21 14:13:20' WHERE line_id='4323-01'");
 const original=JSON.parse(x.raw.prepare('SELECT canonical_json AS c FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).c);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,'queue:01',?,?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-01',JSON.stringify(original.queuePlans[0]));
 x.raw.exec("UPDATE t12_prod_outbox SET created_at='2026-09-21 14:13:20' WHERE event_key='queue:01'");
 assert.equal((await request(x)).status,200);
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-03',?,?,3,'ليزر','جابر','UNEXPECTED',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
}));
test('ACC229 detects mutated quantity, item name, priority or print flags even when old IDs stay correct',()=>withFixture(async x=>{
 for(const [change,undo] of [
  ["UPDATE t12_prod_lines SET qty=7 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET qty=1 WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET item_name='ALTERED' WHERE line_id='4323-02'",
   "UPDATE t12_prod_lines SET item_name='FAKE MUG - ليزر' WHERE line_id='4323-02'"],
  ["UPDATE t12_prod_lines SET priority='VIP' WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET priority='عادي' WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET heat_press=1 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET heat_press=0 WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET fly_print=1 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET fly_print=0 WHERE line_id='4323-01'"]
 ]){
  x.raw.exec(change);
  const result=await request(x);
  assert.equal(result.status,409,change);
  assert.equal(result.body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED',change);
  x.raw.exec(undo);
  assert.equal((await request(x)).status,200,undo);
 }
}));
test('ACC229 detects changed original customer/department/notes and even matching-name based relabel',()=>withFixture(async x=>{
 for(const [change,undo] of [
  ["UPDATE t12_prod_orders SET customer_name='SAME-NAME-OTHER-USER'",
   "UPDATE t12_prod_orders SET customer_name='FAKE CLIENT'"],
  ["UPDATE t12_prod_orders SET customer_phone='01099999999'",
   "UPDATE t12_prod_orders SET customer_phone='01000000000'"],
  ["UPDATE t12_prod_orders SET notes='EXTRA PRIVATE NOTE'",
   "UPDATE t12_prod_orders SET notes=''"],
  ["UPDATE t12_prod_orders SET department='طباعة'",
   "UPDATE t12_prod_orders SET department='متعدد الأقسام'"],
  ["UPDATE t12_prod_orders SET source='UNTRUSTED'",
   "UPDATE t12_prod_orders SET source='T12 General Create'"]
 ]){
  x.raw.exec(change);
  const result=await request(x);
  assert.equal(result.body.code,'T12_ORIGINAL_CREATE_ORDER_DRIFT',change);
  x.raw.exec(undo);
  assert.equal((await request(x)).status,200,undo);
 }
}));
test('ACC229 refuses missing/corrupted ledger intent or edited selector capture inside ledger',()=>withFixture(async x=>{
 const original=x.raw.prepare('SELECT canonical_json val FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).val;
 for(const altered of ['{}','not-valid-json',
  JSON.stringify({...JSON.parse(original),sourceCapture:{
    ...JSON.parse(original).sourceCapture,evidenceRef:'FORGED_CHANGED_SELECTOR_PROOF'
  }}),
  JSON.stringify({...JSON.parse(original),lines:[JSON.parse(original).lines[0]]})
 ]){
  x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?').run(altered,KEY);
  const res=await request(x);
  assert.equal(res.status,409,altered.slice(0,60));
  assert.equal(res.body.financeAuthorized,false);
  x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?').run(original,KEY);
  assert.equal((await request(x)).status,200);
 }
}));
test('ACC229 policy epoch drift and wrong original queue plan do not qualify source',()=>withFixture(async x=>{
 x.raw.prepare("UPDATE t12_prod_request_ledger SET policy_epoch='CHANGED_POLICY' WHERE request_key=?").run(KEY);
 assert.equal((await request(x)).body.code,'ORIGINAL_T12_CREATE_INTENT_NOT_AVAILABLE');
 x.raw.prepare("UPDATE t12_prod_request_ledger SET policy_epoch='FAKE_POLICY' WHERE request_key=?").run(KEY);
 const canonical=JSON.parse(x.raw.prepare('SELECT canonical_json AS json FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).json);
 canonical.queuePlans[1].department='طباعة';
 x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?')
   .run(JSON.stringify(canonical),KEY);
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
}));
test('ACC230 original activity event missing, corrupted or wrong type stops operational finance candidate',()=>withFixture(async x=>{
 const before=x.raw.prepare("SELECT payload_json AS p FROM t12_prod_events WHERE event_key='activity'").get().p;
 x.raw.exec("UPDATE t12_prod_events SET payload_json='{}' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
 x.raw.prepare("UPDATE t12_prod_events SET payload_json=? WHERE event_key='activity'").run(before);
 assert.equal((await request(x)).status,200);
 x.raw.exec("UPDATE t12_prod_events SET event_type='finance-post' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
 x.raw.exec("UPDATE t12_prod_events SET event_type='order-create' WHERE event_key='activity'");
 x.raw.exec("DELETE FROM t12_prod_events WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ACTIVITY_EVENT_MISSING_OR_AMBIGUOUS');
}));
test('ACC230 rejects missing or extra queue event per original Print and Laser source line',()=>withFixture(async x=>{
 x.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:02'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_OUTBOX_LINES_MISSING_OR_EXTRA');
 const original=JSON.parse(x.raw.prepare('SELECT canonical_json AS c FROM t12_prod_request_ledger').get().c);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?, 'queue:02', ?, ?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-02',JSON.stringify(original.queuePlans[1]));
 x.raw.exec("UPDATE t12_prod_outbox SET created_at='2026-09-21 14:13:20' WHERE event_key='queue:02'");
 assert.equal((await request(x)).status,200);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?, 'queue:03', ?, ?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-01',JSON.stringify(original.queuePlans[0]));
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_OUTBOX_LINES_MISSING_OR_EXTRA');
}));
test('ACC230 rejects wrong outbox line, wrong type, failed delivery, missing or corrupt payload',()=>withFixture(async x=>{
 for(const [change,undo,code] of [
  ["UPDATE t12_prod_outbox SET line_id='4323-01' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET line_id='4323-02' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET event_type='invoice-post' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET event_type='trend-master-status-intent' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET status='failed' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET status='pending' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET payload_json='{}' WHERE event_key='queue:02'",
   null,'T12_ORIGINAL_OUTBOX_PAYLOAD_DRIFT']
 ]){
  const original=x.raw.prepare("SELECT payload_json AS p FROM t12_prod_outbox WHERE event_key='queue:02'").get().p;
  x.raw.exec(change);
  assert.equal((await request(x)).body.code,code,change);
  if(undo)x.raw.exec(undo);
  else x.raw.prepare("UPDATE t12_prod_outbox SET payload_json=? WHERE event_key='queue:02'").run(original);
  assert.equal((await request(x)).status,200);
 }
 x.raw.exec("UPDATE t12_prod_outbox SET status='done' WHERE event_key='queue:02'");
 const done=await request(x);
 assert.equal(done.status,200);
 assert.equal(done.body.financeAuthorized,false);
 assert.equal(done.body.connectorEventPublished,false);
}));
test('ACC230 no extra finance event or orders generated from initial T12 outbox',()=>withFixture(async x=>{
 const prior=x.raw.prepare("SELECT total_changes() AS n").get().n;
 const inspected=await request(x);
 assert.equal(inspected.status,200);
 assert.equal(x.raw.prepare("SELECT total_changes() AS n").get().n,prior);
 assert.equal(x.raw.prepare("SELECT COUNT(*) AS n FROM t12_prod_outbox").get().n,2);
 assert.equal(x.raw.prepare("SELECT COUNT(*) AS n FROM t12_prod_events").get().n,1);
 assert.equal(inspected.body.departmentApprovalsVerified,false);
 assert.equal(inspected.body.canRequestInvoice,false);
}));
// ACC232 current runtime is a source safety veto, NEVER a line approval.
function runtimeState(x,lineId,status,actor='wael-synthetic',version=1){
 x.raw.prepare(`INSERT INTO t12_prod_line_runtime
  (line_id,order_id,status,notes,updated_by,version)
  VALUES (?, ?, ?, '', ?, ?)`).run(lineId,ORDER_ID,status,actor,version);
}
function runtimeEvent(x,lineId,oldStatus,newStatus,actor='wael-synthetic',type='line-update'){
 x.raw.prepare(`INSERT INTO t12_prod_runtime_events
  (order_id,line_id,event_type,old_status,new_status,actor,payload_json)
  VALUES (?,?,?,?,?,?, '{}')`).run(ORDER_ID,lineId,type,oldStatus,newStatus,actor);
}
test('ACC232 current runtime cancels, blocks or duplicates any source line without changing finance authority',()=>withFixture(async x=>{
 assert.equal((await request(x)).status,200);
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 assert.equal((await request(x)).status,200);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 for(const blocked of ['ملغى','مكرر','متوقف']){
  runtimeState(x,'4323-02',blocked,'jaber-synthetic');
  runtimeEvent(x,'4323-02','طلب جديد',blocked,'jaber-synthetic');
  const r=await request(x);
  assert.equal(r.status,409,blocked);
  assert.equal(r.body.code,'T12_RUNTIME_LINE_CANCELLED_DUPLICATE_OR_STOPPED',blocked);
  assert.equal(r.body.financeAuthorized,false);
  x.raw.exec("DELETE FROM t12_prod_runtime_events WHERE line_id='4323-02'");
  x.raw.exec("DELETE FROM t12_prod_line_runtime WHERE line_id='4323-02'");
 }
}));
test('ACC232 healthy runtime and WhatsApp status do not confer Wail/Gaber financial approval',()=>withFixture(async x=>{
 runtimeState(x,'4323-01','جاهز للاستلام');
 runtimeEvent(x,'4323-01','طلب جديد','جاهز للاستلام');
 let r=await request(x);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.departmentApprovalsVerified,false);
 assert.equal(r.body.canRequestInvoice,false);
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=2 WHERE line_id='4323-01'");
 runtimeEvent(x,'4323-01','جاهز للاستلام','جاهز للاستلام','wael-synthetic','whatsapp-ready_notify');
 r=await request(x);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.connectorEventPublished,false);
 assert.equal(r.body.canRequestInvoice,false);
}));
test('ACC232 missing last runtime event, altered actor/status/version or orphan event fails closed',()=>withFixture(async x=>{
 runtimeState(x,'4323-01','بدأ التنفيذ');
 let r=await request(x);
 assert.equal(r.body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 runtimeEvent(x,'4323-01','طلب جديد','بدأ التنفيذ');
 assert.equal((await request(x)).status,200);
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=2 WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=1,updated_by='FORGED' WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("UPDATE t12_prod_line_runtime SET updated_by='wael-synthetic',status='جاهز للاستلام' WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("DELETE FROM t12_prod_line_runtime WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_EVENT_WITHOUT_STATE');
}));
test('ACC232 original unmodified create and current runtime remain a single read-only D1 batch',()=>withFixture(async x=>{
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const r=await request(x);
 assert.equal(r.status,200);
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 assert.equal(r.body.sourceOnly,true);
 assert.equal(r.body.readOnly,true);
 assert.equal(r.body.officialCustomerOwnershipAttested,false);
}));

// ACC233 signed order-created: only invented keys/data, never the accounting DB.
const FIXTURE_KEY_ID='ACC233_FAKE_SIGNING_KEY';
const fakeSignKey=()=>webcrypto.subtle.importKey('raw',
 new Uint8Array(32).fill(31),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const otherSignKey=()=>webcrypto.subtle.importKey('raw',
 new Uint8Array(32).fill(42),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const SIGN_TIME=1790000000000;
const signed=(x,signKey)=>signOrder({
 db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
 signKey,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME
});
const verified=(message,verifyKey,nowMs=SIGN_TIME)=>verifyOrder({
 message,verifyKey,expectedKeyId:FIXTURE_KEY_ID,nowMs
});
test('ACC233 signed order-created is OFF, not Worker-wired, and never a financial approval',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const signer=readFileSync('cloudflare-d1/src/t12-finance-connector-v1-order-created-sourceonly.mjs','utf8');
 assert.doesNotMatch(worker,/t12-finance-connector-v1-order-created-sourceonly/);
 assert.doesNotMatch(signer,/saveAccountingFinalInvoice\s*\(|fetch\s*\(|INSERT INTO|UPDATE\s+t12_prod/);
 assert.equal(SIGNER_POLICY.defaultMode,'OFF');
 assert.equal(SIGNER_POLICY.onlyEventType,'order_created');
 assert.equal(SIGNER_POLICY.departmentApprovalsVerified,false);
 assert.equal(SIGNER_POLICY.invoicePostingAllowed,false);
});
test('ACC233 signs EXACT source-owned T12 order_created V1 envelope with no personal or financial data',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const r=await signed(x,key);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 assert.equal(r.message.envelope.event_type,'order_created');
 assert.equal(r.message.envelope.contract_version,'ACCOUNTING_CONNECTOR_CONTRACT_V1');
 assert.equal(r.message.envelope.occurred_at,'2026-09-21T14:13:20Z');
 assert.equal(SIGNER_POLICY.timestampAnchoredToOriginalT12Create,true);
 assert.equal(r.message.envelope.payload.expected_line_count,2);
 assert.deepEqual(r.message.envelope.payload.lines.map(l=>l.department),['طباعة','ليزر']);
 assert.equal(r.message.envelope.payload.customer_id,C);
 assert.equal(r.message.envelope.payload.finance_authorized,false);
 assert.equal(r.connectorEventPublished,false);
 for(const privateText of ['FAKE CLIENT','01000000000','999002','FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE']){
  assert.equal(JSON.stringify(r).includes(privateText),false);
 }
 const v=await verified(r.message,key);
 assert.equal(v.success,true,JSON.stringify(v));
 assert.equal(v.cryptographicSignatureVerified,true);
 assert.equal(v.officialCustomerOwnershipAttested,false);
 assert.equal(v.departmentApprovalsVerified,false);
 assert.equal(v.invoicePostingAllowed,false);
 assert.equal(v.replayLedgerVerified,false);
}));
test('ACC233 deterministic event identity/signature for retries but no replay ledger attested',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const a=await signed(x,key),b=await signOrder({
  db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME+120000
 });
 assert.equal(a.success,true);assert.equal(b.success,true);
 assert.deepEqual(a.message,b.message);
 assert.equal(a.message.envelope.event_id,'t12:order_created:'+ORDER_ID);
 assert.equal(a.message.envelope.idempotency_key,a.message.envelope.event_id);
 assert.equal((await verified(a.message,key)).replayLedgerVerified,false);
},1));
test('ACC233 rejects unauthorized modes, missing/wrong keys and incomplete source',()=>withFixture(async x=>{
 const k=await fakeSignKey();
 const deny=await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:C,signKey:k,keyId:FIXTURE_KEY_ID});
 assert.equal(deny.code,'SIGNER_DEFAULT_OFF');
 assert.equal(x.batches(),0);
 assert.equal((await signed(x,null)).code,'SIGNING_INPUT_OR_KEY_UNQUALIFIED');
 assert.equal((await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:'WRONG_CUSTOMER',signKey:k,
  keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME}))
 .code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
}));
test('ACC233 existing order after cancelled T12 line cannot obtain a signed operational message',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 runtimeState(x,'4323-02','ملغى','jaber-synthetic');
 runtimeEvent(x,'4323-02','طلب جديد','ملغى','jaber-synthetic');
 const r=await signed(x,key);
 assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
 assert.equal(r.connectorEventPublished,false);
}));
test('ACC233 altered signed line, customer, event type and hidden finance flag fail contract/signature',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const created=await signed(x,key);
 assert.equal(created.success,true);
 for(const patch of [
  m=>{m.envelope.payload.customer_id='ANOTHER';},
  m=>{m.envelope.payload.lines[1].department='طباعة';},
  m=>{m.envelope.event_type='order_line_approved';},
  m=>{m.envelope.payload.finance_authorized=true;},
  m=>{m.envelope.payload.lines[0].line_id='4323-02';}
 ]){
  const forged=structuredClone(created.message);patch(forged);
  const result=await verified(forged,key);
  assert.equal(result.success,false,JSON.stringify(result));
  assert.equal(result.invoicePostingAllowed,false);
 }
 const reworded=structuredClone(created.message);
 reworded.envelope.evidence_refs[0]='t12:original-ledger:OTHER';
 assert.equal((await verified(reworded,key)).success,false);
}));
test('ACC233 mismatched signer identity, wrong verifier key and corrupted signature fail closed',()=>withFixture(async x=>{
 const key=await fakeSignKey(),other=await otherSignKey();
 const created=await signed(x,key);assert.equal(created.success,true);
 assert.equal((await verified(created.message,other)).code,'SOURCE_SIGNATURE_MISMATCH');
 assert.equal((await verifyOrder({message:created.message,verifyKey:key,
  expectedKeyId:'ANOTHER_KEY',nowMs:SIGN_TIME})).code,'UNTRUSTED_SIGNER_OR_ENVELOPE');
 const forged=structuredClone(created.message);
 forged.signature='THIS_IS_NOT_BASE64_SIGNATURE';
 assert.equal((await verified(forged,key)).code,'MALFORMED_SOURCE_SIGNATURE');
}));
test('ACC233 event expiry and future timestamp reject even valid cryptographic HMAC',()=>withFixture(async x=>{
 const key=await fakeSignKey(),r=await signed(x,key);
 assert.equal(r.success,true);
 assert.equal((await verified(r.message,key,SIGN_TIME+301000)).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
 assert.equal((await verified(r.message,key,SIGN_TIME-61000)).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
 assert.equal((await verified(r.message,key,SIGN_TIME+299000)).success,true);
}));
test('ACC233 no absent capture, changed original item, or forged runtime signature from original T12',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 x.raw.exec("UPDATE t12_prod_lines SET item_name='UNTRUSTED ITEM' WHERE line_id='4323-01'");
 const r=await signed(x,key);
 assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
},2));


test('ACC234 original event timestamp stabilizes retries but unsigned history has a five-minute limit',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const a=await signed(x,key);
 const b=await signOrder({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME+300000});
 assert.equal(a.success,true);
 assert.equal(b.success,true);
 assert.deepEqual(a.message,b.message);
 assert.equal(a.message.envelope.occurred_at,'2026-09-21T14:13:20Z');
 const old=await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:C,signKey:key,keyId:FIXTURE_KEY_ID,
  mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME+300001});
 assert.equal(old.code,'ORIGINAL_T12_CREATE_OUTSIDE_SIGNING_WINDOW');
 assert.equal(old.connectorEventPublished,false);
 assert.equal((await verifyOrder({message:a.message,verifyKey:key,
  expectedKeyId:FIXTURE_KEY_ID,nowMs:SIGN_TIME+300001})).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
}));
test('ACC234 source time cannot be borrowed from changed ledger, order or line',()=>withFixture(async x=>{
 for(const table of ['t12_prod_request_ledger','t12_prod_orders','t12_prod_lines']){
  const where=table==='t12_prod_lines'?" WHERE line_id='4323-02'":'';
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:15:30'"+where);
  const r=await request(x);
  assert.equal(r.status,409,table);
  assert.equal(r.body.code,'T12_ORIGINAL_CREATE_TIMESTAMP_MISSING_OR_DRIFTED',table);
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'"+where);
  assert.equal((await request(x)).status,200,table);
 }
}));
test('ACC234 activity/outbox creation timestamps cannot come from retry wall-clock',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 for(const [table,where] of [
  ['t12_prod_events'," WHERE event_key='activity'"],
  ['t12_prod_outbox'," WHERE event_key='queue:02'"]
 ]){
  x.raw.exec("UPDATE "+table+" SET created_at='1970-01-01 00:00:00'"+where);
  const r=await signed(x,key);
  assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED',table);
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'"+where);
  assert.equal((await signed(x,key)).success,true,table);
 }
 x.raw.exec("UPDATE t12_prod_events SET created_at='2026-02-30 14:13:20' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_CREATE_TIMESTAMP_MISSING_OR_DRIFTED');
}));
test('ACC234 rejects future creation and ambiguous local timestamp values',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const future=await signOrder({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME-61000});
 assert.equal(future.code,'ORIGINAL_T12_CREATE_OUTSIDE_SIGNING_WINDOW');
 x.raw.exec("UPDATE t12_prod_orders SET created_at='2026-09-21T14:13:20Z'");
 assert.equal((await signed(x,key)).code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
}));


function acc235OfflineDb(filename=':memory:',initialize=true){
 const raw=new DatabaseSync(filename);if(initialize)raw.exec(OUTBOX_SCHEMA);
 const db={prepare(sql){const stmt=raw.prepare(sql);return {bind(...args){return {
  async first(){return stmt.get(...args)||null},async run(){return stmt.run(...args)}
 }}}}};
 const row=()=>raw.prepare('SELECT * FROM acc235_signed_outbox_fixture').get();
 return {raw,db,row,close(){raw.close()}};
}
const acc235Mode='ISOLATED_SQLITE_FIXTURE';
const acc235Event='t12:order_created:'+ORDER_ID;
const acc235Stage=(x,store,key,nowMs=SIGN_TIME,verifyKey=key)=>persistSigned({
 sourceDb:x.db,outboxDb:store.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
 signKey:key,verifyKey,keyId:FIXTURE_KEY_ID,nowMs,mode:acc235Mode});
const acc235ReserveArgs=(x,store,key,nowMs=SIGN_TIME+1000,leaseOwner='A')=>({
 sourceDb:x.db,outboxDb:store.db,eventId:acc235Event,verifyKey:key,keyId:FIXTURE_KEY_ID,
 nowMs,leaseOwner,mode:acc235Mode});
const acc235Reserve=(x,store,key,nowMs=SIGN_TIME+1000,leaseOwner='A')=>
 reserveSigned(acc235ReserveArgs(x,store,key,nowMs,leaseOwner));
test('ACC235-OUTBOX remains isolated OFF, signed bytes immutable, source D1 read-only',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey(),before=x.raw.prepare('SELECT total_changes() n').get().n;
  assert.equal(OUTBOX_POLICY.defaultMode,'OFF');
  assert.equal(OUTBOX_POLICY.financialPostingAllowed,false);
  assert.doesNotMatch(readFileSync('cloudflare-d1/src/index_v2.js','utf8'),/t12-finance-signed-outbox-acc235-offline/);
  assert.equal((await persistSigned({sourceDb:x.db,outboxDb:store.db,orderId:ORDER_ID,
   expectedOfficialCustomerId:C,signKey:key,verifyKey:key,keyId:FIXTURE_KEY_ID,
   nowMs:SIGN_TIME})).code,'OUTBOX_DEFAULT_OFF');
  const r=await acc235Stage(x,store,key);assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.connectorEventPublished,false);
  assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
  assert.equal(store.row().state,'PENDING');
  assert.equal(JSON.parse(store.row().payload_json).envelope.event_type,'order_created');
  assert.throws(()=>store.raw.exec("UPDATE acc235_signed_outbox_fixture SET payload_json='{}'"),/ACC235_SIGNED_BYTES_IMMUTABLE/);
  assert.throws(()=>store.raw.exec('DELETE FROM acc235_signed_outbox_fixture'),/ACC235_SIGNED_OUTBOX_NO_DELETE/);
 }finally{store.close()}
}));
test('ACC235-OUTBOX same order HMAC persisted only once across different retry seconds',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const before=store.row();const r=await acc235Stage(x,store,key,SIGN_TIME+120000);
  assert.equal(r.success,true,JSON.stringify(r));assert.deepEqual(store.row(),before);
  assert.equal(store.raw.prepare('SELECT COUNT(*) n FROM acc235_signed_outbox_fixture').get().n,1);
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME+301000)).code,'ORIGINAL_SOURCE_NOT_SIGNABLE');
 }finally{store.close()}
}));
test('ACC235-OUTBOX CAS lease excludes second sender and retries exact original bytes after crash',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const original=store.row().payload_json;
  const first=await acc235Reserve(x,store,key);assert.equal(first.success,true,JSON.stringify(first));
  assert.equal((await acc235Reserve(x,store,key,SIGN_TIME+1000,'OTHER')).code,'OUTBOX_ALREADY_LEASED');
  assert.equal((await releaseSigned({outboxDb:store.db,eventId:acc235Event,
   leaseOwner:'OTHER',nowMs:SIGN_TIME+2000,mode:acc235Mode})).success,false);
  const retry=await acc235Reserve(x,store,key,SIGN_TIME+17000,'OTHER');
  assert.equal(retry.success,true,JSON.stringify(retry));
  assert.equal(retry.attempts,2);
  assert.equal(JSON.stringify(retry.originalSignedMessage),original);
  assert.equal(first.consumerAcknowledged,false);
 }finally{store.close()}
}));
test('ACC235-OUTBOX enforces max attempts, explicit dead letter and rejects re-stage of dead event',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const a=await acc235Reserve(x,store,key);assert.equal(a.success,true);
  assert.equal((await deadSigned({outboxDb:store.db,eventId:acc235Event,
   nowMs:SIGN_TIME+2000,mode:acc235Mode})).success,false);
  const b=await acc235Reserve(x,store,key,SIGN_TIME+17000,'B');assert.equal(b.success,true);
  const c=await acc235Reserve(x,store,key,SIGN_TIME+33000,'C');assert.equal(c.success,true);
  assert.equal((await acc235Reserve(x,store,key,SIGN_TIME+49000,'D')).code,'OUTBOX_RETRY_BUDGET_EXHAUSTED');
  const dead=await deadSigned({outboxDb:store.db,eventId:acc235Event,
   nowMs:SIGN_TIME+49000,mode:acc235Mode});
  assert.equal(dead.success,true);assert.equal(dead.consumerAcknowledged,false);
  assert.equal(store.row().state,'DEAD_LETTER');
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME+50000)).code,'OUTBOX_IMMUTABLE_EVENT_IDEMPOTENCY_CONFLICT');
 }finally{store.close()}
}));
test('ACC235-OUTBOX verifies pinned signer, source cancellation and stale event before claiming',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey(),wrong=await otherSignKey();
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME,wrong)).code,'OUTBOX_SIGNER_VERIFIER_UNMATCHED');
  assert.equal((await acc235Stage(x,store,key)).success,true);
  assert.equal((await acc235Reserve(x,store,wrong)).code,'OUTBOX_SIGNATURE_STALE_OR_UNVERIFIED');
  assert.equal((await acc235Reserve(x,store,key,SIGN_TIME+301000)).code,'OUTBOX_SIGNATURE_STALE_OR_UNVERIFIED');
  assert.equal(store.row().attempts,0);
 }finally{store.close()}
}));
test('ACC235-OUTBOX survives close/reopen of disposable disk SQLite and concurrent claims are exclusive',()=>withFixture(async x=>{
 const dir=mkdtempSync(join(tmpdir(),'trend-acc235-')),file=join(dir,'test.sqlite');
 let store;try{
  const key=await fakeSignKey();store=acc235OfflineDb(file);
  assert.equal((await acc235Stage(x,store,key)).success,true);
  const signed=store.row().payload_json;store.close();store=null;
  store=acc235OfflineDb(file,false);
  const [a,b]=await Promise.all([
   acc235Reserve(x,store,key,SIGN_TIME+1000,'A'),
   acc235Reserve(x,store,key,SIGN_TIME+1000,'B')
  ]);
  assert.equal([a,b].filter(v=>v.success).length,1,JSON.stringify([a,b]));
  assert.equal(JSON.stringify((a.success?a:b).originalSignedMessage),signed);
  assert.equal(store.row().attempts,1);
 }finally{store?.close();rmSync(dir,{recursive:true,force:true})}
}));


test('ACC245-OUTBOX denies post-enqueue T12 cancellation before any retry lease',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey(),before=x.raw.prepare('SELECT total_changes() n').get().n;
  assert.equal((await acc235Stage(x,store,key)).success,true);
  runtimeState(x,'4323-02','ملغى','jaber-synthetic');
  runtimeEvent(x,'4323-02','طلب جديد','ملغى','jaber-synthetic');
  const snapshot=store.row();
  const r=await acc235Reserve(x,store,key);
  assert.equal(r.code,'OUTBOX_ORIGINAL_T12_NOW_UNQUALIFIED');
  assert.equal(r.connectorEventPublished,false);
  assert.equal(store.row().attempts,0);
  assert.deepEqual(store.row(),snapshot);
  assert.equal(x.raw.prepare('SELECT total_changes() n').get().n>before,true);
 }finally{store.close()}
}));
test('ACC245-OUTBOX rejects post-enqueue changed customer or source line assignment',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();
  assert.equal((await acc235Stage(x,store,key)).success,true);
  let attempts=store.row().attempts;
  for(const [change,undo] of [
   ["UPDATE t12_prod_orders SET external_customer_id='CHANGED' WHERE order_id='4323'",
    "UPDATE t12_prod_orders SET external_customer_id='999002' WHERE order_id='4323'"],
   ["UPDATE t12_prod_lines SET assigned_to='OTHER' WHERE line_id='4323-02'",
    "UPDATE t12_prod_lines SET assigned_to='جابر' WHERE line_id='4323-02'"],
   ["UPDATE t12_prod_events SET created_at='2026-09-21 14:14:50' WHERE event_key='activity'",
    "UPDATE t12_prod_events SET created_at='2026-09-21 14:13:20' WHERE event_key='activity'"]
  ]){
   x.raw.exec(change);
   const r=await acc235Reserve(x,store,key);
   assert.equal(r.code,'OUTBOX_ORIGINAL_T12_NOW_UNQUALIFIED',change);
   assert.equal(store.row().attempts,attempts);
   x.raw.exec(undo);
   assert.equal((await acc235Reserve(x,store,key)).success,true,undo);
   attempts++;
   assert.equal(store.row().attempts,attempts);
   const out=await releaseSigned({outboxDb:store.db,eventId:acc235Event,
     leaseOwner:'A',nowMs:SIGN_TIME+2000,mode:acc235Mode});
   assert.equal(out.success,true);
  }
 }finally{store.close()}
}));
test('ACC245-OUTBOX missing source reader, failed source batch, and post-enqueue loss refuse retry',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();
  assert.equal((await acc235Stage(x,store,key)).success,true);
  const absent=await reserveSigned({
   outboxDb:store.db,eventId:acc235Event,verifyKey:key,keyId:FIXTURE_KEY_ID,
   nowMs:SIGN_TIME+1000,leaseOwner:'A',mode:acc235Mode
  });
  assert.equal(absent.code,'OUTBOX_FRESH_ORIGINAL_T12_READER_REQUIRED');
  const fakeSource={prepare:x.db.prepare,batch:async()=>{throw new Error('SENSITIVE_FAKE_SOURCE_ERROR')}};
  const broken=await reserveSigned({
   ...acc235ReserveArgs(x,store,key),sourceDb:fakeSource
  });
  assert.equal(broken.code,'OUTBOX_ORIGINAL_T12_NOW_UNQUALIFIED');
  assert.equal(JSON.stringify(broken).includes('SENSITIVE_FAKE_SOURCE_ERROR'),false);
  assert.equal(store.row().attempts,0);
  x.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:02'");
  assert.equal((await acc235Reserve(x,store,key)).code,'OUTBOX_ORIGINAL_T12_NOW_UNQUALIFIED');
  assert.equal(store.row().attempts,0);
 }finally{store.close()}
}));
test('ACC245-OUTBOX healthy reread stays read-only, same immutable signed HMAC bytes',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();
  assert.equal((await acc235Stage(x,store,key)).success,true);
  const original=store.row().payload_json;
  const before=x.raw.prepare('SELECT total_changes() n').get().n;
  const batches=x.batches();
  const r=await acc235Reserve(x,store,key);
  assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(x.batches(),batches+1);
  assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
  assert.equal(JSON.stringify(r.originalSignedMessage),original);
  assert.equal(r.financeAuthorized,false);
  assert.equal(r.consumerAcknowledged,false);
 }finally{store.close()}
}));

test('without D1 batch, broken transaction or broken schema return generic fail closed',async()=>{
 const lacking=await inspect({db:{prepare(){}},orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(lacking.status,503);
 await withFixture(async x=>{
  x.db.batch=async()=>[{success:true,results:[]},{success:false,results:[]}];
  assert.equal((await request(x)).status,503);
  x.db.batch=async()=>{throw Error('PRIVATE_CUSTOMER_DATA_SQL');};
  const bad=await request(x);
  assert.equal(bad.status,503);
  assert.equal(JSON.stringify(bad).includes('PRIVATE_CUSTOMER_DATA_SQL'),false);
 });
});
