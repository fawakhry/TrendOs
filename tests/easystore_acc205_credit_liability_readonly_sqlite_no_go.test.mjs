import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';

// ACC205: actual checked-in ACCOUNTING worker, real immutable receipt posting,
// one ephemeral :memory: SQLite DB. Only the SSO verifier is synthetic.
// This test NEVER runs against D1 remote, customer accounts or actual money.
const script=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const worker=script.replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'').replace(/^export /gm,'');
const db=new DatabaseSync(':memory:');
try{
  for(const name of [
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
  ])db.exec(fs.readFileSync('cloudflare-d1/migrations/'+name,'utf8'));
  db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,active TEXT DEFAULT 'نعم')");
  db.prepare("INSERT INTO t12_customers(customer_id,customer_name) VALUES('ACC205_FAKE_A','ACC205_FAKE_PERSON_A'),('ACC205_FAKE_B','ACC205_FAKE_PERSON_B')").run();
  const DB={
    prepare(sql){
      const cmd={sql:String(sql),args:[]};
      const w={bind(...args){cmd.args=args;return w;},
        first(){return Promise.resolve(db.prepare(cmd.sql).get(...cmd.args)||null)},
        all(){return Promise.resolve({results:db.prepare(cmd.sql).all(...cmd.args)})},
        run(){return Promise.resolve(db.prepare(cmd.sql).run(...cmd.args))}};
      w.__statement=cmd;return w;
    },
    async batch(statements){
      db.exec('BEGIN IMMEDIATE');
      try{const r=statements.map(s=>db.prepare(s.__statement.sql).run(...s.__statement.args));db.exec('COMMIT');return r}
      catch(e){db.exec('ROLLBACK');throw e}
    }
  };
  let role='admin',network=0;
  const env={DB,CORS_ORIGINS:'https://fawakhry.github.io',EASYSTORE_CUSTOMER_CREDIT_V1:'ON'};
  const sandbox=vm.createContext({
    crypto:webcrypto,TextEncoder,Request,Response,Headers,URL,URLSearchParams,Date,Intl,JSON,Math,console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      if(username!=='ACC205_FAKE_OWNER'||token!=='ACC205_FAKE_TOKEN')
        return {ok:false,message:'fake session rejected'};
      return {ok:true,authSource:'ACC205_LOCAL_FAKE_VERIFIER',body:{user:{username,role,department:'طباعة'}}};
    }
  });
  vm.runInContext(worker+'\n;globalThis.ACC205_HANDLER=handleEmployeeAccountingNativeRequest;',sandbox,{timeout:18000});
  const one=(sql,...p)=>db.prepare(sql).get(...p);
  const count=table=>one('SELECT COUNT(*) AS n FROM '+table).n;
  async function send(action,data={},opts={}){
    const before=globalThis.fetch;
    globalThis.fetch=()=>{network++;throw Error('EXTERNAL_NETWORK_FORBIDDEN')};
    try{
      const r=await sandbox.ACC205_HANDLER(new Request('https://acc205.invalid/v1/employee/accounting',{
        method:'POST',headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
          Authorization:'Bearer '+(opts.token??'ACC205_FAKE_TOKEN')},
        body:JSON.stringify({action,username:'ACC205_FAKE_OWNER',sourceSystem:'ACC205_OFFLINE_SQLITE',...data})
      }),env);
      return {httpStatus:r.status,...await r.json()};
    }finally{globalThis.fetch=before}
  }
  const audit=(id='ACC205_FAKE_A')=>send('previewCustomerCreditLiabilityAuditV1',{customerId:id});
  const receipt=()=>send('saveCustomerAccountMovementV1915',{
    requestId:'ACC205_FAKE_RECEIPT_0001',operation:'payment_received',
    customerId:'ACC205_FAKE_A',amount:10,paymentMethod:'نقدي',workDate:'2099-12-31'
  });
  const snapshot=()=>({
    credit:one("SELECT credit_cents AS n FROM employee_accounting_customer_credits_v1 WHERE customer_id='ACC205_FAKE_A'")?.n??null,
    creditRows:count('employee_accounting_customer_credit_events_v1'),
    cashRows:count('employee_accounting_cashbox_v1'),
    commandRows:count('employee_accounting_request_ledger_v1')
  });
  await test('01 accounting fresh OFF cannot access customer liability diagnostic',async()=>{
    assert.equal(one('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').mode,'OFF');
    assert.equal((await audit()).httpStatus,503);
  });
  await test('02 READONLY owner-only but synthetic nonfinance service role is rejected',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    role='service';
    const r=await audit();assert.equal(r.success,false);
    role='admin';
  });
  await test('03 fake role/body spoof cannot authorize without authenticated finance manager',async()=>{
    role='service';
    const r=await send('previewCustomerCreditLiabilityAuditV1',{customerId:'ACC205_FAKE_A',role:'admin'});
    assert.equal(r.success,false);
    role='admin';
  });
  await test('04 missing immutable customer identifier fails, no phone/name fallback',async()=>{
    const r=await send('previewCustomerCreditLiabilityAuditV1',{customerName:'ACC205_FAKE_PERSON_A',phone:'0100000000'});
    assert.equal(r.success,false);
  });
  await test('05 credit feature OFF cannot pretend to reconcile incomplete schema',async()=>{
    env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';
    const r=await audit();assert.equal(r.success,false);
    env.EASYSTORE_CUSTOMER_CREDIT_V1='ON';
  });
  await test('06 actual native Worker receipt creates 1000 piastre liability and one cash receipt',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
    const r=await receipt();assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(snapshot().credit,1000);
    assert.equal(snapshot().creditRows,1);
    assert.equal(snapshot().cashRows,1);
    assert.equal(one("SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key='ACC205_FAKE_RECEIPT_0001'").status,'COMMITTED');
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
  });
  await test('07 READONLY actual COMMITTED receipt reconciles source event total without authorizing payout',async()=>{
    const before=snapshot(),r=await audit();
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.creditCents,1000);
    assert.equal(r.eventDeltaCents,1000);
    assert.equal(r.eventCount,1);
    assert.equal(r.uncommittedEventCount,0);
    assert.equal(r.reviewState,'AGGREGATES_EQUAL_IDENTITY_NOT_VERIFIED');
    assert.equal(r.refundAuthorized,false);assert.equal(r.postingAllowed,false);
    assert.equal(r.financeRelease,'NO_GO');
    assert.deepEqual(snapshot(),before);
  });
  await test('08 no client customer name/phone disclosure or cross-customer event leakage',async()=>{
    const r=await audit('ACC205_FAKE_B');assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.creditCents,null);
    assert.equal(r.eventCount,0);assert.equal(r.reviewState,'NO_BALANCE_OR_EVENTS_NOT_PROVEN');
    assert.equal(r.refundAuthorized,false);
  });
  await test('09 persisted balance manipulated in fake SQLite is detected as mismatch',async()=>{
    db.exec("UPDATE employee_accounting_customer_credits_v1 SET credit_cents=700 WHERE customer_id='ACC205_FAKE_A'");
    const r=await audit();
    assert.equal(r.reviewState,'BALANCE_EVENT_MISMATCH');
    assert.equal(r.creditCents,700);assert.equal(r.eventDeltaCents,1000);
    assert.equal(r.refundAuthorized,false);
    db.exec("UPDATE employee_accounting_customer_credits_v1 SET credit_cents=1000 WHERE customer_id='ACC205_FAKE_A'");
  });
  await test('10 orphan event without a COMMITTED parent request triggers manual review',async()=>{
    db.prepare("INSERT INTO employee_accounting_customer_credit_events_v1(event_id,request_key,customer_id,kind,amount_cents,delta_cents,credit_before_cents,credit_after_cents,actor,created_at_ms) VALUES('ACC205_FAKE_ORPHAN','ACC205_FAKE_ORPHAN_KEY-CREDIT','ACC205_FAKE_A','RECEIPT_EXCESS',100,100,1000,1100,'FAKE',2099000000000)").run();
    const r=await audit();
    assert.equal(r.uncommittedEventCount,1);
    assert.equal(r.reviewState,'UNCOMMITTED_EVENT_REQUIRES_REVIEW');
    assert.equal(r.refundAuthorized,false);
    db.exec("DELETE FROM employee_accounting_customer_credit_events_v1 WHERE event_id='ACC205_FAKE_ORPHAN'");
  });
  await test('11 unknown inactive account ref fails closed; no inference from names',async()=>{
    const r=await audit('ACC205_FAKE_NOT_FOUND');
    assert.equal(r.success,false);
    assert.equal(r.refundAuthorized,false);
  });
  await test('12 readonly cannot process repeat cash receipt even for admin',async()=>{
    const before=snapshot(),r=await receipt();
    assert.equal(r.httpStatus,503);assert.deepEqual(snapshot(),before);
  });
  await test('13 unavailable credit event schema is UNKNOWN, not automatic zero',async()=>{
    db.exec('ALTER TABLE employee_accounting_customer_credit_events_v1 RENAME TO acc205_temporarily_missing_events');
    const r=await audit();
    assert.equal(r.success,false);
    assert.equal(r.refundAuthorized,false);
    db.exec('ALTER TABLE acc205_temporarily_missing_events RENAME TO employee_accounting_customer_credit_events_v1');
  });
  await test('14 no outbound HTTP and final cash/debt/credit remain untouched by all diagnostic calls',async()=>{
    assert.equal(network,0);
    assert.equal(snapshot().credit,1000);
    assert.equal(snapshot().creditRows,1);
    assert.equal(snapshot().cashRows,1);
    assert.equal(snapshot().commandRows,1);
  });
  console.log('ACC205_ACTUAL_ACCOUNTING_RECEIPT_FAKE_SQLITE=TESTED');
  console.log('ACC205_CREDIT_LIABILITY_OWNER_PREVIEW=READONLY_ONLY');
  console.log('FINANCE_RELEASE=NO_GO');
}finally{db.close()}
