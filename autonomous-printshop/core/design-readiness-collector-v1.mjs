import { designReadinessEvidenceCandidatesV1 } from './design-production-evidence-v1.mjs';
import { recordReadinessEvidenceV1 } from './readiness-evidence-writer-v1.mjs';

function text(v){return String(v==null?'':v).trim();}

export async function designReadinessSchemaStateV1(db){
  if(!db||typeof db.prepare!=='function') throw new Error('DESIGN_READINESS_DB_REQUIRED');

  const row=await db.prepare(`
    SELECT COUNT(*) AS tableCount
      FROM sqlite_master
     WHERE type='table'
       AND name IN (
         'autonomous_design_control',
         'autonomous_design_artifacts',
         'autonomous_design_approval_events',
         'autonomous_design_preflight_runs',
         'autonomous_design_asset_binding_events'
       )
  `).first();

  const tableCount=Number(row&&row.tableCount||0);
  if(tableCount!==5){
    return {
      ready:false,
      tableCount,
      mode:'ABSENT'
    };
  }

  const control=await db.prepare(`
    SELECT mode
      FROM autonomous_design_control
     WHERE singleton_id=1
     LIMIT 1
  `).first();

  return {
    ready:true,
    tableCount,
    mode:text(control&&control.mode)||'ABSENT'
  };
}

export async function collectDesignReadinessEvidenceV1(db,options={}){
  if(!db||typeof db.prepare!=='function') throw new Error('DESIGN_READINESS_DB_REQUIRED');

  const schema=await designReadinessSchemaStateV1(db);
  if(!schema.ready){
    return {
      success:true,
      skipped:true,
      reason:'DESIGN_EVIDENCE_SCHEMA_NOT_READY',
      tableCount:schema.tableCount,
      designMode:schema.mode,
      candidates:0,
      inserted:0,
      duplicates:0
    };
  }
  if(schema.mode!=='SHADOW'){
    return {
      success:true,
      skipped:true,
      reason:'DESIGN_CONTROL_NOT_SHADOW',
      tableCount:schema.tableCount,
      designMode:schema.mode,
      candidates:0,
      inserted:0,
      duplicates:0
    };
  }

  const [artifactsResult,approvalsResult,preflightsResult,bindingsResult]=await Promise.all([
    db.prepare(`
      SELECT artifact_id AS artifactId,
             line_id AS lineId,
             case_id AS caseId,
             version_id AS versionId,
             content_sha256 AS contentSha256,
             created_at_ms AS createdAtMs
        FROM autonomous_design_artifacts
       ORDER BY created_at_ms
    `).all(),
    db.prepare(`
      SELECT approval_event_id AS approvalEventId,
             artifact_id AS artifactId,
             line_id AS lineId,
             approval_gate AS approvalGate,
             approval_state AS approvalState,
             evidence_ref AS evidenceRef,
             policy_ref AS policyRef,
             actor_kind AS actorKind,
             observed_at_ms AS observedAtMs
        FROM autonomous_design_approval_events
       ORDER BY observed_at_ms
    `).all(),
    db.prepare(`
      SELECT preflight_run_id AS preflightRunId,
             artifact_id AS artifactId,
             line_id AS lineId,
             result,
             recipe_id AS recipeId,
             policy_version AS policyVersion,
             observed_at_ms AS observedAtMs
        FROM autonomous_design_preflight_runs
       ORDER BY observed_at_ms
    `).all(),
    db.prepare(`
      SELECT binding_event_id AS bindingEventId,
             artifact_id AS artifactId,
             tenant_id AS tenantId,
             binding_status AS bindingStatus,
             privacy_class AS privacyClass,
             storage_provider AS storageProvider,
             storage_ref AS storageRef,
             source_asset_id AS sourceAssetId,
             source_ref AS sourceRef,
             observed_at_ms AS observedAtMs
        FROM autonomous_design_asset_binding_events
       ORDER BY observed_at_ms
    `).all()
  ]);

  const candidates=designReadinessEvidenceCandidatesV1({
    artifacts:artifactsResult.results||[],
    approvals:approvalsResult.results||[],
    preflights:preflightsResult.results||[],
    assetBindings:bindingsResult.results||[],
    tenantId:text(options.tenantId)||'TENANT_001'
  });

  let inserted=0;
  let duplicates=0;
  let ready=0;
  let blocked=0;
  for(const candidate of candidates){
    const result=await recordReadinessEvidenceV1(db,candidate,options);
    if(candidate.state==='READY') ready+=1;
    if(candidate.state==='BLOCKED') blocked+=1;
    if(result.inserted) inserted+=1;
    else duplicates+=1;
  }

  return {
    success:true,
    skipped:false,
    reason:'',
    designMode:schema.mode,
    artifacts:(artifactsResult.results||[]).length,
    candidates:candidates.length,
    ready,
    blocked,
    inserted,
    duplicates
  };
}
