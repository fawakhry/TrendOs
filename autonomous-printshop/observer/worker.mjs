import {
  qualification,
  currentRows,
  readinessInputs
} from '../production-shadow/worker.mjs';
import {
  buildOperationalRealityV1
} from '../core/operational-reality-v1.mjs';
import {
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';
import {
  readAutonomyControlV1,
  recordAutonomyShadowEventV1
} from '../core/autonomy-event-ledger-v1.mjs';
import {
  decideAutonomyV1
} from '../core/autonomy-policy-v1.mjs';

function text(v){ return String(v==null?'':v).trim(); }

function minEvidenceConfidence(task){
  const evidence=task&&task.raw&&task.raw.readinessEvidence||{};
  const values=['design','material','machine']
    .map(k=>evidence[k]&&Number(evidence[k].confidence))
    .filter(Number.isFinite);
  return values.length?Math.min(...values):0;
}

async function health(env){
  const autonomy=await readAutonomyControlV1(env.DB);
  const readiness=await readinessInputs(env);
  const counts=await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM autonomy_events) AS autonomyEvents,
      (SELECT COUNT(*) FROM autonomy_observations) AS autonomyObservations,
      (SELECT COUNT(*) FROM operator_tasks) AS operatorTasks
  `).first();
  return {
    success:true,
    service:'autonomous-printshop-shadow-observer',
    mode:'SHADOW_OBSERVER',
    autonomyMode:text(autonomy.mode),
    readinessMode:readiness.ok?text(readiness.control.mode):'UNAVAILABLE',
    autonomyEvents:Number(counts&&counts.autonomyEvents||0),
    autonomyObservations:Number(counts&&counts.autonomyObservations||0),
    operatorTasks:Number(counts&&counts.operatorTasks||0),
    businessWrites:false,
    employeeAssignment:false
  };
}

export async function buildObservationPlan(env){
  const autonomy=await readAutonomyControlV1(env.DB);
  if(text(autonomy.mode)!=='SHADOW'){
    return {success:true,skipped:true,reason:'AUTONOMY_CONTROL_NOT_SHADOW'};
  }

  const readiness=await readinessInputs(env);
  if(!readiness.ok){
    return {success:false,skipped:true,reason:readiness.reason||'READINESS_UNAVAILABLE'};
  }
  if(text(readiness.control.mode)!=='SHADOW'){
    return {success:true,skipped:true,reason:'READINESS_CONTROL_NOT_SHADOW'};
  }

  const source=await qualification(env);
  if(!source.ok){
    return {
      success:true,
      state:'SOURCE_NOT_QUALIFIED',
      policyVersion:'v1-shadow-observer',
      minConfidence:Number(autonomy.minConfidence||0.92),
      eventInput:{
        family:'PRODUCTION_SCHEDULING',
        taskKey:'production-scheduling:source-qualification',
        confidence:0,
        idempotent:true,
        dataIntegrityUnknown:true,
        qualificationReason:text(source.reason)
      },
      baselineCandidates:0,
      strictCandidates:0,
      evidenceRows:Number(readiness.evidence&&readiness.evidence.length||0)
    };
  }

  const rows=await currentRows(env);
  const baseline=buildOperationalRealityV1(rows,{});
  const top=baseline.ordinary[0]||null;
  if(!top){
    return {
      success:true,
      skipped:true,
      reason:'NO_BASELINE_ORDINARY_CANDIDATE',
      baselineCounts:baseline.counts
    };
  }

  const requiredKinds=[];
  if(readiness.control.requireDesign) requiredKinds.push('design');
  if(readiness.control.requireMaterial) requiredKinds.push('material');
  if(readiness.control.requireMachine) requiredKinds.push('machine');

  const candidateRows=baseline.ordinary.map(x=>x.raw||x);
  const strict=buildReadinessQualifiedRealityV1(
    candidateRows,
    readiness.evidence,
    {requiredKinds}
  );
  const recommended=strict.recommendation.recommended||null;
  const decisionTask=recommended||top;
  const missingRequiredData=!recommended;
  const confidence=recommended?minEvidenceConfidence(recommended):0;

  return {
    success:true,
    state:recommended?'STRICT_ELIGIBLE':'READINESS_BLOCKED',
    policyVersion:'v1-readiness-shadow',
    minConfidence:Number(autonomy.minConfidence||0.92),
    baselineCandidates:baseline.ordinary.length,
    strictCandidates:strict.reality.ordinary.length,
    evidenceRows:readiness.evidence.length,
    requiredKinds,
    eventInput:{
      family:'EMPLOYEE_TASK_ASSIGNMENT',
      taskKey:'employee-task-assignment:'+text(decisionTask.lineId),
      orderId:text(decisionTask.orderId),
      lineId:text(decisionTask.lineId),
      confidence,
      idempotent:true,
      missingRequiredData,
      requiredKinds,
      readinessCoverage:strict.coverage,
      baselineCounts:baseline.counts,
      strictCounts:strict.reality.counts,
      baselinePriority:text(top.priority),
      baselineDepartment:text(top.department),
      baselineDueIso:text(top.dueIso),
      strictEligible:!!recommended
    }
  };
}

export async function previewObservationV1(env){
  const plan=await buildObservationPlan(env);
  if(!plan.success||plan.skipped||!plan.eventInput){
    return {
      success:plan.success,
      skipped:!!plan.skipped,
      reason:text(plan.reason),
      state:text(plan.state),
      baselineCandidates:Number(plan.baselineCandidates||0),
      strictCandidates:Number(plan.strictCandidates||0),
      evidenceRows:Number(plan.evidenceRows||0),
      writePerformed:false,
      rawOrderIdsExposed:false,
      rawLineIdsExposed:false
    };
  }

  const actual=decideAutonomyV1(plan.eventInput,{
    autopilotEnabled:false,
    minConfidence:plan.minConfidence
  });
  const recommended=decideAutonomyV1(plan.eventInput,{
    autopilotEnabled:true,
    minConfidence:plan.minConfidence
  });

  return {
    success:true,
    skipped:false,
    mode:'SHADOW_OBSERVER_PREVIEW',
    state:plan.state,
    baselineCandidates:Number(plan.baselineCandidates||0),
    strictCandidates:Number(plan.strictCandidates||0),
    evidenceRows:Number(plan.evidenceRows||0),
    requiredKinds:plan.requiredKinds||[],
    family:text(plan.eventInput.family),
    actualDecision:text(actual.decision),
    actualReason:text(actual.reason),
    recommendedDecision:text(recommended.decision),
    recommendedReason:text(recommended.reason),
    writePerformed:false,
    businessWrites:false,
    employeeAssignment:false,
    piiExposed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false
  };
}

export async function observeOnce(env){
  const plan=await buildObservationPlan(env);
  if(!plan.success||plan.skipped||!plan.eventInput) return plan;

  const event=await recordAutonomyShadowEventV1(
    env.DB,
    plan.eventInput,
    {
      policyVersion:plan.policyVersion,
      minConfidence:plan.minConfidence
    }
  );

  return {
    success:true,
    inserted:event.inserted,
    state:plan.state,
    baselineCandidates:Number(plan.baselineCandidates||0),
    strictCandidates:Number(plan.strictCandidates||0),
    evidenceRows:Number(plan.evidenceRows||0),
    decision:event.decision.decision,
    decisionReason:event.decision.reason,
    recommendedDecision:event.recommendedDecision.decision,
    recommendedReason:event.recommendedDecision.reason
  };
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET'){
      return new Response(JSON.stringify({success:false,code:'METHOD_NOT_ALLOWED'}),{
        status:405,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    if(path!=='/'&&path!=='/health'&&path!=='/preview'){
      return new Response(JSON.stringify({success:false,code:'NOT_FOUND'}),{
        status:404,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    try{
      const body=path==='/preview' ? await previewObservationV1(env) : await health(env);
      return new Response(JSON.stringify(body),{
        status:200,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }catch(err){
      return new Response(JSON.stringify({
        success:false,
        code:path==='/preview'?'OBSERVER_PREVIEW_ERROR':'OBSERVER_HEALTH_ERROR',
        message:text(err&&err.message)
      }),{
        status:503,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
  },

  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      const result=await observeOnce(env);
      console.log('AUTONOMOUS_PRINTSHOP_SHADOW_OBSERVER='+JSON.stringify({
        success:result.success,
        inserted:!!result.inserted,
        skipped:!!result.skipped,
        reason:text(result.reason),
        state:text(result.state),
        baselineCandidates:Number(result.baselineCandidates||0),
        strictCandidates:Number(result.strictCandidates||0),
        evidenceRows:Number(result.evidenceRows||0),
        decision:text(result.decision),
        recommendedDecision:text(result.recommendedDecision)
      }));
    })());
  }
};
