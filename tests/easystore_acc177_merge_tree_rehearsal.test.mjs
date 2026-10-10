import assert from 'node:assert/strict';
import fs from 'node:fs';
import {acc177Receipt,acc177BlockedReceipt,allowedOverlap} from '../scripts/acc177_finance_worker_merged_tree_receipt.mjs';
const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const arg={
 accountingSha:'a'.repeat(40),
 sharedSha:'b'.repeat(40),
 mergedTreeSha:'c'.repeat(40),
 overlap:[],
 accountingSource:source,
 mergedSource:source
};
const go=(p={})=>acc177Receipt({...arg,...p});
const r=go();
assert.equal(r.release_decision,'NO_GO');
assert.equal(r.production_deploy_executed,false);
assert.equal(r.immutable_release_pin_approved,false);
assert.equal(r.independent_database_backup_and_restore_verified,false);
assert.equal(r.production_version_rollback_drill_verified,false);
assert.equal(r.checks.source_and_merged_sql_repairs_present,true);
assert.equal(r.accounting_worker_bytes_changed_by_merge,false);
assert.deepEqual(go({overlap:allowedOverlap}).approved_overlap_paths,allowedOverlap);
for(const v of [null,'x'.repeat(40),'SHA'])assert.throws(()=>go({sharedSha:v}),/SHA_PIN_INVALID/);
assert.throws(()=>go({mergedTreeSha:'f'.repeat(41)}),/SHA_PIN_INVALID/);
assert.throws(()=>go({overlap:['cloudflare-d1/src/index_v2.js']}),/CODE_OVERLAP/);
assert.throws(()=>go({overlap:['cloudflare-d1/src/employee-accounting-native-v1.mjs']}),/CODE_OVERLAP/);
assert.throws(()=>go({overlap:[...allowedOverlap,'cloudflare-d1/wrangler.toml']}),/CODE_OVERLAP/);
assert.throws(()=>go({overlap:[42]}),/OVERLAP_INVALID/);
assert.throws(()=>go({accountingSource:source.replace("'payment_paid',?,?,-1","'payment_paid',?,-1")}),/SQL_OR_VERIFIED_GRANTS/);
assert.throws(()=>go({mergedSource:source.replace("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)","VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)")}),/SQL_OR_VERIFIED_GRANTS/);
assert.throws(()=>go({mergedSource:source.replace('function approvedAccountingModeV1(env,verifiedUsername,user)','function missingGrants()')}),/SQL_OR_VERIFIED_GRANTS/);
assert.equal(go({mergedSource:source+'\n// SAFE LOCAL DIFFERENCE'}).accounting_worker_bytes_changed_by_merge,true);
assert.equal(go({mergedSource:source+'\n// SAFE LOCAL DIFFERENCE'}).release_decision,'NO_GO');
const blocked=acc177BlockedReceipt({
 accountingSha:arg.accountingSha,
 sharedSha:arg.sharedSha,
 overlap:['TrendOS_MASTER_BOOK.md'],
 accountingSource:source,
 sharedSource:source
});
assert.equal(blocked.existing_legacy_deploy_guard,'BLOCKED_BY_UNAPPROVED_OVERLAP');
assert.equal(blocked.release_decision,'NO_GO');
assert.equal(blocked.merged_tree_created,false);
assert.equal(blocked.integrated_merged_tree_tests_executed,false);
assert.deepEqual(blocked.exact_unsafe_overlap_paths,['TrendOS_MASTER_BOOK.md']);
assert.throws(()=>acc177BlockedReceipt({
 accountingSha:arg.accountingSha,sharedSha:arg.sharedSha,overlap:[],accountingSource:source,sharedSource:source
}),/NO_UNAPPROVED_OVERLAP/);
console.log('ACC177_CONFLICTED_BOOK_FAIL_CLOSED_WITHOUT_FAKE_MERGED_TREE=PASS');
console.log('ACC177_MANIFEST_EXACT_COMMIT_AND_TREE_VALIDATION=PASS');
console.log('ACC177_UNAPPROVED_SHARED_SOURCE_OVERLAP_REJECTED=PASS');
console.log('ACC177_SUPPLIER_CUSTODY_SQL_AND_ROSTER_REGRESSIONS_REJECTED=PASS');
console.log('ACC177_UNCHANGED_OR_CHANGED_WORKER_NEVER_AUTO_APPROVES_DEPLOY=PASS');
console.log('ACC177_PRODUCTION_DEPLOY=NOT_EXECUTED');
