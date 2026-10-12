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
 assert.equal(financeState(),'OFF','initial in-memory migration must fail closed');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const locked=await send('saveEasyStorePurchaseV2',{requestId:'ACC170-BLOCKED-WRITE-0001'});
 assert.equal(locked.status,503);
 assert.equal(locked.code,'employee-accounting-readonly');
 assert.equal(count('employee_accounting_request_ledger_v1'),0);
 // This GENERAL mode exists strictly inside discarded SQLite memory. The
 // production accounting server is never contacted, armed or reconfigured.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 const roleSpoof=await send('saveEasyStoreSupplier',{requestId:'ACC170-FORGED-ROLE-0001',
   role:'admin',supplierName:'ACC170_FORGED'});
 assert.equal(roleSpoof.status,403);
 assert.equal(count('employee_accounting_parties_v1'),0);
 verifiedRole='admin';
 const supplier=await send('saveEasyStoreSupplier',{
   requestId:'ACC170-SUPPLIER-0001',supplierName:'ACC170_SYNTHETIC_SUPPLIER',
   openingDebt:0,active:'نعم'
 });
 assert.equal(supplier.success,true,'synthetic supplier '+JSON.stringify(supplier));
 const material=await send('saveAccountingMaterial',{
   requestId:'ACC170-MATERIAL-0001',materialName:'ACC170_SYNTHETIC_MATERIAL',
   department:'طباعة',unit:'قطعة',unitCost:10,stockQty:0,active:'نعم'
 });
 assert.equal(material.success,true,'synthetic material '+JSON.stringify(material));
 const sid=supplier.supplierId,mid=material.materialId;
 assert.ok(sid&&mid);
 const buy=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC170-BUY-0001',supplierId:sid,materialId:mid,department:'طباعة',
   invoiceNo:'ACC170-INV-BUY-1',qty:5,unitCost:10,total:50,paid:20,
   paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(buy.success,true,'purchase '+JSON.stringify(buy));
 assert.equal(stock(mid),5);
 assert.equal(balance('supplier',sid),30);
 assert.equal(count('employee_accounting_purchase_invoices_v1'),1);
 assert.equal(count('employee_accounting_stock_moves_v1'),1);
 assert.equal(count('employee_accounting_cashbox_v1'),1);
 assert.equal(one('SELECT amount FROM employee_accounting_cashbox_v1').amount,20);
 const paymentLedger=one(
   "SELECT amount,effect FROM employee_accounting_party_ledger_v1 WHERE operation='payment_paid' AND party_id=?",sid);
 assert.equal(Number(paymentLedger.amount),20,'supplier paid amount must be written to ledger');
 assert.equal(Number(paymentLedger.effect),-1);

 const beforeDup=count('employee_accounting_request_ledger_v1');
 const dupeBuy=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC170-BUY-DUP-0001',supplierId:sid,materialId:mid,
   department:'طباعة',invoiceNo:'ACC170-INV-BUY-1',qty:5,unitCost:10,total:50,paid:20
 });
 assert.equal(dupeBuy.success,false,'duplicate supplier invoice should be rejected');
 assert.equal(stock(mid),5);
 assert.equal(count('employee_accounting_request_ledger_v1'),beforeDup);
 const reversed=await send('reverseApprovedPurchaseV1920',{
   requestId:'ACC170-REVERSE-0001',purchaseId:buy.purchaseId,reason:'ACC170 synthetic audit'
 });
 assert.equal(reversed.success,true,'reverse '+JSON.stringify(reversed));
 assert.equal(stock(mid),0);
 assert.equal(balance('supplier',sid),0);
 assert.equal(count('employee_accounting_cashbox_v1'),2);
 assert.equal(one('SELECT status FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=?',buy.purchaseId).status,'REVERSED');
 const reversedAgain=await send('reverseApprovedPurchaseV1920',{
   requestId:'ACC170-REVERSE-DUP-0001',purchaseId:buy.purchaseId,reason:'ACC170 synthetic audit'
 });
 assert.equal(reversedAgain.duplicatePrevented,true);
 assert.equal(count('employee_accounting_stock_moves_v1'),2);
 const purchase2=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC170-BUY-0002',supplierId:sid,materialId:mid,department:'طباعة',
   invoiceNo:'ACC170-INV-BUY-2',qty:5,unitCost:10,total:50,paid:0,
   paymentMethod:'آجل',workDate:'2099-12-31'
 });
 assert.equal(purchase2.success,true,'second purchase '+JSON.stringify(purchase2));
 assert.equal(stock(mid),5);
 assert.equal(balance('supplier',sid),50);
 const sale=await send('saveEasyStoreSaleV2',{
   requestId:'ACC170-SALE-0001',customerId:'ACC170-FAKE-CUSTOMER',
   department:'طباعة',item:'ACC170_SYNTHETIC_MATERIAL',
   invoiceNo:'ACC170-SALE-INVOICE-1',qty:2,unitPrice:20,total:40,paid:25,
   paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(sale.success,true,'sale '+JSON.stringify(sale));
 assert.equal(stock(mid),3);
 assert.equal(balance('customer','ACC170-FAKE-CUSTOMER'),15);
 assert.equal(sale.remaining,15);
 assert.equal(count('employee_accounting_final_invoices_v1'),1);
 assert.equal(count('employee_accounting_cashbox_v1'),3);
 const receipts=one("SELECT SUM(amount) AS sum FROM employee_accounting_cashbox_v1 WHERE movement_type='CUSTOMER_RECEIPT'").sum;
 assert.equal(receipts,25);
 assert.equal(count('employee_accounting_tx_guard_v1'),0);
 const report=await send('getDailyDepartmentReportV1920',{
   department:'طباعة',workDate:'2099-12-31'
 });
 assert.equal(report.success,true,'actual finance report handler '+JSON.stringify(report));
 assert.ok(report.report,'daily finance report must be produced from real SQLite data');
 const dayClose=await send('closeDepartmentDayV1920',{
   requestId:'ACC170-DAY-CLOSE-0001',department:'طباعة',workDate:'2099-12-31'
 });
 assert.equal(dayClose.success,true,'day-close '+JSON.stringify(dayClose));
 assert.ok(dayClose.reportHash,'auditable day-close report hash');
 assert.equal(count('employee_accounting_day_closes_v1'),1);
 const repeatedClose=await send('closeDepartmentDayV1920',{
   requestId:'ACC170-DAY-CLOSE-DUP-0001',department:'طباعة',workDate:'2099-12-31'
 });
 assert.equal(repeatedClose.duplicatePrevented,true);
 assert.equal(count('employee_accounting_day_closes_v1'),1);

 // ACC192 extension: use original real Worker and fake SQLite migrations.
 assert.equal(report.report.sales,40);
 assert.equal(report.report.purchases,50);
 assert.equal(report.report.actualJobCost,20);
 assert.equal(report.report.profit,20);
 assert.equal(report.report.cash,25);
 assert.equal(report.report.credit,15);
 assert.equal(report.report.receipts,25);
 const persisted=one("SELECT report_hash,report_json,integrity_status FROM employee_accounting_day_closes_v1 WHERE work_date=? AND department=?", '2099-12-31','طباعة');
 assert.equal(persisted.integrity_status,'PASS');
 assert.equal(persisted.report_hash,dayClose.reportHash);
 assert.deepEqual(JSON.parse(persisted.report_json),dayClose.report);
 const wd='2099-12-30',initialCloseCount=count('employee_accounting_day_closes_v1');
 const money=()=>({cash:count('employee_accounting_cashbox_v1'),
   party:count('employee_accounting_party_ledger_v1'),
   stock:count('employee_accounting_stock_moves_v1'),
   invoice:count('employee_accounting_final_invoices_v1'),
   request:count('employee_accounting_request_ledger_v1')});
 const beforeBlocked=money();
 db.prepare("INSERT INTO employee_accounting_daily_purchases_v1(daily_purchase_id,request_key,work_date,employee_key,department,material_name,qty,unit_cost,total,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?)")
  .run('ACC192-FAKE-PENDING','ACC192-FAKE-REQUEST',wd,'ACC192-FAKE-STAFF','طباعة','ACC192-PAPER',1,10,10,1);
 const pending=await send('closeDepartmentDayV1920',{requestId:'ACC192-PENDING-0001',department:'طباعة',workDate:wd});
 assert.equal(pending.status,400);
 assert.match(pending.message,/مشتريات القسم المعلقة/);
 db.prepare("DELETE FROM employee_accounting_daily_purchases_v1 WHERE daily_purchase_id=?").run('ACC192-FAKE-PENDING');
 db.prepare("INSERT INTO employee_accounting_dept_lines_v1(accounting_line_id,order_id,department,work_date) VALUES(?,?,?,?)")
  .run('ACC192-FAKE-LINE','ACC192-FAKE-ORDER','طباعة',wd);
 const unbilled=await send('closeDepartmentDayV1920',{requestId:'ACC192-UNBILLED-0001',department:'طباعة',workDate:wd});
 assert.equal(unbilled.status,400);
 assert.match(unbilled.message,/بنود القسم/);
 db.prepare("DELETE FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id=?").run('ACC192-FAKE-LINE');
 db.prepare("INSERT INTO employee_accounting_purchase_invoices_v1(purchase_id,request_key,work_date,created_at_ms) VALUES(?,?,?,?)")
  .run('ACC192-FAKE-UNCLASS','ACC192-FAKE-UNCLASS-RQ',wd,2);
 const unclassified=await send('closeDepartmentDayV1920',{requestId:'ACC192-UNCLASS-0001',department:'طباعة',workDate:wd});
 assert.equal(unclassified.status,400);
 assert.match(unclassified.message,/غير المصنفة/);
 db.prepare("DELETE FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=?").run('ACC192-FAKE-UNCLASS');
 assert.equal(count('employee_accounting_day_closes_v1'),initialCloseCount);
 assert.deepEqual(money(),beforeBlocked);
 const premature=await send('closeDepartmentDayV1920',{requestId:'ACC192-EARLY-0001',department:'كل الأقسام',workDate:wd});
 assert.equal(premature.status,400);
 assert.match(premature.message,/اقفل الليزر والطباعة/);
 const print=await send('closeDepartmentDayV1920',{requestId:'ACC192-PRINT-0001',department:'طباعة',workDate:wd});
 assert.equal(print.success,true,JSON.stringify(print));
 const early2=await send('closeDepartmentDayV1920',{requestId:'ACC192-EARLY-0002',department:'كل الأقسام',workDate:wd});
 assert.equal(early2.status,400);
 const laser=await send('closeDepartmentDayV1920',{requestId:'ACC192-LASER-0001',department:'ليزر',workDate:wd});
 assert.equal(laser.success,true,JSON.stringify(laser));
 const overall=await send('closeDepartmentDayV1920',{requestId:'ACC192-ALL-0001',department:'كل الأقسام',workDate:wd});
 assert.equal(overall.success,true,JSON.stringify(overall));
 for(const field of ['sales','actualJobCost','purchases','profit','receipts','payments','cash','instapay','credit']){
   assert.equal(overall.report[field],print.report[field]+laser.report[field],field);
 }
 assert.equal(count('employee_accounting_day_closes_v1'),initialCloseCount+3);
 const beforeReplay=money();
 const repeat=await send('closeDepartmentDayV1920',{requestId:'ACC192-REPEAT-0001',department:'كل الأقسام',workDate:wd});
 assert.equal(repeat.success,true);
 assert.equal(repeat.duplicatePrevented,true);
 assert.deepEqual(money(),beforeReplay);
 assert.equal(count('employee_accounting_day_closes_v1'),initialCloseCount+3);
 for(const [department,response] of [['طباعة',print],['ليزر',laser],['كل الأقسام',overall]]){
   const row=one("SELECT report_hash,report_json,integrity_status FROM employee_accounting_day_closes_v1 WHERE work_date=? AND department=?",wd,department);
   assert.equal(row.integrity_status,'PASS');
   assert.equal(row.report_hash,response.reportHash);
   assert.deepEqual(JSON.parse(row.report_json),response.report);
 }
 verifiedRole='service';
 const denied=await send('getDailyDepartmentReportV1920',{workDate:wd,department:'طباعة',role:'admin'});
 assert.equal(denied.status,403);
 verifiedRole='admin';
 console.log('ACC192_REAL_WORKER_DAY_REPORT_CASH_DEBT_STOCK=PASS');
 console.log('ACC192_UNCLASSIFIED_PENDING_UNBILLED_DAY_CLOSE_BLOCKS=PASS');
 console.log('ACC192_DEPARTMENT_THEN_OVERALL_CLOSE_RECONCILES=PASS');
 console.log('ACC192_DUPLICATE_CLOSE_HASH_IMMUTABLE=PASS');
 console.log('ACC192_ROLE_SPOOF_DENIED=PASS');
 console.log('ACC192_REAL_FINANCIAL_DAY_ACCEPTANCE=NOT_TESTED');
 console.log('ACC192_RELEASE_DECISION=NO_GO');
 const oldCounts={
   purchases:count('employee_accounting_purchase_invoices_v1'),
   final:count('employee_accounting_final_invoices_v1'),
   ledger:count('employee_accounting_request_ledger_v1'),
   events:count('employee_accounting_events_v1'),
   stockMoves:count('employee_accounting_stock_moves_v1')
 };
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const blockedAfter=await send('saveEasyStoreSaleV2',{
   requestId:'ACC170-SALE-BLOCKED-0001',customerId:'ACC170-FAKE-CUSTOMER',
   item:'ACC170_SYNTHETIC_MATERIAL',qty:1,unitPrice:10,total:10,paid:0
 });
 assert.equal(blockedAfter.status,503);
 assert.equal(stock(mid),3);
 assert.equal(balance('customer','ACC170-FAKE-CUSTOMER'),15);
 assert.equal(count('employee_accounting_request_ledger_v1'),oldCounts.ledger);
 assert.equal(count('employee_accounting_events_v1'),oldCounts.events);
 assert.equal(count('employee_accounting_stock_moves_v1'),oldCounts.stockMoves);
 assert.equal(count('employee_accounting_purchase_invoices_v1'),oldCounts.purchases);
 assert.equal(count('employee_accounting_final_invoices_v1'),oldCounts.final);
 assert.equal(financeState(),'READONLY');
 // No production state or identity was ever accessible from this fixture.
 assert.equal(sqlTrace.some(x=>/wrangler|http/i.test(x.sql)),false);
 console.log('ACC170_SQLITE_REAL_WORKER_PURCHASE_STOCK_SUPPLIER_CASH=PASS');
 console.log('ACC170_SQLITE_REAL_WORKER_PURCHASE_REVERSAL=PASS');
 console.log('ACC170_SQLITE_REAL_WORKER_DIRECT_SALE_CUSTOMER_STOCK=PASS');
 console.log('ACC170_SQLITE_DUPLICATE_INVOICE_AND_REVERSAL_GUARDS=PASS');
 console.log('ACC170_SQLITE_DAILY_REPORT_AND_DAY_CLOSE=PASS');
 console.log('ACC170_SQLITE_VERIFIED_ROLE_SPOOF_DENIED=PASS');
 console.log('ACC170_SQLITE_READONLY_FINANCIAL_POST_DENIED=PASS');
 console.log('ACC170_PRODUCTION_D1_WRITES=ZERO');
 console.log('ACC170_REAL_FINANCIAL_ACCEPTANCE=NOT_TESTED');
}finally{db.close();}
