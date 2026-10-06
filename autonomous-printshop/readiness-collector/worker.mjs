import {
  collectExistingReadinessEvidenceV1
} from '../core/readiness-source-adapters-v1.mjs';
import {
  collectDesignReadinessEvidenceV1,
  designReadinessSchemaStateV1
} from '../core/design-readiness-collector-v1.mjs';
import {
  classifyAccountingCloudCutoverV1
} from '../core/accounting-cloud-cutover-guard-v1.mjs';
import {
  projectDesignProductionReadinessV1
} from '../core/design-production-evidence-v1.mjs';

function text(v){return String(v==null?'':v).trim();}

async function health(env){
  const [row,design]=await Promise.all([
    env.DB.prepare(`
      SELECT
        (SELECT mode FROM autonomous_readiness_control WHERE singleton_id=1) AS readinessMode,
        (SELECT COUNT(*) FROM autonomous_readiness_evidence) AS evidenceRows,
        (SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1) AS accountingMode,
        (SELECT policy_epoch FROM employee_accounting_control_v1 WHERE singleton=1) AS accountingEpoch,
        (SELECT mode FROM autonomous_machine_control WHERE singleton_id=1) AS machineMode,
        (SELECT COUNT(*) FROM autonomous_machines) AS machineRows,
        (SELECT COUNT(*) FROM autonomous_machine_observations) AS machineObservations,
        (SELECT COUNT(*) FROM autonomous_line_machine_mapping_events) AS machineMappings,
        (SELECT COUNT(*) FROM operator_tasks) AS operatorTasks
    `).first(),
    designReadinessSchemaStateV1(env.DB)
  ]);
  return {
    success:true,
    service:'autonomous-printshop-readiness-collector',
    mode:'READINESS_EVIDENCE_COLLECTOR',
    readinessMode:text(row&&row.readinessMode),
    designEvidenceSchemaReady:design.ready,
    designMode:design.mode,
    evidenceRows:Number(row&&row.evidenceRows||0),
    accountingMode:text(row&&row.accountingMode)||'ABSENT',
    accountingEpoch:Number(row&&row.accountingEpoch||0),
    materialConnector:'ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_V1',
    materialAuthorityReadOnly:text(row&&row.accountingMode)==='READONLY',
    machineMode:text(row&&row.machineMode)||'ABSENT',
    machineRows:Number(row&&row.machineRows||0),
    machineObservations:Number(row&&row.machineObservations||0),
    machineMappings:Number(row&&row.machineMappings||0),
    operatorTasks:Number(row&&row.operatorTasks||0),
    writeAuthority:'AUTONOMOUS_READINESS_EVIDENCE_ONLY',
    businessWrites:false,
    employeeAssignment:false
  };
}

async function readDesignAcquisitionProjection(env){
  const [artifacts,approvals,preflights,bindings]=await Promise.all([
    env.DB.prepare(`
      SELECT artifact_id AS artifactId,line_id AS lineId,case_id AS caseId,
             version_id AS versionId,content_sha256 AS contentSha256,
             created_at_ms AS createdAtMs
        FROM autonomous_design_artifacts
       ORDER BY created_at_ms
    `).all(),
    env.DB.prepare(`
      SELECT approval_event_id AS approvalEventId,artifact_id AS artifactId,
             line_id AS lineId,approval_gate AS approvalGate,
             approval_state AS approvalState,evidence_ref AS evidenceRef,
             policy_ref AS policyRef,actor_kind AS actorKind,
             observed_at_ms AS observedAtMs
        FROM autonomous_design_approval_events
       ORDER BY observed_at_ms
    `).all(),
    env.DB.prepare(`
      SELECT preflight_run_id AS preflightRunId,artifact_id AS artifactId,
             line_id AS lineId,result,recipe_id AS recipeId,
             policy_version AS policyVersion,observed_at_ms AS observedAtMs
        FROM autonomous_design_preflight_runs
       ORDER BY observed_at_ms
    `).all(),
    env.DB.prepare(`
      SELECT binding_event_id AS bindingEventId,artifact_id AS artifactId,
             tenant_id AS tenantId,binding_status AS bindingStatus,
             privacy_class AS privacyClass,storage_provider AS storageProvider,
             storage_ref AS storageRef,source_asset_id AS sourceAssetId,
             source_ref AS sourceRef,observed_at_ms AS observedAtMs
        FROM autonomous_design_asset_binding_events
       ORDER BY observed_at_ms
    `).all()
  ]);
  const projection=projectDesignProductionReadinessV1({
    artifacts:artifacts.results||[],
    approvals:approvals.results||[],
    preflights:preflights.results||[],
    assetBindings:bindings.results||[],
    tenantId:'TENANT_001'
  });
  return {
    projectedLines:projection.length,
    ready:projection.filter(x=>x.state==='READY').length,
    blocked:projection.filter(x=>x.state==='BLOCKED').length,
    unknown:projection.filter(x=>x.state==='UNKNOWN').length
  };
}

async function evidenceStatus(env){
  const [row,designProjection]=await Promise.all([
    env.DB.prepare(`
    SELECT
      (SELECT mode FROM autonomous_readiness_control WHERE singleton_id=1) AS readinessMode,
      (SELECT mode FROM autonomous_design_control WHERE singleton_id=1) AS designMode,
      (SELECT COUNT(*) FROM autonomous_design_artifacts) AS designArtifacts,
      (SELECT COUNT(*) FROM autonomous_design_approval_events) AS designApprovals,
      (SELECT COUNT(*) FROM autonomous_design_preflight_runs) AS designPreflights,
      (SELECT COUNT(*) FROM autonomous_design_asset_binding_events WHERE binding_status='LINKED') AS designLinkedBindings,
      (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='autonomous_design_approval_receipts') AS approvalReceiptSchemaReady,
      (SELECT COUNT(*) FROM autonomous_design_approval_receipts) AS approvalReceiptRows,
      (SELECT COUNT(*) FROM employee_order_conversation_files_v1) AS cloudOrderFiles,
      (SELECT COUNT(*) FROM employee_order_conversation_files_v1 WHERE trim(line_id)<>'') AS cloudLineLinkedFiles,
      (SELECT COUNT(*) FROM pragma_table_info('employee_order_conversation_files_v1') WHERE lower(name)='content_sha256') AS cloudFileHashColumns,
      (SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1) AS accountingMode,
      (SELECT policy_epoch FROM employee_accounting_control_v1 WHERE singleton=1) AS accountingEpoch,
      (SELECT COUNT(*) FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryRows,
      (SELECT enabled FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryEnabled,
      (SELECT CASE WHEN json_valid(allowed_usernames_json) THEN json_array_length(allowed_usernames_json) ELSE 0 END FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryAllowedUsers,
      (SELECT CASE WHEN json_valid(allowed_actions_json) THEN json_array_length(allowed_actions_json) ELSE 0 END FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryAllowedActions,
      (SELECT expires_at_ms FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryExpiresAtMs,
      (SELECT max_commands FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryMaxCommands,
      (SELECT commands_started FROM employee_accounting_write_canary_v1 WHERE singleton=1) AS writeCanaryCommandsStarted,
      (SELECT COUNT(*) FROM employee_accounting_materials_v1) AS accountingMaterialRowsTotal,
      (SELECT COUNT(*) FROM employee_accounting_materials_v1 WHERE upper(trim(material_kind))='A2_CANARY') AS accountingCanaryMaterialRows,
      (SELECT COUNT(*) FROM employee_accounting_materials_v1 WHERE active=1) AS activeMaterialsAll,
      (SELECT COUNT(*) FROM employee_accounting_materials_v1 WHERE active=1 AND upper(trim(material_kind))<>'A2_CANARY') AS activeMaterials,
      (SELECT COUNT(*) FROM employee_accounting_stock_moves_v1) AS stockMoves,
      (SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE trim(line_id)<>'') AS accountingDeptLinesWithLineId,
      (SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE trim(material_name)<>'') AS accountingDeptLinesWithMaterial,
      (SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE material_consumption>0) AS accountingDeptLinesWithConsumption,
      (SELECT mode FROM autonomous_machine_control WHERE singleton_id=1) AS machineMode,
      (SELECT COUNT(*) FROM autonomous_machines WHERE active=1) AS activeMachines,
      (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='autonomous_machine_identity_events') AS machineIdentitySchemaReady,
      (SELECT COUNT(*) FROM autonomous_machine_identity_events) AS machineIdentityRows,
      (SELECT COUNT(*) FROM autonomous_machine_observations WHERE expires_at_ms>?) AS activeMachineObservations,
      (SELECT COUNT(*) FROM autonomous_line_machine_mapping_events) AS machineMappings,
      (SELECT mode FROM operator_task_control WHERE singleton_id=1) AS operatorTaskMode,
      (SELECT COUNT(*) FROM operator_tasks) AS operatorTasks,
      (SELECT COUNT(*) FROM autonomous_readiness_evidence) AS evidenceRows
  `).bind(Date.now()).first(),
    readDesignAcquisitionProjection(env)
  ]);

  const designReadyInput=Number(designProjection&&designProjection.ready||0)>0;
  const accountingCutover=classifyAccountingCloudCutoverV1({
    mode:text(row&&row.accountingMode)||'ABSENT',
    policyEpoch:Number(row&&row.accountingEpoch||0),
    writeCanaryReady:Number(row&&row.writeCanaryRows||0)>0,
    writeCanaryEnabled:Number(row&&row.writeCanaryEnabled||0)===1,
    allowedUsers:Number(row&&row.writeCanaryAllowedUsers||0),
    allowedActions:Number(row&&row.writeCanaryAllowedActions||0),
    maxCommands:Number(row&&row.writeCanaryMaxCommands||0),
    commandsStarted:Number(row&&row.writeCanaryCommandsStarted||0),
    activeMaterials:Number(row&&row.activeMaterials||0),
    stockMoves:Number(row&&row.stockMoves||0),
    deptLinesWithLineId:Number(row&&row.accountingDeptLinesWithLineId||0),
    deptLinesWithMaterial:Number(row&&row.accountingDeptLinesWithMaterial||0),
    deptLinesWithConsumption:Number(row&&row.accountingDeptLinesWithConsumption||0)
  });
  const materialRowsTotal=Number(row&&row.accountingMaterialRowsTotal||0);
  const canaryMaterialRows=Number(row&&row.accountingCanaryMaterialRows||0);
  const operationalActiveMaterials=Number(row&&row.activeMaterials||0);
  const materialSourceClass=operationalActiveMaterials>0
    ? 'OPERATIONAL_ACTIVE_MATERIALS_PRESENT'
    : (materialRowsTotal>0&&canaryMaterialRows===materialRowsTotal)
      ? 'AUDIT_ONLY_CANARY_MATERIALS'
      : materialRowsTotal>0
        ? 'NO_ACTIVE_OPERATIONAL_MATERIALS'
        : 'NO_MATERIAL_ROWS';
  const materialReadyInput=accountingCutover.sourceDataPresent &&
    accountingCutover.blockerCollectionAllowed===true;
  const machineReadyInput=text(row&&row.machineMode)==='SHADOW' &&
    Number(row&&row.activeMachines||0)>0 &&
    Number(row&&row.activeMachineObservations||0)>0 &&
    Number(row&&row.machineMappings||0)>0;

  return {
    success:true,
    mode:'READINESS_EVIDENCE_STATUS',
    readinessMode:text(row&&row.readinessMode)||'ABSENT',
    design:{
      mode:text(row&&row.designMode)||'ABSENT',
      artifacts:Number(row&&row.designArtifacts||0),
      approvals:Number(row&&row.designApprovals||0),
      preflights:Number(row&&row.designPreflights||0),
      linkedBindings:Number(row&&row.designLinkedBindings||0),
      approvalReceiptSchemaReady:Number(row&&row.approvalReceiptSchemaReady||0)===1,
      approvalReceiptRows:Number(row&&row.approvalReceiptRows||0),
      cloudOrderFiles:Number(row&&row.cloudOrderFiles||0),
      cloudLineLinkedFiles:Number(row&&row.cloudLineLinkedFiles||0),
      cloudFileHashSchemaReady:Number(row&&row.cloudFileHashColumns||0)>0,
      projectedLines:Number(designProjection&&designProjection.projectedLines||0),
      qualifiedReadyLines:Number(designProjection&&designProjection.ready||0),
      projectedBlockedLines:Number(designProjection&&designProjection.blocked||0),
      projectedUnknownLines:Number(designProjection&&designProjection.unknown||0),
      acquisitionReady:designReadyInput,
      blocker:designReadyInput?'':'REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING'
    },
    material:{
      accountingMode:text(row&&row.accountingMode)||'ABSENT',
      accountingEpoch:Number(row&&row.accountingEpoch||0),
      cloudStage:accountingCutover.stage,
      materialFrozen:accountingCutover.frozen,
      blockerCollectionAllowed:accountingCutover.blockerCollectionAllowed,
      readyEvidenceAllowed:accountingCutover.readyEvidenceAllowed,
      accountingMaterialRowsTotal:materialRowsTotal,
      accountingCanaryMaterialRows:canaryMaterialRows,
      activeMaterialsAll:Number(row&&row.activeMaterialsAll||0),
      materialSourceClass,
      canaryRowsExcludedFromReadiness:true,
      activeMaterials:Number(row&&row.activeMaterials||0),
      stockMoves:Number(row&&row.stockMoves||0),
      deptLinesWithLineId:Number(row&&row.accountingDeptLinesWithLineId||0),
      deptLinesWithMaterial:Number(row&&row.accountingDeptLinesWithMaterial||0),
      deptLinesWithConsumption:Number(row&&row.accountingDeptLinesWithConsumption||0),
      writeCanaryReady:Number(row&&row.writeCanaryRows||0)>0,
      writeCanaryEnabled:Number(row&&row.writeCanaryEnabled||0)===1,
      writeCanaryAllowedUsers:Number(row&&row.writeCanaryAllowedUsers||0),
      writeCanaryAllowedActions:Number(row&&row.writeCanaryAllowedActions||0),
      writeCanaryExpiresAtMs:Number(row&&row.writeCanaryExpiresAtMs||0),
      writeCanaryMaxCommands:Number(row&&row.writeCanaryMaxCommands||0),
      writeCanaryCommandsStarted:Number(row&&row.writeCanaryCommandsStarted||0),
      writeCanaryCommandsRemaining:Number(accountingCutover.writeCanary&&accountingCutover.writeCanary.commandsRemaining||0),
      acquisitionReady:materialReadyInput,
      blocker:materialReadyInput?'':accountingCutover.reason
    },
    machine:{
      mode:text(row&&row.machineMode)||'ABSENT',
      activeMachines:Number(row&&row.activeMachines||0),
      identitySchemaReady:Number(row&&row.machineIdentitySchemaReady||0)===1,
      identityRows:Number(row&&row.machineIdentityRows||0),
      activeObservations:Number(row&&row.activeMachineObservations||0),
      mappings:Number(row&&row.machineMappings||0),
      acquisitionReady:machineReadyInput,
      blocker:machineReadyInput?'':'REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED'
    },
    evidenceRows:Number(row&&row.evidenceRows||0),
    operatorTaskMode:text(row&&row.operatorTaskMode)||'ABSENT',
    operatorTasks:Number(row&&row.operatorTasks||0),
    piiExposed:false,
    employeeIdentityExposed:false,
    businessWrites:false,
    employeeAssignment:false
  };
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET'){
      return new Response(JSON.stringify({success:false,code:'METHOD_NOT_ALLOWED'}),{
        status:405,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    if(path!=='/'&&path!=='/health'&&path!=='/evidence-status'){
      return new Response(JSON.stringify({success:false,code:'NOT_FOUND'}),{
        status:404,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    try{
      const body=path==='/evidence-status' ? await evidenceStatus(env) : await health(env);
      return new Response(JSON.stringify(body),{
        status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }catch(err){
      return new Response(JSON.stringify({
        success:false,code:'READINESS_COLLECTOR_HEALTH_ERROR',message:text(err&&err.message)
      }),{
        status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
  },

  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      const nowMs=Date.now();
      const existing=await collectExistingReadinessEvidenceV1(env.DB,{nowMs});
      const design=await collectDesignReadinessEvidenceV1(env.DB,{nowMs,tenantId:'TENANT_001'});
      console.log('AUTONOMOUS_PRINTSHOP_READINESS_COLLECTOR='+JSON.stringify({
        success:existing.success===true&&design.success===true,
        existing:{
          skipped:!!existing.skipped,
          reason:text(existing.reason),
          candidates:Number(existing.candidates||0),
          inserted:Number(existing.inserted||0),
          duplicates:Number(existing.duplicates||0),
          byKind:existing.byKind||{}
        },
        design:{
          skipped:!!design.skipped,
          reason:text(design.reason),
          mode:text(design.designMode),
          artifacts:Number(design.artifacts||0),
          candidates:Number(design.candidates||0),
          ready:Number(design.ready||0),
          blocked:Number(design.blocked||0),
          inserted:Number(design.inserted||0),
          duplicates:Number(design.duplicates||0)
        }
      }));
    })());
  }
};
