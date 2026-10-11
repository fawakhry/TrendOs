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
 assert.equal((await send('saveAccountingMaterial',{requestId:'ACC189-READONLY-0001',materialName:'DENY'})).status,503);
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 assert.equal((await send('saveAccountingMaterial',{requestId:'ACC189-FAKE-ROLE-0001',role:'admin',materialName:'FORGED'})).status,403);
 verifiedRole='admin';
 const matA=await send('saveAccountingMaterial',{
   requestId:'ACC189-MATERIAL-A-0001',materialName:'ACC189_SYNTHETIC_PAPER',
   department:'طباعة',stockQty:10,unit:'ورقة',unitCost:10,active:'نعم'
 });
 const matB=await send('saveAccountingMaterial',{
   requestId:'ACC189-MATERIAL-B-0001',materialName:'ACC189_SYNTHETIC_INK',
   department:'طباعة',stockQty:10,unit:'جرام',unitCost:3,active:'نعم'
 });
 assert.equal(matA.success,true,JSON.stringify(matA));
 assert.equal(matB.success,true,JSON.stringify(matB));
 const a=matA.materialId,z=matB.materialId,customer='ACC170-FAKE-CUSTOMER';
 assert.equal(stock(a),10);assert.equal(stock(z),10);
 const template=await send('saveAccountingTemplate',{
   requestId:'ACC189-COMPOSITE-TPL-0001',itemName:'ACC189_SYNTHETIC_PRINT',
   department:'طباعة',componentsJson:[
     {materialName:'ACC189_SYNTHETIC_PAPER',qty:2},
     {materialName:'ACC189_SYNTHETIC_INK',qty:1}
   ],salePrice:60,active:'نعم'
 });
 assert.equal(template.success,true,JSON.stringify(template));
 assert.equal(template.calculatedCost,23,'composite single-unit cost should be 2*10+3=23');
 const sale=await send('saveEasyStoreSaleV2',{
   requestId:'ACC189-COMPOSITE-SALE-0001',customerId:customer,department:'طباعة',
   item:'ACC189_SYNTHETIC_PRINT',invoiceNo:'ACC189-SALE-0001',
   qty:2,unitPrice:60,total:120,paid:120,paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(sale.success,true,JSON.stringify(sale));
 assert.equal(sale.manualCost,46,'composite cost of two units is 46');
 assert.equal(stock(a),6);assert.equal(stock(z),8);
 const beforeWaste=count('employee_accounting_waste_v1');
 const waste=await send('saveAccountingWaste',{
   requestId:'ACC189-STOCK-WASTE-0001',orderId:'ACC189-ORDER-01',
   department:'طباعة',materialId:a,materialQty:1,amount:10,paid:0,
   reason:'ACC189 synthetic paper scrap',workDate:'2099-12-31'
 });
 assert.equal(waste.success,true,JSON.stringify(waste));
 assert.equal(stock(a),5);assert.equal(stock(z),8);
 assert.equal(count('employee_accounting_waste_v1'),beforeWaste+1);
 const beforeOverdraw={
   a:stock(a),b:stock(z),sales:count('employee_accounting_final_invoices_v1'),
   waste:count('employee_accounting_waste_v1'),
   req:count('employee_accounting_request_ledger_v1'),
   cash:count('employee_accounting_cashbox_v1')
 };
 const overdrawWaste=await send('saveAccountingWaste',{
   requestId:'ACC189-WASTE-OVERDRAW-0001',orderId:'ACC189-ORDER-02',
   department:'طباعة',materialId:a,materialQty:7,amount:70,
   reason:'ACC189 insufficient fake stock',workDate:'2099-12-31'
 });
 assert.equal(overdrawWaste.success,false);
 assert.equal(overdrawWaste.status,400);
 const overdrawSale=await send('saveEasyStoreSaleV2',{
   requestId:'ACC189-SALE-OVERDRAW-0001',customerId:customer,department:'طباعة',
   item:'ACC189_SYNTHETIC_PRINT',invoiceNo:'ACC189-OVERDRAW-INVOICE-1',
   qty:3,unitPrice:60,total:180,paid:0,workDate:'2099-12-31'
 });
 assert.equal(overdrawSale.success,false);
 assert.equal(overdrawSale.status,400);
 const negStock=await send('saveAccountingMaterial',{
   requestId:'ACC189-STOCK-NEGATIVE-0001',materialName:'ACC189_SYNTHETIC_PAPER',
   department:'طباعة',stockQty:-5,unitCost:10,active:'نعم'
 });
 assert.equal(negStock.success,false);
 assert.equal(negStock.status,400,'native material validation must disallow negative stock');
 assert.equal(negStock.message,'رصيد الخامة لا يمكن أن يكون سالبًا.');
 assert.deepEqual({
   a:stock(a),b:stock(z),sales:count('employee_accounting_final_invoices_v1'),
   waste:count('employee_accounting_waste_v1'),
   req:count('employee_accounting_request_ledger_v1'),
   cash:count('employee_accounting_cashbox_v1')
 },beforeOverdraw,'insufficient waste, sale and negative manual stock must not alter D1 fake ledgers');
 // Two concurrent fake sales together require 8 sheets while only 5 remain.
 // The native version-gated SQL batch must allow at most one success.
 const concurrentPayload=i=>({
   requestId:'ACC189-RACE-SALE-000'+i,customerId:customer,department:'طباعة',
   item:'ACC189_SYNTHETIC_PRINT',invoiceNo:'ACC189-RACE-INVOICE-'+i,
   qty:2,unitPrice:60,total:120,paid:0,workDate:'2099-12-31'
 });
 const outcomes=await Promise.all([
   send('saveEasyStoreSaleV2',concurrentPayload(1)),
   send('saveEasyStoreSaleV2',concurrentPayload(2))
 ]);
 assert.equal(outcomes.filter(x=>x.success===true).length,1,'two competing stock commands cannot both consume same five sheets '+JSON.stringify(outcomes));
 assert.equal(outcomes.filter(x=>x.success===false).length,1);
 assert.equal(stock(a),1);assert.equal(stock(z),6);
 assert.equal(count('employee_accounting_final_invoices_v1'),2,'one original + one successful concurrent credit sale');
 assert.equal(count('employee_accounting_cashbox_v1'),1,'concurrent credit sale cannot duplicate cash receipt');
 assert.equal(balance('customer',customer),120,'only one credit sale increases receivable');
 const materialRows=db.prepare("SELECT stock_qty FROM employee_accounting_materials_v1").all();
 assert.ok(materialRows.every(x=>Number(x.stock_qty)>=0),'no material inventory may be negative');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const originalStockA=stock(a),originalStockB=stock(z);
 assert.equal((await send('saveAccountingWaste',{
   requestId:'ACC189-READONLY-WASTE-0001',orderId:'ACC189-ORDER-03',
   materialId:a,materialQty:1,amount:10,reason:'blocked after safe idle'
 })).status,503);
 assert.equal(stock(a),originalStockA);assert.equal(stock(z),originalStockB);
 console.log('ACC189_COMPOSITE_TEMPLATE_REAL_SQL_COST_23_SALE_COST_46=PASS');
 console.log('ACC189_COMPOSITE_SALE_STOCK_MULTI_MATERIAL=PASS');
 console.log('ACC189_WASTE_STOCK_DEDUCT_AND_OVERDRAW_NO_SIDE_EFFECT=PASS');
 console.log('ACC189_NEGATIVE_MANUAL_STOCK_REJECTED=PASS');
 console.log('ACC189_CONCURRENT_CREDIT_SALE_STOCK_VERSION_GUARD=PASS');
 console.log('ACC189_PARTY_CASHBOX_AFTER_CONCURRENCY_RECONCILED=PASS');
 console.log('ACC189_ROLE_SPOOF_AND_READONLY_WRITE_REJECTED=PASS');
 console.log('ACC189_G4_PRODUCTION_STOCK_ACCEPTANCE=NOT_PERFORMED');
 console.log('ACC189_RELEASE_DECISION=NO_GO');
 console.log('ACC189_PRODUCTION_FINANCE_MUTATIONS=ZERO');
}finally{db.close();}
