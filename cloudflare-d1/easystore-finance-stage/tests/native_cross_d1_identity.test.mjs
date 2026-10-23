import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import sourceWorker from '../trendos-customer-facts-source.mjs';
import {readOfficialCustomersV1} from '../../src/accounting-customer-facts-contract-v1.mjs';

function adapter(sqlite,record,denyOperationalInFinance=false){
 return {prepare(sql){
   if(denyOperationalInFinance&&/\bt12_/i.test(sql))throw Error('FINANCE_D1_T12_ACCESS_FORBIDDEN');
   record.push(sql);
   const query={sql,values:[]};
   const wrapper={
     bind(...values){query.values=values;return wrapper;},
     async first(){return sqlite.prepare(query.sql).get(...query.values)||null;},
     async all(){return {results:sqlite.prepare(query.sql).all(...query.values)};},
     async run(){return sqlite.prepare(query.sql).run(...query.values);}
   };
   return wrapper;
 }};
}
const financeDB=new DatabaseSync(':memory:'),operationalDB=new DatabaseSync(':memory:');
{
 const migrations=[
  '0015_employee_accounting_zero_google_v1.sql',
  ...[20,21,22,23,24,25,26,27,28,29,30,31].map(n=>{
    const fsNames=fs.readdirSync('cloudflare-d1/migrations');
    const name=fsNames.find(x=>x.startsWith(String(n).padStart(4,'0')+'_employee_accounting_'));
    assert.ok(name,'missing original migration '+n);return name;
  })
 ];
 for(const name of migrations)financeDB.exec(fs.readFileSync('cloudflare-d1/migrations/'+name,'utf8'));
 operationalDB.exec(fs.readFileSync('cloudflare-d1/migrations/0008_t12_customer_master.sql','utf8'));
 const customer=(id,name,active='نعم')=>{
  operationalDB.prepare('INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,active,source) VALUES(?,?,?,?,?)')
   .run(id,name,name.toLowerCase(),active,'cloud-native');
 };
 customer('FAKE-ID-01','ACC235 Synthetic Only');
 customer('FAKE-ID-02','ACC235 Ambiguous');
 customer('FAKE-ID-03','ACC235 Ambiguous');
 customer('FAKE-ID-04','ACC235 Disabled','لا');
 financeDB.prepare("INSERT INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('customer',?,?,73.5,1,'',0)")
  .run('FAKE-ID-01','ACC235 Synthetic Only');
 assert.equal(financeDB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='t12_customers'").get().n,0);
 assert.equal(operationalDB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE 'employee_accounting_%'").get().n,0);
 const financeQueries=[],sourceQueries=[];
 const testSecret='fake-'.repeat(12);
 const sourceEnv={DB:adapter(operationalDB,sourceQueries),
   TRENDOS_CUSTOMER_FACTS_SOURCE_V1:'ENFORCE',TRENDOS_CUSTOMER_FACTS_HMAC_V1:testSecret};
 const financeEnv={
   DB:adapter(financeDB,financeQueries,true),
   EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
   TRENDOS_CUSTOMER_FACTS_HMAC_V1:testSecret,
   EASYSTORE_CUSTOMER_CREDIT_V1:'OFF',
   TRENDOS_CUSTOMER_FACTS:{fetch:request=>sourceWorker.fetch(request,sourceEnv)}
 };
 let native=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
   .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
   .replace(/async function readOfficialCustomersV1\(env,query\)\{[\s\S]*?\n\}/,
     'async function readOfficialCustomersV1(env,query){return globalThis.ACC235_REMOTE(env,query);}')
   .replace(/^export /gm,'');
 assert.ok(!native.startsWith('import'),'original native module SSO stub was not removed');
 const context=vm.createContext({
   ACC235_REMOTE:(env,q)=>readOfficialCustomersV1(env,q),
   crypto:webcrypto,TextEncoder,Response,Request,Headers,URL,URLSearchParams,
   Intl,Date,JSON,Math,console,
   verifyEmployeeSessionCloudFirst:async()=>({ok:false})
 });
 vm.runInContext(native+'\n;globalThis.ACC235_METHODS={resolvePartyV1,getCustomerAccountV1915V1,getEasyStoreCustomersV1,searchCustomersV1};',context,{timeout:15000});
 const methods=context.ACC235_METHODS;
 test('original native finance resolves official ID from signed TrendOS service, NOT local t12',async()=>{
   const p=await methods.resolvePartyV1(financeEnv,'customer',{customerId:'FAKE-ID-01'});
   assert.equal(p.partyId,'FAKE-ID-01');
   assert.equal(p.partyName,'ACC235 Synthetic Only');
   assert.equal(financeQueries.filter(x=>/\bt12_/.test(x)).length,0);
 });
 test('original native getCustomerAccount reads 73.50 only from separate finance D1',async()=>{
   const got=await methods.getCustomerAccountV1915V1(financeEnv,{mode:'final'},{customerId:'FAKE-ID-01'});
   assert.equal(got.success,true,JSON.stringify(got));
   assert.equal(got.balance,73.5);
   assert.equal(got.customer.currentBalance,73.5);
   const dept=await methods.getEasyStoreCustomersV1(financeEnv,{mode:'print'},{limit:10});
   assert.ok(dept.customers.length>=1);
   const pick=dept.customers.find(x=>x.customerId==='FAKE-ID-01');
   assert.ok(pick);
   for(const k of ['debt','phone','currentBalance','creditBalance'])
     assert.equal(Object.hasOwn(pick,k),false);
   const finance=await methods.getEasyStoreCustomersV1(financeEnv,{mode:'final'},{limit:10});
   assert.equal(finance.customers.find(x=>x.customerId==='FAKE-ID-01').currentBalance,73.5);
 });
 test('original native rejects inactive customer and same-name ambiguous ID',async()=>{
   await assert.rejects(methods.resolvePartyV1(financeEnv,'customer',{customerId:'FAKE-ID-04'}),/العميل غير موجود/);
   await assert.rejects(methods.resolvePartyV1(financeEnv,'customer',{customerName:'ACC235 Ambiguous'}),/أكثر من عميل/);
   const unmatched=await methods.getCustomerAccountV1915V1(financeEnv,{mode:'final'},{customerId:'FAKE-ID-99'});
   assert.equal(unmatched.success,false);
 });
 test('service outage never falls back to local customer table or real money writes',async()=>{
   const original=financeEnv.TRENDOS_CUSTOMER_FACTS;
   financeEnv.TRENDOS_CUSTOMER_FACTS={fetch:async()=>new Response('{}',{status:503})};
   await assert.rejects(methods.resolvePartyV1(financeEnv,'customer',{customerId:'FAKE-ID-01'}),/rejected/);
   financeEnv.TRENDOS_CUSTOMER_FACTS=original;
   assert.equal(financeDB.prepare('SELECT COUNT(*) AS n FROM employee_accounting_final_invoices_v1').get().n,0);
   assert.equal(financeDB.prepare('SELECT COUNT(*) AS n FROM employee_accounting_cashbox_v1').get().n,0);
   assert.ok(financeQueries.every(x=>!/\bt12_/i.test(x)));
   assert.ok(sourceQueries.every(x=>/\bSELECT\b/i.test(x)&&!/\b(?:INSERT|UPDATE|DELETE)\b/i.test(x)));
 });
  test.after(()=>{
    // Close only AFTER all Node test callbacks run.
    financeDB.close();operationalDB.close();
  });
}
