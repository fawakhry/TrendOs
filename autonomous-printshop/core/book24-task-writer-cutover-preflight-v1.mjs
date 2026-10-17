/*
 * BOOK24-TASK-AUTHORITY: OFFLINE cross-deployment cutover qualification.
 * Pure computation only: no Google/Cloudflare/D1 calls, no write, no secrets.
 * "configurationConsistent" is NOT an operational deployment certificate.
 */
export const BOOK24_TASK_CUTOVER_PREFLIGHT_VERSION='BOOK24_TASK_WRITER_CUTOVER_PREFLIGHT_V1';
const LANES=['WORK_QUEUE_V1','OPERATOR_TASK_V2'];
const VALID_OWNERS=['WORK_QUEUE_V1','OPERATOR_TASK_V2','D1','NONE'];
const safe=(x)=>String(x==null?'':x).trim();
const up=(x)=>safe(x).toUpperCase();
const on=(x)=>x===true;
function nonNegInt(v){return Number.isSafeInteger(v)&&v>=0;}
function validFingerprint(s){
  // Fingerprint is a non-secret, manually redacted deployment reference.
  // Never accept UNKNOWN/TODO placeholders as deployment evidence.
  return /^[A-Za-z0-9_.:-]{8,96}$/.test(s)&&!/UNKNOWN|TODO|EXAMPLE|REPLACE|PLACEHOLDER|FAKE/i.test(s);
}

export function qualifyBook24TaskWriterHandoffV1(input={}){
  const blockers=[];
  const add=(code)=>{if(!blockers.includes(code))blockers.push(code);};
  const snapshot=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const projects=Array.isArray(snapshot.scriptLanes)?snapshot.scriptLanes:[];
  const declaredOwner=up(snapshot.selectedOwner);
  const d1=snapshot.d1&&typeof snapshot.d1==='object'?snapshot.d1:{};
  const edge=snapshot.edge&&typeof snapshot.edge==='object'?snapshot.edge:{};
  if(snapshot.inventoryComplete!==true)add('WRITER_DEPLOYMENT_INVENTORY_INCOMPLETE');
  if(snapshot.readonlyEvidenceAttested!==true)add('DEPLOYED_READONLY_EVIDENCE_MISSING');
  if(snapshot.ownerApprovalForHandoff!==true)add('OWNER_HANDOFF_APPROVAL_MISSING');
  if(!VALID_OWNERS.includes(declaredOwner)||declaredOwner==='NONE')
    add('SELECTED_TASK_WRITER_INVALID_OR_NONE');
  // A count of two UNIQUE lane names is not proof that the two REQUIRED
  // writers were inventoried. Unknown names previously skipped both loops
  // and could incorrectly return configurationConsistent=true.
  const laneIds=projects.map(x=>up(x&&x.lane));
  if(projects.length!==LANES.length ||
     LANES.some(lane=>laneIds.filter(id=>id===lane).length!==1) ||
     laneIds.some(id=>!LANES.includes(id)))
    add('SCRIPT_LANE_INVENTORY_NOT_EXACT');
  const shared=[];
  for(const lane of LANES){
    const found=projects.filter(p=>up(p&&p.lane)===lane);
    if(found.length!==1)continue;
    const item=found[0];
    const ref=safe(item.projectFingerprint);
    if(!validFingerprint(ref))add('SCRIPT_PROJECT_FINGERPRINT_MISSING');
    else shared.push(ref);
    if(item.guardDeployed!==true)add('SCRIPT_WRITER_GUARD_NOT_DEPLOYED');
    if(item.guardEnabled!==true)add('SCRIPT_WRITER_GUARD_NOT_ENABLED');
    if(up(item.selectedOwner)!==declaredOwner)add('SCRIPT_OWNER_SELECTION_MISMATCH');
    if(item.codeVersionVerified!==true)add('SCRIPT_CODE_VERSION_UNVERIFIED');
    if(!nonNegInt(item.activeTaskCount))add('SCRIPT_ACTIVE_TASK_COUNT_UNKNOWN');
    else if(item.activeTaskCount>0)add('SCRIPT_ACTIVE_TASKS_PRESENT');
    if(item.lockNamespaceVerified!==true)add('SCRIPT_LOCK_NAMESPACE_UNVERIFIED');
  }
  if(shared.length===LANES.length&&shared[0]!==shared[1])
    add('SCRIPT_LOCK_NAMESPACE_SPLIT');
  const d1Mode=up(d1.mode);
  if(d1.controlModeVerified!==true)add('D1_CONTROL_MODE_NOT_VERIFIED');
  if(!['OFF','SHADOW','CANARY','GENERAL'].includes(d1Mode))
    add('D1_CONTROL_MODE_INVALID');
  if(!nonNegInt(d1.activeTaskCount))add('D1_ACTIVE_TASK_COUNT_UNKNOWN');
  else if(d1.activeTaskCount>0)add('D1_ACTIVE_TASKS_PRESENT');
  if(d1.codeVersionVerified!==true)add('D1_TASK_GUARD_VERSION_UNVERIFIED');
  if(declaredOwner==='D1'){
    if(!['CANARY','GENERAL'].includes(d1Mode))add('D1_NOT_ENABLED_FOR_SELECTED_WRITER');
  } else if(declaredOwner==='WORK_QUEUE_V1'||declaredOwner==='OPERATOR_TASK_V2'){
    if(!['OFF','SHADOW'].includes(d1Mode))add('D1_STILL_WRITABLE_DURING_GOOGLE_AUTHORITY');
  }
  if(edge.enabled!==true&&edge.enabled!==false)add('EDGE_FLAG_UNKNOWN');
  if(edge.enabled===true){
    if(edge.codeVersionVerified!==true)add('EDGE_DEPLOYED_VERSION_UNVERIFIED');
    if(declaredOwner==='D1'&&(edge.d1ConflictGuardDeployed!==true||edge.d1ConflictGuardEnabled!==true))
      add('EDGE_D1_WRITER_FENCE_NOT_CONFIRMED');
    if(declaredOwner==='WORK_QUEUE_V1')add('EDGE_OPERATOR_PROXY_LANE_CONFLICT');
  }
  // An offline report CANNOT attest live writer exclusivity. Even a
  // configuration-consistent manifest requires independent deployed checks.
  return {
    version:BOOK24_TASK_CUTOVER_PREFLIGHT_VERSION,
    selectedOwner:VALID_OWNERS.includes(declaredOwner)?declaredOwner:'UNKNOWN',
    configurationConsistent:blockers.length===0,
    currentDisposition:blockers.length?'BLOCKED':'CONFIGURATION_ONLY_REVIEW_REQUIRED',
    activationCertified:false,
    activationPerformed:false,
    productionVerified:false,
    blockers,
    checkedLanes:LANES,
    warnings:[
      'OFFLINE_MANIFEST_NOT_LIVE_RUNTIME_PROOF',
      'SCRIPT_LOCK_CANNOT_FENCE_SEPARATE_SCRIPT_PROJECTS',
      'CROSS_STORE_GOOGLE_D1_MUTUAL_EXCLUSION_UNVERIFIED',
      'REAL_DEPLOYMENT_OWNER_SIGNOFF_AND_EPOCH_RECHECK_REQUIRED'
    ]
  };
}
