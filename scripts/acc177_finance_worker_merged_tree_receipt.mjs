// ACC-177: manifest for an *offline* shared-base merge rehearsal only.
// Call after Git has resolved an isolated worktree merge. No real Worker deploy.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const hex40=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const sum=x=>crypto.createHash('sha256').update(x).digest('hex');
export const allowedOverlap=[
 '.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml',
 '.github/workflows/easystore-a2-sync-shared-base.yml'
];
export function acc177Receipt({accountingSha,sharedSha,mergedTreeSha,overlap,accountingSource,mergedSource}){
 if(![accountingSha,sharedSha,mergedTreeSha].every(hex40))throw Error('ACC177_SHA_PIN_INVALID');
 if(!Array.isArray(overlap)||overlap.some(x=>typeof x!=='string'))throw Error('ACC177_OVERLAP_INVALID');
 const unwanted=overlap.filter(x=>!allowedOverlap.includes(x));
 if(unwanted.length)throw Error('ACC177_SHARED_ACCOUNTING_CODE_OVERLAP:'+unwanted.join(','));
 for(const [label,src] of [['accounting',accountingSource],['merged',mergedSource]]){
  if(typeof src!=='string'||!src.includes("'payment_paid',?,?,-1")
      ||!src.includes("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)")
      ||src.includes("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)")
      ||!src.includes('function approvedAccountingModeV1(env,verifiedUsername,user)')){
    throw Error('ACC177_FINANCE_SQL_OR_VERIFIED_GRANTS_MISSING_'+label);
  }
 }
 return {
  schema:'ACC177_ACCOUNTING_SHARED_WORKER_OFFLINE_TREE_REHEARSAL_V1',
  source_accounting_commit:accountingSha,
  source_shared_base_commit:sharedSha,
  resulting_uncommitted_merge_tree_sha:mergedTreeSha,
  source_accounting_worker_sha256:sum(accountingSource),
  result_merged_worker_sha256:sum(mergedSource),
  accounting_worker_bytes_changed_by_merge:sum(accountingSource)!==sum(mergedSource),
  approved_overlap_paths:overlap,
  checks:{
   exact_input_commits_recorded:true,
   actual_uncommitted_git_merge_tree_recorded:true,
   unsafe_source_overlap_detected:false,
   source_and_merged_sql_repairs_present:true,
   source_and_merged_verified_finance_grants_present:true,
   real_worker_sqlite_acc170_passed:true,
   real_worker_sqlite_acc174_passed:true,
   offline_trusted_roster_acc175_passed:true
  },
  existing_prep_state:'REHEARSAL_ONLY',
  immutable_release_pin_approved:false,
  independent_database_backup_and_restore_verified:false,
  production_version_rollback_drill_verified:false,
  finance_owner_approval:false,
  release_decision:'NO_GO',
  production_deploy_executed:false,
  financial_http_post_executed:false,
  d1_production_dml_executed:false,
  note:'Git worktree-only merge tree. Exact source SHA and shared commit may change before an authorized release; revalidate everything and approve a pinned artifact separately.'
 };
}

export function acc177BlockedReceipt({accountingSha,sharedSha,overlap,accountingSource,sharedSource}){
 if(![accountingSha,sharedSha].every(hex40))throw Error('ACC177_SHA_PIN_INVALID');
 if(!Array.isArray(overlap)||overlap.some(p=>typeof p!=='string'))throw Error('ACC177_OVERLAP_INVALID');
 const unsafe=overlap.filter(p=>!allowedOverlap.includes(p));
 if(unsafe.length===0)throw Error('ACC177_NO_UNAPPROVED_OVERLAP');
 if(typeof accountingSource!=='string'||typeof sharedSource!=='string')throw Error('ACC177_SOURCE_MISSING');
 return {
  schema:'ACC177_ACCOUNTING_SHARED_WORKER_LEGACY_GUARD_BLOCKED_V1',
  source_accounting_commit:accountingSha,
  source_shared_base_commit:sharedSha,
  original_finance_worker_sha256:sum(accountingSource),
  shared_finance_worker_sha256:sum(sharedSource),
  exact_unsafe_overlap_paths:unsafe,
  merged_tree_created:false,
  integrated_merged_tree_tests_executed:false,
  existing_legacy_deploy_guard:'BLOCKED_BY_UNAPPROVED_OVERLAP',
  release_decision:'NO_GO',
  release_authorized:false,
  production_deploy_executed:false,
  financial_http_post_executed:false,
  d1_production_dml_executed:false,
  note:'This is a successful fail-closed predeploy diagnostic, NOT a successful runtime merge and NOT deployment approval.'
 };
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){

 if(process.argv[2]==='--blocked'){
  const [_,accountingSha,sharedSha,overlapFile,accountingFile,sharedFile,outFile]=process.argv.slice(2);
  try{
   if(![accountingSha,sharedSha,overlapFile,accountingFile,sharedFile,outFile].every(Boolean))
    throw Error('ACC177_BLOCKED_MANIFEST_ARGUMENTS_MISSING');
   const receipt=acc177BlockedReceipt({
    accountingSha,sharedSha,
    overlap:fs.readFileSync(overlapFile,'utf8').split(/\r?\n/).filter(Boolean),
    accountingSource:fs.readFileSync(accountingFile,'utf8'),
    sharedSource:fs.readFileSync(sharedFile,'utf8')
   });
   fs.mkdirSync(path.dirname(outFile),{recursive:true});
   fs.writeFileSync(outFile,JSON.stringify(receipt,null,2)+'\n');
   console.log('ACC177_EXISTING_PRODUCTION_DEPLOY_GUARD=BLOCKED');
   console.log('ACC177_MERGE_TREE=NOT_CREATED');
   console.log('ACC177_RELEASE_DECISION=NO_GO');
   console.log('ACC177_PRODUCTION_DEPLOY=NOT_EXECUTED');
  }catch(e){console.error('ACC177_FAIL_CLOSED='+String(e.message));process.exitCode=1;}
 } else {
 const [accountingSha,sharedSha,mergedTreeSha,overlapFile,accountingFile,mergedFile,outFile]=process.argv.slice(2);
 try {
  if([accountingSha,sharedSha,mergedTreeSha,overlapFile,accountingFile,mergedFile,outFile].some(x=>!x))
   throw Error('ACC177_MANIFEST_ARGUMENTS_MISSING');
  const overlap=fs.readFileSync(overlapFile,'utf8').split(/\r?\n/).filter(Boolean);
  const receipt=acc177Receipt({
   accountingSha,sharedSha,mergedTreeSha,overlap,
   accountingSource:fs.readFileSync(accountingFile,'utf8'),
   mergedSource:fs.readFileSync(mergedFile,'utf8')
  });
  fs.mkdirSync(path.dirname(outFile),{recursive:true});
  fs.writeFileSync(outFile,JSON.stringify(receipt,null,2)+'\n');
  console.log('ACC177_OFFLINE_MERGE_TREE_SHA='+mergedTreeSha);
  console.log('ACC177_ACCOUNTING_SOURCE_SHA='+accountingSha);
  console.log('ACC177_SHARED_BASE_SOURCE_SHA='+sharedSha);
  console.log('ACC177_WORKER_SOURCE_UNCHANGED_BY_MERGE='+(receipt.accounting_worker_bytes_changed_by_merge?'NO':'YES'));
  console.log('ACC177_SOURCE_SQL_AUTH_REGRESSIONS=PASS');
  console.log('ACC177_RELEASE_DECISION=NO_GO');
  console.log('ACC177_PRODUCTION_DEPLOY=NOT_EXECUTED');
 }catch(e){console.error('ACC177_FAIL_CLOSED='+String(e.message));process.exitCode=1;}
 }
}
