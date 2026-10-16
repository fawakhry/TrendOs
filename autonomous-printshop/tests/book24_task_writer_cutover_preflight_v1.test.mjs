import test from 'node:test';
import assert from 'node:assert/strict';
import {qualifyBook24TaskWriterHandoffV1 as qualify} from '../core/book24-task-writer-cutover-preflight-v1.mjs';

const script=(lane,owner='D1',overrides={})=>({
  lane,projectFingerprint:'same-proj-0123456789',
  guardDeployed:true,guardEnabled:true,selectedOwner:owner,
  codeVersionVerified:true,lockNamespaceVerified:true,activeTaskCount:0,
  ...overrides
});
const make=(owner='D1')=>({
  inventoryComplete:true,readonlyEvidenceAttested:true,
  ownerApprovalForHandoff:true,selectedOwner:owner,
  scriptLanes:[script('WORK_QUEUE_V1',owner),script('OPERATOR_TASK_V2',owner)],
  d1:{mode:owner==='D1'?'CANARY':'OFF',controlModeVerified:true,
    activeTaskCount:0,codeVersionVerified:true},
  edge:{enabled:false,codeVersionVerified:true,d1ConflictGuardDeployed:true,d1ConflictGuardEnabled:true}
});
const has=(o,b)=>assert.ok(o.blockers.includes(b),JSON.stringify(o.blockers));
test('BOOK24 cutover: synthetic consistent snapshot is CONFIGURATION_ONLY, NEVER production certified',()=>{
  const o=qualify(make());
  assert.equal(o.configurationConsistent,true);
  assert.equal(o.currentDisposition,'CONFIGURATION_ONLY_REVIEW_REQUIRED');
  assert.equal(o.activationCertified,false);
  assert.equal(o.activationPerformed,false);
  assert.equal(o.productionVerified,false);
});
test('BOOK24 cutover: missing inventory/owner approval/read-only evidence fails closed',()=>{
  const x=make();x.inventoryComplete=false;x.ownerApprovalForHandoff=false;x.readonlyEvidenceAttested=false;
  const o=qualify(x);
  ['WRITER_DEPLOYMENT_INVENTORY_INCOMPLETE','OWNER_HANDOFF_APPROVAL_MISSING','DEPLOYED_READONLY_EVIDENCE_MISSING'].forEach(b=>has(o,b));
  assert.equal(o.configurationConsistent,false);
});
test('BOOK24 cutover: two distinct Google script project fingerprints are NOT one script lock',()=>{
  const x=make('WORK_QUEUE_V1');
  x.scriptLanes[1].projectFingerprint='different-proj-0123456789';
  const o=qualify(x);has(o,'SCRIPT_LOCK_NAMESPACE_SPLIT');
});
test('BOOK24 cutover: missing, duplicated and unrecognized script lane inventory rejected',()=>{
  for(const scriptLanes of [[],[script('WORK_QUEUE_V1')],[script('WORK_QUEUE_V1'),script('WORK_QUEUE_V1')]]){
    has(qualify({...make(),scriptLanes}),'SCRIPT_LANE_INVENTORY_NOT_EXACT');
  }
});
test('BOOK24 cutover: placeholders and empty project fingerprints are not deployment proof',()=>{
  for(const fingerprint of ['','UNKNOWN','TODO_PROJECT','FAKE_PROJECT_A','EXAMPLE-ID']){
    const x=make();x.scriptLanes[0].projectFingerprint=fingerprint;
    has(qualify(x),'SCRIPT_PROJECT_FINGERPRINT_MISSING');
  }
});
test('BOOK24 cutover: mismatched script owner selection blocks both-authority plan',()=>{
  const x=make();x.scriptLanes[0].selectedOwner='WORK_QUEUE_V1';
  has(qualify(x),'SCRIPT_OWNER_SELECTION_MISMATCH');
});
test('BOOK24 cutover: enabled false or new guard not deployed are independent blockers',()=>{
  const x=make();x.scriptLanes[1].guardEnabled=false;x.scriptLanes[0].guardDeployed=false;
  const o=qualify(x);
  has(o,'SCRIPT_WRITER_GUARD_NOT_ENABLED');
  has(o,'SCRIPT_WRITER_GUARD_NOT_DEPLOYED');
});
test('BOOK24 cutover: missing source/lock parity blocks otherwise consistent config',()=>{
  const x=make();x.scriptLanes[0].codeVersionVerified=false;x.scriptLanes[1].lockNamespaceVerified=false;
  const o=qualify(x);
  has(o,'SCRIPT_CODE_VERSION_UNVERIFIED');
  has(o,'SCRIPT_LOCK_NAMESPACE_UNVERIFIED');
});
test('BOOK24 cutover: active tasks in either legacy lane or D1 block handoff',()=>{
  const x=make();x.scriptLanes[1].activeTaskCount=1;x.d1.activeTaskCount=2;
  const o=qualify(x);
  has(o,'SCRIPT_ACTIVE_TASKS_PRESENT');has(o,'D1_ACTIVE_TASKS_PRESENT');
});
test('BOOK24 cutover: unknown active-task count cannot be considered zero',()=>{
  const x=make();x.scriptLanes[0].activeTaskCount='0';x.d1.activeTaskCount=null;
  const o=qualify(x);
  has(o,'SCRIPT_ACTIVE_TASK_COUNT_UNKNOWN');has(o,'D1_ACTIVE_TASK_COUNT_UNKNOWN');
});
test('BOOK24 cutover: D1 OFF with D1 selected and GENERAL with Google selected block',()=>{
  let x=make('D1');x.d1.mode='OFF';has(qualify(x),'D1_NOT_ENABLED_FOR_SELECTED_WRITER');
  x=make('WORK_QUEUE_V1');x.d1.mode='GENERAL';has(qualify(x),'D1_STILL_WRITABLE_DURING_GOOGLE_AUTHORITY');
});
test('BOOK24 cutover: D1 unknown mode and missing control proof fail closed',()=>{
  const x=make();x.d1.mode='UNKNOWN';x.d1.controlModeVerified=false;
  const o=qualify(x);has(o,'D1_CONTROL_MODE_INVALID');has(o,'D1_CONTROL_MODE_NOT_VERIFIED');
});
test('BOOK24 cutover: D1 CANARY and enabled Edge require deployed and enabled conflict fence',()=>{
  const x=make('D1');x.edge.enabled=true;x.edge.d1ConflictGuardEnabled=false;
  has(qualify(x),'EDGE_D1_WRITER_FENCE_NOT_CONFIRMED');
});
test('BOOK24 cutover: enabled Edge routes conflict with Work Queue as selected writer',()=>{
  const x=make('WORK_QUEUE_V1');x.edge.enabled=true;
  has(qualify(x),'EDGE_OPERATOR_PROXY_LANE_CONFLICT');
});
test('BOOK24 cutover: Operator V2 owner with D1 OFF and Edge enabled is configuration consistent',()=>{
  const x=make('OPERATOR_TASK_V2');x.edge.enabled=true;
  const o=qualify(x);
  assert.equal(o.configurationConsistent,true);
  assert.equal(o.productionVerified,false);
});
test('BOOK24 cutover: blank Edge enablement and unverified code fail closed',()=>{
  const x=make();x.edge.enabled='';x.d1.codeVersionVerified=false;
  const o=qualify(x);has(o,'EDGE_FLAG_UNKNOWN');has(o,'D1_TASK_GUARD_VERSION_UNVERIFIED');
});
test('BOOK24 cutover: NONE and unexpected writer names cannot be approved',()=>{
  for(const owner of ['NONE','', 'BOTH','GOOGLE,D1']){
    has(qualify({...make(),selectedOwner:owner}),'SELECTED_TASK_WRITER_INVALID_OR_NONE');
  }
});
test('BOOK24 cutover: no client or customer identifiers returned by evaluator',()=>{
  const x=make();x.customerEmail='PII@EXAMPLE.INVALID';x.scriptLanes[0].authToken='SECRET_DO_NOT_EXPORT';
  const out=qualify(x);
  const printed=JSON.stringify(out);
  assert.doesNotMatch(printed,/PII@EXAMPLE|SECRET_DO_NOT_EXPORT|same-proj-0123456789/);
});
test('BOOK24 cutover: malformed/non-object input produces BLOCKED, never throws or certifies',()=>{
  for(const x of [undefined,null,[],{},'text',25]){
    const out=qualify(x);
    assert.equal(out.currentDisposition,'BLOCKED');
    assert.equal(out.activationCertified,false);
  }
});
