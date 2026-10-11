import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';

// End-to-end integration of the exact checked-in D1 Worker + migrations.
// The entire finance authority and every row live ONLY in ephemeral :memory: SQLite.
// No real employees, no real HTTP network, no Wrangler, secrets or remote D1.
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
 '0030_employee_accounting_write_canary_budget_v1.sql'
];
const worker=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
 .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
 .replace(/^export /gm,'');
assert.ok(worker.includes('async function postPurchaseInvoiceV1('));
assert.ok(worker.includes('async function saveEasyStoreSaleV2A2('));
assert.ok(worker.includes('async function reverseApprovedPurchaseV1('));

const db=new DatabaseSync(':memory:');
try{
 for(const filename of migrations)db.exec(fs.readFileSync('cloudflare-d1/migrations/'+filename,'utf8'));
 // Account customer lookup is owned by an existing T12 native family and is not
 // part of the accounting migrations, so provide ONLY its minimum fake schema.
 db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT,active TEXT,updated_at TEXT);");
 db.prepare("INSERT INTO t12_customers(customer_id,customer_name,active,updated_at) VALUES(?,?,'نعم',CURRENT_TIMESTAMP)")
   .run('ACC170-FAKE-CUSTOMER','ACC170_SYNTHETIC_CUSTOMER');
 const financeState=()=>db.prepare("SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1").get().mode;
 const sqlTrace=[], DB={
   prepare(sql){
     const statement={sql:String(sql),args:[]};
     sqlTrace.push(statement);
     const wrapper={
       bind(...args){statement.args=args;return wrapper;},
       first(){return Promise.resolve(db.prepare(statement.sql).get(...statement.args)||null);},
       all(){return Promise.resolve({results:db.prepare(statement.sql).all(...statement.args)});},
       run(){return Promise.resolve(db.prepare(statement.sql).run(...statement.args));}
     };
     wrapper.__statement=statement;
     return wrapper;
   },
   async batch(statements){
     db.exec('BEGIN IMMEDIATE');
     try{
       const out=statements.map(stmt=>db.prepare(stmt.__statement.sql).run(...stmt.__statement.args));
       db.exec('COMMIT');
       return out;
     }catch(error){
       db.exec('ROLLBACK');
       throw error;
     }
   }
 };
 const env={DB,CORS_ORIGINS:'https://fawakhry.github.io'};
 let verifiedRole='admin';
 const ctx=vm.createContext({
   crypto:webcrypto,TextEncoder,Response,Request,Headers,URL,URLSearchParams,
   Date,Intl,JSON,Math,console,
   verifyEmployeeSessionCloudFirst:async (username,token)=>{
     if(username!=='ACC170_SYNTHETIC_OPERATOR'||token!=='ACC170_NONPRODUCTION_TOKEN')
       return {ok:false,message:'fake identity rejected'};
     return {ok:true,authSource:'ACC170_LOCAL_VERIFIED_SESSION',
       body:{user:{username,role:verifiedRole,department:''}}};
   }
 });
 vm.runInContext(worker+'\n;globalThis.ACC170_HANDLER=handleEmployeeAccountingNativeRequest;',ctx,{timeout:12000});
 const count=table=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 const one=(sql,...args)=>db.prepare(sql).get(...args);
 const request= (action,data={},opts={})=>new Request(
   'https://acc170.invalid/v1/employee/accounting',{
     method:'POST',
     headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
       Authorization:'Bearer '+(opts.token??'ACC170_NONPRODUCTION_TOKEN')},
     body:JSON.stringify({action,username:'ACC170_SYNTHETIC_OPERATOR',
       name:'ACC170_SYNTHETIC_OPERATOR',sourceSystem:'ACC170_OFFLINE_SQLITE',
       ...data})
   });
 async function send(action,data={},opts={}){
   const response=await ctx.ACC170_HANDLER(request(action,data,opts),env);
   return {status:response.status,...await response.json()};
 }
 const balance=(type,id)=>Number(one(
   'SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type=? AND party_id=?',
   type,id)?.balance??0);
 const stock=id=>Number(one('SELECT stock_qty FROM employee_accounting_materials_v1 WHERE material_id=?',id)?.stock_qty??0);

 assert.equal(financeState(),'OFF');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const locked=await send('savePartyLedgerTransaction',{
   requestId:'ACC188-BLOCKED-0001',partyType:'customer',
   customerId:'ACC170-FAKE-CUSTOMER',operation:'opening_debt',amount:70
 });
 assert.equal(locked.status,503);
 assert.equal(count('employee_accounting_party_ledger_v1'),0);
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 const impersonated=await send('savePartyLedgerTransaction',{
   requestId:'ACC188-FORGED-ROLE-0001',partyType:'customer',role:'admin',
   customerId:'ACC170-FAKE-CUSTOMER',operation:'opening_debt',amount:70
 });
 assert.equal(impersonated.status,403);
 verifiedRole='admin';
 const customer='ACC170-FAKE-CUSTOMER';
 const debt=await send('savePartyLedgerTransaction',{
   requestId:'ACC188-CUSTOMER-DEBT-0001',partyType:'customer',customerId:customer,
   operation:'opening_debt',amount:70,notes:'synthetic opening only'
 });
 assert.equal(debt.success,true,'fake customer debt '+JSON.stringify(debt));
 assert.equal(balance('customer',customer),70);
 const receiptBody={
   requestId:'ACC188-CUSTOMER-RECEIPT-0001',partyType:'customer',customerId:customer,
   operation:'payment_received',amount:60,paymentMethod:'نقدي',workDate:'2099-12-31'
 };
 const collected=await send('savePartyLedgerTransaction',receiptBody);
 assert.equal(collected.success,true,JSON.stringify(collected));
 assert.equal(balance('customer',customer),10);
 const customerReceiptCount=()=>count('employee_accounting_cashbox_v1');
 assert.equal(customerReceiptCount(),1);
 const beforeReplay={
   customerBalance:balance('customer',customer),
   cashCount:customerReceiptCount(),
   ledgerCount:count('employee_accounting_party_ledger_v1'),
   requestCount:count('employee_accounting_request_ledger_v1')
 };
 const replay=await send('savePartyLedgerTransaction',receiptBody);
 assert.equal(replay.success,true,'exact retry must return original committed receipt even with only 10 remaining '+JSON.stringify(replay));
 assert.equal(replay.duplicatePrevented,true);
 assert.equal(replay.balance,collected.balance);
 assert.deepEqual({
   customerBalance:balance('customer',customer),
   cashCount:customerReceiptCount(),
   ledgerCount:count('employee_accounting_party_ledger_v1'),
   requestCount:count('employee_accounting_request_ledger_v1')
 },beforeReplay,'exact retry never writes second party movement or cashbox entry');
 const changedSameKey=await send('savePartyLedgerTransaction',{...receiptBody,amount:61});
 assert.equal(changedSameKey.success,false);
 assert.equal(changedSameKey.code,'accounting-idempotency-conflict','same key altered amount must not be accepted');
 assert.equal(changedSameKey.status,500);
 const anotherOperation=await send('savePartyLedgerTransaction',{
   ...receiptBody,operation:'adjustment_decrease',amount:1
 });
 assert.equal(anotherOperation.code,'accounting-idempotency-conflict','same key different operation must conflict');
 const deniedOverpay=await send('savePartyLedgerTransaction',{
   ...receiptBody,requestId:'ACC188-CUSTOMER-OVERPAY-0001',amount:11
 });
 assert.equal(deniedOverpay.success,false);
 assert.equal(deniedOverpay.status,400);
 assert.equal(balance('customer',customer),10);
 assert.equal(customerReceiptCount(),1);
 assert.equal(count('employee_accounting_request_ledger_v1'),beforeReplay.requestCount);
 // An independent supplier purchase also creates and settles its party balance.
 const supplier=await send('saveEasyStoreSupplier',{
   requestId:'ACC188-SUPPLIER-0001',supplierName:'ACC188_FAKE_SUPPLIER',openingDebt:0,active:'نعم'
 });
 const mat=await send('saveAccountingMaterial',{
   requestId:'ACC188-MATERIAL-0001',materialName:'ACC188_FAKE_MATERIAL',
   department:'طباعة',stockQty:0,unit:'قطعة',unitCost:10,active:'نعم'
 });
 assert.equal(supplier.success,true);assert.equal(mat.success,true);
 const sid=supplier.supplierId,mid=mat.materialId;
 const buy=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC188-SUPPLIER-BUY-0001',supplierId:sid,materialId:mid,department:'طباعة',
   invoiceNo:'ACC188-SUPPLIER-INVOICE-1',qty:10,unitCost:10,total:100,paid:40,
   paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(buy.success,true,JSON.stringify(buy));
 assert.equal(balance('supplier',sid),60);
 const payment={
   requestId:'ACC188-SUPPLIER-PAYMENT-0001',partyType:'supplier',supplierId:sid,
   operation:'payment_paid',amount:50,paymentMethod:'نقدي',workDate:'2099-12-31'
 };
 const paid=await send('savePartyLedgerTransaction',payment);
 assert.equal(paid.success,true,JSON.stringify(paid));
 assert.equal(balance('supplier',sid),10);
 const beforeSupplierRepeat={
   remaining:balance('supplier',sid),
   cash:count('employee_accounting_cashbox_v1'),
   ledger:count('employee_accounting_party_ledger_v1'),
   requests:count('employee_accounting_request_ledger_v1')
 };
 const paidTwice=await send('savePartyLedgerTransaction',payment);
 assert.equal(paidTwice.success,true);
 assert.equal(paidTwice.duplicatePrevented,true);
 assert.deepEqual({
   remaining:balance('supplier',sid),
   cash:count('employee_accounting_cashbox_v1'),
   ledger:count('employee_accounting_party_ledger_v1'),
   requests:count('employee_accounting_request_ledger_v1')
 },beforeSupplierRepeat,'supplier paid 50 of 60 must not debit twice on retry after remaining=10');
 assert.equal(Number(one("SELECT SUM(amount) AS value FROM employee_accounting_cashbox_v1 WHERE movement_type='CUSTOMER_RECEIPT'").value),60);
 assert.equal(Number(one("SELECT SUM(amount) AS value FROM employee_accounting_cashbox_v1 WHERE movement_type='SUPPLIER_PAYMENT'").value),90);
 assert.equal(count('employee_accounting_cashbox_v1'),3,'one customer receipt + one initial supplier purchase payment + one later supplier payment');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const beforeFinal={
   c:balance('customer',customer),s:balance('supplier',sid),
   cash:count('employee_accounting_cashbox_v1'),
   ledger:count('employee_accounting_party_ledger_v1')
 };
 const noFinancialWrite=await send('savePartyLedgerTransaction',{
   requestId:'ACC188-FINAL-READONLY-0001',partyType:'customer',customerId:customer,
   operation:'payment_received',amount:10
 });
 assert.equal(noFinancialWrite.status,503);
 assert.deepEqual({
   c:balance('customer',customer),s:balance('supplier',sid),
   cash:count('employee_accounting_cashbox_v1'),
   ledger:count('employee_accounting_party_ledger_v1')
 },beforeFinal);
 console.log('ACC188_CUSTOMER_PARTIAL_RECEIPT_IDEMPOTENT_REPLAY=PASS');
 console.log('ACC188_SUPPLIER_PARTIAL_PAYMENT_IDEMPOTENT_REPLAY=PASS');
 console.log('ACC188_CHANGED_REQUEST_PAYLOAD_AND_OPERATION_REJECTED=PASS');
 console.log('ACC188_OVERPAY_READONLY_AND_SPOOF_REJECTED=PASS');
 console.log('ACC188_CASHBOX_AND_PARTY_LEDGER_NO_DOUBLE_POST=PASS');
 console.log('ACC188_G4_REAL_PAYMENT_ACCEPTANCE=NOT_PERFORMED');
 console.log('ACC188_RELEASE_DECISION=NO_GO');
 console.log('ACC188_PRODUCTION_D1_MUTATIONS=ZERO');
}finally{db.close();}
