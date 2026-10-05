import { verifyOrdersEdgeToken, mapMirrorRows } from './edge-orders-read-v1.mjs';
import { guardEdgeOrdersPageRequest } from './edge-orders-freshness-gate.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from './edge-orders-idle-verifier.mjs';
import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from '../../autonomous-printshop/core/operational-reality-v1.mjs';

const HEALTH_PATH='/v1/autonomous-printshop/shadow/health';
const RECOMMEND_PATH='/v1/autonomous-printshop/shadow/recommend';
const SCREEN_VIEW_SHEETS={
  service:'واجهة خدمة العملاء',
  print:'واجهة الطباعة',
  laser:'واجهة الليزر',
  press:'واجهة المكبس'
};

function text(v){return String(v==null?'':v).trim();}
function bool(v){return ['1','true','yes','on'].includes(text(v).toLowerCase());}
function configuredOrigins(env){
  const list=String(env&&env.CORS_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  return list.length?list:['https://fawakhry.github.io'];
}
function corsHeaders(request,env){
  const origin=text(request.headers.get('Origin'));
  const allowed=configuredOrigins(env);
  return {
    'access-control-allow-origin':origin&&allowed.includes(origin)?origin:allowed[0],
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'content-type,authorization',
    'access-control-max-age':'86400',
    'vary':'Origin'
  };
}
function json(payload,status,request,env){
  return new Response(JSON.stringify(payload),{
    status:status||200,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      ...corsHeaders(request,env)
    }
  });
}
function bearer(request){
  const m=text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return m?text(m[1]):'';
}
function enabled(env){return bool(env&&env.AUTONOMOUS_PRINTSHOP_SHADOW_V1_ENABLED);}
function screenSheetName(screen){return SCREEN_VIEW_SHEETS[text(screen)]||'';}

async function readViewMirror(env,screen){
  const sheetName=screenSheetName(screen);
  if(!sheetName) throw Object.assign(new Error('Unsupported operational screen'),{code:'SHADOW_SCREEN_UNSUPPORTED'});
  const catalog=await env.DB.prepare(`
    SELECT headers_json AS headersJson,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     WHERE sheet_name = ?
     LIMIT 1
  `).bind(sheetName).first();
  if(!catalog) throw Object.assign(new Error('Operational view mirror is missing'),{code:'SHADOW_VIEW_MIRROR_MISSING'});
  if(text(catalog.status)!=='ready') throw Object.assign(new Error('Operational view mirror is not ready'),{code:'SHADOW_VIEW_MIRROR_NOT_READY'});
  const query=await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(sheetName).all();
  const rows=(query.results||[]).map(r=>({
    rowNumber:Number(r.rowNumber||0),
    values:JSON.parse(r.valuesJson||'[]'),
    display:JSON.parse(r.displayJson||'[]')
  }));
  return {
    sheetName,
    catalog,
    headers:JSON.parse(catalog.headersJson||'[]'),
    rows
  };
}

function taskSummary(task){
  if(!task)return null;
  return {
    orderId:text(task.orderId),
    lineId:text(task.lineId),
    department:text(task.department),
    itemName:text(task.itemName),
    assignedTo:text(task.assignedTo),
    priority:text(task.priority),
    status:text(task.status),
    urgent:task.urgent===true,
    dueIso:text(task.dueIso),
    dueRaw:text(task.dueRaw)
  };
}

export function isAutonomousPrintshopShadowPath(path){
  return path===HEALTH_PATH||path===RECOMMEND_PATH;
}

export async function handleAutonomousPrintshopShadowRequest(request,env,ctx){
  const url=new URL(request.url);
  const path=url.pathname.replace(/\/+$/,'')||'/';
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request,env)});
  if(request.method!=='GET')return json({success:false,code:'METHOD_NOT_ALLOWED'},405,request,env);

  if(path===HEALTH_PATH){
    return json({
      success:true,
      service:'autonomous-printshop-shadow-v1',
      enabled:enabled(env),
      mode:'SHADOW_READ_ONLY',
      writesAccepted:false,
      employeeAssignment:false,
      d1Mutation:false,
      source:'qualified-edge-orders'
    },200,request,env);
  }

  if(path!==RECOMMEND_PATH)return json({success:false,code:'NOT_FOUND'},404,request,env);
  if(!enabled(env))return json({success:false,code:'AUTONOMOUS_PRINTSHOP_SHADOW_DISABLED'},503,request,env);

  const verified=await verifyOrdersEdgeToken(
    bearer(request),
    text(env&&env.EDGE_SESSION_SECRET)
  );
  if(!verified.ok){
    return json({
      success:false,
      code:'AUTONOMOUS_PRINTSHOP_SHADOW_UNAUTHORIZED',
      authReason:verified.reason
    },401,request,env);
  }

  const session=verified.payload||{};
  if(text(session.role).toLowerCase()!=='admin'){
    return json({success:false,code:'AUTONOMOUS_PRINTSHOP_SHADOW_ADMIN_ONLY'},403,request,env);
  }

  const screen=text(url.searchParams.get('screen')||'print');
  const allowed=Array.isArray(session.screens)?session.screens.map(text):[];
  if(!allowed.includes(screen)){
    return json({success:false,code:'AUTONOMOUS_PRINTSHOP_SHADOW_SCREEN_DENIED'},403,request,env);
  }

  const probeUrl=new URL(request.url);
  probeUrl.pathname='/v1/edge/orders/page';
  probeUrl.search='';
  probeUrl.searchParams.set('screen',screen);
  probeUrl.searchParams.set('page','1');
  probeUrl.searchParams.set('pageSize','100');
  probeUrl.searchParams.set('statusFilter','__ACTIVE__');
  const probeRequest=new Request(probeUrl.toString(),{
    method:'GET',
    headers:request.headers
  });
  const heartbeatOptions=ordersIdleHeartbeatVerifierEnabled(env)
    ? {verifyIdleSourceFreshness:async()=>fetchOrdersIdleHeartbeat(env)}
    : {};
  const blocked=await guardEdgeOrdersPageRequest(probeRequest,env,Date.now(),heartbeatOptions);
  if(blocked){
    const payload=await blocked.json().catch(()=>({}));
    return json({
      success:false,
      code:'AUTONOMOUS_PRINTSHOP_SHADOW_SOURCE_BLOCKED',
      sourceStatus:blocked.status,
      source:payload
    },503,request,env);
  }

  try{
    const mirror=await readViewMirror(env,screen);
    const mapped=mapMirrorRows(mirror.headers,mirror.rows,screen);
    const department=text(url.searchParams.get('department'));
    const reality=buildOperationalRealityV1(mapped,{department});
    const next=recommendNextTaskV1(mapped,{department});

    return json({
      success:true,
      mode:'SHADOW_READ_ONLY',
      source:{
        dataSource:'d1-edge-orders',
        screen,
        sheetName:mirror.sheetName,
        syncedAt:text(mirror.catalog.syncedAt),
        sourceLastRow:Number(mirror.catalog.sourceLastRow||0),
        rowCount:Number(mirror.catalog.rowCount||0)
      },
      counts:reality.counts,
      recommendation:{
        reason:next.reason,
        task:taskSummary(next.recommended),
        evidence:next.evidence||null
      },
      limitations:{
        activeTaskAuthorityConnected:false,
        employeeAvailabilityConnected:false,
        designReadinessConnected:false,
        materialReadinessConnected:false,
        machineReadinessConnected:false
      },
      writesAccepted:false,
      employeeAssignment:false
    },200,request,env);
  }catch(err){
    return json({
      success:false,
      code:text(err&&err.code)||'AUTONOMOUS_PRINTSHOP_SHADOW_ERROR',
      message:text(err&&err.message)||'Shadow recommendation failed'
    },502,request,env);
  }
}

export const AUTONOMOUS_PRINTSHOP_SHADOW_PATHS=Object.freeze({
  HEALTH_PATH,
  RECOMMEND_PATH
});
