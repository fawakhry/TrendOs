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
 const emptyReport=await send('getDailyDepartmentReportV1920',{department:'كل الأقسام',workDate:'2099-12-31'});
 assert.equal(emptyReport.success,true,JSON.stringify(emptyReport));
 assert.equal(emptyReport.report.sales,0);
 assert.equal(emptyReport.report.cash,0);
 const readonlyAttempt=await send('closeDepartmentDayV1920',{requestId:'ACC192-READONLY-0001',department:'طباعة',workDate:'2099-12-31'});
 assert.equal(readonlyAttempt.status,503);
 assert.equal(count('employee_accounting_day_closes_v1'),0);
 // GENERAL runs in disposable fake SQLite memory only; production is untouched.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 const spoof=await send('closeDepartmentDayV1920',{requestId:'ACC192-ROLE-SPOOF-0001',role:'admin',department:'طباعة',workDate:'2099-12-31'});
 assert.equal(spoof.status,403);
 verifiedRole='admin';
 const a=await send('saveAccountingMaterial',{requestId:'ACC192-PRINT-MAT',materialName:'ACC192_FAKE_PAPER',
   department:'طباعة',stockQty:10,unitCost:10,unit:'قطعة',active:'نعم'});
 const b=await send('saveAccountingMaterial',{requestId:'ACC192-LASER-MAT',materialName:'ACC192_FAKE_LASER',
   department:'ليزر',stockQty:10,unitCost:20,unit:'قطعة',active:'نعم'});
 assert.equal(a.success,true,JSON.stringify(a));assert.equal(b.success,true,JSON.stringify(b));
 const customer='ACC170-FAKE-CUSTOMER',DAY='2099-12-31';
 const first=await send('saveEasyStoreSaleV2',{
   requestId:'ACC192-PRINT-SALE',customerId:customer,department:'طباعة',
   item:'ACC192_FAKE_PAPER',invoiceNo:'ACC192-PRINT-INVOICE',
   qty:2,unitPrice:20,total:40,paid:25,paymentMethod:'نقدي',workDate:DAY
 });
 const second=await send('saveEasyStoreSaleV2',{
   requestId:'ACC192-LASER-SALE',customerId:customer,department:'ليزر',
   item:'ACC192_FAKE_LASER',invoiceNo:'ACC192-LASER-INVOICE',
   qty:1,unitPrice:100,total:100,paid:70,paymentMethod:'إنستاباي',workDate:DAY
 });
 assert.equal(first.success,true,JSON.stringify(first));assert.equal(second.success,true,JSON.stringify(second));
 assert.equal(stock(a.materialId),8);assert.equal(stock(b.materialId),9);
 assert.equal(balance('customer',customer),45);
 assert.equal(count('employee_accounting_cashbox_v1'),2);
 const report=async(dept)=>{
   const res=await send('getDailyDepartmentReportV1920',{department:dept,workDate:DAY});
   assert.equal(res.success,true,JSON.stringify(res));return res.report;
 };
 const print=await report('طباعة'),laser=await report('ليزر'),all=await report('كل الأقسام');
 assert.equal(print.sales,40);assert.equal(laser.sales,100);assert.equal(all.sales,140);
 assert.equal(print.actualJobCost,20);assert.equal(laser.actualJobCost,20);assert.equal(all.actualJobCost,40);
 assert.equal(all.profit,100);
 assert.equal(print.credit,15);assert.equal(laser.credit,30);assert.equal(all.credit,45);
 assert.equal(print.cash,25);assert.equal(laser.instapay,70);
 assert.equal(all.cash,25);assert.equal(all.instapay,70);
 assert.equal(all.receipts,95);
 assert.equal(all.lineCount,0);
 for(const k of ['sales','actualJobCost','profit','credit','cash','instapay','receipts','payments']){
   assert.equal(Number((print[k]+laser[k]).toFixed(2)),all[k],k+' two departments must reconcile');
 }
 const firstWhole=await send('closeDepartmentDayV1920',{
   requestId:'ACC192-CLOSE-ALL-PREMATURE',department:'كل الأقسام',workDate:DAY
 });
 assert.equal(firstWhole.success,false);assert.equal(firstWhole.status,400);
 assert.equal(count('employee_accounting_day_closes_v1'),0);
 const lastMoney={
   cash:count('employee_accounting_cashbox_v1'),
   invoices:count('employee_accounting_final_invoices_v1'),
   stock:count('employee_accounting_stock_moves_v1')
 };
 const close=async(name,requestId)=>{
   const res=await send('closeDepartmentDayV1920',{requestId,department:name,workDate:DAY});
   assert.equal(res.success,true,name+' '+JSON.stringify(res));
   assert.match(res.reportHash,/^[a-f0-9]{64}$/);return res;
 };
 const closeP=await close('طباعة','ACC192-CLOSE-PRINT');
 const stillPremature=await send('closeDepartmentDayV1920',{
   requestId:'ACC192-CLOSE-ALL-MISSING-LASER',department:'كل الأقسام',workDate:DAY
 });
 assert.equal(stillPremature.success,false);
 assert.equal(count('employee_accounting_day_closes_v1'),1);
 const closeL=await close('ليزر','ACC192-CLOSE-LASER');
 const closeA=await close('كل الأقسام','ACC192-CLOSE-ALL');
 assert.equal(closeA.report.sales,140);
 assert.equal(count('employee_accounting_day_closes_v1'),3);
 const replay=await send('closeDepartmentDayV1920',{
   requestId:'ACC192-REPLAY-DIFF-KEY',department:'طباعة',workDate:DAY
 });
 assert.equal(replay.success,true);assert.equal(replay.duplicatePrevented,true);
 assert.equal(replay.closeId,closeP.closeId);
 assert.equal(count('employee_accounting_day_closes_v1'),3);
 const committed=one("SELECT report_json,report_hash FROM employee_accounting_day_closes_v1 WHERE department='كل الأقسام' AND work_date=?",DAY);
 assert.deepEqual(JSON.parse(committed.report_json),JSON.parse(JSON.stringify(closeA.report)));
 assert.equal(committed.report_hash,closeA.reportHash);
 assert.deepEqual({
   cash:count('employee_accounting_cashbox_v1'),
   invoices:count('employee_accounting_final_invoices_v1'),
   stock:count('employee_accounting_stock_moves_v1')
 },lastMoney);
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const again=await send('closeDepartmentDayV1920',{
   requestId:'ACC192-READONLY-AFTER-CLOSE',department:'ليزر',workDate:DAY
 });
 assert.equal(again.status,503);
 assert.equal(count('employee_accounting_day_closes_v1'),3);
 console.log('ACC192_TWO_DEPARTMENTS_SALE_COST_PROFIT_CASH_CREDIT_RECONCILE=PASS');
 console.log('ACC192_TOTAL_DAY_CLOSE_REQUIRES_BOTH_DEPARTMENT_CLOSES=PASS');
 console.log('ACC192_CLOSED_REPORT_HASH_PERSISTED_AND_DUPLICATE_SAFE=PASS');
 console.log('ACC192_VERIFIED_ROLE_SPOOF_AND_READONLY_BLOCK=PASS');
 console.log('ACC192_REAL_G4_OPERATING_ACCEPTANCE=NOT_PERFORMED');
 console.log('ACC192_RELEASE_DECISION=NO_GO');
 console.log('ACC192_PRODUCTION_MUTATIONS=ZERO');
}finally{db.close();}
