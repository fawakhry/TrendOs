import { collectCloudOrderFileDesignArtifactsV1 } from '../core/cloud-order-file-design-artifact-collector-v1.mjs';

function text(v){return String(v==null?'':v).trim();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}

async function state(env){
  const row=await env.DB.prepare(`
    SELECT
      (SELECT mode FROM autonomous_design_control WHERE singleton_id=1) AS designMode,
      (SELECT mode FROM autonomous_readiness_control WHERE singleton_id=1) AS readinessMode,
      (SELECT mode FROM autonomy_control WHERE singleton_id=1) AS autonomyMode,
      (SELECT mode FROM operator_task_control WHERE singleton_id=1) AS operatorTaskMode,
      (SELECT COUNT(*) FROM operator_tasks) AS operatorTasks,
      (SELECT COUNT(*) FROM employee_order_conversation_files_v1) AS cloudOrderFiles,
      (SELECT COUNT(*) FROM employee_order_conversation_files_v1
        WHERE trim(order_id)<>''
          AND trim(line_id)<>''
          AND trim(file_id)<>''
          AND trim(r2_key)<>''
          AND length(content_sha256)=64
          AND lower(content_sha256) NOT GLOB '*[^0-9a-f]*'
          AND (lower(mime_type) LIKE 'image/%'
               OR lower(mime_type) IN ('application/pdf','application/postscript'))
      ) AS hashedDesignFiles,
      (SELECT COUNT(*) FROM autonomous_design_artifacts) AS designArtifacts,
      (SELECT COUNT(*) FROM autonomous_design_asset_binding_events WHERE binding_status='LINKED') AS linkedBindings,
      (SELECT COUNT(*) FROM autonomous_design_approval_events) AS approvals,
      (SELECT COUNT(*) FROM autonomous_design_preflight_runs) AS preflights,
      (SELECT COUNT(*) FROM autonomous_readiness_evidence WHERE evidence_kind='DESIGN') AS designReadinessEvidence
  `).first();

  const controlsQualified=
    text(row&&row.designMode)==='SHADOW' &&
    text(row&&row.readinessMode)==='SHADOW' &&
    text(row&&row.autonomyMode)==='SHADOW' &&
    text(row&&row.operatorTaskMode)==='OFF' &&
    num(row&&row.operatorTasks)===0;

  return {
    designMode:text(row&&row.designMode)||'ABSENT',
    readinessMode:text(row&&row.readinessMode)||'ABSENT',
    autonomyMode:text(row&&row.autonomyMode)||'ABSENT',
    operatorTaskMode:text(row&&row.operatorTaskMode)||'ABSENT',
    operatorTasks:num(row&&row.operatorTasks),
    cloudOrderFiles:num(row&&row.cloudOrderFiles),
    hashedDesignFiles:num(row&&row.hashedDesignFiles),
    designArtifacts:num(row&&row.designArtifacts),
    linkedBindings:num(row&&row.linkedBindings),
    approvals:num(row&&row.approvals),
    preflights:num(row&&row.preflights),
    designReadinessEvidence:num(row&&row.designReadinessEvidence),
    controlsQualified
  };
}

async function health(env){
  const s=await state(env);
  return {
    success:true,
    service:'autonomous-printshop-cloud-design-ingest',
    mode:'CLOUD_DESIGN_ARTIFACT_INGEST',
    ...s,
    sourceAuthority:'employee_order_conversation_files_v1',
    sourceStorage:'R2',
    writeAuthority:'DESIGN_ARTIFACT_AND_BINDING_ONLY',
    approvalWrite:false,
    preflightWrite:false,
    readinessWrite:false,
    accountingWrite:false,
    operatorTaskWrite:false,
    employeeAssignment:false,
    piiExposed:false
  };
}

async function runScheduled(env){
  const before=await state(env);
  if(!before.controlsQualified){
    return {
      success:true,
      skipped:true,
      reason:'CONTROL_GATE_NOT_QUALIFIED',
      before,
      candidates:0,
      artifactsInserted:0,
      bindingsInserted:0
    };
  }

  const result=await collectCloudOrderFileDesignArtifactsV1(env.DB,{limit:25,nowMs:Date.now()});
  const after=await state(env);

  return {
    success:result.success===true,
    skipped:!!result.skipped,
    reason:text(result.reason),
    candidates:num(result.candidates),
    artifactsInserted:num(result.artifactsInserted),
    bindingsInserted:num(result.bindingsInserted),
    duplicates:num(result.duplicates),
    invalid:num(result.invalid),
    before:{
      cloudOrderFiles:before.cloudOrderFiles,
      hashedDesignFiles:before.hashedDesignFiles,
      designArtifacts:before.designArtifacts,
      linkedBindings:before.linkedBindings
    },
    after:{
      cloudOrderFiles:after.cloudOrderFiles,
      hashedDesignFiles:after.hashedDesignFiles,
      designArtifacts:after.designArtifacts,
      linkedBindings:after.linkedBindings
    },
    approvalWrite:false,
    preflightWrite:false,
    readinessWrite:false,
    accountingWrite:false,
    operatorTaskWrite:false,
    employeeAssignment:false,
    piiExposed:false
  };
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET') return json({success:false,code:'METHOD_NOT_ALLOWED'},405);
    if(path!=='/'&&path!=='/health') return json({success:false,code:'NOT_FOUND'},404);
    try{
      return json(await health(env),200);
    }catch(err){
      return json({
        success:false,
        code:'CLOUD_DESIGN_INGEST_HEALTH_ERROR',
        message:text(err&&err.message),
        writeAuthority:'DESIGN_ARTIFACT_AND_BINDING_ONLY',
        employeeAssignment:false
      },503);
    }
  },

  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      try{
        const out=await runScheduled(env);
        console.log('AUTONOMOUS_PRINTSHOP_CLOUD_DESIGN_INGEST='+JSON.stringify(out));
      }catch(err){
        console.log('AUTONOMOUS_PRINTSHOP_CLOUD_DESIGN_INGEST='+JSON.stringify({
          success:false,
          code:'CLOUD_DESIGN_INGEST_RUN_ERROR',
          message:text(err&&err.message),
          approvalWrite:false,
          preflightWrite:false,
          readinessWrite:false,
          accountingWrite:false,
          operatorTaskWrite:false,
          employeeAssignment:false
        }));
      }
    })());
  }
};

export { health, state, runScheduled };
