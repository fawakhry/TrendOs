import { mapMirrorRows } from '../../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { inspectOrdersMirrorCatalog } from '../../cloudflare-d1/src/edge-orders-freshness-gate.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from '../../cloudflare-d1/src/edge-orders-idle-verifier.mjs';
import {
  inspectOrdersIdleHeartbeat,
  ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS
} from '../../cloudflare-d1/src/edge-orders-idle-heartbeat.mjs';
import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from '../core/operational-reality-v1.mjs';

const ORDERS_SHEET='الأوردرات';
const LINES_SHEET='بنود الأوردرات';

function text(v){return String(v==null?'':v).trim();}
function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store'
    }
  });
}
function parseMaxAge(env){
  const n=Number(env&&env.EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS);
  return Number.isFinite(n)?Math.max(300,Math.min(3600,Math.trunc(n))):600;
}
async function catalog(env,sheetName){
  return env.DB.prepare(`
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
}
async function rows(env,sheetName){
  const out=await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(sheetName).all();
  return (out.results||[]).map(r=>({
    rowNumber:Number(r.rowNumber||0),
    values:JSON.parse(r.valuesJson||'[]'),
    display:JSON.parse(r.displayJson||'[]')
  }));
}
function structuralReady(x){
  return !!(x&&x.statusReady&&x.parity&&x.live);
}
async function freshness(env){
  const now=Date.now();
  const maxAge=parseMaxAge(env);
  const [ordersCatalog,linesCatalog]=await Promise.all([
    catalog(env,ORDERS_SHEET),
    catalog(env,LINES_SHEET)
  ]);
  if(!ordersCatalog||!linesCatalog){
    return {ok:false,reason:'MIRROR_CATALOG_MISSING'};
  }
  const orders=inspectOrdersMirrorCatalog(ordersCatalog,now,maxAge);
  const lines=inspectOrdersMirrorCatalog(linesCatalog,now,maxAge);
  if(orders.ready&&lines.ready){
    return {ok:true,mode:'fresh-write-age',orders,lines,heartbeat:null};
  }
  const staleOnly=structuralReady(orders)&&structuralReady(lines)&&(!orders.fresh||!lines.fresh);
  if(!staleOnly||!ordersIdleHeartbeatVerifierEnabled(env)){
    return {ok:false,reason:staleOnly?'STALE_NO_HEARTBEAT':'MIRROR_NOT_READY',orders,lines};
  }
  try{
    const payload=await fetchOrdersIdleHeartbeat(env);
    const heartbeat=inspectOrdersIdleHeartbeat(payload,{
      nowMs:now,
      maxAgeSeconds:ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS,
      expectedOrdersSourceLastRow:orders.sourceLastRow,
      expectedOrdersSourceLastCol:orders.sourceLastCol,
      expectedLinesSourceLastRow:lines.sourceLastRow,
      expectedLinesSourceLastCol:lines.sourceLastCol
    });
    return heartbeat.ok
      ? {ok:true,mode:'idle-heartbeat',orders,lines,heartbeat}
      : {ok:false,reason:'IDLE_HEARTBEAT_REJECTED',orders,lines,heartbeat};
  }catch(err){
    return {ok:false,reason:'IDLE_HEARTBEAT_ERROR',orders,lines,error:text(err&&err.message)};
  }
}
async function lineMirror(env){
  const c=await catalog(env,LINES_SHEET);
  if(!c)throw new Error('LINES_MIRROR_MISSING');
  const headers=JSON.parse(c.headersJson||'[]');
  const data=await rows(env,LINES_SHEET);
  return {catalog:c,headers,rows:data};
}
async function fingerprint(task){
  if(!task)return '';
  const raw=text(task.orderId)+'|'+text(task.lineId);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,20);
}
function sanitizedExceptionCounts(exceptions){
  const out={};
  for(const x of exceptions||[]){
    const key=text(x.reason)||'UNKNOWN';
    out[key]=(out[key]||0)+1;
  }
  return out;
}

async function snapshot(env){
  const fresh=await freshness(env);
  if(!fresh.ok){
    return {
      success:false,
      mode:'PRODUCTION_SHADOW_READ_ONLY',
      code:'SOURCE_NOT_QUALIFIED',
      source:fresh,
      writesAccepted:false
    };
  }
  const mirror=await lineMirror(env);
  const mapped=mapMirrorRows(mirror.headers,mirror.rows,'');
  const reality=buildOperationalRealityV1(mapped,{});
  const next=recommendNextTaskV1(mapped,{});
  return {
    success:true,
    mode:'PRODUCTION_SHADOW_READ_ONLY',
    source:{
      authority:'trendos-main-d1',
      freshnessMode:fresh.mode,
      syncedAt:text(mirror.catalog.syncedAt),
      rowCount:Number(mirror.catalog.rowCount||0)
    },
    counts:reality.counts,
    exceptionCounts:sanitizedExceptionCounts(reality.exceptions),
    recommendation:{
      exists:!!next.recommended,
      fingerprint:await fingerprint(next.recommended),
      urgent:!!(next.recommended&&next.recommended.urgent),
      department:text(next.recommended&&next.recommended.department),
      priority:text(next.recommended&&next.recommended.priority),
      dueIso:text(next.recommended&&next.recommended.dueIso),
      reason:text(next.reason)
    },
    limitations:{
      activeTaskAuthorityConnected:false,
      employeeAvailabilityConnected:false,
      designReadinessConnected:false,
      materialReadinessConnected:false,
      machineReadinessConnected:false
    },
    piiExposed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    writesAccepted:false,
    d1Mutation:false,
    employeeAssignment:false,
    generatedAt:new Date().toISOString()
  };
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET')return json({success:false,code:'METHOD_NOT_ALLOWED'},405);
    if(path==='/'||path==='/health'){
      let database=false;
      try{
        const r=await env.DB.prepare('SELECT 1 AS ok').first();
        database=!!(r&&Number(r.ok)===1);
      }catch(err){}
      return json({
        success:true,
        service:'autonomous-printshop-production-shadow',
        database,
        mode:'PRODUCTION_SHADOW_READ_ONLY',
        writesAccepted:false,
        d1Mutation:false,
        employeeAssignment:false,
        piiExposed:false
      });
    }
    if(path==='/snapshot'){
      try{
        const body=await snapshot(env);
        return json(body,body.success?200:503);
      }catch(err){
        return json({
          success:false,
          code:'SHADOW_SNAPSHOT_ERROR',
          message:text(err&&err.message),
          writesAccepted:false,
          d1Mutation:false
        },502);
      }
    }
    return json({success:false,code:'NOT_FOUND'},404);
  }
};

export { snapshot };
