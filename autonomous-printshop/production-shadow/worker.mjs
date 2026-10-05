import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from '../core/operational-reality-v1.mjs';

function text(v){return String(v==null?'':v).trim();}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store'
    }
  });
}
function parseSqliteUtc(v){
  const raw=text(v);
  if(!raw)return 0;
  const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)?raw.replace(' ','T')+'Z':raw;
  const ms=Date.parse(normalized);
  return Number.isFinite(ms)?ms:0;
}
function backfillMaxAgeSeconds(env){
  const n=Number(env&&env.AUTONOMOUS_SHADOW_BACKFILL_MAX_AGE_SECONDS);
  return Number.isFinite(n)?Math.max(3600,Math.min(604800,Math.trunc(n))):172800;
}

async function qualification(env){
  const required=[
    'employee_core_orders_v1',
    'employee_core_lines_v1',
    'employee_core_archive_lines_v1',
    'employee_zero_google_backfill_runs_v1',
    'employee_zero_google_parity_v1',
    't12_prod_orders',
    't12_prod_lines',
    't12_prod_line_runtime',
    't12_legacy_line_runtime'
  ];
  const placeholders=required.map(()=>'?').join(',');
  const tables=await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`
  ).bind(...required).all();
  const present=new Set((tables.results||[]).map(r=>text(r.name)));
  const missing=required.filter(x=>!present.has(x));
  if(missing.length)return {ok:false,reason:'REQUIRED_TABLES_MISSING',missing};

  const run=await env.DB.prepare(`
    SELECT run_id AS runId,
           source_snapshot_sha256 AS sourceSnapshotSha256,
           status,
           completed_at AS completedAt
      FROM employee_zero_google_backfill_runs_v1
     WHERE mode='APPLY' AND status='COMMITTED'
     ORDER BY completed_at DESC
     LIMIT 1
  `).first();
  if(!run)return {ok:false,reason:'COMMITTED_BACKFILL_MISSING'};

  const parity=await env.DB.prepare(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN pass=1 THEN 1 ELSE 0 END) AS passed,
           SUM(CASE WHEN pass<>1 THEN 1 ELSE 0 END) AS failed
      FROM employee_zero_google_parity_v1
     WHERE run_id=?
  `).bind(text(run.runId)).first();
  const total=num(parity&&parity.total),failed=num(parity&&parity.failed);
  if(total<=0||failed>0){
    return {
      ok:false,
      reason:'BACKFILL_PARITY_NOT_QUALIFIED',
      runId:text(run.runId),
      parity:{total,passed:num(parity&&parity.passed),failed}
    };
  }

  const completedMs=parseSqliteUtc(run.completedAt);
  const ageSeconds=completedMs?Math.max(0,Math.round((Date.now()-completedMs)/1000)):Number.MAX_SAFE_INTEGER;
  const maxAgeSeconds=backfillMaxAgeSeconds(env);
  if(ageSeconds>maxAgeSeconds){
    return {
      ok:false,
      reason:'BACKFILL_TOO_OLD_FOR_SHADOW',
      runId:text(run.runId),
      completedAt:text(run.completedAt),
      ageSeconds,
      maxAgeSeconds,
      parity:{total,passed:num(parity&&parity.passed),failed}
    };
  }

  return {
    ok:true,
    mode:'entry615-backfill+t12-runtime-overlays',
    runId:text(run.runId),
    sourceSnapshotSha256:text(run.sourceSnapshotSha256),
    completedAt:text(run.completedAt),
    ageSeconds,
    maxAgeSeconds,
    parity:{total,passed:num(parity&&parity.passed),failed}
  };
}

async function currentRows(env){
  const [imported,native]=await Promise.all([
    env.DB.prepare(`
      SELECT l.line_id AS lineId,
             l.order_id AS orderId,
             l.department,
             l.item_name AS itemName,
             l.assigned_to AS assignedTo,
             l.priority,
             COALESCE(lr.status,l.status) AS status,
             l.heat_press AS heatPress,
             l.fly_print AS flyPrint,
             l.expected_delivery_at AS expectedDeliveryAt,
             COALESCE(lr.updated_at,l.updated_at) AS updatedAt,
             'entry615-import+legacy-runtime' AS sourceKind
        FROM employee_core_lines_v1 l
        JOIN employee_core_orders_v1 o ON o.order_id=l.order_id
        LEFT JOIN t12_legacy_line_runtime lr
          ON lr.line_id=l.line_id AND lr.order_id=l.order_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE l.active=1
         AND o.active=1
         AND a.line_id IS NULL
       ORDER BY l.source_row
    `).all(),
    env.DB.prepare(`
      SELECT l.line_id AS lineId,
             l.order_id AS orderId,
             l.department,
             l.item_name AS itemName,
             l.assigned_to AS assignedTo,
             l.priority,
             COALESCE(r.status,l.status) AS status,
             l.heat_press AS heatPress,
             l.fly_print AS flyPrint,
             '' AS expectedDeliveryAt,
             COALESCE(r.updated_at,l.updated_at) AS updatedAt,
             't12-native+runtime' AS sourceKind
        FROM t12_prod_lines l
        JOIN t12_prod_orders o ON o.order_id=l.order_id
        LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE a.line_id IS NULL
       ORDER BY o.created_at,l.ordinal
    `).all()
  ]);

  const byLine=new Map();
  for(const r of imported.results||[])byLine.set(text(r.lineId),r);
  for(const r of native.results||[])byLine.set(text(r.lineId),r);

  return [...byLine.values()].map(r=>({
    orderId:text(r.orderId),
    lineId:text(r.lineId),
    department:text(r.department),
    itemName:text(r.itemName),
    assignedTo:text(r.assignedTo),
    priority:text(r.priority)||'عادي',
    status:text(r.status)||'طلب جديد',
    heatPress:Number(r.heatPress||0)===1,
    flyPrint:Number(r.flyPrint||0)===1,
    expectedDeliveryAt:text(r.expectedDeliveryAt),
    updatedAt:text(r.updatedAt),
    sourceKind:text(r.sourceKind)
  }));
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
function sourceKindCounts(rows){
  const out={};
  for(const r of rows||[]){
    const k=text(r.sourceKind)||'unknown';
    out[k]=(out[k]||0)+1;
  }
  return out;
}

async function snapshot(env){
  const qualified=await qualification(env);
  if(!qualified.ok){
    return {
      success:false,
      mode:'PRODUCTION_SHADOW_READ_ONLY',
      code:'SOURCE_NOT_QUALIFIED',
      source:qualified,
      writesAccepted:false,
      d1Mutation:false
    };
  }

  const rows=await currentRows(env);
  const reality=buildOperationalRealityV1(rows,{});
  const next=recommendNextTaskV1(rows,{});
  return {
    success:true,
    mode:'PRODUCTION_SHADOW_READ_ONLY',
    source:{
      authority:'trendos-main-d1',
      qualificationMode:qualified.mode,
      backfillRunId:qualified.runId,
      backfillCompletedAt:qualified.completedAt,
      backfillAgeSeconds:qualified.ageSeconds,
      parity:qualified.parity,
      rowCount:rows.length,
      sourceKinds:sourceKindCounts(rows)
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
      machineReadinessConnected:false,
      nativeOrderDueDatePersisted:false
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
      }catch{}
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

export { snapshot, qualification, currentRows };
