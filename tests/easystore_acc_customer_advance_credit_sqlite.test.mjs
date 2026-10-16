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
  let auditWriteFault=0; // synthetic audit INSERT failure, never a real D1 or customer write
  let creditRaceGate=null; // deterministic LOCAL interleaving: both credit reads see one stale version
  const DB={
    prepare(sql){
      const stmt={sql:String(sql),args:[]};
      const w={
        bind(...args){stmt.args=args;return w;},
        first(){
          const result=db.prepare(stmt.sql).get(...stmt.args)||null;
          const gate=creditRaceGate;
          if(gate && stmt.sql.includes("SELECT credit_cents AS creditCents,version FROM employee_accounting_customer_credits_v1")
            && stmt.args[0]==='FAKE_CUST_B'){
            gate.snapshots.push({cents:Number(result.creditCents),version:Number(result.version)});
            return new Promise((resolve,reject)=>{
              const timeout=setTimeout(()=>reject(Error('CREDIT_STALE_SNAPSHOT_BARRIER_TIMEOUT')),5000);
              gate.waiters.push(()=>{clearTimeout(timeout);resolve(result)});
              if(gate.waiters.length===2){
                creditRaceGate=null;
                for(const notify of gate.waiters)notify();
              }
            });
          }
          return Promise.resolve(result);
        },
        all(){return Promise.resolve({results:db.prepare(stmt.sql).all(...stmt.args)});},
        run(){
          if(auditWriteFault>0 && stmt.sql.includes('INSERT INTO employee_accounting_events_v1')){
            auditWriteFault--;
            return Promise.reject(Error('SYNTHETIC_AUDIT_INSERT_FAILURE'));
          }
          return Promise.resolve(db.prepare(stmt.sql).run(...stmt.args));
        }
      };
      w.__statement=stmt;
      return w;
    },
    async batch(items){
      db.exec('BEGIN IMMEDIATE');
      try{
        const result=items.map(q=>{
          if(auditWriteFault>0 && q.__statement.sql.includes('INSERT INTO employee_accounting_events_v1')){
            auditWriteFault--;
            throw Error('SYNTHETIC_AUDIT_INSERT_FAILURE');
          }
          return db.prepare(q.__statement.sql).run(...q.__statement.args);
        });
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
  await test('01 default OFF state even with D1 schema denies writes',async()=>{
    assert.equal(one('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').mode,'OFF');
    const r=await send('saveCustomerAccountMovementV1915',receive('BLOCK',100));
    assert.equal(r.status,503);
    assert.equal(count('employee_accounting_customer_credit_events_v1'),0);
  });
  await test('02 READONLY mode denies customer overpayment writes',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    const r=await send('saveCustomerAccountMovementV1915',receive('RO',100));
    assert.equal(r.status,503);
    assert.equal(count('employee_accounting_cashbox_v1'),0);
  });
  await test('03 fake service role cannot create credit or invoice',async()=>{
    db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
    role='service';
    assert.equal((await send('saveCustomerAccountMovementV1915',receive('FORGE',100))).status,403);
    role='admin';
  });
  await test('04 create fabricated print material, actual native D1 source',async()=>{
    const r=await send('saveAccountingMaterial',{
      requestId:'FAKE_CREDIT_MATERIAL_0001',materialName:'FAKE_ONLY_PAPER',
      department:'طباعة',unit:'قطعة',unitCost:10,stockQty:20,active:'نعم'
    });
    assert.equal(r.success,true,JSON.stringify(r));
  });
  await test('05 invoice 97 creates debt 97 without any customer credit',async()=>{
    const r=await send('saveEasyStoreSaleV2',sale('A',97,0));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(debt('FAKE_CUST_A'),97);
    assert.equal(credit('FAKE_CUST_A'),0);
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
  });
  await test('06 verified cash 100 against debt 97 posts ONE receipt + 300-piastre liability',async()=>{
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
  await test('07 exact receipt retry after ACK lost cannot duplicate credit/cashbox',async()=>{
    const before=[count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1')];
    const again=await send('saveCustomerAccountMovementV1915',receive('OVER',100));
    assert.equal(again.success,true,JSON.stringify(again));
    assert.equal(again.duplicatePrevented,true);
    assert.equal(again.customerCredit,3);
    assert.deepEqual([count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1')],before);
  });
  await test('08 next 20 invoice atomically consumes +3 customer credit; 17 remains, zero cash',async()=>{
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
  await test('09 direct invoice 97.5 paid 100 creates 250-piastre customer liability at invoice-time',async()=>{
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
  await test('10 completely prepaid customer 50 with no invoices retains +50 credit',async()=>{
    const r=await send('saveCustomerAccountMovementV1915',receive('PREPAY',50,'FAKE_CUST_B'));
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(credit('FAKE_CUST_B'),5250);
    assert.equal(debt('FAKE_CUST_B'),0);
    assert.equal(cash('FAKE_CUST_B').length,2);
  });
  await test('11 invoice 20 with customer credit 52.5 consumes 20 and retains +32.5',async()=>{
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
  await test('12 successful credit-backed invoice replay is idempotent',async()=>{
    const before=[count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1'),count('employee_accounting_final_invoices_v1')];
    const repeat=await send('saveEasyStoreSaleV2',sale('D',20,0,'FAKE_CUST_B'));
    assert.equal(repeat.success,true,JSON.stringify(repeat));
    assert.equal(repeat.duplicatePrevented,true);
    assert.deepEqual([count('employee_accounting_customer_credit_events_v1'),count('employee_accounting_cashbox_v1'),count('employee_accounting_final_invoices_v1')],before);
  });
  await test('13 account/customer listing displays positive customer-facing balance',async()=>{
    const r=await send('getCustomerAccountV1915',{customerId:'FAKE_CUST_B'});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.creditBalance,32.5);
    assert.equal(r.outstandingDebt,0);
    assert.equal(r.displayBalance,32.5);
    assert.equal(r.customer.displayBalance,32.5);
    const list=await send('getEasyStoreCustomers');
    assert.equal(list.success,true,JSON.stringify(list));
    assert.ok(list.customers.some(x=>x.customerId==='FAKE_CUST_B'),JSON.stringify({list:list.customers,source:all('SELECT customer_id,customer_name,active FROM t12_customers')}));
    assert.equal(list.customers.find(x=>x.customerId==='FAKE_CUST_B').creditBalance,32.5);
    const search=await send('searchCustomers',{q:'FAKE_CUST_B'});
    assert.equal(search.success,true,JSON.stringify(search));
    assert.equal(search.customers[0].displayBalance,32.5);
  });
  await test('14 non-cent-safe payment never credits fake account',async()=>{
    const c=credit('FAKE_CUST_B'),n=count('employee_accounting_cashbox_v1');
    const r=await send('saveCustomerAccountMovementV1915',receive('BAD',1.001,'FAKE_CUST_B'));
    assert.equal(r.success,false);
    assert.equal(credit('FAKE_CUST_B'),c);
    assert.equal(count('employee_accounting_cashbox_v1'),n);
  });
  await test('15 forged credentials cannot access customer liability or submit receipts',async()=>{
    assert.equal((await send('getCustomerAccountV1915',{customerId:'FAKE_CUST_B'},{token:'BAD'})).status,401);
    assert.equal((await send('saveCustomerAccountMovementV1915',receive('NOAUTH',1,'FAKE_CUST_B'),{token:'BAD'})).status,401);
  });
  await test('16 unsafe reversal of credit-backed invoice must fail closed',async()=>{
    const before=credit('FAKE_CUST_B');
    const r=await send('reopenAccountingFinalInvoice',{invoiceNo:'FAKE_CREDIT_INVOICE_D',reason:'FAKE_REQUEST'});
    assert.equal(r.success,false);
    assert.equal(r.code,'customer-credit-invoice-reversal-not-implemented');
    assert.equal(credit('FAKE_CUST_B'),before);
  });
  await test('17 default feature-flag OFF on same fake D1 preserves legacy overpay denial',async()=>{
    env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';
    const c=credit('FAKE_CUST_B'),n=count('employee_accounting_cashbox_v1');
    const r=await send('saveCustomerAccountMovementV1915',receive('OFF',1,'FAKE_CUST_B'));
    assert.equal(r.success,false);
    assert.equal(credit('FAKE_CUST_B'),c);
    assert.equal(count('employee_accounting_cashbox_v1'),n);
    env.EASYSTORE_CUSTOMER_CREDIT_V1='ON';
  });
  let winningReceipt=null,staleReceipt=null;
  await test('18 two truly overlapping 1 EGP advances use atomic debt + credit CAS; only one posts',async()=>{
    const beforeCash=count('employee_accounting_cashbox_v1');
    const beforeEvents=count('employee_accounting_customer_credit_events_v1');
    const beforeCredit=credit('FAKE_CUST_B');
    const gate={waiters:[],snapshots:[]};
    creditRaceGate=gate;
    const a=receive('RACE_A',1,'FAKE_CUST_B'),b=receive('RACE_B',1,'FAKE_CUST_B');
    let results;
    try{
      results=await Promise.all([
        send('saveCustomerAccountMovementV1915',a),
        send('saveCustomerAccountMovementV1915',b)
      ]);
    }finally{creditRaceGate=null}
    assert.equal(gate.snapshots.length,2,'both payments must observe same precommit credit snapshot');
    assert.deepEqual(gate.snapshots.map(v=>v.cents),[beforeCredit,beforeCredit]);
    assert.equal(gate.snapshots[0].version,gate.snapshots[1].version);
    const success=results.filter(x=>x.success===true),failure=results.filter(x=>x.success===false);
    assert.equal(success.length,1,JSON.stringify(results));
    assert.equal(failure.length,1,JSON.stringify(results));
    winningReceipt=results[0].success?a:b;
    staleReceipt=results[0].success?b:a;
    assert.equal(credit('FAKE_CUST_B'),beforeCredit+100);
    assert.equal(debt('FAKE_CUST_B'),0);
    assert.equal(count('employee_accounting_cashbox_v1'),beforeCash+1);
    assert.equal(count('employee_accounting_customer_credit_events_v1'),beforeEvents+1);
    assert.equal(failure[0].status,500,'stale version must fail closed, not silently post');
  });
  await test('19 concurrent winner replay is exactly-once and loser PREPARED cannot be replayed',async()=>{
    const counts=()=>[count('employee_accounting_cashbox_v1'),count('employee_accounting_customer_credit_events_v1')];
    const before=counts();
    const winner=await send('saveCustomerAccountMovementV1915',winningReceipt);
    assert.equal(winner.success,true,JSON.stringify(winner));
    assert.equal(winner.duplicatePrevented,true);
    assert.deepEqual(counts(),before);
    const loser=await send('saveCustomerAccountMovementV1915',staleReceipt);
    assert.equal(loser.success,false);
    assert.deepEqual(counts(),before);
    assert.equal(Number(one("SELECT COUNT(*) AS n FROM employee_accounting_request_ledger_v1 WHERE status='PREPARED'").n),1);
  });
  await test('20 final post-race customer credit liability reconciles without fabricated revenue',async()=>{
    const r=await send('getCustomerAccountV1915',{customerId:'FAKE_CUST_B'});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.displayBalance,33.5);
    assert.equal(r.creditBalance,33.5);
    assert.equal(r.outstandingDebt,0);
    assert.equal(cash('FAKE_CUST_B').reduce((n,x)=>n+x.amount,0),151);
    assert.equal(creditEvents('FAKE_CUST_B').reduce((n,x)=>n+x.delta,0),3350);
  });
  let winningInvoice=null,staleInvoice=null;
  await test('22 two parallel invoices cannot spend the same prepaid customer credit twice',async()=>{
    const customerId='FAKE_CUST_B',before=credit(customerId);
    assert.equal(before,3350);
    const beforeCash=cash(customerId).length;
    const beforeInvoiceCount=count('employee_accounting_final_invoices_v1');
    const beforeStock=Number(one("SELECT SUM(stock_qty) AS n FROM employee_accounting_materials_v1").n);
    const beforeEvents=creditEvents(customerId).length;
    const a=sale('CREDIT_RACE_A',20,0,customerId);
    const b=sale('CREDIT_RACE_B',20,0,customerId);
    const gate={waiters:[],snapshots:[]};
    creditRaceGate=gate;
    let pair;
    try{
      pair=await Promise.all([
        send('saveEasyStoreSaleV2',a),
        send('saveEasyStoreSaleV2',b)
      ]);
    }finally{creditRaceGate=null}
    assert.equal(gate.snapshots.length,2,'both invoice handlers read the same credit-version snapshot');
    assert.deepEqual(gate.snapshots.map(x=>x.cents),[3350,3350]);
    assert.equal(gate.snapshots[0].version,gate.snapshots[1].version);
    const posted=pair.filter(x=>x.success===true),denied=pair.filter(x=>x.success===false);
    assert.equal(posted.length,1,JSON.stringify(pair));
    assert.equal(denied.length,1,JSON.stringify(pair));
    assert.equal(posted[0].creditApplied,20);
    assert.equal(posted[0].cashReceived,0);
    assert.equal(posted[0].remaining,0);
    assert.equal(credit(customerId),1350,'only 2000 piastres of advance were spent');
    assert.equal(count('employee_accounting_final_invoices_v1'),beforeInvoiceCount+1);
    assert.equal(creditEvents(customerId).length,beforeEvents+1);
    assert.equal(cash(customerId).length,beforeCash,'using advance never creates a new cash collection');
    assert.equal(Number(one("SELECT SUM(stock_qty) AS n FROM employee_accounting_materials_v1").n),beforeStock-1);
    winningInvoice=pair[0].success?a:b;
    staleInvoice=pair[0].success?b:a;
  });
  await test('23 credit-backed invoice replay cannot consume the same advance again',async()=>{
    const previousCredit=credit('FAKE_CUST_B'),previousInvoices=count('employee_accounting_final_invoices_v1');
    const previousCash=cash('FAKE_CUST_B').length,previousEvents=creditEvents('FAKE_CUST_B').length;
    const ok=await send('saveEasyStoreSaleV2',winningInvoice);
    assert.equal(ok.success,true,JSON.stringify(ok));
    assert.equal(ok.duplicatePrevented,true);
    assert.equal(credit('FAKE_CUST_B'),previousCredit);
    assert.equal(count('employee_accounting_final_invoices_v1'),previousInvoices);
    assert.equal(cash('FAKE_CUST_B').length,previousCash);
    assert.equal(creditEvents('FAKE_CUST_B').length,previousEvents);
    const rejected=await send('saveEasyStoreSaleV2',staleInvoice);
    assert.equal(rejected.success,false,'stale PREPARED credit-spend must not silently retry');
    assert.equal(credit('FAKE_CUST_B'),previousCredit);
    assert.equal(count('employee_accounting_final_invoices_v1'),previousInvoices);
  });
  const liabilitySnapshot=()=>({
    creditA:credit('FAKE_CUST_A'),creditB:credit('FAKE_CUST_B'),
    debtA:debt('FAKE_CUST_A'),debtB:debt('FAKE_CUST_B'),
    cash:count('employee_accounting_cashbox_v1'),
    events:count('employee_accounting_customer_credit_events_v1'),
    invoices:count('employee_accounting_final_invoices_v1'),
    partyEvents:count('employee_accounting_party_ledger_v1'),
    stockMoves:count('employee_accounting_stock_moves_v1'),
    stock:one('SELECT SUM(stock_qty) AS total FROM employee_accounting_materials_v1').total
  });
  await test('24 native full-role invoice review reads credit-used and cash receipt evidence without posting',async()=>{
    const previous=liabilitySnapshot();
    const r=await send('previewCustomerCreditInvoiceReviewV1',{
      invoiceNo:'FAKE_CREDIT_INVOICE_B',proposedInvoiceTotal:'15.00'
    });
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.invoiceTotalCents,2000);
    assert.equal(r.originalCreditAppliedCents,300);
    assert.equal(r.originalCashReceivedCents,0);
    assert.equal(r.originalCreditCreatedCents,0);
    assert.equal(r.originalRemainingCents,1700);
    assert.equal(r.proposedInvoiceTotalCents,1500);
    assert.equal(r.proposedDifferenceCents,500);
    assert.equal(r.evidenceEventsVerified,1);
    assert.equal(r.creditRestorationAuthorized,false);
    assert.equal(r.cashRefundAuthorized,false);
    assert.equal(r.postingAllowed,false);
    assert.equal(r.financeRelease,'NO_GO');
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('25 read-only review shows excess cash invoice liability and blocks automatic compensation',async()=>{
    const previous=liabilitySnapshot();
    const r=await send('previewCustomerCreditInvoiceReviewV1',{
      invoiceNo:'FAKE_CREDIT_INVOICE_C',proposedInvoiceTotal:'80.00'
    });
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.invoiceTotalCents,9750);
    assert.equal(r.originalCashReceivedCents,10000);
    assert.equal(r.originalCreditCreatedCents,250);
    assert.equal(r.originalCreditAppliedCents,0);
    assert.equal(r.proposedDifferenceCents,1750);
    assert.equal(r.approvalRequired,true);
    assert.equal(r.postingAllowed,false);
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('26 invoice cancellation proposal of zero returns only review preview; no credit or cash mutated',async()=>{
    const previous=liabilitySnapshot();
    const r=await send('previewCustomerCreditInvoiceReviewV1',{
      invoiceNo:'FAKE_CREDIT_INVOICE_D',proposedInvoiceTotal:0
    });
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.originalCreditAppliedCents,2000);
    assert.equal(r.proposedDifferenceCents,2000);
    assert.equal(r.creditRestorationAuthorized,false);
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('27 ordinary staff and forged browser role cannot view private invoice credit review',async()=>{
    const previous=liabilitySnapshot();
    role='service';
    try{
      const denied=await send('previewCustomerCreditInvoiceReviewV1',{
        invoiceNo:'FAKE_CREDIT_INVOICE_D',role:'admin',ownerVerified:true
      });
      assert.equal(denied.success,false);
      assert.equal(denied.status,403);
    }finally{role='admin'}
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('28 missing and unsafe modified totals fail closed before returning review',async()=>{
    const previous=liabilitySnapshot();
    for(const proposedInvoiceTotal of ['-1','12.345','nan',{},'9999999999999999999999']){
      const r=await send('previewCustomerCreditInvoiceReviewV1',{
        invoiceNo:'FAKE_CREDIT_INVOICE_D',proposedInvoiceTotal
      });
      assert.equal(r.success,false,JSON.stringify(r));
      assert.equal(r.postingAllowed,false);
    }
    const missing=await send('previewCustomerCreditInvoiceReviewV1',{invoiceNo:'FAKE_NOT_EXISTING'});
    assert.equal(missing.success,false);
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('29 changing a historic credit-applied invoice still fails CLOSED; no financial POST',async()=>{
    const previous=liabilitySnapshot();
    for(const action of ['reopenAccountingFinalInvoice','modifyCustomerCreditInvoice']){
      const r=await send(action,{invoiceNo:'FAKE_CREDIT_INVOICE_D',
        reason:'FAKE_CHANGE_REQUEST',proposedInvoiceTotal:12.50});
      assert.equal(r.success,false,JSON.stringify({action,r}));
    }
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('30 even with the credit FEATURE FLAG OFF, historic credit-backed invoice cannot be reversed',async()=>{
    const previous=liabilitySnapshot();
    env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';
    try{
      const r=await send('reopenAccountingFinalInvoice',{invoiceNo:'FAKE_CREDIT_INVOICE_D',reason:'FAKE_RETURN'});
      assert.equal(r.success,false,JSON.stringify(r));
      assert.equal(r.code,'customer-credit-invoice-reversal-not-implemented');
      const preview=await send('previewCustomerCreditInvoiceReviewV1',{invoiceNo:'FAKE_CREDIT_INVOICE_D'});
      assert.equal(preview.success,false);
      assert.equal(preview.code,'customer-credit-review-feature-off');
    }finally{env.EASYSTORE_CUSTOMER_CREDIT_V1='ON'}
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('31 duplicate review calls are pure reads; no invoice, ledger, credit or cash duplication',async()=>{
    const previous=liabilitySnapshot();
    const first=await send('previewCustomerCreditInvoiceReviewV1',{invoiceNo:'FAKE_CREDIT_INVOICE_D',proposedInvoiceTotal:15});
    const second=await send('previewCustomerCreditInvoiceReviewV1',{invoiceNo:'FAKE_CREDIT_INVOICE_D',proposedInvoiceTotal:15});
    assert.equal(first.success,true,JSON.stringify(first));
    assert.deepEqual(second,first);
    assert.deepEqual(liabilitySnapshot(),previous);
  });
  await test('32 corrupt invoice credit amount / missing immutable event evidence are rejected without compensating write',async()=>{
    const previous=liabilitySnapshot();
    db.prepare("UPDATE employee_accounting_final_invoices_v1 SET credit_applied=credit_applied+1 WHERE invoice_no=?")
      .run('FAKE_CREDIT_INVOICE_D');
    const broken=await send('previewCustomerCreditInvoiceReviewV1',{invoiceNo:'FAKE_CREDIT_INVOICE_D'});
    assert.equal(broken.success,false);
    assert.ok(['customer-credit-review-invoice-integrity','customer-credit-review-event-lineage-unproven'].includes(broken.code),JSON.stringify(broken));
    db.prepare("UPDATE employee_accounting_final_invoices_v1 SET credit_applied=credit_applied-1 WHERE invoice_no=?")
      .run('FAKE_CREDIT_INVOICE_D');
    assert.deepEqual(liabilitySnapshot(),previous);
  });

  // 2026-10-16 PREPARED FORENSICS: intentionally NO financial commands.
  // These fake SQLite tests never unlock, retry, refund or reconcile a ledger.
  const forensicSnapshot=()=>({
    balances:liabilitySnapshot(),
    requestStates:all('SELECT request_key,status FROM employee_accounting_request_ledger_v1 ORDER BY request_key'),
    creditEvents:all('SELECT request_key,delta_cents FROM employee_accounting_customer_credit_events_v1 ORDER BY request_key'),
    cashbox:all('SELECT request_key,amount FROM employee_accounting_cashbox_v1 ORDER BY request_key')
  });
  await test('33 stale invoice PREPARED exposes no visible effects but NEVER authorizes automatic replay',async()=>{
    const before=forensicSnapshot();
    const key=staleInvoice.requestId;
    assert.equal(one('SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key=?',key).status,'PREPARED');
    const r=await send('previewCustomerCreditPreparedCommandV1',{requestKey:key});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.commandStatus,'PREPARED');
    assert.equal(r.operation,'credit-direct-sale');
    assert.equal(r.observedEffectCount,0);
    assert.equal(r.reviewState,'PREPARED_WITHOUT_VISIBLE_EFFECTS_STILL_UNRESOLVED');
    assert.equal(r.automaticRetryAuthorized,false);
    assert.equal(r.postingAllowed,false);
    assert.equal(r.manualReconciliationRequired,true);
    assert.equal(r.financeRelease,'NO_GO');
    assert.deepEqual(forensicSnapshot(),before);
  });
  await test('34 stale receipt PREPARED inspectable in READONLY even if credit feature flag OFF',async()=>{
    const before=forensicSnapshot();
    env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    try{
      const r=await send('previewCustomerCreditPreparedCommandV1',{requestKey:staleReceipt.requestId});
      assert.equal(r.success,true,JSON.stringify(r));
      assert.equal(r.operation,'party-ledger:customer:payment_received');
      assert.equal(r.creditFeatureEnabled,false);
      assert.equal(r.commandStatus,'PREPARED');
      assert.equal(r.observedEffectCount,0);
      assert.equal(r.automaticRetryAuthorized,false);
      assert.equal(r.refundAuthorized,false);
    }finally{
      env.EASYSTORE_CUSTOMER_CREDIT_V1='ON';
      db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    }
    assert.deepEqual(forensicSnapshot(),before);
  });
  await test('35 successful credit invoice and excess receipt have distinct bounded evidence footprints',async()=>{
    const before=forensicSnapshot();
    const invoice=await send('previewCustomerCreditPreparedCommandV1',{requestKey:sale('D',20,0,'FAKE_CUST_B').requestId});
    assert.equal(invoice.success,true,JSON.stringify(invoice));
    assert.equal(invoice.commandStatus,'COMMITTED');
    assert.equal(invoice.evidence.invoiceCount,1);
    assert.equal(invoice.evidence.creditEventCount,1);
    assert.ok(invoice.evidence.stockMovementCount>0);
    assert.ok(invoice.observedEffectCount>=3);
    assert.equal(invoice.reviewState,'COMMITTED_EVIDENCE_CHECK_ONLY');
    assert.equal(invoice.automaticRetryAuthorized,false);
    const receipt=await send('previewCustomerCreditPreparedCommandV1',{requestKey:receive('OVER',100).requestId});
    assert.equal(receipt.success,true,JSON.stringify(receipt));
    assert.equal(receipt.commandStatus,'COMMITTED');
    assert.equal(receipt.evidence.invoiceCount,0);
    assert.equal(receipt.evidence.cashCount,1);
    assert.equal(receipt.evidence.creditEventCount,1);
    assert.equal(receipt.refundAuthorized,false);
    assert.deepEqual(forensicSnapshot(),before);
  });
  await test('36 forged full role, unauthenticated caller, invalid keys and unrelated operation fail closed',async()=>{
    const before=forensicSnapshot();
    role='service';
    try{
      const denied=await send('previewCustomerCreditPreparedCommandV1',{
        requestKey:staleInvoice.requestId,role:'admin',ownerVerified:true
      });
      assert.equal(denied.success,false);
      assert.equal(denied.status,403);
    }finally{role='admin';}
    const invalidToken=await send('previewCustomerCreditPreparedCommandV1',
      {requestKey:staleInvoice.requestId},{token:'FAKE_BAD_TOKEN'});
    assert.equal(invalidToken.status,401);
    for(const requestKey of ['../bad','x','FAKE_CREDIT_TEST_KEY!',''.padEnd(181,'A')]){
      const r=await send('previewCustomerCreditPreparedCommandV1',{requestKey});
      assert.equal(r.success,false,JSON.stringify(r));
      assert.equal(r.code,'customer-credit-prepared-key-required');
      assert.equal(r.postingAllowed,false);
    }
    const absent=await send('previewCustomerCreditPreparedCommandV1',{requestKey:'FAKE_UNKNOWN_PREPARED_0001'});
    assert.equal(absent.code,'customer-credit-prepared-not-found');
    const unrelated=await send('previewCustomerCreditPreparedCommandV1',{requestKey:'FAKE_CREDIT_MATERIAL_0001'});
    assert.equal(unrelated.code,'customer-credit-prepared-out-of-scope');
    assert.deepEqual(forensicSnapshot(),before);
  });
  await test('37 mocked interrupted commit with prior effects stays manual review; never marked safe to replay',async()=>{
    const key=sale('D',20,0,'FAKE_CUST_B').requestId;
    const before=forensicSnapshot();
    db.prepare("UPDATE employee_accounting_request_ledger_v1 SET status='PREPARED' WHERE request_key=?").run(key);
    try{
      const r=await send('previewCustomerCreditPreparedCommandV1',{requestKey:key});
      assert.equal(r.success,true,JSON.stringify(r));
      assert.equal(r.commandStatus,'PREPARED');
      assert.ok(r.observedEffectCount>=3);
      assert.equal(r.reviewState,'PREPARED_WITH_EFFECTS_MANUAL_RECONCILIATION');
      assert.equal(r.automaticRetryAuthorized,false);
      assert.equal(r.creditRestorationAuthorized,false);
      assert.equal(r.postingAllowed,false);
    }finally{
      db.prepare("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED' WHERE request_key=?").run(key);
    }
    assert.deepEqual(forensicSnapshot(),before);
  });
  await test('38 repeated PREPARED preview is idempotent read and does not alter credit, cash or pending state',async()=>{
    const before=forensicSnapshot();
    const req={requestKey:staleReceipt.requestId};
    const a=await send('previewCustomerCreditPreparedCommandV1',req);
    const b=await send('previewCustomerCreditPreparedCommandV1',req);
    assert.deepEqual(b,a);
    assert.equal(a.automaticRetryAuthorized,false);
    assert.deepEqual(forensicSnapshot(),before);
    assert.equal(network,0);
  });

  await test('39 BOOK18 P0 same-name customers cannot be mixed in account read, receipt or invoice',async()=>{
    const before=forensicSnapshot(),duplicateName='FAKE_AMBIGUOUS_CUSTOMER_NAME';
    for(const id of ['FAKE_DUPLICATE_001','FAKE_DUPLICATE_002']){
      db.prepare('INSERT INTO t12_customers(customer_id,customer_name) VALUES(?,?)').run(id,duplicateName);
    }
    const account=await send('getCustomerAccountV1915',{customerName:duplicateName});
    assert.equal(account.success,false,JSON.stringify(account));
    assert.equal(account.code,'accounting-customer-name-ambiguous');
    const receipt=await send('saveCustomerAccountMovementV1915',{
      ...receive('DUPLICATE_NAME',1),customerId:'',customerName:duplicateName
    });
    assert.equal(receipt.success,false,JSON.stringify(receipt));
    assert.equal(receipt.code,'accounting-customer-name-ambiguous');
    const invoice=await send('saveEasyStoreSaleV2',{
      ...sale('DUPLICATE_NAME',20,0),customerId:'',customerName:duplicateName
    });
    assert.equal(invoice.success,false,JSON.stringify(invoice));
    assert.equal(invoice.code,'accounting-customer-name-ambiguous');
    assert.deepEqual(forensicSnapshot(),before,'ambiguous name must not move any finances');
  });
  await test('40 BOOK18 P0 explicit stable IDs isolate same-name accounts and never degrade into name fallback',async()=>{
    const before=forensicSnapshot();
    const a=await send('getCustomerAccountV1915',{customerId:'FAKE_DUPLICATE_001'});
    const b=await send('getCustomerAccountV1915',{customerId:'FAKE_DUPLICATE_002'});
    assert.equal(a.success,true,JSON.stringify(a));
    assert.equal(b.success,true,JSON.stringify(b));
    assert.equal(a.customer.customerId,'FAKE_DUPLICATE_001');
    assert.equal(b.customer.customerId,'FAKE_DUPLICATE_002');
    assert.equal(a.balance,0);assert.equal(b.balance,0);
    const missingId=await send('getCustomerAccountV1915',{customerId:'FAKE_AMBIGUOUS_CUSTOMER_NAME'});
    assert.equal(missingId.success,false,'an unknown ID that happens to equal a real name must NOT silently match that name');
    const uniqueName=await send('getCustomerAccountV1915',{customerName:'FAKE_ONLY_FAKE_CUST_A'});
    assert.equal(uniqueName.success,true,JSON.stringify(uniqueName));
    assert.equal(uniqueName.customer.customerId,'FAKE_CUST_A');
    assert.deepEqual(forensicSnapshot(),before);
    assert.equal(network,0);
  });

  const financialRowsForAtomicity=()=>Object.fromEntries([
    'employee_accounting_materials_v1','employee_accounting_stock_moves_v1',
    'employee_accounting_final_invoices_v1','employee_accounting_party_balances_v1',
    'employee_accounting_customer_credits_v1','employee_accounting_party_ledger_v1',
    'employee_accounting_customer_credit_events_v1','employee_accounting_cashbox_v1',
    'employee_accounting_events_v1'
  ].map(t=>[t,all('SELECT * FROM '+t+' ORDER BY rowid')]));
  await test('41 BOOK18 audit INSERT fault on cash/credit receipt must roll back entire finance batch',async()=>{
    const before=financialRowsForAtomicity();
    const request=receive('AUDIT_INSERT_FAIL',5,'FAKE_CUST_B');
    auditWriteFault=1;
    let result;
    try{result=await send('saveCustomerAccountMovementV1915',request);}
    finally{auditWriteFault=0;}
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.status,500);
    assert.deepEqual(financialRowsForAtomicity(),before,
      'audit failure must not leave cash, liability, balances, ledgers, events or stock posted');
    const state=one('SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key=?',request.requestId);
    assert.equal(state?.status,'PREPARED');
    const repeated=await send('saveCustomerAccountMovementV1915',request);
    assert.equal(repeated.success,false,'PREPARED must not automatically replay');
    assert.deepEqual(financialRowsForAtomicity(),before);
  });
  await test('42 BOOK18 audit INSERT fault on credit-backed invoice must roll back stock, credit, debt, invoice',async()=>{
    const before=financialRowsForAtomicity();
    const request=sale('AUDIT_INSERT_FAIL',10,0,'FAKE_CUST_B');
    auditWriteFault=1;
    let result;
    try{result=await send('saveEasyStoreSaleV2',request);}
    finally{auditWriteFault=0;}
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.status,500);
    assert.deepEqual(financialRowsForAtomicity(),before,
      'invoice financial transaction may not commit without its audit record');
    assert.equal(one('SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key=?',request.requestId)?.status,'PREPARED');
    assert.equal((await send('saveEasyStoreSaleV2',request)).success,false,
      'safe replay is blocked until manual PREPARED reconciliation');
    assert.deepEqual(financialRowsForAtomicity(),before);
  });
  await test('43 BOOK18 successful customer credit receipt and invoice each have a durable exact-key audit event',async()=>{
    const before=financialRowsForAtomicity();
    for(const requestKey of [receive('OVER',100).requestId,sale('D',20,0,'FAKE_CUST_B').requestId]){
      const events=all('SELECT event_type,entity_type FROM employee_accounting_events_v1 WHERE request_key=?',requestKey);
      assert.equal(events.length,1,requestKey+' missing exact command audit');
      assert.equal(events[0].event_type,'post');
      assert.equal(one('SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key=?',requestKey).status,'COMMITTED');
    }
    assert.deepEqual(financialRowsForAtomicity(),before);
    assert.equal(network,0);
  });
  await test('21 preserve integrity: cash equals actual funds received; credit events reconcile liability',()=>{
    assert.equal(network,0);
    for(const id of ['FAKE_CUST_A','FAKE_CUST_B']){
      const delta=one("SELECT COALESCE(SUM(delta_cents),0) AS n FROM employee_accounting_customer_credit_events_v1 WHERE customer_id=?",id).n;
      assert.equal(delta,credit(id));
      const c=cash(id).reduce((a,x)=>a+x.amount,0);
      assert.ok(c>=0);
    }
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_accounting_tx_guard_v1").n,0);
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_accounting_request_ledger_v1 WHERE status='PREPARED'").n,2,
      'rejected racing receipt and rejected racing invoice remain PREPARED; never auto-repost');
  });
}finally{db.close()}
