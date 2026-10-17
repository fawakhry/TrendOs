import {
  latestDesignAssetBindingsV1,
  productionAssetBindingStateV1
} from './design-asset-linking-v1.mjs';

export const DESIGN_PRODUCTION_EVIDENCE_VERSION='AUTONOMOUS_DESIGN_PRODUCTION_EVIDENCE_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

function latestBy(rows,keyFn,timeFn){
  const map=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const key=keyFn(row);
    if(!key) continue;
    const t=num(timeFn(row));
    const cur=map.get(key);
    if(!cur||t>cur.t||(t===cur.t&&text(row.id||row.approvalEventId||row.preflightRunId).localeCompare(cur.id)>0)){
      map.set(key,{row,t,id:text(row.id||row.approvalEventId||row.preflightRunId)});
    }
  }
  return map;
}

function approvalAllowsProduction(row){
  if(!row) return false;
  const gate=upper(row.approvalGate||row.approval_gate);
  const state=upper(row.approvalState||row.approval_state);
  if(gate==='REQUIRED'){
    return state==='CUSTOMER_APPROVED'||state==='OWNER_APPROVED';
  }
  if(gate==='NOT_REQUIRED_BY_POLICY'){
    return state==='POLICY_APPROVED'&&!!text(row.policyRef||row.policy_ref);
  }
  return false;
}

export function projectDesignProductionReadinessV1({
  artifacts=[],
  approvals=[],
  preflights=[],
  assetBindings=[],
  tenantId='TENANT_001',
  nowMs=Date.now()
}={}){
  const latestArtifact=latestBy(
    artifacts,
    r=>text(r.lineId||r.line_id),
    r=>r.createdAtMs??r.created_at_ms
  );
  const latestApproval=latestBy(
    approvals,
    r=>text(r.artifactId||r.artifact_id),
    r=>r.observedAtMs??r.observed_at_ms
  );
  const latestPreflight=latestBy(
    preflights,
    r=>text(r.artifactId||r.artifact_id),
    r=>r.observedAtMs??r.observed_at_ms
  );
  const latestBinding=latestDesignAssetBindingsV1(assetBindings,{tenantId});

  const out=[];
  for(const [lineId,box] of latestArtifact){
    const artifact=box.row;
    const artifactId=text(artifact.artifactId||artifact.artifact_id);
    const hash=text(artifact.contentSha256||artifact.content_sha256).toLowerCase();
    const approvalBox=latestApproval.get(artifactId);
    const preflightBox=latestPreflight.get(artifactId);
    const approval=approvalBox&&approvalBox.row||null;
    const preflight=preflightBox&&preflightBox.row||null;
    const bindingEvent=latestBinding.get(artifactId)||null;
    const binding=productionAssetBindingStateV1(bindingEvent);
    // The projected state depends on every component's latest event, not only
    // the preflight. A later rejection/removal must be newer than legacy READY.
    const sourceTimes=[
      artifact.createdAtMs??artifact.created_at_ms,
      approval&&(approval.observedAtMs??approval.observed_at_ms),
      preflight&&(preflight.observedAtMs??preflight.observed_at_ms),
      bindingEvent&&bindingEvent.observedAtMs
    ].filter(x=>x!==null&&x!==undefined);
    const sourceClockInvalid=sourceTimes.some(x=>
      !Number.isFinite(Number(x))||Number(x)<=0||Number(x)>Number(nowMs)
    );
    const observedAtMs=sourceClockInvalid
      ? Number(nowMs)
      : Math.max(0,...sourceTimes.map(Number));
    const preflightResult=upper(preflight&&(preflight.result));
    const approvalState=upper(approval&&(approval.approvalState||approval.approval_state));

    let state='UNKNOWN';
    let reason='DESIGN_EVIDENCE_INCOMPLETE';

    if(sourceClockInvalid){
      // A future-dated latest approval/binding/preflight is a blocker, never
      // READY; stamp the synthetic rejection at collector time, not the future.
      state='BLOCKED';
      reason='DESIGN_SOURCE_TIMESTAMP_INVALID';
    }else if(binding.state==='BLOCKED'){
      state='BLOCKED';
      reason=binding.reason;
    }else if(preflightResult==='FAIL'){
      state='BLOCKED';
      reason='DESIGN_PREFLIGHT_FAILED';
    }else if(approvalState==='REJECTED'){
      state='BLOCKED';
      reason='DESIGN_REJECTED';
    }else if(
      binding.available===true &&
      /^[a-f0-9]{64}$/.test(hash) &&
      preflightResult==='PASS' &&
      approvalAllowsProduction(approval)
    ){
      state='READY';
      reason='DESIGN_ASSET_LINKED_APPROVED_AND_PREFLIGHT_PASS';
    }else if(binding.available!==true){
      reason=binding.reason||'ASSET_BINDING_NOT_READY';
    }else if(!/^[a-f0-9]{64}$/.test(hash)){
      reason='DESIGN_CONTENT_HASH_INVALID';
    }else if(preflightResult!=='PASS'){
      reason='DESIGN_PREFLIGHT_NOT_PASS';
    }else if(!approvalAllowsProduction(approval)){
      reason='DESIGN_APPROVAL_NOT_QUALIFIED';
    }

    out.push({
      lineId,
      artifactId,
      contentSha256:hash,
      caseId:text(artifact.caseId||artifact.case_id),
      versionId:text(artifact.versionId||artifact.version_id),
      state,
      reason,
      approvalGate:upper(approval&&(approval.approvalGate||approval.approval_gate)),
      approvalState,
      approvalEvidenceRef:text(approval&&(approval.evidenceRef||approval.evidence_ref)),
      approvalPolicyRef:text(approval&&(approval.policyRef||approval.policy_ref)),
      assetBindingState:binding.state,
      assetBindingReason:binding.reason,
      storageProvider:text(binding.storageProvider),
      privacyClass:text(binding.privacyClass),
      preflightResult,
      preflightRunId:text(preflight&&(preflight.preflightRunId||preflight.preflight_run_id)),
      recipeId:text(preflight&&(preflight.recipeId||preflight.recipe_id)),
      sourceVersion:hash,
      observedAtMs,
      sourceClockInvalid
    });
  }
  return out;
}

export function designReadinessEvidenceCandidatesV1(input={}){
  return projectDesignProductionReadinessV1(input).flatMap(x=>{
    if(x.state==='UNKNOWN') return [];
    const preflight=(input.preflights||[]).find(r=>
      text(r.preflightRunId||r.preflight_run_id)===x.preflightRunId
    );
    // Keep the preflight identity, but use the most recent contributing
    // event's timestamp. Otherwise later rejection/removal looks stale.
    const observedAtMs=num(x.observedAtMs);
    if(!preflight||!observedAtMs) return [];
    return [{
      lineId:x.lineId,
      kind:'DESIGN',
      state:x.state,
      sourceKind:'DESIGN_PREFLIGHT',
      sourceRef:x.preflightRunId||x.artifactId,
      sourceVersion:x.sourceVersion,
      confidence:1,
      observedAtMs,
      evidence:{
        artifactId:x.artifactId,
        caseId:x.caseId,
        versionId:x.versionId,
        reason:x.reason,
        sourceClockInvalid:x.sourceClockInvalid,
        preflightResult:x.preflightResult,
        approvalGate:x.approvalGate,
        approvalState:x.approvalState,
        approvalEvidenceRef:x.approvalEvidenceRef,
        approvalPolicyRef:x.approvalPolicyRef,
        assetBindingState:x.assetBindingState,
        assetBindingReason:x.assetBindingReason,
        storageProvider:x.storageProvider,
        privacyClass:x.privacyClass,
        preflightRunId:x.preflightRunId,
        recipeId:x.recipeId
      }
    }];
  });
}
