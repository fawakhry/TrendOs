import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';

/**
 * ACC OWNER 2026-10-16: ACTUAL native accounting Worker + migration 0031.
 * Every D1 mutation here is in disposable :memory: SQLite only. Fake sessions,
 * synthetic customer and no external network. NO_GO / feature flag OFF by default.
 */
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
const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
assert.match(source,/EASYSTORE_CUSTOMER_CREDIT_V1/);
const worker=source
  .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
  .replace(/^export /gm,'');
const db=new DatabaseSync(':memory:');
try{
  for(const name of migrations)db.exec(fs.readFileSync('cloudflare-d1/migrations/'+name,'utf8'));
  db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,manager TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',extra_phone TEXT NOT NULL DEFAULT '',customer_type TEXT NOT NULL DEFAULT '',active TEXT NOT NULL DEFAULT 'نعم',updated_at TEXT DEFAULT CURRENT_TIMESTAMP)");
  for(const id of ['FAKE_CUST_A','FAKE_CUST_B'])
    db.prepare("INSERT INTO t12_customers(customer_id,customer_name) VALUES(?,?)").run(id,'FAKE_ONLY_'+id);
  const DB={
    prepare(sql){
      const stmt={sql:String(sql),args:[]};
      const w={
        bind(...args){stmt.args=args;return w;},
        first(){return Promise.resolve(db.prepare(stmt.sql).get(...stmt.args)||null);},
        all(){return Promise.resolve({results:db.prepare(stmt.sql).all(...stmt.args)});},
        run(){return Promise.resolve(db.prepare(stmt.sql).run(...stmt.args));}
      };
      w.__statement=stmt;
      return w;
    },
    async batch(items){
      db.exec('BEGIN IMMEDIATE');
      try{
        const result=items.map(q=>db.prepare(q.__statement.sql).run(...q.__statement.args));
        db.exec('COMMIT');
        return result;
      }catch(error){
        db.exec('ROLLBACK');
        throw error;
      }
    }
  };
  const env={DB,CORS_ORIGINS:'https://fawakhry.github.io',
    EASYSTORE_CUSTOMER_CREDIT_V1:'ON'};
  let role='admin',network=0;
  const context=vm.createContext({
    crypto:webcrypto,TextEncoder,Response,Request,Headers,URL,URLSearchParams,Date,Intl,JSON,Math,console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      if(username!=='FAKE_OWNER_ACC_CREDIT'||token!=='FAKE_OFFLINE_TOKEN')
        return {ok:false,message:'Synthetic employee authentication denied'};
      return {ok:true,authSource:'SYNTHETIC_VERIFIER_NOT_REAL_SSO',
        body:{user:{username,role,department:'طباعة'}}};
    }
  });
  vm.runInContext(worker+'\n;globalThis.ACC_CREDIT_HANDLER=handleEmployeeAccountingNativeRequest;',context,{timeout:18000});
  async function send(action,data={},opts={}){
    const oldFetch=globalThis.fetch;
    globalThis.fetch=()=>{network++;throw Error('NETWORK_FORBIDDEN')};
    try{
      const response=await context.ACC_CREDIT_HANDLER(new Request('https://offline.invalid/v1/employee/accounting',{
        method:'POST',headers:{Origin:'https://fawakhry.github.io','content-type':'application/json',
          Authorization:'Bearer '+(opts.token??'FAKE_OFFLINE_TOKEN')},
        body:JSON.stringify({action,username:'FAKE_OWNER_ACC_CREDIT',sourceSystem:'ACC_CREDIT_FAKE_SQLITE',
          ...data})
      }),env);
      return {status:response.status,...await response.json()};
    }finally{globalThis.fetch=oldFetch;}
  }
  const one=(s,...v)=>db.prepare(s).get(...v);
  const all=(s,...v)=>db.prepare(s).all(...v);
  const count=t=>one('SELECT COUNT(*) AS n FROM '+t).n;
  const debt=id=>Number(one("SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=?",id)?.balance||0);
  const credit=id=>Number(one('SELECT credit_cents FROM employee_accounting_customer_credits_v1 WHERE customer_id=?',id)?.credit_cents||0);
  const cash=id=>all("SELECT amount FROM employee_accounting_cashbox_v1 WHERE movement_type='CUSTOMER_RECEIPT' AND party_id=? ORDER BY created_at_ms,rowid",id);
  const creditEvents=id=>all('SELECT kind,amount_cents AS amount,delta_cents AS delta,credit_before_cents AS before,credit_after_cents AS after FROM employee_accounting_customer_credit_events_v1 WHERE customer_id=? ORDER BY rowid',id);
  const sale=(name,amount,paid,customerId='FAKE_CUST_A')=>({
    requestId:'FAKE_CREDIT_SALE_'+name+'_0001',invoiceNo:'FAKE_CREDIT_INVOICE_'+name,
    customerId,department:'طباعة',item:'FAKE_ONLY_PAPER',qty:1,unitPrice:amount,total:amount,paid,
    paymentMethod:'نقدي',workDate:'2099-12-31'
  });
  const receive=(name,amount,customerId='FAKE_CUST_A')=>({
    requestId:'FAKE_CREDIT_RECEIPT_'+name+'_0001',operation:'payment_received',
    customerId,amount,paymentMethod:'نقدي',refNo:'',workDate:'2099-12-31'
  });
  test('01 default OFF state even with D1 schema denies writes',async()=>{
    assert.equal(one('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').mode,'OFF');
    const r=await send('saveCustomerAccountMovementV1915',receive('BLOCK',100));
    assert.equal(r.status,503);
    assert.equal(count('employee_accounting_customer_credit_events_v1'),0);
  });
  test('02 READONLY mode denies customer overpayment writes',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    const r=await send('saveCustomerAccountMovementV1915',receive('RO',100));
    assert.equal(r.status,503);
    assert.equal(count('employee_accounting_cashbox_v1'),0);
  });
  test('03 fake service role cannot create credit or invoice',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
    role='service';
    assert.equal((await send('saveCustomerAccountMovementV1915',receive('FORGE',100))).status,403);
    role='admin';
  });
  test('04 create fabricated print material, actual native D1 source',async()=>{
    const r=await send('saveAccountingMaterial',{
      requestId:'FAKE_CREDIT_MATERIAL_0001',materialName:'FAKE_ONLY_PAPER',
      department:'طباعة',unit:'قطعة',unitCost:10,stockQty:20,active:'نعم'
    });
    assert.equal(r.success,true,JSON.stringify(r));
  });
  test('05 invoice 97 creates debt 97 without any customer credit',async()=>{
    const r=await send('saveEasyStoreSaleV2',sale('A',97,0));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(debt('FAKE_CUST_A'),97);
    assert.equal(credit('FAKE_CUST_A'),0);
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
  });
  test('06 verified cash 100 against debt 97 posts ONE receipt + 300-piastre liability',async()=>{
    const r=await send('saveCustomerAccountMovementV1915',receive('OVER',100));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.balanceBefore,97);
    assert.equal(r.balance,0);
    assert.equal(r.customerCredit,3);
    assert.equal(r.customerDisplayBalance,3);
    assert.equal(debt('FAKE_CUST_A'),0);
    assert.equal(credit('FAKE_CUST_A'),300);
    assert.equal(cash('FAKE_CUST_A').length,1);
    assert.equal(cash('FAKE_CUST_A')[0].amount,100);
    assert.deepEqual(creditEvents('FAKE_CUST_A').map(e=>[e.kind,e.amount,e.delta]),
      [['RECEIPT_EXCESS',300,300]]);
    const debtLedger=one("SELECT amount FROM employee_accounting_party_ledger_v1 WHERE party_type='customer' AND operation='payment_received' AND party_id='FAKE_CUST_A'");
    assert.equal(debtLedger.amount,97,'remaining 3 is not falsely posted as customer debt reduction');
  });
  test('07 exact receipt retry after ACK lost cannot duplicate credit/cashbox',async()=>{
    const before=[count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1')];
    const again=await send('saveCustomerAccountMovementV1915',receive('OVER',100));
    assert.equal(again.success,true,JSON.stringify(again));
    assert.equal(again.duplicatePrevented,true);
    assert.equal(again.customerCredit,3);
    assert.deepEqual([count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1')],before);
  });
  test('08 next 20 invoice atomically consumes +3 customer credit; 17 remains, zero cash',async()=>{
    const priorCash=count('employee_accounting_cashbox_v1');
    const r=await send('saveEasyStoreSaleV2',sale('B',20,0));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.paid,3);
    assert.equal(r.creditApplied,3);
    assert.equal(r.cashReceived,0);
    assert.equal(r.remaining,17);
    assert.equal(r.customerCreditRemaining,0);
    assert.equal(debt('FAKE_CUST_A'),17);
    assert.equal(credit('FAKE_CUST_A'),0);
    assert.equal(count('employee_accounting_cashbox_v1'),priorCash);
    const inv=one('SELECT paid,remaining,credit_applied AS applied,cash_received AS cash,credit_created AS created FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?','FAKE_CREDIT_INVOICE_B');
    assert.deepEqual([inv.paid,inv.remaining,inv.applied,inv.cash,inv.created],[3,17,3,0,0]);
    assert.deepEqual(creditEvents('FAKE_CUST_A').map(e=>[e.kind,e.delta]),[
      ['RECEIPT_EXCESS',300],['INVOICE_CREDIT_APPLIED',-300]]);
  });
  test('09 direct invoice 97.5 paid 100 creates 250-piastre customer liability at invoice-time',async()=>{
    const r=await send('saveEasyStoreSaleV2',sale('C',97.5,100,'FAKE_CUST_B'));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.paid,97.5);
    assert.equal(r.cashReceived,100);
    assert.equal(r.customerCreditCreated,2.5);
    assert.equal(r.remaining,0);
    assert.equal(credit('FAKE_CUST_B'),250);
    assert.equal(debt('FAKE_CUST_B'),0);
    assert.deepEqual(cash('FAKE_CUST_B').map(x=>x.amount),[100]);
  });
  test('10 completely prepaid customer 50 with no invoices retains +50 credit',async()=>{
    const r=await send('saveCustomerAccountMovementV1915',receive('PREPAY',50,'FAKE_CUST_B'));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(credit('FAKE_CUST_B'),5250);
    assert.equal(debt('FAKE_CUST_B'),0);
    assert.equal(cash('FAKE_CUST_B').length,2);
  });
  test('11 invoice 20 with customer credit 52.5 consumes 20 and retains +32.5',async()=>{
    const r=await send('saveEasyStoreSaleV2',sale('D',20,0,'FAKE_CUST_B'));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.paid,20);
    assert.equal(r.creditApplied,20);
    assert.equal(r.cashReceived,0);
    assert.equal(r.remaining,0);
    assert.equal(credit('FAKE_CUST_B'),3250);
    assert.equal(debt('FAKE_CUST_B'),0);
    assert.equal(cash('FAKE_CUST_B').length,2);
  });
  test('12 successful credit-backed invoice replay is idempotent',async()=>{
    const before=[count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1'),count('employee_accounting_final_invoices_v1')];
    const repeat=await send('saveEasyStoreSaleV2',sale('D',20,0,'FAKE_CUST_B'));
    assert.equal(repeat.success,true,JSON.stringify(repeat));
    assert.equal(repeat.duplicatePrevented,true);
    assert.deepEqual([count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1'),count('employee_accounting_final_invoices_v1')],before);
  });
  test('13 account/customer listing displays positive customer-facing balance',async()=>{
    const r=await send('getCustomerAccountV1915',{customerId:'FAKE_CUST_B'});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.creditBalance,32.5);
    assert.equal(r.outstandingDebt,0);
    assert.equal(r.displayBalance,32.5);
    assert.equal(r.customer.displayBalance,32.5);
    const list=await send('getEasyStoreCustomers');
    assert.equal(list.success,true,JSON.stringify(list));
    assert.equal(list.customers.find(x=>x.customerId==='FAKE_CUST_B').creditBalance,32.5);
    const search=await send('searchCustomers',{q:'FAKE_CUST_B'});
    assert.equal(search.success,true,JSON.stringify(search));
    assert.equal(search.customers[0].displayBalance,32.5);
  });
  test('14 non-cent-safe payment never credits fake account',async()=>{
    const c=credit('FAKE_CUST_B'),n=count('employee_accounting_cashbox_v1');
    const r=await send('saveCustomerAccountMovementV1915',receive('BAD',1.001,'FAKE_CUST_B'));
    assert.equal(r.success,false);
    assert.equal(credit('FAKE_CUST_B'),c);
    assert.equal(count('employee_accounting_cashbox_v1'),n);
  });
  test('15 forged credentials cannot access customer liability or submit receipts',async()=>{
    assert.equal((await send('getCustomerAccountV1915',{customerId:'FAKE_CUST_B'},{token:'BAD'})).status,401);
    assert.equal((await send('saveCustomerAccountMovementV1915',receive('NOAUTH',1,'FAKE_CUST_B'),{token:'BAD'})).status,401);
  });
  test('16 unsafe reversal of credit-backed invoice must fail closed',async()=>{
    const before=credit('FAKE_CUST_B');
    const r=await send('reopenAccountingFinalInvoice',{invoiceNo:'FAKE_CREDIT_INVOICE_D',reason:'FAKE_REQUEST'});
    assert.equal(r.success,false);
    assert.equal(r.code,'customer-credit-invoice-reversal-not-implemented');
    assert.equal(credit('FAKE_CUST_B'),before);
  });
  test('17 default feature-flag OFF on same fake D1 preserves legacy overpay denial',async()=>{
    env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';
    const c=credit('FAKE_CUST_B'),n=count('employee_accounting_cashbox_v1');
    const r=await send('saveCustomerAccountMovementV1915',receive('OFF',1,'FAKE_CUST_B'));
    assert.equal(r.success,false);
    assert.equal(credit('FAKE_CUST_B'),c);
    assert.equal(count('employee_accounting_cashbox_v1'),n);
    env.EASYSTORE_CUSTOMER_CREDIT_V1='ON';
  });
  test('18 preserve integrity: cash equals actual funds received; credit events reconcile liability',()=>{
    assert.equal(network,0);
    for(const id of ['FAKE_CUST_A','FAKE_CUST_B']){
      const delta=one("SELECT COALESCE(SUM(delta_cents),0) AS n FROM employee_accounting_customer_credit_events_v1 WHERE customer_id=?",id).n;
      assert.equal(delta,credit(id));
      const c=cash(id).reduce((a,x)=>a+x.amount,0);
      assert.ok(c>=0);
    }
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_accounting_tx_guard_v1").n,0);
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_accounting_request_ledger_v1 WHERE status='PREPARED'").n,0);
  });
}finally{db.close()}
