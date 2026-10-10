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
 assert.equal(financeState(),'READONLY');
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
 console.log('ACC170_SQLITE_VERIFIED_ROLE_SPOOF_DENIED=PASS');
 console.log('ACC170_SQLITE_READONLY_FINANCIAL_POST_DENIED=PASS');
 console.log('ACC170_PRODUCTION_D1_WRITES=ZERO');
 console.log('ACC170_REAL_FINANCIAL_ACCEPTANCE=NOT_TESTED');
}finally{db.close();}
