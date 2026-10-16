import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

// Actual checked-in Native Core Worker and offline fake SQLite; no finance writes.
const original=fs.readFileSync('cloudflare-d1/src/employee-core-native-v1.mjs','utf8');
const worker=original.replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
 .replace(/^export /gm,'')+'\n;globalThis.fakeHandler=handleEmployeeCoreNativeRequest;';
const db=new DatabaseSync(':memory:');
try{
 db.exec(fs.readFileSync('cloudflare-d1/migrations/0016_employee_core_zero_google_v1.sql','utf8'));
 db.exec(fs.readFileSync('cloudflare-d1/migrations/0017_employee_core_current_orders_v1.sql','utf8'));
 db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',extra_phone TEXT NOT NULL DEFAULT '',active TEXT NOT NULL DEFAULT 'نعم',debt_amount REAL NOT NULL DEFAULT 0)");
 db.exec("CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL DEFAULT '',customer_phone TEXT NOT NULL DEFAULT '')");
 db.exec("CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT NOT NULL)");
 db.exec("CREATE TABLE employee_accounting_party_balances_v1(party_type TEXT NOT NULL,party_id TEXT NOT NULL,balance REAL NOT NULL DEFAULT 0,PRIMARY KEY(party_type,party_id))");
 db.exec("UPDATE employee_core_control_v1 SET mode='READONLY' WHERE singleton=1");
 const addImported=(id,order,customer,phone,debt)=>{
   db.prepare('INSERT INTO employee_core_orders_v1(order_id,customer_name,customer_phone,active) VALUES(?,?,?,1)').run(order,customer,phone);
   db.prepare("INSERT INTO employee_core_lines_v1(line_id,order_id,customer_name,customer_phone,department,debt_amount,active) VALUES(?,?,?,?,'طباعة',?,1)").run(id,order,customer,phone,debt);
 };
 const addCustomer=(id,name,phone,oldDebt,posted)=>{
   db.prepare('INSERT INTO t12_customers(customer_id,customer_name,phone,debt_amount) VALUES(?,?,?,?)').run(id,name,phone,oldDebt);
   if(posted!==null)db.prepare("INSERT INTO employee_accounting_party_balances_v1(party_type,party_id,balance) VALUES('customer',?,?)").run(id,posted);
 };
 addImported('FAKE_SNAPSHOT_STALE','FAKE_ORDER_STALE','FAKE_STALE_CUSTOMER','FAKE_PHONE_STALE',50);
 addCustomer('FAKE_CUSTOMER_STALE','FAKE_STALE_CUSTOMER','FAKE_PHONE_STALE',50,0);
 addImported('FAKE_SNAPSHOT_EQUAL','FAKE_ORDER_EQUAL','FAKE_EQUAL_CUSTOMER','FAKE_PHONE_EQUAL',25);
 addCustomer('FAKE_CUSTOMER_EQUAL','FAKE_EQUAL_CUSTOMER','FAKE_PHONE_EQUAL',25,25);
 addImported('FAKE_SNAPSHOT_MISSING_LEDGER','FAKE_ORDER_MISSING','FAKE_MISSING_LEDGER','FAKE_PHONE_MISSING',30);
 addCustomer('FAKE_CUSTOMER_MISSING','FAKE_MISSING_LEDGER','FAKE_PHONE_MISSING',30,null);
 addImported('FAKE_SNAPSHOT_AMBIG','FAKE_ORDER_AMBIG','FAKE_AMBIG_CUSTOMER','FAKE_SHARED_PHONE',90);
 addCustomer('FAKE_CUSTOMER_A','FAKE_AMBIG_CUSTOMER','FAKE_SHARED_PHONE',90,90);
 addCustomer('FAKE_CUSTOMER_B','FAKE_OTHER_PERSON','FAKE_SHARED_PHONE',0,0);
 addImported('FAKE_SNAPSHOT_UNBOUND','FAKE_ORDER_UNBOUND','FAKE_UNKNOWN_CUSTOMER','FAKE_PHONE_UNKNOWN',12);
 db.prepare("INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone) VALUES('FAKE_T12_ORDER','FAKE_T12_PERSON','FAKE_PHONE_T12')").run();
 db.prepare("INSERT INTO t12_prod_lines(line_id,order_id) VALUES('FAKE_T12_LINE','FAKE_T12_ORDER')").run();
 addCustomer('FAKE_CUSTOMER_T12','FAKE_T12_PERSON','FAKE_PHONE_T12',70,19);
 const DB={
   prepare(sql){let args=[];
     const stmt={
       bind(...params){args=params;return stmt;},
       async first(){return db.prepare(sql).get(...args)||null;},
       async all(){return {results:db.prepare(sql).all(...args)};},
       async run(){throw Error('READONLY_PREVIEW_MUST_NOT_WRITE');}
     };return stmt;
   },
   async batch(){throw Error('READONLY_PREVIEW_MUST_NOT_BATCH');}
 };
 let role='admin',department='إدارة',network=0;
 const env={DB,CORS_ORIGINS:'https://fawakhry.github.io'};
 const ctx=vm.createContext({Date,Math,Intl,JSON,URL,Request,Response,Headers,crypto:webcrypto,TextEncoder,console,
   verifyEmployeeSessionCloudFirst:async(username,token)=>{
     if(username!=='FAKE_CORE_OWNER'||token!=='FAKE_CORE_TOKEN')return {ok:false};
     return {ok:true,authSource:'FAKE_AUTH_ONLY',body:{user:{username,role,department}}};
   }
 });
 vm.runInContext(worker,ctx,{timeout:15000});
 async function send(lineId,override={}){
   const previous=globalThis.fetch;
   globalThis.fetch=()=>{network++;throw Error('NO_NETWORK')};
   try{
     const response=await ctx.fakeHandler(new Request('https://offline.invalid/v1/employee/core',{
       method:'POST',headers:{Origin:'https://fawakhry.github.io',
         'Content-Type':'application/json',Authorization:'Bearer '+(override.token||'FAKE_CORE_TOKEN')},
       body:JSON.stringify({action:'previewDeliveryDebtReconciliationV1',
         username:'FAKE_CORE_OWNER',lineId,...override.body})
     }),env);
     return {httpStatus:response.status,...await response.json()};
   }finally{globalThis.fetch=previous;}
 }
 const changes=()=>db.prepare('SELECT total_changes() AS n').get().n;
 await test('01 BOOK19 imported snapshot debt 50 vs posted customer 0 is read-only discrepancy',async()=>{
   const n=changes(),r=await send('FAKE_SNAPSHOT_STALE');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.status,'SOURCES_DIFFER');assert.equal(r.operationalDebt,50);
   assert.equal(r.postedCustomerBalance,0);assert.equal(r.identityVerified,false);
   assert.equal(r.deliveryAuthorized,false);assert.equal(r.automaticRetryAuthorized,false);
   assert.equal(r.financeRelease,'NO_GO');assert.equal(changes(),n);
 });
 await test('02 BOOK19 equal balances still do not verify a unique immutable customer identity',async()=>{
   const r=await send('FAKE_SNAPSHOT_EQUAL');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.status,'SOURCES_EQUAL_IDENTITY_UNVERIFIED');
   assert.equal(r.customerMatchCount,1);assert.equal(r.identityVerified,false);
   assert.equal(r.postingAllowed,false);
 });
 await test('03 BOOK19 missing accounting balance is not assumed to be zero',async()=>{
   const r=await send('FAKE_SNAPSHOT_MISSING_LEDGER');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.status,'NO_POSTED_BALANCE');assert.equal(r.postedCustomerBalance,null);
 });
 await test('04 BOOK19 same phone two people cannot silently choose posted balance',async()=>{
   const r=await send('FAKE_SNAPSHOT_AMBIG');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.status,'NO_UNIQUE_CUSTOMER_MATCH');
   assert.equal(r.customerMatchCount,2);assert.equal(r.postedCustomerBalance,null);
 });
 await test('05 BOOK19 no customer match is unbound not debt-free',async()=>{
   const r=await send('FAKE_SNAPSHOT_UNBOUND');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.status,'NO_UNIQUE_CUSTOMER_MATCH');assert.equal(r.customerMatchCount,0);
 });
 await test('06 BOOK19 T12 operational debt differs from posted party balance',async()=>{
   const r=await send('FAKE_T12_LINE');
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.sourceKind,'t12-prod');assert.equal(r.operationalDebt,70);
   assert.equal(r.postedCustomerBalance,19);assert.equal(r.status,'SOURCES_DIFFER');
 });
 await test('07 BOOK19 READONLY and forged client finance fields cannot cause a write',async()=>{
   const n=changes();
   const r=await send('FAKE_SNAPSHOT_STALE',{body:{status:'تم التسليم',role:'admin',financeRelease:'GO'}});
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.sourceOnly,true);assert.equal(r.deliveryAuthorized,false);
   assert.equal(r.postingAllowed,false);assert.equal(changes(),n);
 });
 await test('08 BOOK19 verified print cannot view customer reconciliation',async()=>{
   role='print';department='طباعة';
   try{
     const r=await send('FAKE_SNAPSHOT_STALE',{body:{role:'admin',screen:'service'}});
     assert.equal(r.success,false,JSON.stringify(r));
     assert.equal(r.code,'delivery-debt-owner-role-required');
   }finally{role='admin';department='إدارة';}
 });
 await test('09 BOOK19 invalid, missing and unsafe line IDs plus false token fail closed',async()=>{
   for(const lineId of ['','../etc/passwd','FAKE_MISSING_LINE']){
     const r=await send(lineId);
     assert.equal(r.success,false,JSON.stringify(r));
   }
   const bad=await send('FAKE_SNAPSHOT_STALE',{token:'WRONG'});
   assert.equal(bad.success,false);assert.equal(bad.httpStatus,401);assert.equal(network,0);
 });
 await test('10 BOOK19 OFF mode denies this inspection, never activates delivery writes',async()=>{
   db.exec("UPDATE employee_core_control_v1 SET mode='OFF' WHERE singleton=1");
   try{
     const r=await send('FAKE_SNAPSHOT_STALE');
     assert.equal(r.success,false);assert.equal(r.code,'employee-core-off');
   }finally{db.exec("UPDATE employee_core_control_v1 SET mode='READONLY' WHERE singleton=1");}
 });
 console.log('BOOK19_DELIVERY_DEBT_RECONCILIATION=SOURCE_ONLY_FAKE_SQLITE');
 console.log('BOOK19_PRODUCTION_WRITE=NO');
 console.log('FINANCE_RELEASE=NO_GO');
}finally{db.close();}