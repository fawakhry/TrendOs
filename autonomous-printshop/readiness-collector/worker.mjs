import {
  collectExistingReadinessEvidenceV1
} from '../core/readiness-source-adapters-v1.mjs';

function text(v){return String(v==null?'':v).trim();}

async function health(env){
  const row=await env.DB.prepare(`
    SELECT
      (SELECT mode FROM autonomous_readiness_control WHERE singleton_id=1) AS readinessMode,
      (SELECT COUNT(*) FROM autonomous_readiness_evidence) AS evidenceRows,
      (SELECT COUNT(*) FROM operator_tasks) AS operatorTasks
  `).first();
  return {
    success:true,
    service:'autonomous-printshop-readiness-collector',
    mode:'READINESS_EVIDENCE_COLLECTOR',
    readinessMode:text(row&&row.readinessMode),
    evidenceRows:Number(row&&row.evidenceRows||0),
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
      const result=await collectExistingReadinessEvidenceV1(env.DB,{nowMs:Date.now()});
      console.log('AUTONOMOUS_PRINTSHOP_READINESS_COLLECTOR='+JSON.stringify({
        success:result.success,
        skipped:!!result.skipped,
        reason:text(result.reason),
        candidates:Number(result.candidates||0),
        inserted:Number(result.inserted||0),
        duplicates:Number(result.duplicates||0),
        byKind:result.byKind||{}
      }));
    })());
  }
};
