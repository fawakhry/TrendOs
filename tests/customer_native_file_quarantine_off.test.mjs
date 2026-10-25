import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCustomerPrivateQuarantineV0,NATIVE_CUSTOMER_QUARANTINE_AUDIT_SQL_V0,
  NATIVE_CUSTOMER_QUARANTINE_POLICY_V0}
  from '../cloudflare-d1/src/customer-portal-native-file-quarantine-ro-v0.mjs';
const db=({total=1,quarantine=1,missing=0,orphan=0,throws=false}={})=>({
 prepare(sql){
  assert.equal(sql,NATIVE_CUSTOMER_QUARANTINE_AUDIT_SQL_V0);
  assert.doesNotMatch(sql,/INSERT INTO|UPDATE |DELETE FROM /);
  return {async first(){
   if(throws)throw Error('PRIVATE-DB-ERROR');
   return {totalFiles:total,quarantineRows:quarantine,
    missingOrInvalid:missing,orphanRows:orphan};
  }};
 }
});
test('complete source-only quarantine audit never claims malware clearance or T12 release',async()=>{
 const r=await auditCustomerPrivateQuarantineV0({db:db()});
 assert.equal(r.success,true);
 assert.equal(r.allFilesQuarantined,true);
 assert.equal(r.quarantinedFileCount,1);
 assert.equal(r.malwareScanComplete,false);
 assert.equal(r.printReleaseAuthorized,false);
 assert.equal(r.productionOrderCreated,false);
 assert.equal(NATIVE_CUSTOMER_QUARANTINE_POLICY_V0.httpRouteAvailable,false);
 assert.equal(NATIVE_CUSTOMER_QUARANTINE_POLICY_V0.scannerEngineConnected,false);
 assert.equal(NATIVE_CUSTOMER_QUARANTINE_POLICY_V0.officialT12HandoffAllowed,false);
});
test('orphan, mismatch, changed disposition and missing D1 block the quarantine audit',async()=>{
 for(const input of [
  {total:1,quarantine:0},{total:1,quarantine:2},
  {missing:1},{orphan:1},{total:-1},{total:1.2},{throws:true}
 ]){
  const r=await auditCustomerPrivateQuarantineV0({db:db(input)});
  assert.equal(r.success,false,JSON.stringify(input));
  assert.equal(r.printReleaseAuthorized,false);
 }
 const missing=await auditCustomerPrivateQuarantineV0();
 assert.equal(missing.success,false);
});
test('quarantine source never exposes a customer endpoint or changes live Stage/worker bindings',()=>{
 const source=readFileSync('cloudflare-d1/src/customer-portal-native-file-quarantine-ro-v0.mjs','utf8');
 const stage=readFileSync('cloudflare-d1/customer-stage/index.mjs','utf8');
 const cfg=readFileSync('cloudflare-d1/wrangler.customer-stage.toml','utf8');
 const prod=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(stage,/customer-portal-native-file-quarantine-ro-v0/);
 assert.doesNotMatch(prod,/customer-portal-native-file-quarantine-ro-v0/);
 assert.doesNotMatch(source,/createT12GeneralOrder|\.put\(|fetch\s*\(/);
 assert.ok(cfg.includes('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"'));
 assert.doesNotMatch(cfg,/\[\[r2_buckets\]\]|\[\[d1_databases\]\]/);
 const sql=readFileSync('cloudflare-d1/migrations/0040_customer_portal_native_file_quarantine_v1.sql','utf8');
 assert.match(sql,/AFTER INSERT ON customer_portal_native_draft_files_v1/);
 assert.match(sql,/CUSTOMER_FILE_QUARANTINE_IMMUTABLE/);
 assert.match(sql,/CUSTOMER_FILE_SOURCE_METADATA_IMMUTABLE/);
 assert.match(sql,/CHECK\(scan_completed=0\)/);
 assert.match(sql,/CHECK\(print_release_authorized=0\)/);
});
