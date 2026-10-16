// Necessary but not sufficient checks for normalized final freshness contract.
// All fixtures synthetic. No fetch, real sync credentials, D1 or Apps Script.
import assert from 'node:assert/strict';
import test from 'node:test';
import { handleNormalizedImportRequest } from '../cloudflare-d1/src/normalized-import-gate.mjs';

const SECRET='SYNTHETIC-ONLY-MIGRATION-KEY';
function fake(){
  const calls={sql:0,batch:0};
  const env={MIGRATION_SECRET:SECRET,DB:{prepare(sql){
    calls.sql++;
    return {bind(){return this;},async run(){return {};},async first(){return null;},async all(){return {results:[]}}};
  },async batch(){calls.batch++;return []}}};
  return {env,calls};
}
async function post(env,body,secret=SECRET){
  const req=new Request('https://fixture.invalid/v1/import/batch',{method:'POST',headers:{
    'content-type':'application/json','x-migration-secret':secret},body:JSON.stringify(body)});
  const response=await handleNormalizedImportRequest(req,env);
  return {status:response.status,body:await response.json()};
}

test('implicit syncFinal is denied before D1 writes or prepared statements',async()=>{
  for(const input of [{syncRunId:'RUN-FAKE',orders:[{orderId:'FAKE-1'}],sourceRowCounts:{orders:1}},
    {syncFinal:'true',syncRunId:'RUN-FAKE',orders:[],sourceRowCounts:{orders:0}},
    {syncFinal:true,orders:[],sourceRowCounts:{orders:0}}]){
    const {env,calls}=fake(),r=await post(env,input);
    assert.equal(r.status,400);
    assert.equal(r.body.freshnessAdvanced,false);
    assert.equal(calls.batch,0);
    assert.equal(calls.sql,0);
  }
});
test('missing or invalid declared entity counts are denied before D1 writes',async()=>{
  for(const counts of [undefined,{}, {orders:-1},{orders:'2'},{orders:1.4},{orders:Infinity}]){
    const {env,calls}=fake();
    const r=await post(env,{syncRunId:'RUN-FAKE',syncFinal:true,sourceRowCounts:counts,orders:[]});
    assert.equal(r.status,400,'bad counts '+JSON.stringify(counts));
    assert.equal(r.body.freshnessAdvanced,false);
    assert.equal(calls.batch,0);
    assert.equal(calls.sql,0);
  }
});
test('explicit authorized final still works for correctly declared empty source',async()=>{
  const {env,calls}=fake();
  const r=await post(env,{syncRunId:'RUN-EMPTY-1',syncFinal:true,sourceRowCounts:{orders:0},orders:[]});
  assert.equal(r.status,200);
  assert.equal(r.body.sync.freshnessAdvanced,true);
  assert.equal(calls.batch,1);
});
test('unauthorized import cannot prepare or mutate the fake D1',async()=>{
  const {env,calls}=fake();
  const r=await post(env,{syncRunId:'RUN-EMPTY-1',syncFinal:true,sourceRowCounts:{orders:0},orders:[]},'WRONG');
  assert.equal(r.status,401);
  assert.equal(calls.sql,0);
  assert.equal(calls.batch,0);
});
