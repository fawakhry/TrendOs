import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const edge=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const begin=edge.indexOf('  async function t12CreateFingerprint(params)');
const end=edge.indexOf('  function safeT12CreatePayload(params, cloudKey)',begin);
assert.ok(begin>0&&end>begin,'Expected exact scoped browser helper boundaries');
const helpers=edge.slice(begin,end);

const data=new Map();
const storage={
  getItem(k){return data.get(k)??null;},
  setItem(k,v){data.set(k,String(v));},
  removeItem(k){data.delete(k);}
};
function bootWithSameStorage(){
  const script=`(function(){
    var T12_PENDING_CREATE_STORAGE_KEY = 'trendos_t12_pending_create_v1';
    var T12_DURABLE_CREATE_STORAGE_KEY = 'trendos_t12_pending_create_sha256_v2';
    function text(value){return String(value==null?'':value).trim();}
    ${helpers}
    return {hash:t12CreateFingerprint,key:cloudCreateKeyFromLegacy,
      read:readPendingCreate,remember:rememberPendingCreate,clear:clearPendingCreate};
  })()`;
  return vm.runInNewContext(script,{localStorage:storage,sessionStorage:storage,
    crypto:webcrypto,TextEncoder,Date});
}
const params={username:'employee',customerName:'Sample Customer',customerPhone:'01000000000',
  customerMode:'عميل مسجل',department:'طباعة',itemName:'Sample Job',qty:'1',
  priority:'عاجل',status:'طلب جديد',source:'داخلي',notes:'example-private-note'};
const firstBoot=bootWithSameStorage();
const fingerprint=await firstBoot.hash(params);
assert.match(fingerprint,/^[a-f0-9]{64}$/);
assert.notEqual(fingerprint,JSON.stringify(params));
const key1=firstBoot.key('co_1800000000000_abcdefghijklmn');
assert.match(key1,/^cld1_\d{13}_/);
firstBoot.remember(fingerprint,key1);
const stored=JSON.stringify([...data.entries()]);
assert.ok(!stored.includes('Sample Customer')&&!stored.includes('01000000000')&&!stored.includes('example-private-note'),
  'Persistent state must not contain plaintext customer data');

const reloaded=bootWithSameStorage();
assert.equal((await reloaded.hash(params)),fingerprint);
assert.equal(reloaded.read(fingerprint)?.cloudKey,key1,'Same unacknowledged logical create after reload must reuse key');

const another={...params,customerPhone:'01000000002'};
const nextFingerprint=await reloaded.hash(another);
assert.notEqual(nextFingerprint,fingerprint);
const key2=reloaded.key('co_1800000001000_abcdefghijklmno');
reloaded.remember(nextFingerprint,key2);
assert.equal(reloaded.read(fingerprint)?.cloudKey,key1,'Second unresolved order must not overwrite first');
assert.equal(reloaded.read(nextFingerprint)?.cloudKey,key2);
reloaded.clear(nextFingerprint);
assert.equal(reloaded.read(nextFingerprint),null);
assert.equal(reloaded.read(fingerprint)?.cloudKey,key1);
reloaded.clear(fingerprint);
assert.equal(reloaded.read(fingerprint),null);

const createOrderStart=app.indexOf('  async function createOrder() {');
const createOrderEnd=app.indexOf('  function wireCustomerSearch()',createOrderStart);
assert.ok(createOrderStart>0&&createOrderEnd>createOrderStart);
const form=app.slice(createOrderStart,createOrderEnd);
assert.ok(form.indexOf('if (!params.itemName)')>0,'Work description must be required');
assert.ok(!form.includes('duplicateConfirmationOrderId'),'No employee bypass of an occupied department');
assert.ok(form.includes('skippedDepartments'),'Partial multi-department create must show skipped lanes');
assert.ok(!form.includes('forceCreate: "YES"'),'Blind force create must be removed');
assert.ok(form.indexOf('loadRows(true)')<form.indexOf('const phoneForWhatsApp'),
  'Form must be finalized immediately after successful create before optional WhatsApp');
console.log('T12 browser durable idempotency: refresh + multiple pending + privacy + form control PASS');
