import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_DEPARTMENT_OVERHEAD_POLICY as owner,
 inspectOverheadDepartmentPolicy as method,
 inspectSyntheticLikeJobOverheadShare as share,
} from '../scripts/easystore_acc187_department_overhead_policy_no_go.mjs';

const job=(patch={})=>({
 department:'PRINT',workClass:'FAKE_MUG_SUBLIMATION',
 jobId:'FAKE-JOB-801',overheadPoolId:'FAKE-POOL-PRINT-OCT',
 accountingPeriodId:'FAKE-PERIOD-2026-10',
 jobAt:'2026-10-12T09:00:00.000Z',
 policyVersionId:'FAKE-POLICY-PRINT-V1',driver:'FAKE_MACHINE_MINUTES',...patch,
});
const policy=(j=job(),patch={})=>({
 source:'SYNTHETIC_INDEPENDENT_MANAGEMENT_OVERHEAD_POLICY_REGISTRY',
 verifiedManager:true,decision:'APPROVED_METHOD',
 policyId:'FAKE-DOCUMENTED-OVERHEAD-PRINT',
 policyVersionId:j.policyVersionId,
 managerApprovalRef:'FAKE-MANAGER-APPROVAL-PRINT-V1',
 documentEvidenceRef:'FAKE-OVERHEAD-POLICY-DOC-PRINT-V1',
 driverEvidenceRef:'FAKE-MACHINE-TIME-SOURCE',
 department:j.department,workClass:j.workClass,
 overheadPoolId:j.overheadPoolId,accountingPeriodId:j.accountingPeriodId,
 driver:j.driver,
 validFrom:'2026-10-01T00:00:00.000Z',validUntil:'2026-11-01T00:00:00.000Z',
 ...patch,
});
const alloc=(j=job(),patch={})=>({
 source:'SYNTHETIC_INDEPENDENT_OVERHEAD_SHARE_EVIDENCE',verified:true,
 allocationEvidenceRef:'FAKE-ALLOC-801',
 jobId:j.jobId,department:j.department,workClass:j.workClass,
 overheadPoolId:j.overheadPoolId,accountingPeriodId:j.accountingPeriodId,
 policyVersionId:j.policyVersionId,driver:j.driver,
 poolCostCents:12000,totalDriverUnits:120,jobDriverUnits:30,allocatedCents:3000,
 ...patch,
});
const checkNoGo=x=>{
 assert.equal(x.manager_approval_authentic,false);
 assert.equal(x.real_allocation_performed,false);
 assert.equal(x.waste_cost_posted,false);
 assert.equal(x.material_or_finished_goods_stock_changed,false);
 assert.equal(x.reimbursement_or_supplier_recovery_posted,false);
 assert.equal(x.manager_roles_modified,false);
 assert.equal(x.cloudflare_or_d1_accessed,false);
 assert.equal(x.release_decision,'NO_GO');
 assert.equal(x.owner_gates,'G1_G2_G3_G4_G5_OPEN');
};
test('eighth owner decision is management-chosen documented per-department consistency, not selected live rate',()=>{
 assert.equal(owner.policy,'DOCUMENTED_MANAGEMENT_CHOSEN_OVERHEAD_DRIVER_PER_DEPARTMENT');
 assert.equal(owner.consistent_application,'SAME_ACTIVE_VERSION_FOR_LIKE_JOBS_IN_PERIOD');
 assert.equal(owner.prospective_changes,'NEW_DOCUMENTED_MANAGER_APPROVAL_WITH_EFFECTIVE_DATE');
 assert.equal(owner.real_driver_and_rate_choices,'PENDING_MANAGEMENT_DOCUMENT');
 assert.equal(owner.production_overhead_allocator,'NOT_IMPLEMENTED');
 assert.equal(owner.release_decision,'NO_GO');
});
test('independent mock manager policy matches PRINT/MUG class and documented period',()=>{
 const j=job(),x=method(j,policy(j));
 assert.equal(x.status,'SYNTHETIC_DOCUMENTED_DEPARTMENT_METHOD_MATCH_NO_REAL_ALLOCATION');
 assert.equal(x.synthetic_department_method_matches,true);
 assert.equal(x.comparable_work_class,'FAKE_MUG_SUBLIMATION');
 checkNoGo(x);
});
test('two distinct similar fake print jobs share one mock policy version',()=>{
 const a=job(),b=job({jobId:'FAKE-JOB-802'});
 const p=policy(a);
 for(const j of [a,b]){
  const x=method(j,p);
  assert.equal(x.synthetic_department_method_matches,true);
  checkNoGo(x);
 }
});
test('an independent synthetic LASER method may differ from PRINT for a different department',()=>{
 const j=job({
  department:'LASER',workClass:'FAKE_ACRYLIC_ENGRAVING',
  jobId:'FAKE-JOB-LASER-100',
  overheadPoolId:'FAKE-POOL-LASER-OCT',
  policyVersionId:'FAKE-POLICY-LASER-V1',driver:'FAKE_DIRECT_LABOR_MINUTES',
 });
 const x=method(j,policy(j,{
  policyId:'FAKE-OVERHEAD-LASER',documentEvidenceRef:'FAKE-LASER-DOC',
  managerApprovalRef:'FAKE-LASER-APPROVAL',driverEvidenceRef:'FAKE-LASER-TIME-SOURCE',
 }));
 assert.equal(x.synthetic_department_method_matches,true);
 checkNoGo(x);
});
test('fake third department uses a distinct source-only example, not real policy',()=>{
 const j=job({
  department:'OTHER',workClass:'FAKE_GENERAL',
  overheadPoolId:'FAKE-POOL-OTHER',jobId:'FAKE-JOB-OTHER',
  policyVersionId:'FAKE-OTHER-V1',driver:'FAKE_GOOD_UNITS',
 });
 assert.equal(method(j,policy(j)).synthetic_department_method_matches,true);
});
for(const [name,patch,expected] of [
 ['manager not verified',{verifiedManager:false},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['manager explicitly declined',{decision:'DENIED'},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['client made',{source:'CLIENT_ASSERTED_ADMIN'},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['unknown driver',{driver:'ANYTHING_I_WANT'},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['policy document missing',{documentEvidenceRef:''},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['manager approval ref missing',{managerApprovalRef:''},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['driver basis evidence missing',{driverEvidenceRef:''},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['bad version',{policyVersionId:''},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['bad start time',{validFrom:'not-a-date'},'STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED'],
 ['wrong department',{department:'LASER'},'STOP_CROSS_DEPARTMENT_CLASS_OR_POOL_POLICY'],
 ['wrong class',{workClass:'FAKE_OTHER'},'STOP_CROSS_DEPARTMENT_CLASS_OR_POOL_POLICY'],
 ['wrong period',{accountingPeriodId:'FAKE-PERIOD-NOV'},'STOP_CROSS_DEPARTMENT_CLASS_OR_POOL_POLICY'],
 ['wrong pool',{overheadPoolId:'FAKE-SHARED-OTHER-POOL'},'STOP_CROSS_DEPARTMENT_CLASS_OR_POOL_POLICY'],
 ['other version',{policyVersionId:'FAKE-POLICY-PRINT-V2'},'STOP_INCONSISTENT_DRIVER_OR_POLICY_VERSION'],
]){
 test('invalid/changed independent policy '+name+' blocked',()=>{
  const j=job(),x=method(j,policy(j,patch));
  assert.equal(x.status,expected);
  checkNoGo(x);
 });
}
test('job driver override cannot select a different allocation method for a similar job',()=>{
 const j=job({driver:'FAKE_GOOD_UNITS'}),p=policy(job());
 const x=method(j,p);
 assert.equal(x.status,'STOP_INCONSISTENT_DRIVER_OR_POLICY_VERSION');
 checkNoGo(x);
});
test('wrong client admin assertion does not replace independent policy source',()=>{
 const j={...job(),role:'admin',approved:true,allocationMethod:'FAKE_GOOD_UNITS',managementProof:policy()};
 assert.equal(method(j).status,'STOP_NO_DOCUMENTED_DEPARTMENT_MANAGEMENT_POLICY');
});
for(const [name,patch] of [
 ['before effective date',{jobAt:'2026-09-30T23:59:59.000Z'}],
 ['after expiry',{jobAt:'2026-11-01T00:00:00.000Z'}],
]){
 test('documented effective period is mandatory: '+name,()=>{
  const j=job(patch),x=method(j,policy(job()));
  assert.equal(x.status,'STOP_OUTSIDE_REGISTERED_POLICY_EFFECTIVE_PERIOD');
  checkNoGo(x);
 });
}
test('new version may be effective prospectively after separate mock approval',()=>{
 const j=job({jobAt:'2026-11-02T10:00:00.000Z',
  policyVersionId:'FAKE-POLICY-PRINT-V2',driver:'FAKE_GOOD_UNITS'});
 const old=policy(job());
 assert.notEqual(method(j,old).status,'SYNTHETIC_DOCUMENTED_DEPARTMENT_METHOD_MATCH_NO_REAL_ALLOCATION');
 const next=policy(j,{
  policyId:'FAKE-PRINT-POLICY-V2',managerApprovalRef:'FAKE-NEW-MANAGER-APPROVAL',
  documentEvidenceRef:'FAKE-NEW-DOC',driverEvidenceRef:'FAKE-NEW-DRIVER-REASON',
  validFrom:'2026-11-01T00:00:00.000Z',validUntil:'2026-12-01T00:00:00.000Z',
 });
 assert.equal(method(j,next).synthetic_department_method_matches,true);
});
test('exact fake allocation share for documented method is source-only',()=>{
 const j=job(),x=share(j,policy(j),alloc(j));
 assert.equal(x.status,'SYNTHETIC_CONSISTENT_DEPARTMENT_SHARE_REVIEW_ONLY');
 assert.equal(x.synthetic_allocation_share_matches,true);
 assert.equal(x.hypothetical_allocated_overhead_cents,3000);
 assert.equal(x.real_allocation_method_selected,false);
 checkNoGo(x);
});
for(const [name,patch,expected] of [
 ['wrong job',{jobId:'FAKE-JOB-OTHER'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['wrong department',{department:'LASER'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['wrong work class',{workClass:'FAKE_OTHER'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['changed policy version',{policyVersionId:'FAKE-V2'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['wrong driver',{driver:'FAKE_GOOD_UNITS'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['different pool',{overheadPoolId:'FAKE-OTHER-POOL'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['different period',{accountingPeriodId:'FAKE-OTHER-PERIOD'},'STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH'],
 ['unverified',{verified:false},'STOP_ALLOCATION_NOT_INDEPENDENTLY_VERIFIED'],
 ['client allocation',{source:'CLIENT_OVERRIDDEN_RATE'},'STOP_ALLOCATION_NOT_INDEPENDENTLY_VERIFIED'],
 ['missing allocation reference',{allocationEvidenceRef:''},'STOP_ALLOCATION_NOT_INDEPENDENTLY_VERIFIED'],
 ['negative pool cost',{poolCostCents:-1},'STOP_INVALID_FAKE_ALLOCATION_UNITS_OR_POOL'],
 ['missing denominator',{totalDriverUnits:0},'STOP_INVALID_FAKE_ALLOCATION_UNITS_OR_POOL'],
 ['negative job units',{jobDriverUnits:-1},'STOP_INVALID_FAKE_ALLOCATION_UNITS_OR_POOL'],
 ['job units above period total',{jobDriverUnits:121},'STOP_INVALID_FAKE_ALLOCATION_UNITS_OR_POOL'],
 ['bad fake allocated money',{allocatedCents:3001},'STOP_FAKE_OVERHEAD_SHARE_MISMATCH'],
]){
 test('no inconsistent/unverified allocated share '+name,()=>{
  const j=job(),x=share(j,policy(j),alloc(j,patch));
  assert.equal(x.status,expected);
  checkNoGo(x);
 });
}
test('fractional-cent share requires a separate rounding rule, no silent rounding',()=>{
 const j=job(),x=share(j,policy(j),alloc(j,{
  poolCostCents:10000,totalDriverUnits:3,jobDriverUnits:1,allocatedCents:3333,
 }));
 assert.equal(x.status,'STOP_REAL_ROUNDING_RULE_NOT_DECIDED');
 checkNoGo(x);
});
test('exact BigInt intermediate multiplication does not overflow JS number silently',()=>{
 const j=job(),x=share(j,policy(j),alloc(j,{
  poolCostCents:Number.MAX_SAFE_INTEGER,totalDriverUnits:3,jobDriverUnits:3,
  allocatedCents:Number.MAX_SAFE_INTEGER,
 }));
 assert.equal(x.synthetic_allocation_share_matches,true);
 checkNoGo(x);
});
test('request for allocation without independent pool allocation proof stops',()=>{
 const j=job(),x=share(j,policy(j));
 assert.equal(x.status,'STOP_ALLOCATION_NOT_INDEPENDENTLY_VERIFIED');
 checkNoGo(x);
});
console.log('ACC187_OWNER_OVERHEAD=MANAGEMENT_DOCUMENTED_PER_DEPARTMENT_CLASS');
console.log('ACC187_SAME_COMPARABLE_JOBS=MUST_USE_SAME_EFFECTIVE_POLICY_VERSION');
console.log('ACC187_CHANGE=PROSPECTIVE_DOCUMENTED_MANAGER_APPROVAL_ONLY');
console.log('ACC187_ACTUAL_OVERHEAD_METHOD_AND_ROUNDING=NOT_SELECTED');
console.log('ACC187_REAL_FINANCE_D1_PRINTSHOP=ZERO');console.log('FINANCE_RELEASE=NO_GO');
