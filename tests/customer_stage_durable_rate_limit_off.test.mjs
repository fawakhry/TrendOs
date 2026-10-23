import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CustomerLoginThrottleStageV0,createCustomerStageDurableRateGateV0,
 reserveCustomerLoginAttemptStageV0,CUSTOMER_STAGE_RATE_POLICY_V0
} from '../cloudflare-d1/customer-stage/login-throttle-v0.mjs';

const input=(code='a'.repeat(64),ip='b'.repeat(64))=>({
  policy:'customer-login-dual-v0',keys:[code,ip]
});
function sqliteFake(){
  let data=new Map(),txCount=0;
  const sql={
    exec(statement,...args){
      if(statement.startsWith('CREATE TABLE IF NOT EXISTS'))return {toArray:()=>[]};
      if(statement.startsWith('SELECT window_id AS windowId')){
        const row=data.get(args[0]);
        return {toArray:()=>row?[{windowId:row.windowId,hits:row.hits}]:[]};
      }
      if(statement.startsWith('INSERT INTO customer_login_rate_stage_v0')){
        if(args.length!==4)throw Error('test SQL bind mismatch');
        data.set(args[0],{windowId:args[1],hits:args[2],lastSeen:args[3]});
        return {toArray:()=>[]};
      }
      if(statement.startsWith('DELETE FROM customer_login_rate_stage_v0')){
        for(const [key,row] of data)
          if(row.lastSeen<args[0])data.delete(key);
        return {toArray:()=>[]};
      }
      throw Error('unexpected SQL '+statement);
    }
  };
  const storage={
    sql,transactionSync(work){
      txCount++;
      const snapshot=new Map([...data].map(([k,v])=>[k,{...v}]));
      try{return work();}
      catch(e){data=snapshot;throw e;}
    }
  };
  return {storage,sql,rows:()=>new Map(data),transactionCount:()=>txCount};
}
function makeStageDo(store=sqliteFake()){
  return {object:new CustomerLoginThrottleStageV0({storage:store.storage}),store};
}
const post=(value=input(),overrides={})=>new Request(
 'https://internal.stage.test/internal/customer-login-rate/reserve',{
  method:'POST',headers:{'content-type':'application/json',...overrides.headers},
  body:overrides.body??JSON.stringify(value)
 });
test('SQLite DO config is isolated and production Wrangler unchanged',()=>{
  const cfg=readFileSync('cloudflare-d1/wrangler.customer-stage.toml','utf8');
  const prod=readFileSync('cloudflare-d1/wrangler.toml','utf8');
  const idx=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
  const shadow=readFileSync('cloudflare-d1/production-shadow/index.js','utf8');
  assert.match(cfg,/\[\[durable_objects\.bindings\]\]/);
  assert.match(cfg,/name\s*=\s*"CUSTOMER_LOGIN_RATE_STAGE_V0"/);
  assert.match(cfg,/class_name\s*=\s*"CustomerLoginThrottleStageV0"/);
  assert.match(cfg,/new_sqlite_classes\s*=\s*\["CustomerLoginThrottleStageV0"\]/);
  assert.match(cfg,/TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED\s*=\s*"false"/);
  assert.doesNotMatch(cfg,/\[\[d1_databases\]\]|database_id|\[\[r2_buckets\]\]|routes?\s*=/);
  assert.doesNotMatch(prod,/CUSTOMER_LOGIN_RATE_STAGE_V0|customer-stage\/login-throttle-v0/);
  assert.doesNotMatch(shadow,/CUSTOMER_LOGIN_RATE_STAGE_V0|customer-stage\/login-throttle-v0/);
  assert.doesNotMatch(idx,/CUSTOMER_LOGIN_RATE_STAGE_V0|customer-stage\/login-throttle-v0/);
  assert.equal(CUSTOMER_STAGE_RATE_POLICY_V0.sourceOnly,true);
  assert.equal(CUSTOMER_STAGE_RATE_POLICY_V0.productionEnabled,false);
});
test('global transaction persists 5 per customer identifier, sixth blocks without changing counters',async()=>{
  const {object,store}=makeStageDo();
  for(let n=0;n<5;n++){
    const res=await object.fetch(post());
    assert.equal(res.status,200);
    assert.deepEqual(await res.json(),{allowed:true,persisted:true});
  }
  const before=store.rows();
  const rejected=await object.fetch(post());
  assert.deepEqual(await rejected.json(),{allowed:false,persisted:true});
  assert.deepEqual(store.rows(),before);
  assert.equal(store.transactionCount(),6);
  assert.equal(store.rows().get('portal:'+'a'.repeat(64)).hits,5);
  assert.equal(store.rows().get('ip:'+'b'.repeat(64)).hits,5);
});
test('single IP across six independent customer IDs denies after 30 attempts',async()=>{
  const {object,store}=makeStageDo();
  for(let i=0;i<30;i++){
    const code=i.toString(16).padStart(64,'0');
    const r=await object.fetch(post(input(code,'b'.repeat(64))));
    assert.equal((await r.json()).allowed,true);
  }
  const r=await object.fetch(post(input('f'.repeat(64),'b'.repeat(64))));
  assert.deepEqual(await r.json(),{allowed:false,persisted:true});
  assert.equal(store.rows().get('ip:'+'b'.repeat(64)).hits,30);
  assert.equal(store.rows().has('portal:'+'f'.repeat(64)),false);
});
test('state survives DO instance recreation and fixed 15-minute windows reset',async()=>{
  const store=sqliteFake();
  const first=new CustomerLoginThrottleStageV0({storage:store.storage});
  for(let i=0;i<5;i++)await first.fetch(post());
  const second=new CustomerLoginThrottleStageV0({storage:store.storage});
  assert.equal((await (await second.fetch(post())).json()).allowed,false);
  const old=15*60*1000+1;
  const next=old+15*60*1000;
  const different=input('f'.repeat(64),'1'.repeat(64));
  const a=reserveCustomerLoginAttemptStageV0(store.sql,different,old);
  const b=reserveCustomerLoginAttemptStageV0(store.sql,different,next);
  assert.equal(a.allowed,true);assert.equal(b.allowed,true);
  assert.equal(store.rows().get('portal:'+'f'.repeat(64)).hits,1);
});
test('malformed keys, invalid methods, excess size and no storage cannot grant',async()=>{
  const {object}=makeStageDo();
  for(const keys of [
    ['bad','b'.repeat(64)],['a'.repeat(64),'a'.repeat(64)],
    ['a'.repeat(64)],['A'.repeat(64),'b'.repeat(64)]
  ]){
    const response=await object.fetch(post({keys,policy:'customer-login-dual-v0'}));
    assert.equal(response.status,400);
  }
  for(const req of [
    new Request('https://internal.stage.test/internal/customer-login-rate/reserve',{method:'GET'}),
    new Request('https://internal.stage.test/internal/customer-login-rate/reserve?debug=true',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input())}),
    post(input(),{headers:{'content-type':'text/plain'}}),
    post(input(),{body:'x'.repeat(800)})
  ]){
    assert.notEqual((await object.fetch(req)).status,200);
  }
  const broken=new CustomerLoginThrottleStageV0({storage:{}});
  const r=await broken.fetch(post());
  assert.equal(r.status,503);
  assert.deepEqual(await r.json(),{allowed:false,persisted:false});
});
test('the Worker rate adapter requires exact binding and confirmed response',async()=>{
  assert.equal(createCustomerStageDurableRateGateV0({}),null);
  let seenId='',seenCalls=0;
  const {object}=makeStageDo();
  const gate=createCustomerStageDurableRateGateV0({
    CUSTOMER_LOGIN_RATE_STAGE_V0:{
      idFromName(name){seenId=name;return 'fake-in-test';},
      get(id){assert.equal(id,'fake-in-test');return {
        async fetch(...args){seenCalls++;return object.fetch(new Request(...args));}
      };}
    }
  });
  assert.equal(typeof gate.reserveMany,'function');
  for(let i=0;i<5;i++){
    assert.deepEqual(await gate.reserveMany(input()),{allowed:true,persisted:true});
  }
  assert.deepEqual(await gate.reserveMany(input()),{allowed:false,persisted:true});
  assert.equal(seenCalls,6);
  assert.equal(seenId,'singleton-customer-native-login-stage-v0');
  await assert.rejects(()=>gate.reserveMany(input('invalid','b'.repeat(64))));
});
test('storage failure cannot claim atomic persistence',async()=>{
  const object=new CustomerLoginThrottleStageV0({
    storage:{sql:{exec(){throw Error('SQL unavailable')}},transactionSync(fn){return fn();}}
  });
  const response=await object.fetch(post());
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{allowed:false,persisted:false});
});
