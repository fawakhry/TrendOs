import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../trendos-customer-facts-source.mjs';
import {readOfficialCustomersV1,newEnvelope,signBody,PATH} from '../../src/accounting-customer-facts-contract-v1.mjs';

const signingValue='offline-fixture-'.repeat(4);
const fixture=[
  {customer_id:'FAKE-ONE',customer_name:'Test Alpha',manager:'',
    phone:'fake',extra_phone:'',customer_type:'خارجي',active:'نعم',debt_amount:444},
  {customer_id:'FAKE-TWO',customer_name:'Test Alpha',manager:'',
    phone:'',extra_phone:'',customer_type:'خارجي',active:'نعم',debt_amount:777},
  {customer_id:'FAKE-OFF',customer_name:'Test Disabled',manager:'',
    phone:'',extra_phone:'',customer_type:'خارجي',active:'لا',debt_amount:123}
];
const seen=[];
function operationalDb(){return {prepare(sql){
  seen.push(sql);
  return {bind(...values){
    let results=fixture;
    if(sql.includes('customer_id=?'))results=results.filter(x=>x.customer_id===values[0]);
    else if(sql.includes('lower(customer_name)=lower(?)'))
      results=results.filter(x=>x.customer_name.toLowerCase()===values[0].toLowerCase());
    else if(sql.includes('LIKE lower(?)'))
      results=results.filter(x=>x.active==='نعم'&&x.customer_name.toLowerCase().includes(values[0].replace(/%/g,'').toLowerCase()));
    else results=results.filter(x=>x.active==='نعم');
    if(sql.includes('LIMIT 2'))results=results.slice(0,2);
    return {first:async()=>results[0]||null,all:async()=>({results})};
  }};
}};}
const sourceEnv=()=>({DB:operationalDb(),
  TRENDOS_CUSTOMER_FACTS_SOURCE_V1:'ENFORCE',
  TRENDOS_CUSTOMER_FACTS_HMAC_V1:signingValue});
function financeEnv(src=sourceEnv()){return {
  EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
  TRENDOS_CUSTOMER_FACTS_HMAC_V1:signingValue,
  TRENDOS_CUSTOMER_FACTS:{fetch:r=>source.fetch(r,src)}
};}

test('signed internal source returns only official identity/contact, not debts',async()=>{
 const got=await readOfficialCustomersV1(financeEnv(),{operation:'BY_ID',customerId:'FAKE-ONE'});
 assert.equal(got[0].customer_id,'FAKE-ONE');
 assert.equal(Object.hasOwn(got[0],'debt_amount'),false);
 assert.equal(got.length,1);
 assert.ok(seen.every(q=>q.includes('FROM t12_customers')));
 assert.ok(seen.every(q=>!/(INSERT|UPDATE|DELETE|employee_accounting_)/i.test(q)));
});
test('duplicate official name remains ambiguous and inactive search hidden',async()=>{
 const f=financeEnv();
 const exact=await readOfficialCustomersV1(f,{operation:'EXACT_NAME',name:'Test Alpha'});
 assert.deepEqual(exact.map(x=>x.customer_id),['FAKE-ONE','FAKE-TWO']);
 const listing=await readOfficialCustomersV1(f,{operation:'LIST_ACTIVE',limit:10});
 assert.equal(listing.length,2);
});
test('missing service, disabled source, weak authentication and expired timestamp fail closed',async()=>{
 const f=financeEnv();
 await assert.rejects(readOfficialCustomersV1({...f,TRENDOS_CUSTOMER_FACTS:undefined},
  {operation:'BY_ID',customerId:'FAKE-ONE'}));
 await assert.rejects(readOfficialCustomersV1({...f,EASYSTORE_CUSTOMER_SOURCE_V1:'LOCAL'},
  {operation:'BY_ID',customerId:'FAKE-ONE'}));
 await assert.rejects(readOfficialCustomersV1(financeEnv({...sourceEnv(),TRENDOS_CUSTOMER_FACTS_SOURCE_V1:'OFF'}),
  {operation:'BY_ID',customerId:'FAKE-ONE'}));
 const old={...newEnvelope('BY_ID',{customerId:'FAKE-ONE'})};
 old.issuedAt-=61000;
 const json=JSON.stringify(old);
 const resp=await source.fetch(new Request('https://example.invalid'+PATH,{
  method:'POST',body:json,headers:{'x-trendos-customer-facts-signature':await signBody(signingValue,json)}
 }),sourceEnv());
 assert.equal(resp.status,400);
});
test('tampered response signatures and mismatched nonce rejected',async()=>{
 const good=financeEnv();
 const baseline=good.TRENDOS_CUSTOMER_FACTS.fetch;
 good.TRENDOS_CUSTOMER_FACTS={fetch:async req=>{
  const res=await baseline(req),original=await res.json(),body=JSON.stringify({...original,nonce:'bad'});
  return new Response(body,{status:200,headers:{
   'x-trendos-customer-facts-signature':await signBody(signingValue,body)
  }});
 }};
 await assert.rejects(readOfficialCustomersV1(good,{operation:'BY_ID',customerId:'FAKE-ONE'}),/mismatch/);
});
test('no unsigned, public GET or arbitrary path accepted',async()=>{
 const root='https://example.invalid';
 assert.equal((await source.fetch(new Request(root+PATH),sourceEnv())).status,405);
 assert.equal((await source.fetch(new Request(root+'/v1/customers'),sourceEnv())).status,404);
 assert.equal((await source.fetch(new Request(root+PATH,{method:'POST',body:'{}'}),sourceEnv())).status,401);
});
