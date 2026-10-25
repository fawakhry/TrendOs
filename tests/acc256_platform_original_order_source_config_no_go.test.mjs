import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import worker from '../cloudflare-d1/easystore-finance-stage/trendos-original-order-context-source.mjs';
import {PATH,VERSION,signBody,readOriginalOrderContextV1}
 from '../cloudflare-d1/src/accounting-original-order-context-v1.mjs';

if (!globalThis.crypto) globalThis.crypto=webcrypto;
const candidate=readFileSync('cloudflare-d1/easystore-finance-stage/wrangler.trendos-original-order-context-main-candidate-off.toml','utf8');
const stage=readFileSync('cloudflare-d1/easystore-finance-stage/wrangler.trendos-original-order-context-source.toml','utf8');
const config=readFileSync('cloudflare-d1/wrangler.toml','utf8');
const PRIVATE_TEST_KEY='ACC256_FAKE_TEST_ONLY_PRIVATE_HMAC'.repeat(4);

test('ACC256 points ONLY to existing verified TrendOS main source; no copy to staging or finance',()=>{
 assert.match(config,/name = "trendos-d1-api"/);
 assert.match(config,/database_name = "trendos-main"/);
 assert.match(config,/database_id = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"/);
 assert.match(candidate,/database_name = "trendos-main"/);
 assert.match(candidate,/database_id = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"/);
 assert.match(candidate,/SOURCE_SYSTEM = "trendos_t12_native"/);
 assert.doesNotMatch(candidate,/database_name = "trendos-staging"/);
 assert.doesNotMatch(candidate,/database_name = "easystore-accounting-staging"/);
 assert.match(stage,/database_name = "trendos-staging"/);
});
test('ACC256 platform private candidate is disabled, no route/deploy/real HMAC',()=>{
 assert.match(candidate,/TRENDOS_ORDER_CONTEXT_SOURCE_V1 = "OFF"/);
 assert.match(candidate,/FINANCE_RELEASE = "NO_GO"/);
 assert.match(candidate,/FINANCE_WRITES = "OFF"/);
 assert.match(candidate,/ORIGINAL_ORDER_CUSTOMER_CAPTURE_0035 = "NOT_PRESENT"/);
 assert.match(candidate,/workers_dev = false/);
 assert.doesNotMatch(candidate,/^route\s*=|^routes\s*=|^\[\[routes\]\]/m);
 assert.doesNotMatch(candidate,/^\[triggers\]|^\[\[triggers\]\]/m);
 assert.doesNotMatch(candidate,/^TRENDOS_ORDER_CONTEXT_HMAC_V1\s*=/m);
 assert.doesNotMatch(candidate,/^\[\[services\]\]/m);
 assert.doesNotMatch(candidate,/^\[\[kv_namespaces\]\]/m);
});
test('ACC256 normal current config OFF prevents reading original live D1 even if passed DB',async()=>{
 let attempts=0;
 const DB={async batch(){attempts++;throw Error('NEVER_READ_PROD');}};
 const resp=await worker.fetch(new Request('https://private.invalid'+PATH,{
  method:'POST',body:'{}'
 }),{
  DB,TRENDOS_ORDER_CONTEXT_SOURCE_V1:'OFF',
  TRENDOS_ORDER_CONTEXT_HMAC_V1:PRIVATE_TEST_KEY
 });
 assert.equal(resp.status,503);
 assert.equal(attempts,0);
 const result=await resp.json();
 assert.equal(result.financialAuthority,false);
 assert.equal(result.invoicePostingAllowed,false);
});
test('ACC256 missing original 0035 capture fails closed even with fake fully signed request',async()=>{
 let batches=0;
 const raw=JSON.stringify({
  version:VERSION,orderId:'fake-order-no-data',
  customerId:'fake-customer-no-data',issuedAt:Date.now(),
  nonce:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 });
 const sig=await signBody(PRIVATE_TEST_KEY,raw);
 const resp=await worker.fetch(new Request('https://private.invalid'+PATH,{
  method:'POST',headers:{'x-order-context-signature':sig},body:raw
 }),{
  TRENDOS_ORDER_CONTEXT_SOURCE_V1:'ENFORCE',
  TRENDOS_ORDER_CONTEXT_HMAC_V1:PRIVATE_TEST_KEY,
  DB:{prepare(){return {bind(){return {}}};},batch:async()=>{batches++;throw Error('no such table: t12_order_customer_at_create_v1')}}
 });
 assert.equal(resp.status,409);
 assert.equal(batches,1);
 const body=await resp.text();
 assert.equal(body.includes('no such table'),false);
 assert.equal(body.includes('fake-customer-no-data'),false);
});
test('ACC256 no service binding or key => EasyStore private client refuses any original source request',async()=>{
 await assert.rejects(()=>readOriginalOrderContextV1({
  EASYSTORE_ORDER_CONTEXT_SOURCE_V1:'OFF'
 },{orderId:'fake',customerId:'fake'}),/ACC251_PRIVATE_ORDER_SOURCE_NOT_CONNECTED/);
 await assert.rejects(()=>readOriginalOrderContextV1({
  EASYSTORE_ORDER_CONTEXT_SOURCE_V1:'REMOTE_REQUIRED'
 },{orderId:'fake',customerId:'fake'}),/ACC251_PRIVATE_ORDER_SOURCE_NOT_CONNECTED/);
});
