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
function expectedSnapshotSha(env){
  return text(env&&env.AUTONOMOUS_SHADOW_EXPECTED_BACKFILL_SHA256).toLowerCase();
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
           target_counts_json AS targetCountsJson,
           status,
           completed_at AS completedAt
      FROM employee_zero_google_backfill_runs_v1
     WHERE mode='APPLY' AND status='COMMITTED'
     ORDER BY completed_at DESC
     LIMIT 1
  `).first();
  if(!run)return {ok:false,reason:'COMMITTED_BACKFILL_MISSING'};

  const expectedSha=expectedSnapshotSha(env);
  const actualSha=text(run.sourceSnapshotSha256).toLowerCase();
  if(!expectedSha||actualSha!==expectedSha){
    return {
      ok:false,
      reason:'BACKFILL_SNAPSHOT_SHA_MISMATCH',
      runId:text(run.runId),
      expectedShaConfigured:!!expectedSha
    };
  }

  let targets={};
  try{targets=JSON.parse(text(run.targetCountsJson)||'{}');}
  catch{return {ok:false,reason:'BACKFILL_TARGET_COUNTS_INVALID',runId:text(run.runId)};}

  const actual=await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM employee_core_orders_v1) AS coreOrders,
      (SELECT COUNT(*) FROM employee_core_lines_v1) AS coreLines,
      (SELECT COUNT(*) FROM employee_core_archive_orders_v1) AS archiveOrders,
      (SELECT COUNT(*) FROM employee_core_archive_lines_v1) AS archiveLines,
      (SELECT COUNT(*) FROM employee_core_lines_v1 i
         JOIN t12_prod_lines n ON n.line_id=i.line_id) AS overlappingLineIds,
      (SELECT COUNT(DISTINCT i.order_id) FROM employee_core_orders_v1 i
         JOIN t12_prod_orders n ON n.order_id=i.order_id) AS overlappingOrderIds
  `).first();

  const expectedCounts={
    coreOrders:num(targets.employee_core_orders_v1,-1),
    coreLines:num(targets.employee_core_lines_v1,-1),
    archiveOrders:num(targets.employee_core_archive_orders_v1,-1),
    archiveLines:num(targets.employee_core_archive_lines_v1,-1)
  };
  const actualCounts={
    coreOrders:num(actual&&actual.coreOrders,-1),
    coreLines:num(actual&&actual.coreLines,-1),
    archiveOrders:num(actual&&actual.archiveOrders,-1),
    archiveLines:num(actual&&actual.archiveLines,-1)
  };
  const countsMatch=Object.keys(expectedCounts).every(k=>
    expectedCounts[k]>=0&&actualCounts[k]===expectedCounts[k]
  );
  if(!countsMatch){
    return {
      ok:false,
      reason:'BACKFILL_TARGET_COUNT_MISMATCH',
      runId:text(run.runId),
      expectedCounts,
      actualCounts
    };
  }
  if(num(actual&&actual.overlappingLineIds)>0||num(actual&&actual.overlappingOrderIds)>0){
    return {
      ok:false,
      reason:'BACKFILL_NATIVE_IDENTITY_OVERLAP',
      runId:text(run.runId),
      overlappingLineIds:num(actual&&actual.overlappingLineIds),
      overlappingOrderIds:num(actual&&actual.overlappingOrderIds)
    };
  }

  const parity=await env.DB.prepare(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN pass=1 THEN 1 ELSE 0 END) AS passed,
           SUM(CASE WHEN pass<>1 THEN 1 ELSE 0 END) AS failed
      FROM employee_zero_google_parity_v1
     WHERE run_id=?
  `).bind(text(run.runId)).first();
  const parityRows=num(parity&&parity.total);
  const parityFailed=num(parity&&parity.failed);
  if(parityRows>0&&parityFailed>0){
    return {
      ok:false,
      reason:'BACKFILL_PARITY_ROW_FAILURE',
      runId:text(run.runId),
      parity:{total:parityRows,passed:num(parity&&parity.passed),failed:parityFailed}
    };
  }

  const completedMs=parseSqliteUtc(run.completedAt);
  const ageSeconds=completedMs?Math.max(0,Math.round((Date.now()-completedMs)/1000)):null;

  return {
    ok:true,
    mode:'entry615-committed-count-qualified+t12-runtime-overlays',
    runId:text(run.runId),
    sourceSnapshotSha256:actualSha,
    completedAt:text(run.completedAt),
    ageSeconds,
    expectedCounts,
    actualCounts,
    identityOverlap:{lines:0,orders:0},
    parityTable:{
      rows:parityRows,
      passed:num(parity&&parity.passed),
      failed:parityFailed,
      optionalBecauseCommittedRunCountsAreQualified:parityRows===0
    }
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
      targetCountsQualified:true,
      identityOverlap:qualified.identityOverlap,
      parityTable:qualified.parityTable,
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
