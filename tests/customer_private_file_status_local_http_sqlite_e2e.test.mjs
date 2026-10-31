/*
 * OFFLINE HTTP -> real disposable D1 SQLite -> original native HMAC session
 * -> owner-scoped file status. No Cloudflare Worker deploy, Google, R2, blobs,
 * real users or network listeners. Node 22 experimental sqlite only in CI.
 */
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {
  handleCustomerPrivateFileStatusStageV0,
  CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0
} from '../cloudflare-d1/customer-stage/private-file-status-ro-v0.mjs';

const TOKEN_A='ab'.repeat(32),TOKEN_B='cd'.repeat(32);
const SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const ORIGIN='https://customer.fake.test';
const DRAFT_A='CDR-'+'22'.repeat(16),ITEM_A='CDI-'+'33'.repeat(16);
const DRAFT_B='CDR-'+'44'.repeat(16),ITEM_B='CDI-'+'55'.repeat(16);
const FILE_A='CDF-'+'0'.repeat(31)+'1';
const FILE_B='CDF-'+'0'.repeat(31)+'2';
const mkUrl=(d,i,f)=>'https://test-worker.fake.test/v1/customer/native/drafts/'
  +d+'/items/'+i+'/files/'+f+'/status';
const request=(token,d=DRAFT_A,i=ITEM_A,f=FILE_A,origin=ORIGIN)=>new Request(
  mkUrl(d,i,f),{headers:{Origin:origin,Authorization:'Bearer '+token}});
let dir,disk,sqlite,db;
let baselineOrders=0;
before(()=>{
  const here=path.dirname(fileURLToPath(import.meta.url));
  dir=mkdtempSync(path.join(tmpdir(),'trendos-status-http-e2e-'));
  disk=path.join(dir,'isolated.sqlite3');
  execFileSync('python3',[path.join(here,'customer_private_file_status_http_e2e_fixture.py'),disk],
    {stdio:'pipe',timeout:20000});
  assert.equal(existsSync(disk),true);
  sqlite=new DatabaseSync(disk);
  sqlite.exec('PRAGMA foreign_keys=ON');
  db={prepare(sql){
    const stmt=sqlite.prepare(sql);
    return {bind(...parameters){
      return {async first(){return stmt.get(...parameters)??null}};
    }};
  }};
  baselineOrders=sqlite.prepare('SELECT COUNT(*) AS n FROM t12_prod_orders').get().n;
});
after(()=>{
  try{sqlite?.close();}finally{if(dir)rmSync(dir,{recursive:true,force:true});}
});
const env=(enabled='true')=>({
  DB:db,
  CORS_ORIGINS:ORIGIN,
  TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
  TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED:enabled
});
const send=async(token,d,i,f,e=env())=>{
  const response=await handleCustomerPrivateFileStatusStageV0(request(token,d,i,f),e);
  return{response,body:await response.json()};
};
test('HTTP + real D1 schema + native HMAC: C1 and C2 only view own quarantined file status',async()=>{
  const ownerA=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  assert.equal(ownerA.response.status,200);
  assert.equal(ownerA.body.status,'STORED_QUARANTINED');
  assert.equal(ownerA.body.previewAvailable,false);
  const ownerB=await send(TOKEN_B,DRAFT_B,ITEM_B,FILE_B);
  assert.equal(ownerB.response.status,200);
  assert.equal(ownerB.body.status,'STORED_QUARANTINED');
  for(const [token,d,i,f] of [
    [TOKEN_B,DRAFT_A,ITEM_A,FILE_A],
    [TOKEN_A,DRAFT_B,ITEM_B,FILE_B],
    [TOKEN_A,DRAFT_A,ITEM_B,FILE_B],
    [TOKEN_B,DRAFT_B,ITEM_A,FILE_A],
  ]){
    const denied=await send(token,d,i,f);
    assert.equal(denied.response.status,404);
    assert.equal(denied.body.previewAvailable,false);
    assert.equal(JSON.stringify(denied.body).includes(FILE_A),false);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM t12_prod_orders').get().n,
    baselineOrders);
});
test('HTTP GET returns no private image bytes, SHA, filename, object key or customer ID',async()=>{
  const {response,body}=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  const text=JSON.stringify(body);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  for(const forbidden of ['r2_object_key','sha256_hex','sha256Hex','customer-drafts/',
    FILE_A,FILE_B,'C1','C2','PRIVATE-FOLDER','http://','https://']){
    assert.equal(text.includes(forbidden),false,forbidden);
  }
  assert.equal(body.scanCompleted,false);
  assert.equal(body.printReleaseAuthorized,false);
  assert.equal(body.downloadUrlIssued,false);
  assert.equal(CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0.readsR2,false);
});
test('HTTP endpoint refuses OFF flag, untrusted CORS and unknown bearer',async()=>{
  const off=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A,env('false'));
  assert.equal(off.response.status,503);
  const hostile=await handleCustomerPrivateFileStatusStageV0(
    request(TOKEN_A,DRAFT_A,ITEM_A,FILE_A,'https://hostile.fake.test'),env());
  assert.equal(hostile.status,403);
  assert.equal(hostile.headers.get('access-control-allow-origin'),null);
  const invalid=await send('ff'.repeat(32),DRAFT_A,ITEM_A,FILE_A);
  assert.equal(invalid.response.status,401);
});
test('revocation between status polls refuses formerly-valid session',async()=>{
  const prior=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  assert.equal(prior.response.status,200);
  sqlite.prepare(
    "UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE customer_id='C1'"
  ).run(Date.now());
  const denied=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  assert.equal(denied.response.status,401);
  sqlite.prepare(
    "UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=NULL WHERE customer_id='C1'"
  ).run();
});
test('submitted draft no longer exposes even file metadata',async()=>{
  sqlite.prepare("UPDATE customer_portal_native_drafts_v1 SET state='SUBMITTED' WHERE draft_id=?")
    .run(DRAFT_A);
  const denied=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  assert.equal(denied.response.status,404);
  sqlite.prepare("UPDATE customer_portal_native_drafts_v1 SET state='DRAFT' WHERE draft_id=?")
    .run(DRAFT_A);
});
test('if quarantine schema is absent, original HTTP endpoint safely rejects rather than leaking',async()=>{
  sqlite.exec('DROP TRIGGER IF EXISTS trg_customer_native_quarantine_no_delete_v1');
  sqlite.exec('DROP TABLE customer_portal_native_file_quarantine_v1');
  const result=await send(TOKEN_A,DRAFT_A,ITEM_A,FILE_A);
  assert.equal(result.response.status,503);
  assert.equal(result.body.previewAvailable,false);
  assert.equal(result.body.printReleaseAuthorized,false);
});
