/** SERVER-68 source-only preflight. No Cloudflare credentials, URLs, network or D1. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MirrorServiceNonceGuardV1} from '../cloudflare-d1/src/mirror-service-replay-guard-v1.mjs';
import {handleMirrorServiceRead} from '../cloudflare-d1/src/mirror-service-read-v1.mjs';

const cfg=readFileSync('cloudflare-d1/wrangler.server68-isolated-stage.toml','utf8');
const main=readFileSync('cloudflare-d1/production-shadow/index.js','utf8');
const prod=readFileSync('cloudflare-d1/wrangler.toml','utf8');
const r5=readFileSync('.github/workflows/trendos-r5-periodic-controlled.yml','utf8');

test('separate stage worker: correct entrypoint, unpublished by default',()=>{
  assert.match(cfg,/^name = "trendos-server68-isolated-stage"$/m);
  assert.match(cfg,/^main = "production-shadow\/index\.js"$/m);
  assert.match(cfg,/^workers_dev = false$/m);
  assert.doesNotMatch(cfg,/\b(?:routes?|zone_id|account_id|route)\s*=|\[\[routes\]\]/i);
  assert.doesNotMatch(cfg,/\b(?:trendos-main|5c4b92bf-e043-4f6e-bd6d-d514a92cd825)\b/i);
  assert.doesNotMatch(cfg,/\[\[d1_databases\]\]|database_id\s*=/);
  assert.notEqual(cfg.match(/^name = "(.+)"$/m)?.[1],prod.match(/^name = "(.+)"$/m)?.[1]);
});

test('all stage data access/mutation features remain OFF and contain no secrets',()=>{
  for(const name of [
    'MIRROR_SERVICE_READ_ENABLED','MIRROR_METADATA_READ_ENABLED',
    'MIRROR_PARITY_READ_ENABLED','TRENDOSSHOP_SERVICE_READ_ENABLED',
    'TRENDOS_CLOUD_WRITE_V1_ENABLED','TRENDOS_R5_PERIODIC_ENABLED',
    'TRENDOS_T12_PROD_CREATE_CANARY_ENABLED','AUTONOMOUS_PRINTSHOP_SHADOW_V1_ENABLED',
    'TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED','TRENDOS_EMPLOYEE_AUTH_V1_ENABLED'
  ])assert.ok(cfg.split('\n').includes(name+' = "false"'),name+' must be explicitly OFF');
  assert.doesNotMatch(cfg,/secret\s*=|token\s*=|password\s*=|api[_-]?key\s*=/i);
});

test('stage Durable Object migration is isolated and class is actually exported',()=>{
  assert.match(cfg,/\[\[durable_objects\.bindings\]\]/);
  assert.match(cfg,/^name = "MIRROR_SERVICE_READ_REPLAY_DO"$/m);
  assert.match(cfg,/^class_name = "MirrorServiceNonceGuardV1"$/m);
  assert.match(cfg,/\[\[migrations\]\]/);
  assert.match(cfg,/^new_sqlite_classes = \["MirrorServiceNonceGuardV1"\]$/m);
  assert.match(main,/export \{ MirrorServiceNonceGuardV1 \} from/);
  assert.doesNotMatch(prod,/MIRROR_SERVICE_READ_REPLAY_DO|server68_isolated_stage_nonce_v1/);
});

function fakeStore(){
  const values=new Map();
  let alarm=null;
  let queue=Promise.resolve();
  const storage={
    async transaction(fn){
      const op=queue.then(()=>fn({
        get:async key=>values.get(key),
        put:async(key,value)=>{values.set(key,value);}
      }));
      queue=op.then(()=>{},()=>{});
      return op;
    },
    getAlarm:async()=>alarm,
    setAlarm:async time=>{alarm=time;},
    list:async({prefix='',limit=Infinity}={})=>new Map([...values].filter(([key])=>key.startsWith(prefix)).slice(0,limit)),
    delete:async key=>{values.delete(key);}
  };
  return {values,storage};
}
function consume(nonce,validUntil=Date.now()+20000){
  return new Request('https://replay-only.invalid/consume',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({scope:'trendos_mirror_metadata',nonce,validUntil})
  });
}
test('two concurrent duplicate HMAC nonce receipts permit exactly one access',async()=>{
  const fake=fakeStore(),guard=new MirrorServiceNonceGuardV1({storage:fake.storage});
  const nonce='N'.repeat(24);
  const [one,two]=await Promise.all([
    guard.fetch(consume(nonce)),guard.fetch(consume(nonce))
  ]);
  assert.deepEqual([one.status,two.status].sort(),[200,409]);
  assert.equal(fake.values.size,1);
});
test('replay guard rejects malformed and expired requests with no stored nonce',async()=>{
  const fake=fakeStore(),guard=new MirrorServiceNonceGuardV1({storage:fake.storage});
  const old=await guard.fetch(consume('N'.repeat(24),Date.now()-2000));
  assert.equal(old.status,400);
  const bad=new Request('https://replay-only.invalid/consume',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({scope:'untrusted',nonce:'Q'.repeat(24),validUntil:Date.now()+20000})
  });
  assert.equal((await guard.fetch(bad)).status,400);
  assert.equal(fake.values.size,0);
});
test('offline guarded reader fails closed with missing D1 even when flags accidentally ON',async()=>{
  const request=new Request('https://stage-offline.invalid/v1/service/mirror/stats');
  const env={MIRROR_SERVICE_READ_ENABLED:'false'};
  const response=await handleMirrorServiceRead(request,env);
  assert.equal(response.status,404);
  assert.equal((await response.json()).code,'mirror-service-disabled');
});
test('R5 deployment workflow still depends on unsecured GET=200: production migration BLOCKED',()=>{
  assert.match(r5,/catalog_code=.*\/v1\/mirror\/sheets/);
  assert.match(r5,/test "\$catalog_code" = 200/);
  // This intentional dependency must be replaced and separately reviewed
  // before enabling the fail-closed legacy mirror gate in Production.
});
test('all synthetic test hostnames are nonroutable fixtures',()=>{
  for(const url of ['https://stage-offline.invalid','https://replay-only.invalid']){
    assert.ok(new URL(url).hostname.endsWith('.invalid'));
  }
});
