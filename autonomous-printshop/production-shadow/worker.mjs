import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from '../core/operational-reality-v1.mjs';
import {
  buildEmployeeSupervisorShadowV1
} from '../core/employee-supervisor-shadow-v1.mjs';
import {
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';

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
    't12_prod_order_schedule',
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

  const schedule=await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM t12_prod_orders) AS nativeOrders,
      (SELECT COUNT(*) FROM t12_prod_order_schedule) AS scheduleRows,
      (SELECT COUNT(*)
         FROM t12_prod_orders o
         LEFT JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
        WHERE s.order_id IS NULL) AS missingSchedule,
      (SELECT COUNT(*)
         FROM t12_prod_orders o
         JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
        WHERE s.policy_code<>'LEGACY_D0_FLY_D2_STANDARD_V1') AS invalidPolicyRows,
      (SELECT COUNT(*)
         FROM t12_prod_orders o
         JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
        WHERE s.expected_delivery_date <>
          CASE
            WHEN EXISTS(
              SELECT 1 FROM t12_prod_lines l
               WHERE l.order_id=o.order_id AND l.fly_print=1
            )
            THEN date(datetime(o.created_at,'+3 hours'))
            ELSE date(datetime(o.created_at,'+3 hours'),'+2 days')
          END) AS duePolicyMismatches
  `).first();
  const nativeOrders=num(schedule&&schedule.nativeOrders,-1);
  const scheduleRows=num(schedule&&schedule.scheduleRows,-1);
  const missingSchedule=num(schedule&&schedule.missingSchedule,-1);
  const invalidPolicyRows=num(schedule&&schedule.invalidPolicyRows,-1);
  const duePolicyMismatches=num(schedule&&schedule.duePolicyMismatches,-1);
  if(nativeOrders<0||scheduleRows!==nativeOrders||missingSchedule!==0){
    return {
      ok:false,
      reason:'NATIVE_ORDER_SCHEDULE_INCOMPLETE',
      nativeOrders,
      scheduleRows,
      missingSchedule
    };
  }
  if(invalidPolicyRows!==0||duePolicyMismatches!==0){
    return {
      ok:false,
      reason:'NATIVE_ORDER_SCHEDULE_POLICY_MISMATCH',
      nativeOrders,
      invalidPolicyRows,
      duePolicyMismatches
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
    },
    schedule:{
      qualified:true,
      nativeOrders,
      scheduleRows,
      missingSchedule:0,
      policyCode:'LEGACY_D0_FLY_D2_STANDARD_V1',
      policyMismatches:0
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
             COALESCE(s.expected_delivery_date,'') AS expectedDeliveryAt,
             COALESCE(r.updated_at,l.updated_at) AS updatedAt,
             't12-native+runtime' AS sourceKind
        FROM t12_prod_lines l
        JOIN t12_prod_orders o ON o.order_id=l.order_id
        LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
        LEFT JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
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
function supervisorKey(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا')
    .replace(/[ى]/g,'ي')
    .replace(/[ةه]/g,'ه')
    .replace(/\s+/g,' ')
    .trim();
}
function cairoDateKey(nowMs=Date.now()){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Africa/Cairo',
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  }).formatToParts(new Date(nowMs));
  const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return map.year+'-'+map.month+'-'+map.day;
}
async function supervisorInputs(env){
  const names=[
    'employee_hr_employees_v1',
    'employee_attendance_days_v1',
    'employee_attendance_pulses_v1',
    'operator_tasks',
    'operator_task_control'
  ];
  const placeholders=names.map(()=>'?').join(',');
  const present=await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`
  ).bind(...names).all();
  const set=new Set((present.results||[]).map(r=>text(r.name)));
  const missing=names.filter(x=>!set.has(x));
  if(missing.length){
    return {ok:false,reason:'SUPERVISOR_REQUIRED_TABLES_MISSING',missing};
  }

  const dateKey=cairoDateKey();
  const [employeesResult,daysResult,pulsesResult,activeTasksResult,control]=await Promise.all([
    env.DB.prepare(`
      SELECT username,
             display_name AS displayName,
             primary_department AS department,
             status
        FROM employee_hr_employees_v1
       ORDER BY display_name
    `).all(),
    env.DB.prepare(`
      SELECT attendance_id AS attendanceId,
             username_key AS usernameKey,
             username,
             department,
             day_status AS dayStatus,
             ended_at_ms AS endedAtMs
        FROM employee_attendance_days_v1
       WHERE date_key=?
    `).bind(dateKey).all(),
    env.DB.prepare(`
      SELECT p.attendance_id AS attendanceId,
             p.pulse_type AS lastPulse
        FROM employee_attendance_pulses_v1 p
        JOIN (
          SELECT attendance_id, MAX(created_at_ms) AS maxCreated
            FROM employee_attendance_pulses_v1
           GROUP BY attendance_id
        ) x
          ON x.attendance_id=p.attendance_id
         AND x.maxCreated=p.created_at_ms
        JOIN employee_attendance_days_v1 d
          ON d.attendance_id=p.attendance_id
       WHERE d.date_key=?
    `).bind(dateKey).all(),
    env.DB.prepare(`
      SELECT task_id AS taskId,
             operator_id AS operatorId,
             status
        FROM operator_tasks
       WHERE task_type='ORDINARY'
         AND status='ACTIVE'
    `).all(),
    env.DB.prepare(`
      SELECT mode,
             canary_operator_id AS canaryOperatorId,
             epoch
        FROM operator_task_control
       WHERE singleton_id=1
       LIMIT 1
    `).first()
  ]);

  const pulseByAttendance=new Map(
    (pulsesResult.results||[]).map(r=>[text(r.attendanceId),text(r.lastPulse)])
  );
  const dayByKey=new Map();
  for(const row of daysResult.results||[]){
    const value={
      started:true,
      dayStatus:text(row.dayStatus),
      endedAtMs:row.endedAtMs==null?null:Number(row.endedAtMs),
      lastPulse:pulseByAttendance.get(text(row.attendanceId))||'start'
    };
    dayByKey.set(supervisorKey(row.usernameKey),value);
    dayByKey.set(supervisorKey(row.username),value);
  }

  const employees=(employeesResult.results||[]).map(r=>({
    operatorId:text(r.username),
    username:text(r.username),
    displayName:text(r.displayName),
    department:text(r.department),
    status:text(r.status)
  }));

  const attendanceByOperator={};
  for(const employee of employees){
    const state=dayByKey.get(supervisorKey(employee.username))||null;
    if(state){
      attendanceByOperator[supervisorKey(employee.username)]=state;
      attendanceByOperator[supervisorKey(employee.displayName)]=state;
    }
  }

  return {
    ok:true,
    dateKey,
    employees,
    attendanceByOperator,
    activeTasks:(activeTasksResult.results||[]).map(r=>({
      taskId:text(r.taskId),
      operatorId:text(r.operatorId),
      status:text(r.status)
    })),
    control:{
      mode:text(control&&control.mode)||'OFF',
      epoch:num(control&&control.epoch),
      canaryConfigured:!!text(control&&control.canaryOperatorId)
    }
  };
}
async function supervisorSnapshot(env,rows){
  const inputs=await supervisorInputs(env);
  if(!inputs.ok){
    return {
      success:false,
      mode:'EMPLOYEE_SUPERVISOR_SHADOW',
      code:inputs.reason,
      missing:inputs.missing||[],
      writesAccepted:false,
      employeeAssignment:false
    };
  }

  const internal=buildEmployeeSupervisorShadowV1({
    rows,
    employees:inputs.employees,
    attendanceByOperator:inputs.attendanceByOperator,
    activeTasks:inputs.activeTasks
  });

  const availability={available:0,unavailable:0,reviewRequired:0,ended:0,notStarted:0};
  const departments={};
  const departmentSources={};
  let recommendations=0;
  let activeTaskOperators=0;

  for(const op of internal.operators){
    const state=text(op.availability&&op.availability.state);
    if(state==='AVAILABLE') availability.available+=1;
    else availability.unavailable+=1;
    if(state==='REVIEW_REQUIRED') availability.reviewRequired+=1;
    if(state==='ENDED') availability.ended+=1;
    if(state==='NOT_STARTED') availability.notStarted+=1;
    if(op.activeTask) activeTaskOperators+=1;
    if(op.recommendation&&op.recommendation.recommended) recommendations+=1;
    const source=text(op.departmentSource)||'UNKNOWN';
    departmentSources[source]=(departmentSources[source]||0)+1;

    const dept=text(op.department)||'UNSPECIFIED';
    if(!departments[dept]){
      departments[dept]={
        operators:0,
        availableOperators:0,
        assignedRows:0,
        ordinary:0,
        inProgress:0,
        exceptions:0,
        recommendations:0
      };
    }
    const d=departments[dept];
    d.operators+=1;
    if(state==='AVAILABLE') d.availableOperators+=1;
    d.assignedRows+=num(op.assignedRowCount);
    d.ordinary+=num(op.reality&&op.reality.counts&&op.reality.counts.ordinary);
    d.inProgress+=num(op.reality&&op.reality.counts&&op.reality.counts.inProgress);
    d.exceptions+=num(op.reality&&op.reality.counts&&op.reality.counts.exceptions);
    if(op.recommendation&&op.recommendation.recommended) d.recommendations+=1;
  }

  return {
    success:true,
    mode:'EMPLOYEE_SUPERVISOR_SHADOW',
    supervisorCoreVersion:text(internal.version),
    routingMode:internal.mode,
    dateKey:inputs.dateKey,
    operatorTaskControl:inputs.control,
    operatorCounts:{
      total:internal.operators.length,
      ...availability,
      withActiveTask:activeTaskOperators,
      withRecommendation:recommendations
    },
    assignmentCoverage:internal.assignmentCoverage,
    departmentSources,
    departments,
    unassigned:{
      counts:internal.unassignedReality.counts
    },
    piiExposed:false,
    employeeIdentityExposed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    writesAccepted:false,
    d1Mutation:false,
    employeeAssignment:false,
    generatedAt:new Date().toISOString()
  };
}

async function readinessInputs(env){
  const names=[
    'autonomous_readiness_control',
    'autonomous_readiness_evidence'
  ];
  const placeholders=names.map(()=>'?').join(',');
  const present=await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`
  ).bind(...names).all();
  const set=new Set((present.results||[]).map(r=>text(r.name)));
  const missing=names.filter(x=>!set.has(x));
  if(missing.length){
    return {ok:false,reason:'READINESS_REQUIRED_TABLES_MISSING',missing};
  }

  const [control,evidenceResult]=await Promise.all([
    env.DB.prepare(`
      SELECT mode,
             canary_operator_id AS canaryOperatorId,
             require_design AS requireDesign,
             require_material AS requireMaterial,
             require_machine AS requireMachine,
             epoch
        FROM autonomous_readiness_control
       WHERE singleton_id=1
       LIMIT 1
    `).first(),
    env.DB.prepare(`
      SELECT evidence_id AS evidenceId,
             line_id AS lineId,
             evidence_kind AS evidenceKind,
             evidence_state AS evidenceState,
             source_kind AS sourceKind,
             source_ref AS sourceRef,
             source_version AS sourceVersion,
             confidence,
             observed_at_ms AS observedAtMs,
             expires_at_ms AS expiresAtMs
        FROM autonomous_readiness_evidence
       WHERE expires_at_ms IS NULL OR expires_at_ms>?
       ORDER BY observed_at_ms DESC
    `).bind(Date.now()).all()
  ]);

  return {
    ok:true,
    control:{
      mode:text(control&&control.mode)||'OFF',
      epoch:num(control&&control.epoch),
      canaryConfigured:!!text(control&&control.canaryOperatorId),
      requireDesign:num(control&&control.requireDesign,1)===1,
      requireMaterial:num(control&&control.requireMaterial,1)===1,
      requireMachine:num(control&&control.requireMachine,1)===1
    },
    evidence:(evidenceResult.results||[]).map(r=>({
      evidenceId:text(r.evidenceId),
      lineId:text(r.lineId),
      evidenceKind:text(r.evidenceKind),
      evidenceState:text(r.evidenceState),
      sourceKind:text(r.sourceKind),
      sourceRef:text(r.sourceRef),
      sourceVersion:text(r.sourceVersion),
      confidence:Number(r.confidence||0),
      observedAtMs:Number(r.observedAtMs||0),
      expiresAtMs:r.expiresAtMs==null?null:Number(r.expiresAtMs)
    }))
  };
}

async function readinessSnapshot(env,rows){
  const inputs=await readinessInputs(env);
  if(!inputs.ok){
    return {
      success:false,
      mode:'READINESS_SHADOW',
      code:inputs.reason,
      missing:inputs.missing||[],
      writesAccepted:false,
      d1Mutation:false,
      employeeAssignment:false
    };
  }

  const baseline=buildOperationalRealityV1(rows,{});
  const candidateRows=baseline.ordinary.map(x=>x.raw||x);
  const requiredKinds=[];
  if(inputs.control.requireDesign) requiredKinds.push('design');
  if(inputs.control.requireMaterial) requiredKinds.push('material');
  if(inputs.control.requireMachine) requiredKinds.push('machine');

  const strict=buildReadinessQualifiedRealityV1(
    candidateRows,
    inputs.evidence,
    {requiredKinds}
  );

  return {
    success:true,
    mode:'READINESS_SHADOW',
    evaluationMode:'STRICT_FAIL_CLOSED',
    control:inputs.control,
    baselineCandidates:candidateRows.length,
    evidenceRows:inputs.evidence.length,
    requiredKinds,
    coverage:strict.coverage,
    strictCounts:strict.reality.counts,
    strictExceptionCounts:sanitizedExceptionCounts(strict.reality.exceptions),
    strictRecommendation:{
      exists:!!strict.recommendation.recommended,
      fingerprint:await fingerprint(strict.recommendation.recommended),
      department:text(strict.recommendation.recommended&&strict.recommendation.recommended.department),
      priority:text(strict.recommendation.recommended&&strict.recommendation.recommended.priority),
      dueIso:text(strict.recommendation.recommended&&strict.recommendation.recommended.dueIso),
      reason:text(strict.recommendation.reason)
    },
    piiExposed:false,
    employeeIdentityExposed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    writesAccepted:false,
    d1Mutation:false,
    employeeAssignment:false,
    generatedAt:new Date().toISOString()
  };
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
      schedule:qualified.schedule,
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
      nativeOrderDueDatePersisted:true
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
    if(path==='/supervisor'){
      try{
        const qualified=await qualification(env);
        if(!qualified.ok){
          return json({
            success:false,
            mode:'EMPLOYEE_SUPERVISOR_SHADOW',
            code:'SOURCE_NOT_QUALIFIED',
            source:qualified,
            writesAccepted:false,
            d1Mutation:false,
            employeeAssignment:false
          },503);
        }
        const rows=await currentRows(env);
        const body=await supervisorSnapshot(env,rows);
        return json(body,body.success?200:503);
      }catch(err){
        return json({
          success:false,
          mode:'EMPLOYEE_SUPERVISOR_SHADOW',
          code:'SUPERVISOR_SHADOW_ERROR',
          message:text(err&&err.message),
          writesAccepted:false,
          d1Mutation:false,
          employeeAssignment:false
        },502);
      }
    }
    if(path==='/readiness'){
      try{
        const qualified=await qualification(env);
        if(!qualified.ok){
          return json({
            success:false,
            mode:'READINESS_SHADOW',
            code:'SOURCE_NOT_QUALIFIED',
            source:qualified,
            writesAccepted:false,
            d1Mutation:false,
            employeeAssignment:false
          },503);
        }
        const rows=await currentRows(env);
        const body=await readinessSnapshot(env,rows);
        return json(body,body.success?200:503);
      }catch(err){
        return json({
          success:false,
          mode:'READINESS_SHADOW',
          code:'READINESS_SHADOW_ERROR',
          message:text(err&&err.message),
          writesAccepted:false,
          d1Mutation:false,
          employeeAssignment:false
        },502);
      }
    }
    return json({success:false,code:'NOT_FOUND'},404);
  }
};

export { snapshot, qualification, currentRows, supervisorSnapshot, supervisorInputs, readinessSnapshot, readinessInputs };
