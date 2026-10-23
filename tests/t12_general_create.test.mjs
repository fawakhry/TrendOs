import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { createT12GeneralOrder } from '../cloudflare-d1/src/t12-general-create.mjs';
import { handleT12GeneralCreateRequest } from '../cloudflare-d1/src/t12-general-create-handler.mjs';

const schema5=fs.readFileSync(new URL('../cloudflare-d1/migrations/0005_t12_production_create_canary.sql',import.meta.url),'utf8');
const schema7=fs.readFileSync(new URL('../cloudflare-d1/migrations/0007_t12_general_create_control.sql',import.meta.url),'utf8');
const schema8=fs.readFileSync(new URL('../cloudflare-d1/migrations/0008_t12_customer_master.sql',import.meta.url),'utf8');
const schema35=fs.readFileSync(new URL('../cloudflare-d1/migrations/0035_t12_order_customer_at_create_sourceonly_v1.sql',import.meta.url),'utf8');
const schema10=fs.readFileSync(new URL('../cloudflare-d1/migrations/0010_t12_duplicate_order_guard.sql',import.meta.url),'utf8');

class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...p){this.params=p;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:this.db.raw.prepare(this.sql).all(...this.params)};}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class D1 {
  constructor(mode='CANARY',budget=1){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    this.raw.exec(schema5);
    this.raw.exec(schema7);
    this.raw.exec(schema10);
    this.raw.exec(schema8);
    this.raw.exec(schema35);
    this.raw.prepare('UPDATE t12_prod_create_control SET next_order_number=4323,canary_remaining=0 WHERE singleton=1').run();
    this.raw.prepare('UPDATE t12_prod_general_create_control SET mode=?,canary_remaining=? WHERE singleton=1').run(mode,budget);
    this.turn=Promise.resolve(); this.failAt=0; this.ambiguous=false;
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(ss){
    let release; const prev=this.turn; this.turn=new Promise(r=>release=r); await prev;
    try{
      this.raw.exec('BEGIN IMMEDIATE');
      try{
        for(let i=0;i<ss.length;i++){ if(this.failAt===i+1)throw Error('SIM_FAIL'); await ss[i].run(); }
        this.raw.exec('COMMIT');
      }catch(e){ try{this.raw.exec('ROLLBACK');}catch{} throw e; }
      if(this.ambiguous)throw Error('SIM_LOST_ACK');
    }finally{release();}
  }
  control(){
    const x=this.raw.prepare('SELECT next_order_number nextNo FROM t12_prod_create_control WHERE singleton=1').get();
    const g=this.raw.prepare('SELECT mode,canary_remaining remaining FROM t12_prod_general_create_control WHERE singleton=1').get();
    return {nextNo:Number(x.nextNo),mode:g.mode,remaining:Number(g.remaining)};
  }
  count(t){return Number(this.raw.prepare('SELECT COUNT(*) n FROM '+t).get().n);}
}
const actor='admin-owner';
const input=(key='cld1_1790000020000_GENERALCANARY_1234567890123456',qty=1)=>({
  clientRequestId:key,
  customerMode:'خارجي / عابر',
  externalCustomerId:'999002',
  customerName:'T12 GENERAL CUSTOMER',
  customerPhone:'01000000001',
  department:'طباعة',
  itemName:'T12 GENERAL ITEM',
  qty,
  priority:'عادي',
  status:'طلب جديد',
  source:'T12 General Create'
});

{
  const db=new D1('CANARY',1);
  const first=await createT12GeneralOrder(db,input(),actor,{canary:true});
  assert.equal(first.success,true,JSON.stringify(first)); assert.equal(first.orderId,'4323'); assert.deepEqual(first.lineIds,['4323-01']);
  assert.deepEqual(db.control(),{nextNo:4324,mode:'CANARY',remaining:0});
  const replay=await createT12GeneralOrder(db,input(),actor,{canary:true});
  assert.equal(replay.success,true); assert.equal(replay.idempotent,true); assert.equal(replay.orderId,'4323');
  const second=await createT12GeneralOrder(db,input('cld1_1790000020001_GENERALCANARY_1234567890123457'),actor,{canary:true});
  assert.equal(second.success,false); assert.equal(second.reason,'general-create-canary-not-armed');
}
{
  const db=new D1('GENERAL',0);
  const first=await createT12GeneralOrder(db,input('cld1_1790000021000_GENERALCREATE_1234567890123456'),actor,{canary:false});
  assert.equal(first.success,true); assert.equal(first.orderId,'4323');
  const second=await createT12GeneralOrder(db,input('cld1_1790000021001_GENERALCREATE_1234567890123457',2),actor,{canary:false});
  assert.equal(second.success,true); assert.equal(second.orderId,'4324');
  assert.deepEqual(db.control(),{nextNo:4325,mode:'GENERAL',remaining:0});
}
{
  const db=new D1('CANARY',1); db.ambiguous=true;
  const r=await createT12GeneralOrder(db,input(),actor,{canary:true});
  assert.equal(r.success,true); assert.equal(r.ambiguousAckRecovered,true); assert.equal(r.orderId,'4323');
}
{
  const db=new D1('OFF',0);
  const env={DB:db,EDGE_SESSION_SECRET:'unit-secret',CORS_ORIGINS:'https://fawakhry.github.io'};
  let req=new Request('https://x/v1/t12/orders/create/health');
  let res=await handleT12GeneralCreateRequest(req,env);
  assert.equal(res.status,200);
  let h=await res.json(); assert.equal(h.mode,'OFF'); assert.equal(h.nextOrderNumber,4323); assert.equal(h.generalCutover,false); assert.equal(h.duplicateGuardReady,true);

  const token=await issueOrdersEdgeToken({sub:'admin-owner',role:'admin',department:'',screens:['service','print','laser','press','']},'unit-secret',Math.floor(Date.now()/1000),600);
  req=new Request('https://x/v1/t12/orders/create',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(input())});
  res=await handleT12GeneralCreateRequest(req,env); assert.equal(res.status,423);

  db.raw.prepare("UPDATE t12_prod_general_create_control SET mode='CANARY',canary_remaining=1").run();
  req=new Request('https://x/v1/t12/orders/create',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json','x-t12-general-canary-confirm':'4323'},body:JSON.stringify(input())});
  res=await handleT12GeneralCreateRequest(req,env); assert.equal(res.status,201);
  const body=await res.json(); assert.equal(body.orderId,'4323'); assert.equal(body.generalCutover,false);
}
{
  const db=new D1('GENERAL',0);
  const now=1800000000000;
  const first=await createT12GeneralOrder(
    db,
    input('cld1_1800000000000_DUPGUARD_A_1234567890123456'),
    actor,
    {canary:false,nowMs:now}
  );
  assert.equal(first.success,true); assert.equal(first.orderId,'4323');
  const duplicate=await createT12GeneralOrder(
    db,
    input('cld1_1800000000001_DUPGUARD_B_1234567890123457'),
    actor,
    {canary:false,nowMs:now+1000}
  );
  assert.equal(duplicate.success,false);
  assert.equal(duplicate.reason,'duplicate-order-window-active');
  assert.equal(duplicate.duplicatePrevented,true);
  assert.equal(duplicate.existingOrderId,'4323');
  assert.equal(db.count('t12_prod_orders'),1);
  assert.deepEqual(db.control(),{nextNo:4324,mode:'GENERAL',remaining:0});
}
{
  const db=new D1('GENERAL',0);
  const now=1800000100000;
  const first=await createT12GeneralOrder(
    db,
    input('cld1_1800000100000_WINDOW_A_1234567890123456'),
    actor,
    {canary:false,nowMs:now}
  );
  assert.equal(first.success,true);
  const later=await createT12GeneralOrder(
    db,
    input('cld1_1800000220001_WINDOW_B_1234567890123457'),
    actor,
    {canary:false,nowMs:now+120001}
  );
  assert.equal(later.success,true);
  assert.equal(later.orderId,'4324');
  assert.equal(db.count('t12_prod_orders'),2);
}
{
  const db=new D1('GENERAL',0);
  const now=1800000300000;
  const first=await createT12GeneralOrder(
    db,
    input('cld1_1800000300000_PAYLOAD_A_1234567890123456',1),
    actor,
    {canary:false,nowMs:now}
  );
  assert.equal(first.success,true);
  const changed=await createT12GeneralOrder(
    db,
    input('cld1_1800000300001_PAYLOAD_B_1234567890123457',2),
    actor,
    {canary:false,nowMs:now+1000}
  );
  assert.equal(changed.success,true);
  assert.equal(changed.orderId,'4324');
  assert.equal(db.count('t12_prod_orders'),2);
}
{
  const db=new D1('GENERAL',0);
  const now=1800000400000;
  const rs=await Promise.all([
    createT12GeneralOrder(db,input('cld1_1800000400000_RACE_A_1234567890123456'),actor,{canary:false,nowMs:now}),
    createT12GeneralOrder(db,input('cld1_1800000400001_RACE_B_1234567890123457'),actor,{canary:false,nowMs:now})
  ]);
  const successes=rs.filter(x=>x.success===true);
  const blocked=rs.filter(x=>x.duplicatePrevented===true);
  assert.equal(successes.length,1,JSON.stringify(rs));
  assert.equal(blocked.length,1,JSON.stringify(rs));
  assert.equal(db.count('t12_prod_orders'),1);
  assert.deepEqual(db.control(),{nextNo:4324,mode:'GENERAL',remaining:0});
}
{
  const db=new D1('GENERAL',0);
  const env={DB:db,EDGE_SESSION_SECRET:'unit-secret',CORS_ORIGINS:'https://fawakhry.github.io'};
  const token=await issueOrdersEdgeToken({sub:'admin-owner',role:'admin',department:'',screens:['service','print','laser','press','']},'unit-secret',Math.floor(Date.now()/1000),600);
  let req=new Request('https://x/v1/t12/orders/create',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(input('cld1_1800000500000_HTTP_A_1234567890123456'))});
  let res=await handleT12GeneralCreateRequest(req,env);
  assert.equal(res.status,201);
  req=new Request('https://x/v1/t12/orders/create',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(input('cld1_1800000500001_HTTP_B_1234567890123457'))});
  res=await handleT12GeneralCreateRequest(req,env);
  assert.equal(res.status,409);
  const body=await res.json();
  assert.equal(body.duplicatePrevented,true);
  assert.equal(body.existingOrderId,'4323');
}


const acc223Link={customerId:'CUS-FAKE-1',evidenceRef:'ACC223_STAGING_UNATTESTED_001'};
const acc223Opts={canary:false,mode:'isolated-source-only',allowSourceCapture:true,officialCustomerLink:acc223Link};
const acc223Input=(key='cld1_1800000700000_ACC223_1234567890123456')=>({
  ...input(key),externalCustomerId:'CUS-FAKE-1'
});
const installFakeCustomer=db=>{
  db.raw.prepare("INSERT INTO t12_customers (customer_id,customer_name,customer_name_key,source) VALUES (?,?,?,?)")
    .run('CUS-FAKE-1','T12 GENERAL CUSTOMER','t12 general customer','cloud-native');
};
const armIsolated=db=>db.raw.prepare("UPDATE t12_order_customer_at_create_control_v1 SET mode='ISOLATED' WHERE singleton=1").run();
{
  // Existing runtime route passes NO sourceCapture options, so default OFF is unchanged.
  const db=new D1('GENERAL',0);
  const x=await createT12GeneralOrder(db,input('cld1_1800000701000_ACC223_LEGACY_1234567890123456'),actor,{canary:false});
  assert.equal(x.success,true,JSON.stringify(x));
  assert.equal(db.count('t12_order_customer_at_create_v1'),0);
  assert.equal(db.control().nextNo,4324);
}
{
  const db=new D1('GENERAL',0);installFakeCustomer(db);
  const r=await createT12GeneralOrder(db,acc223Input(),actor,acc223Opts);
  assert.equal(r.success,false);
  assert.equal(r.reason,'source-capture-control-off');
  assert.equal(db.count('t12_prod_orders'),0);
  assert.equal(db.count('t12_order_customer_at_create_v1'),0);
}
{
  const db=new D1('GENERAL',0);installFakeCustomer(db);armIsolated(db);
  const result=await createT12GeneralOrder(db,acc223Input(),actor,acc223Opts);
  assert.equal(result.success,true,JSON.stringify(result));
  assert.equal(result.sourceCaptureRecorded,true);
  assert.equal(result.customerOwnershipAttested,false);
  assert.equal(result.financeAuthorized,false);
  assert.equal(result.orderId,'4323');
  assert.equal(db.count('t12_prod_orders'),1);
  assert.equal(db.count('t12_order_customer_at_create_v1'),1);
  const capture=db.raw.prepare('SELECT * FROM t12_order_customer_at_create_v1').get();
  assert.equal(capture.customer_id,'CUS-FAKE-1');
  assert.equal(capture.customer_version,1);
  assert.equal(capture.actor_subject,actor);
  assert.equal(capture.capture_status,'SOURCE_ONLY_NOT_ATTESTED');
  assert.equal(capture.finance_authorized,0);
  assert.equal(capture.delivery_authorized,0);
  assert.throws(()=>db.raw.prepare('UPDATE t12_order_customer_at_create_v1 SET finance_authorized=1').run());
  assert.throws(()=>db.raw.prepare('DELETE FROM t12_order_customer_at_create_v1').run());
  const replay=await createT12GeneralOrder(db,acc223Input(),actor,acc223Opts);
  assert.equal(replay.success,true,JSON.stringify(replay));
  assert.equal(replay.idempotent,true);
  assert.equal(replay.sourceCaptureRecorded,true);
  assert.equal(db.count('t12_prod_orders'),1);
  assert.equal(db.count('t12_order_customer_at_create_v1'),1);
  const changedEvidence=await createT12GeneralOrder(db,acc223Input(),actor,
    {...acc223Opts,officialCustomerLink:{...acc223Link,evidenceRef:'ACC223_STAGING_DIFFERENT_002'}});
  assert.equal(changedEvidence.success,false);
  assert.equal(changedEvidence.reason,'same-key-actor-payload-or-policy-conflict');
}
{
  const db=new D1('GENERAL',0);installFakeCustomer(db);armIsolated(db);
  for(const options of [
    {canary:false,officialCustomerLink:acc223Link},
    {canary:false,mode:'isolated-source-only',officialCustomerLink:acc223Link},
    {canary:false,mode:'isolated-source-only',allowSourceCapture:true,
      officialCustomerLink:{customerId:'FAKE-SPOOF',evidenceRef:'ACC223_STAGING_UNATTESTED_001'}},
    {...acc223Opts,officialCustomerLink:{...acc223Link,evidenceRef:'short'}},
    {...acc223Opts,officialCustomerLink:{...acc223Link,evidenceRef:'ACC223_\u202eSPOOFING'}},
  ]){
    const out=await createT12GeneralOrder(db,acc223Input(),actor,options);
    assert.equal(out.success,false,JSON.stringify(out));
  }
  const bodySpoof=await createT12GeneralOrder(db,{
    ...acc223Input(),officialCustomerId:'CUS-FAKE-1'
  },actor,{canary:false});
  assert.equal(bodySpoof.success,false);
  assert.equal(db.count('t12_prod_orders'),0);
}
{
  const db=new D1('GENERAL',0);installFakeCustomer(db);armIsolated(db);
  db.raw.prepare("UPDATE t12_customers SET active='لا' WHERE customer_id='CUS-FAKE-1'").run();
  const r=await createT12GeneralOrder(db,acc223Input(),actor,acc223Opts);
  assert.equal(r.success,false);
  assert.equal(r.reason,'source-capture-customer-unavailable-or-inactive');
  assert.equal(db.count('t12_prod_orders'),0);
}
{
  const db=new D1('GENERAL',0);installFakeCustomer(db);armIsolated(db);
  const originalBatch=db.batch.bind(db);
  db.batch=async stmts=>{
    // Model a concurrent customer UPDATE after preflight and before atomic commit:
    // trigger must RAISE and rollback all T12 orders/lines/ledger statements.
    db.raw.prepare("UPDATE t12_customers SET version=version+1 WHERE customer_id='CUS-FAKE-1'").run();
    return originalBatch(stmts);
  };
  const r=await createT12GeneralOrder(db,acc223Input(),actor,acc223Opts);
  assert.equal(r.success,false,JSON.stringify(r));
  assert.equal(db.count('t12_prod_orders'),0);
  assert.equal(db.count('t12_prod_lines'),0);
  assert.equal(db.count('t12_prod_request_ledger'),0);
  assert.equal(db.count('t12_order_customer_at_create_v1'),0);
  assert.equal(db.control().nextNo,4323);
}
console.log('ACC223 actual T12 general CREATE + OFF-default in-transaction customer source capture PASS; FINANCE_RELEASE=NO_GO');

console.log('T12 general CREATE isolated PASS');
