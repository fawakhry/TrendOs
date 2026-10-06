import {
  collectExistingReadinessEvidenceV1
} from '../core/readiness-source-adapters-v1.mjs';
import {
  collectDesignReadinessEvidenceV1,
  designReadinessSchemaStateV1
} from '../core/design-readiness-collector-v1.mjs';

function text(v){return String(v==null?'':v).trim();}

async function health(env){
  const [row,design]=await Promise.all([
    env.DB.prepare(`
      SELECT
        (SELECT mode FROM autonomous_readiness_control WHERE singleton_id=1) AS readinessMode,
        (SELECT COUNT(*) FROM autonomous_readiness_evidence) AS evidenceRows,
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

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET'){
      return new Response(JSON.stringify({success:false,code:'METHOD_NOT_ALLOWED'}),{
        status:405,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    if(path!=='/'&&path!=='/health'){
      return new Response(JSON.stringify({success:false,code:'NOT_FOUND'}),{
        status:404,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }
    try{
      return new Response(JSON.stringify(await health(env)),{
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
