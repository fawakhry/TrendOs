// ACC187 EIGHTH owner business decision (2026-10-12):
// MANAGEMENT chooses the documented shared production-overhead allocation
// method per department (e.g. printing / laser) according to that department's
// operations. The method must be consistently and fairly applied to SIMILAR
// production jobs. The owner did NOT select any real driver, rates, pools,
// accounting periods, formulas or employee approval mechanism.
//
// Review-only, pure JS, fake independent approval fixtures: no authenticated
// manager, real allocation, D1, inventory, finance, refund or printing operation.

export const ACC187_OWNER_DEPARTMENT_OVERHEAD_POLICY=Object.freeze({
  policy:'DOCUMENTED_MANAGEMENT_CHOSEN_OVERHEAD_DRIVER_PER_DEPARTMENT',
  selection:'PER_DEPARTMENT_AND_COMPARABLE_WORK_CLASS',
  consistent_application:'SAME_ACTIVE_VERSION_FOR_LIKE_JOBS_IN_PERIOD',
  prospective_changes:'NEW_DOCUMENTED_MANAGER_APPROVAL_WITH_EFFECTIVE_DATE',
  real_driver_and_rate_choices:'PENDING_MANAGEMENT_DOCUMENT',
  authentic_manager_verifier:'NOT_IMPLEMENTED',
  production_overhead_allocator:'NOT_IMPLEMENTED',
  financial_or_inventory_posting:false,
  release_decision:'NO_GO',
  gates:'G1_G2_G3_G4_G5_OPEN',
});
// Possible SYNTHETIC test examples only. NOT approved live production methods.
const DEMO_DRIVERS=new Set(['FAKE_MACHINE_MINUTES','FAKE_DIRECT_LABOR_MINUTES','FAKE_GOOD_UNITS']);
const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(x);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&
 !Number.isNaN(Date.parse(x))&&new Date(x).toISOString()===x;
const stop=(status,extras={})=>Object.freeze({
  status,
  synthetic_department_method_matches:false,
  synthetic_allocation_share_matches:false,
  manager_approval_authentic:false,
  real_allocation_performed:false,
  waste_cost_posted:false,
  material_or_finished_goods_stock_changed:false,
  reimbursement_or_supplier_recovery_posted:false,
  manager_roles_modified:false,
  cloudflare_or_d1_accessed:false,
  release_decision:'NO_GO',
  owner_gates:'G1_G2_G3_G4_G5_OPEN',
  ...extras,
});

/**
 * Check a separate, INVENTED administrative source record for the department
 * and work-class selection. Similar jobs must reference the SAME registered
 * allocation-policy revision, driver, rate basis and active period.
 * Actual policy document approval and manager authentication do not exist here.
 */
export function inspectOverheadDepartmentPolicy(job,independentPolicy=null){
  if(!job||typeof job!=='object'||Array.isArray(job)||
     !safeId(job.department)||!safeId(job.workClass)||
     !safeId(job.jobId)||!safeId(job.overheadPoolId)||
     !safeId(job.accountingPeriodId)||!iso(job.jobAt))
    return stop('STOP_INCOMPLETE_COMPARABLE_PRODUCTION_JOB');
  const p=independentPolicy;
  if(!p||typeof p!=='object'||Array.isArray(p))
    return stop('STOP_NO_DOCUMENTED_DEPARTMENT_MANAGEMENT_POLICY');
  if(p.source!=='SYNTHETIC_INDEPENDENT_MANAGEMENT_OVERHEAD_POLICY_REGISTRY'||
     p.verifiedManager!==true||p.decision!=='APPROVED_METHOD'||
     !safeId(p.policyId)||!safeId(p.policyVersionId)||
     !safeId(p.managerApprovalRef)||!safeId(p.documentEvidenceRef)||
     !safeId(p.driverEvidenceRef)||!DEMO_DRIVERS.has(p.driver)||
     !iso(p.validFrom)||!iso(p.validUntil)||p.validFrom>=p.validUntil)
    return stop('STOP_POLICY_APPROVAL_OR_DOCUMENT_UNVERIFIED');
  if(p.department!==job.department||p.workClass!==job.workClass||
     p.overheadPoolId!==job.overheadPoolId||
     p.accountingPeriodId!==job.accountingPeriodId)
    return stop('STOP_CROSS_DEPARTMENT_CLASS_OR_POOL_POLICY');
  if(job.jobAt<p.validFrom||job.jobAt>=p.validUntil)
    return stop('STOP_OUTSIDE_REGISTERED_POLICY_EFFECTIVE_PERIOD');
  if(job.policyVersionId!==p.policyVersionId||job.driver!==p.driver)
    return stop('STOP_INCONSISTENT_DRIVER_OR_POLICY_VERSION');
  return stop('SYNTHETIC_DOCUMENTED_DEPARTMENT_METHOD_MATCH_NO_REAL_ALLOCATION',{
    synthetic_department_method_matches:true,
    reviewed_policy_id:p.policyId,
    reviewed_policy_version:p.policyVersionId,
    hypothetical_driver:p.driver,
    department:p.department,
    comparable_work_class:p.workClass,
    accounting_period:p.accountingPeriodId,
  });
}

/**
 * Pure check of a fabricated allocation from a demo pool. This is ONLY a
 * consistency/duplicate-protection rehearsal; exact real driver, cost pool,
 * historical source data and rounding rules are NOT approved or implemented.
 * We refuse fractional cents rather than invent a production rounding policy.
 */
export function inspectSyntheticLikeJobOverheadShare(job,policy=null,allocation=null){
  const m=inspectOverheadDepartmentPolicy(job,policy);
  if(!m.synthetic_department_method_matches)return m;
  const a=allocation;
  if(!a||typeof a!=='object'||Array.isArray(a)||
     a.source!=='SYNTHETIC_INDEPENDENT_OVERHEAD_SHARE_EVIDENCE'||
     a.verified!==true||!safeId(a.allocationEvidenceRef))
    return stop('STOP_ALLOCATION_NOT_INDEPENDENTLY_VERIFIED');
  for(const k of ['jobId','department','workClass','overheadPoolId',
                  'accountingPeriodId','policyVersionId','driver']){
    if(a[k]!==job[k])return stop('STOP_ALLOCATION_JOB_OR_POLICY_BINDING_MISMATCH');
  }
  if(!int(a.poolCostCents)||!int(a.totalDriverUnits)||a.totalDriverUnits===0||
     !int(a.jobDriverUnits)||a.jobDriverUnits===0||
     a.jobDriverUnits>a.totalDriverUnits||!int(a.allocatedCents))
    return stop('STOP_INVALID_FAKE_ALLOCATION_UNITS_OR_POOL');
  // BigInt avoids JS number multiplication overflow; exact division ONLY.
  const numerator=BigInt(a.poolCostCents)*BigInt(a.jobDriverUnits);
  const denominator=BigInt(a.totalDriverUnits);
  if(numerator%denominator!==0n)
    return stop('STOP_REAL_ROUNDING_RULE_NOT_DECIDED');
  const exact=numerator/denominator;
  if(exact>BigInt(Number.MAX_SAFE_INTEGER)||exact!==BigInt(a.allocatedCents))
    return stop('STOP_FAKE_OVERHEAD_SHARE_MISMATCH');
  return stop('SYNTHETIC_CONSISTENT_DEPARTMENT_SHARE_REVIEW_ONLY',{
    synthetic_department_method_matches:true,
    synthetic_allocation_share_matches:true,
    reviewed_policy_version:policy.policyVersionId,
    hypothetical_allocated_overhead_cents:Number(exact),
    hypothetical_driver:policy.driver,
    comparable_work_class:policy.workClass,
    real_allocation_method_selected:false,
  });
}
