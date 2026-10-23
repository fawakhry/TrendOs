import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CUSTOMER_DRAFT_SEAL_VERSION_V0,
 CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,
 CUSTOMER_DRAFT_SEAL_SCOPED_READBACK_SQL_V0,
 CUSTOMER_DRAFT_SEAL_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-draft-seal-v0.mjs';
test('seal stays source-only OFF: no Worker route, no order or finance writer',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const code=readFileSync('cloudflare-d1/src/customer-portal-native-draft-seal-v0.mjs','utf8');
 assert.doesNotMatch(worker,/customer-portal-native-draft-seal-v0/);
 assert.doesNotMatch(code,/createT12GeneralOrder\s*\(|APPS_SCRIPT_API_URL|script\.google\.com|fetch\s*\(/);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.sourceOnly,true);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.httpRouteAvailable,false);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.internalAuthorizerAvailable,false);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.productionSealInsertAuthorized,false);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.t12OfficialOrderWriterCalled,false);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.r2BodyHashVerified,false);
 assert.equal(CUSTOMER_DRAFT_SEAL_POLICY_V0.productionRelease,'NO_GO');
 assert.match(CUSTOMER_DRAFT_SEAL_VERSION_V0,/SOURCE_ONLY_OFF/);
});
test('atomic single SQL insert only: exact draft authority and all R2 files READY',()=>{
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/^\s*INSERT OR IGNORE INTO customer_portal_native_draft_seals_v1/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/s\.token_fingerprint_hex=\?/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/ctl\.mode='GENERAL'/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/c\.source='cloud-native'/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/t12_prod_request_ledger/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/f\.state<>'READY'/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/ORDER BY ordinal ASC/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/ORDER BY item_id,file_id/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/GROUP BY f\.item_id HAVING COUNT\(\*\)>5/);
 assert.match(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/NOT EXISTS\(SELECT 1 FROM t12_customers other/);
 assert.doesNotMatch(CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0,/INSERT INTO t12_prod_orders|UPDATE employee_accounting|DELETE FROM t12_prod/);
 assert.match(CUSTOMER_DRAFT_SEAL_SCOPED_READBACK_SQL_V0,/s\.session_version=a\.session_version/);
});
test('original table writes blocked by 10 immutable DB triggers after seal',()=>{
 const migration=readFileSync('cloudflare-d1/migrations/0039_customer_portal_native_draft_seal_v1.sql','utf8');
 const trg=migration.match(/CREATE TRIGGER IF NOT EXISTS /g)||[];
 assert.equal(trg.length,10);
 for(const table of ['customer_portal_native_draft_items_v1','customer_portal_native_draft_files_v1',
                     'customer_portal_native_drafts_v1','customer_portal_native_draft_seals_v1'])
  assert.ok(migration.includes(table));
 assert.match(migration,/RAISE\(ABORT,'CUSTOMER_DRAFT_SEALED'\)/);
 assert.match(migration,/RAISE\(ABORT,'CUSTOMER_DRAFT_SEAL_IMMUTABLE'\)/);
 assert.doesNotMatch(migration,/DROP TABLE|DROP TRIGGER|PRAGMA writable_schema/);
});
