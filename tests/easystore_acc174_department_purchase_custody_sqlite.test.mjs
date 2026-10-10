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
   .run('ACC174-FAKE-CUSTOMER','ACC174_SYNTHETIC_CUSTOMER');
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
     if(username!=='ACC174_SYNTHETIC_OPERATOR'||token!=='ACC174_NONPRODUCTION_TOKEN')
       return {ok:false,message:'fake identity rejected'};
     return {ok:true,authSource:'ACC174_LOCAL_VERIFIED_SESSION',
       body:{user:{username,role:verifiedRole,department:''}}};
   }
 });
 vm.runInContext(worker+'\n;globalThis.ACC174_HANDLER=handleEmployeeAccountingNativeRequest;',ctx,{timeout:12000});
 const count=table=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 const one=(sql,...args)=>db.prepare(sql).get(...args);
 const request= (action,data={},opts={})=>new Request(
   'https://acc170.invalid/v1/employee/accounting',{
     method:'POST',
     headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
       Authorization:'Bearer '+(opts.token??'ACC174_NONPRODUCTION_TOKEN')},
     body:JSON.stringify({action,username:'ACC174_SYNTHETIC_OPERATOR',
       name:'ACC174_SYNTHETIC_OPERATOR',sourceSystem:'ACC174_OFFLINE_SQLITE',
       ...data})
   });
 async function send(action,data={},opts={}){
   const response=await ctx.ACC174_HANDLER(request(action,data,opts),env);
   return {status:response.status,...await response.json()};
 }
 const balance=(type,id)=>Number(one(
   'SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type=? AND party_id=?',
   type,id)?.balance??0);
 const stock=id=>Number(one('SELECT stock_qty FROM employee_accounting_materials_v1 WHERE material_id=?',id)?.stock_qty??0);
 assert.equal(financeState(),'OFF','initial in-memory migration must fail closed');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const locked=await send('saveEasyStorePurchaseV2',{requestId:'ACC174-BLOCKED-WRITE-0001'});
 assert.equal(locked.status,503);
 assert.equal(locked.code,'employee-accounting-readonly');
 assert.equal(count('employee_accounting_request_ledger_v1'),0);
 // This GENERAL mode exists strictly inside discarded SQLite memory. The
 // production accounting server is never contacted, armed or reconfigured.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 const roleSpoof=await send('saveEasyStoreSupplier',{requestId:'ACC174-FORGED-ROLE-0001',
   role:'admin',supplierName:'ACC174_FORGED'});
 assert.equal(roleSpoof.status,403);
 assert.equal(count('employee_accounting_parties_v1'),0);
 verifiedRole='admin';
 const supplier=await send('saveEasyStoreSupplier',{
   requestId:'ACC174-SUPPLIER-0001',supplierName:'ACC174_SYNTHETIC_SUPPLIER',
   openingDebt:0,active:'نعم'
 });
 assert.equal(supplier.success,true,'synthetic supplier '+JSON.stringify(supplier));
 const material=await send('saveAccountingMaterial',{
   requestId:'ACC174-MATERIAL-0001',materialName:'ACC174_SYNTHETIC_MATERIAL',
   department:'طباعة',unit:'قطعة',unitCost:10,stockQty:0,active:'نعم'
 });
 assert.equal(material.success,true,'synthetic material '+JSON.stringify(material));
 const sid=supplier.supplierId,mid=material.materialId;
 assert.ok(sid&&mid);

 // Full employee day-purchase flow uses authentic handler routing with a
 // verified print role and a separately verified full finance approver.
 const EMP='ACC174_SYNTHETIC_OPERATOR';
 const DAY='2099-12-31';
 const dailyTable='employee_accounting_daily_purchases_v1';
 const supplierLedger='employee_accounting_party_ledger_v1';
 const cashTable='employee_accounting_cashbox_v1';
 const custodyEvents='employee_accounting_custody_events_v1';
 const summary=()=>one(
   "SELECT SUM(CASE WHEN movement_type='HANDOFF' THEN amount WHEN movement_type='PURCHASE_SETTLEMENT' THEN -amount WHEN movement_type='PURCHASE_REVERSAL' THEN amount WHEN movement_type='RETURN' THEN -amount ELSE 0 END) AS balance FROM employee_accounting_custody_events_v1 WHERE employee_key=? AND department='طباعة' AND work_date=?",EMP,DAY
 )?.balance??0;
 // A full finance role hands over 20 currency units: one and only cashbox entry.
 const handed=await send('savePurchaseCustodyV1920',{
   requestId:'ACC174-CUSTODY-HANDOFF-0001',
   employee:EMP,department:'طباعة',amount:20,workDate:DAY,paymentMethod:'نقدي'
 });
 assert.equal(handed.success,true,'handoff '+JSON.stringify(handed));
 assert.equal(Number(summary()),20);
 assert.equal(count(cashTable),1);
 assert.equal(one('SELECT movement_type FROM '+cashTable).movement_type,'CUSTODY_HANDOFF');

 // Department staff may record an immediate-stock purchase but must not approve.
 verifiedRole='print';
 const denial=await send('approveDeptDailyPurchasesV1917',{
   requestId:'ACC174-UNAUTHORIZED-APPROVE-0001',
   employee:EMP,workDate:DAY,role:'admin'
 });
 assert.equal(denial.success,false);
 assert.equal(count('employee_accounting_purchase_invoices_v1'),0);

 const daily=await send('saveDeptDailyPurchaseV1917',{
   requestId:'ACC174-DAILY-PAID-0001',
   supplierId:sid,materialId:mid,qty:2,unit:10,
   receiptNo:'ACC174-FAKE-RECEIPT-01',paymentType:'نقدي',workDate:DAY
 });
 assert.equal(daily.success,true,'dept daily purchase '+JSON.stringify(daily));
 assert.equal(daily.purchase.paid,20);
 assert.equal(daily.purchase.status,'PENDING');
 assert.equal(stock(mid),2,'daily purchase applies stock exactly once, before approval');
 assert.equal(balance('supplier',sid),0,'pending daily purchase must not post supplier debt');
 assert.equal(count('employee_accounting_purchase_invoices_v1'),0);
 assert.equal(count(cashTable),1,'daily payment funded from custody, not cashbox twice');
 assert.equal(count(supplierLedger),0);
 const purchaseId=daily.purchase.id;
 assert.ok(purchaseId,'daily purchase id required');

 // The department operation must be idempotent by exactly the same request ID.
 const retry=await send('saveDeptDailyPurchaseV1917',{
   requestId:'ACC174-DAILY-PAID-0001',
   supplierId:sid,materialId:mid,qty:2,unit:10,
   receiptNo:'ACC174-FAKE-RECEIPT-01',paymentType:'نقدي',workDate:DAY
 });
 assert.equal(retry.duplicatePrevented,true);
 assert.equal(stock(mid),2);
 assert.equal(count(dailyTable),1);

 verifiedRole='admin';
 const approval=await send('approveDeptDailyPurchasesV1917',{
   requestId:'ACC174-APPROVE-PAID-0001',
   employee:EMP,workDate:DAY
 });
 assert.equal(approval.success,true,'actual daily approval '+JSON.stringify(approval));
 assert.equal(approval.approvedCount,1);
 assert.equal(approval.partial,false);
 assert.equal(stock(mid),2,'finance approval must not apply the same stock twice');
 assert.equal(balance('supplier',sid),0,'fully paid purchase has no supplier debt');
 assert.equal(count('employee_accounting_purchase_invoices_v1'),1);
 assert.equal(one('SELECT status FROM '+dailyTable+' WHERE daily_purchase_id=?',purchaseId).status,'APPROVED');
 assert.equal(one("SELECT stock_status AS s FROM "+dailyTable+" WHERE daily_purchase_id=?",purchaseId).s,'APPLIED');
 assert.equal(count(cashTable),1,'custody-funded purchase must not double-post cashbox');
 assert.equal(count(custodyEvents),2,'handoff + settlement');
 assert.equal(Number(summary()),0,'approved purchase must fully settle handed custody');
 assert.equal(count('employee_accounting_stock_moves_v1'),1,'approval must not duplicate stock movement');

 const approvedTwice=await send('approveDeptDailyPurchasesV1917',{
   requestId:'ACC174-APPROVE-DUP-0001',employee:EMP,workDate:DAY
 });
 assert.equal(approvedTwice.duplicatePrevented,true,'second approval must be no-op');
 assert.equal(count('employee_accounting_purchase_invoices_v1'),1);
 assert.equal(count(custodyEvents),2);

 const close=await send('closePurchaseCustodyV1920',{
   requestId:'ACC174-CUSTODY-CLOSE-0001',
   employee:EMP,department:'طباعة',workDate:DAY
 });
 assert.equal(close.success,true,'zero-balance close '+JSON.stringify(close));
 assert.equal(close.balanceBefore,0);
 assert.equal(close.settlementAmount,0);
 assert.equal(count('employee_accounting_custody_closes_v1'),1);
 assert.equal(count(cashTable),1,'zero-balance close must not add cash');
 const closeAgain=await send('closePurchaseCustodyV1920',{
   requestId:'ACC174-CUSTODY-CLOSE-DUP-0001',
   employee:EMP,department:'طباعة',workDate:DAY
 });
 assert.equal(closeAgain.duplicatePrevented,true);
 assert.equal(count('employee_accounting_custody_closes_v1'),1);

 // Disallow department staff modifying financially closed purchase rows.
 verifiedRole='print';
 const dailyDeferred=await send('saveDeptDailyPurchaseV1917',{
   requestId:'ACC174-DAILY-DEFERRED-0001',
   supplierId:sid,materialId:mid,qty:3,unit:10,
   receiptNo:'ACC174-FAKE-RECEIPT-02',paymentType:'آجل',workDate:DAY
 });
 assert.equal(dailyDeferred.success,true,'deferred daily purchase '+JSON.stringify(dailyDeferred));
 assert.equal(stock(mid),5);
 assert.equal(dailyDeferred.purchase.paid,0);
 assert.equal(dailyDeferred.purchase.remain,30);
 assert.equal(count(cashTable),1);
 verifiedRole='admin';
 const approvalCredit=await send('approveDeptDailyPurchasesV1917',{
   requestId:'ACC174-APPROVE-CREDIT-0001',
   employee:EMP,workDate:DAY
 });
 assert.equal(approvalCredit.success,true,'deferred approval '+JSON.stringify(approvalCredit));
 assert.equal(approvalCredit.approvedCount,1);
 assert.equal(stock(mid),5,'no double stock on deferred approval either');
 assert.equal(balance('supplier',sid),30,'deferred invoice must produce supplier payable');
 assert.equal(count(cashTable),1,'deferred supplier purchase must not touch cashbox');
 assert.equal(count(custodyEvents),2,'deferred supplier purchase must not settle custody');
 assert.equal(Number(summary()),0);

 // Rejected pending departmental purchase must compensate immediate stock once
 // and must never enter the official purchase/supplier/cash ledgers.
 verifiedRole='print';
 const pendingReject=await send('saveDeptDailyPurchaseV1917',{
   requestId:'ACC174-DAILY-REJECT-0001',
   supplierId:sid,materialId:mid,qty:1,unit:10,
   receiptNo:'ACC174-FAKE-RECEIPT-03',paymentType:'آجل',workDate:DAY
 });
 assert.equal(pendingReject.success,true);
 assert.equal(stock(mid),6);
 verifiedRole='admin';
 const rejected=await send('rejectDeptDailyPurchaseV1917',{
   requestId:'ACC174-REJECT-0001',
   purchaseId:pendingReject.purchase.id,reason:'ACC174 fake invoice inspection'
 });
 assert.equal(rejected.success,true,'rejection '+JSON.stringify(rejected));
 assert.equal(stock(mid),5,'reject rolls back only the pending quantity');
 assert.equal(balance('supplier',sid),30);
 assert.equal(count('employee_accounting_purchase_invoices_v1'),2);
 assert.equal(count(cashTable),1);
 const rejectAgain=await send('rejectDeptDailyPurchaseV1917',{
   requestId:'ACC174-REJECT-DUP-0001',
   purchaseId:pendingReject.purchase.id,reason:'ACC174 fake invoice inspection'
 });
 assert.equal(rejectAgain.duplicatePrevented,true);
 assert.equal(stock(mid),5);
 const rejectApproved=await send('rejectDeptDailyPurchaseV1917',{
   requestId:'ACC174-REJECT-APPROVED-0001',
   purchaseId,reason:'ACC174 fake invoice inspection'
 });
 assert.equal(rejectApproved.success,false,'approved purchase must not be rejected');
 assert.equal(stock(mid),5);

 const report=await send('getDailyDepartmentReportV1920',{department:'طباعة',workDate:DAY});
 assert.equal(report.success,true,'actual department report '+JSON.stringify(report));
 assert.ok(report.report,'report must be produced with actual Worker SQL');
 const closeDay=await send('closeDepartmentDayV1920',{
   requestId:'ACC174-CLOSE-DAY-0001',department:'طباعة',workDate:DAY
 });
 assert.equal(closeDay.success,true,'department close with settled custody '+JSON.stringify(closeDay));
 assert.equal(count('employee_accounting_day_closes_v1'),1);

 const prev={
   stock:stock(mid),
   supplier:balance('supplier',sid),
   cashbox:count(cashTable),
   custodyEvents:count(custodyEvents),
   officialPurchases:count('employee_accounting_purchase_invoices_v1'),
   commands:count('employee_accounting_request_ledger_v1'),
   events:count('employee_accounting_events_v1')
 };
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const closedWrite=await send('saveDeptDailyPurchaseV1917',{
   requestId:'ACC174-DENIED-AFTER-OFF-0001',
   supplierId:sid,materialId:mid,qty:2,unit:10
 });
 assert.equal(closedWrite.status,503);
 assert.equal(stock(mid),prev.stock);
 assert.equal(balance('supplier',sid),prev.supplier);
 assert.equal(count(cashTable),prev.cashbox);
 assert.equal(count(custodyEvents),prev.custodyEvents);
 assert.equal(count('employee_accounting_purchase_invoices_v1'),prev.officialPurchases);
 assert.equal(count('employee_accounting_request_ledger_v1'),prev.commands);
 assert.equal(count('employee_accounting_events_v1'),prev.events);
 assert.equal(financeState(),'READONLY');

 console.log('ACC174_REAL_WORKER_DEPT_BUY_STOCK_ONCE=PASS');
 console.log('ACC174_REAL_WORKER_APPROVAL_SUPPLIER_CUSTODY_LEDGER=PASS');
 console.log('ACC174_REAL_WORKER_ZERO_CUSTODY_CLOSE_NO_CASH_SIDE_EFFECT=PASS');
 console.log('ACC174_REAL_WORKER_DEFERRED_PAYABLE_NO_CASH=PASS');
 console.log('ACC174_REAL_WORKER_REJECT_PENDING_STOCK_REVERSAL=PASS');
 console.log('ACC174_REAL_WORKER_ROLE_SEPARATION_AND_DUPLICATE_BLOCKS=PASS');
 console.log('ACC174_REAL_WORKER_DAY_REPORT_AND_CLOSE=PASS');
 console.log('ACC174_READONLY_FAIL_CLOSED=PASS');
 console.log('ACC174_PRODUCTION_D1_WRITES=ZERO');
 console.log('ACC174_REAL_FINANCIAL_ACCEPTANCE=NOT_TESTED');
}finally{db.close();}
