/*
 * TrendOS Zero Google — four-phase, OFFLINE production cutover gate.
 * This is an evidence classifier and a rollback rehearsal, NOT a release tool.
 * It has NO fetch(), D1 binding, credential import, environment mutation,
 * deployment, customer-data access, SMS, Google, print or finance operation.
 *
 * Source owners:
 *   Customer Portal: Entry654/655/657/658/659 OFF primitives and R2 boundaries
 *   Task authority: BOOK24 preflight PR #194 (no duplicated writer logic)
 *   Deployed parity: owner Cloudflare read-only attestations (not Git flags)
 *   Rollback: owner-approved remote stage still REQUIRED, not emulated as live.
 */
import { LEGACY_CUSTOMER_PORTAL_ACTIONS_V0 } from '../../cloudflare-d1/src/customer-portal-native-readiness-v0.mjs';

export const ZERO_GOOGLE_FOUR_PHASE_VERSION='ZERO_GOOGLE_FOUR_PHASE_AUDIT_V1';

const catalog=Object.freeze({
  customerLogin:{family:'AUTH',requires:['NATIVE_IDENTITY','CUSTOMER_SESSION','OTP_GRANT']},
  customerLogout:{family:'AUTH',requires:['NATIVE_SESSION_REVOCATION']},
  changeCustomerPassword:{family:'AUTH',requires:['NATIVE_PASSWORD_CAS','REVOCATION']},
  getCustomerOrders:{family:'ORDERS',requires:['VERIFIED_ORDER_OWNERSHIP','SCOPED_D1_READ']},
  getCustomerPortalAccountsV1859:{family:'ACCOUNTS',requires:['SCOPED_CUSTOMER_ACCOUNT_READ','FINANCE_BOUNDARY']},
  createCustomerDraft:{family:'DRAFTS',requires:['CANONICAL_CUSTOMER','D1_DRAFT_CREATE']},
  addCustomerDraftItem:{family:'DRAFTS',requires:['DRAFT_OWNERSHIP','D1_ATOMIC_LINE_WRITE']},
  submitCustomerDraft:{family:'DRAFTS',requires:['EXACTLY_ONCE_SUBMISSION','FINANCE_BOUNDARY']},
  uploadCustomerDraftFile:{family:'FILES',requires:['AUTHENTICATED_R2_UPLOAD','OBJECT_ACL','DRAFT_OWNERSHIP']}
});
export const CUSTOMER_ACTION_CUTOVER_CONTRACT_V1=Object.freeze(catalog);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const sort=a=>[...a].sort();
const all=(xs,fn)=>xs.every(fn);

export function assessCustomerLegacyCutoverV1(sourceActions, proofs={}){
  const observed=Array.isArray(sourceActions)?sourceActions:[];
  const expected=Object.keys(catalog);
  const inventoryExact=observed.length===expected.length &&
    new Set(observed).size===expected.length &&
    all(expected,x=>observed.includes(x));
  const verifiedProofs=isObj(proofs)?proofs:{};
  const actions=expected.map(action=>{
    const item=catalog[action];
    const p=verifiedProofs[action];
    // A developer-supplied/locally-fabricated proof cannot certify a deployed
    // customer auth route. No browser-supplied OTP/owner indicator is trusted.
    const sourceCandidate=isObj(p) &&
      item.requires.every(req=>p[req]===true) &&
      p.syntheticOnly===true;
    return {
      action,family:item.family,missingControls:item.requires.filter(req=>!isObj(p)||p[req]!==true),
      sourceCandidate,customerRuntimeAuthorized:false,
      disposition:'LEGACY_GOOGLE_ACTIVE_UNTIL_INDEPENDENT_RUNTIME_PROOF'
    };
  });
  return {
    phase:'CUSTOMER_ACTIONS',inventoryExact,expectedCount:9,
    actionCount:observed.length,actions,
    sourceReadyForReview:inventoryExact&&all(actions,x=>x.sourceCandidate),
    customerProductionReady:false,
    googleDependencyRemoved:false,
    blockers:!inventoryExact?['CUSTOMER_ACTION_LIST_DRIFT']:
      ['NATIVE_CUSTOMER_SESSION_NOT_PROVEN','VERIFIED_ORDER_OWNERSHIP_NOT_PROVEN',
       'DRAFT_ATOMICITY_AND_R2_ACL_NOT_PROVEN','EASYSTORE_FINANCE_AUTHORITY_NOT_PROVEN',
       'CUSTOMER_LEGACY_GOOGLE_UPSTREAM_STILL_PRESENT']
  };
}

const laneNames=['WORK_QUEUE_V1','OPERATOR_TASK_V2'];
export function assessTaskSingleWriterV1(report, deployed={}){
  // Consume — don't reimplement — the already developed BOOK24 PR #194.
  const versionOk=isObj(report) &&
    report.version==='BOOK24_TASK_WRITER_CUTOVER_PREFLIGHT_V1';
  const laneExact=versionOk&&Array.isArray(report.checkedLanes)&&
    report.checkedLanes.length===2&&laneNames.every(x=>report.checkedLanes.includes(x));
  const configOnly=!!(versionOk&&laneExact&&report.configurationConsistent===true&&
    report.currentDisposition==='CONFIGURATION_ONLY_REVIEW_REQUIRED'&&
    report.activationCertified===false&&report.activationPerformed===false);
  const independentEvidence=isObj(deployed)&&deployed.source==='CLOUDFLARE_GOOGLE_READONLY_VERIFIED'&&
    deployed.bothScriptProjectsInspected===true&&
    deployed.d1VersionInspected===true&&deployed.edgeVersionInspected===true&&
    deployed.crossStoreFenceProved===true&&deployed.noConcurrentWritersObserved===true;
  // This offline procedure intentionally CANNOT grant live write authority,
  // even if an input JSON claims source=runtime verified.
  return {
    phase:'SINGLE_WRITER',pr194Referenced:true,preflightVersionRecognized:!!versionOk,
    scriptLaneInventoryExact:!!laneExact,
    configurationOnly:configOnly,independentEvidenceClaimComplete:independentEvidence,
    singleWriterProductionCertified:false,mutationsAuthorized:false,
    blockers:[
      ...(!configOnly?['BOOK24_CONFIGURATION_NOT_QUALIFIED']:[]),
      ...(!independentEvidence?['DEPLOYED_SCRIPT_EDGE_D1_FENCE_NOT_PROVEN']:[]),
      'OFFLINE_EVIDENCE_CANNOT_AUTHORIZE_TASK_WRITER',
      'CROSS_PROJECT_SCRIPTLOCK_NOT_GLOBAL_D1_MUTEX'
    ]
  };
}

const allowedWorkers=['trendos-ui','trendos-d1-api'];
const validRef=s=>typeof s==='string'&&/^[a-zA-Z0-9._:-]{8,128}$/.test(s)&&
  !/unknown|fake|test|placeholder|todo/i.test(s);
export function assessCloudflareDeployedParityV1(expected,observed){
  const ex=isObj(expected)?expected:{};
  const ob=isObj(observed)?observed:{};
  const candidates=allowedWorkers.map(name=>{
    const want=ex[name],seen=ob[name];
    const expectedDefined=isObj(want)&&validRef(want.versionId)&&validRef(want.deploymentId);
    const observedValid=isObj(seen)&&validRef(seen.versionId)&&validRef(seen.deploymentId)&&
      seen.readOnlyEvidence===true&&seen.ownerAuthorizedInventory===true&&
      seen.bundleCompared===true;
    const versionEqual=expectedDefined&&observedValid&&want.versionId===seen.versionId &&
      want.deploymentId===seen.deploymentId;
    return {worker:name,expectedDefined,observedValid,versionEqual:!!versionEqual,
      status:versionEqual?'VERSION_ID_MATCH_NOT_RUNTIME_CERTIFICATION':'UNVERIFIED_OR_DRIFT'};
  });
  const sourceIdsMatch=all(candidates,x=>x.versionEqual);
  return {phase:'DEPLOYED_PARITY',workers:candidates,
    configurationIdsMatch:sourceIdsMatch,
    currentRuntimeProved:false,
    currentGoogleDependenciesCleared:false,
    blockers:sourceIdsMatch?
      ['DEPLOYED_BUNDLE_HASH_AND_AUTH_FLOW_NEED_INDEPENDENT_ATTESTATION',
       'EFFECTIVE_FLAGS_AND_ROUTES_NOT_CERTIFIED']:
      ['CLOUDFLARE_READONLY_DEPLOYMENT_EVIDENCE_MISSING_OR_DRIFT',
       'API_UI_CURRENT_SOURCE_TO_BUNDLE_UNPROVEN'],
    // Source snapshots alone must not stand in for live Cloudflare evidence.
    productionVerified:false
  };
}

export const CUTOVER_STEPS_V1=Object.freeze([
  'CAPTURE_VERIFIED_BACKUPS','VERIFY_RESTORE_ACCESS','QUALIFY_AUTHENTICATED_STAGE',
  'CHECK_GOOGLE_D1_EXCLUSIVE_WRITER','CHECK_CUSTOMER_OWNER_FINANCE',
  'HOLD_PREVIOUS_DEPLOYMENT','CANARY_READ_ONLY','CANARY_CONTROLLED_WRITE',
  'VERIFY_NO_DUPLICATE_OR_MISSING_ORDERS','OWNER_ACTIVATION_APPROVAL'
]);

export function rehearseFailClosedRollbackV1(options={}){
  const opts=isObj(options)?options:{};
  const failureAt=typeof opts.injectFailureAt==='string'?opts.injectFailureAt:'';
  const acceptedFailure=!!failureAt&&CUTOVER_STEPS_V1.includes(failureAt);
  const executed=[];
  let haltedOn='';
  for(const step of CUTOVER_STEPS_V1){
    if(step===failureAt){haltedOn=step;break;}
    executed.push(step);
    // This is a plan trace only; even the "controlled write" step is NOT run.
  }
  const flipped=opts.claimLiveSwitch===true;
  const rollbackCommands=flipped?[
    'STOP_NEW_WRITES_AND_FENCE_DUAL_WRITERS',
    'RESTORE_PREVIOUS_VERIFIED_ROUTES_AND_DEPLOYMENTS',
    'VERIFY_D1_LEDGER_WITHOUT_REPLAYING_WRITES',
    'CHECK_CUSTOMER_SESSIONS_ORDER_OWNERSHIP_AND_FINANCE',
    'OWNER_APPROVED_RESUME_AFTER_READONLY_VALIDATION'
  ]:['LEAVE_CURRENT_GOOGLE_D1_ROUTING_UNCHANGED'];
  return {
    phase:'ROLLBACK_DRY_RUN',simulationOnly:true,executedAsPlan:executed,
    failureInjected:acceptedFailure,haltedOn,
    rollbackPlan:rollbackCommands,
    realWrites:0,networkCalls:0,deployedChanges:0,
    rollbackExecuted:false,backupsVerified:false,ownerSwitchAuthorized:false,
    productionGo:false,
    blockers:['NO_OWNER_APPROVED_STAGE_OR_BACKUP_PROOF','NO_LIVE_SINGLE_WRITER_PROOF',
      'NO_CUSTOMER_RUNTIME_OR_FINANCE_CLEARANCE','NO_DEPLOYED_SHA_PARITY']
  };
}

export function assessZeroGoogleFourPhasesV1(input={}){
  const x=isObj(input)?input:{};
  const customer=assessCustomerLegacyCutoverV1(
    x.customerActions??LEGACY_CUSTOMER_PORTAL_ACTIONS_V0,x.customerProofs);
  const writer=assessTaskSingleWriterV1(x.book24Report,x.writerRuntimeEvidence);
  const parity=assessCloudflareDeployedParityV1(x.expectedDeploy,x.observedDeploy);
  const rollback=rehearseFailClosedRollbackV1(x.rollbackScenario);
  return {
    version:ZERO_GOOGLE_FOUR_PHASE_VERSION,
    phases:[customer,writer,parity,rollback],
    distinctPhasesCompletedAsOfflineReview:4,
    customerActionsDocumented:customer.inventoryExact?9:0,
    productionRelease:'NO_GO',zeroGoogleComplete:false,
    cloudflareTouched:false,googleTouched:false,financeTouched:false,
    singleWriterActivated:false,realCustomerDataAccessed:false,
    decisionsDeferred:[
      'D01_DEPLOYED_CLOUDFLARE_READONLY_SHA_AND_EFFECTIVE_FLAGS',
      'D02_CUSTOMER_IDENTITY_OWNERSHIP_OTP_R2_FINANCE_APPROVAL',
      'D03_BOOK24_GLOBAL_SINGLE_WRITER_AND_GOOGLE_DECOMMISSION',
      'D04_ISOLATED_STAGE_BACKUPS_ROLLBACK_AND_OWNER_GO_LIVE'
    ]
  };
}
