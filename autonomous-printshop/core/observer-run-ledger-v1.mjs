function text(v){return String(v==null?'':v).trim();}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function boolInt(v){return v===true||v===1?1:0;}

export async function recordObserverRunV1(db,input={}){
  if(!db||typeof db.prepare!=='function') throw new Error('OBSERVER_RUN_DB_REQUIRED');

  const runId=text(input.runId);
  const triggerKind=text(input.triggerKind||'CRON').toUpperCase();
  const status=text(input.status).toUpperCase();
  const startedAtMs=num(input.startedAtMs);
  const completedAtMs=num(input.completedAtMs);

  if(!runId) throw new Error('OBSERVER_RUN_ID_REQUIRED');
  if(!['CRON','MANUAL_DIAGNOSTIC'].includes(triggerKind)) throw new Error('OBSERVER_TRIGGER_KIND_INVALID');
  if(!['SUCCESS','SKIPPED','ERROR'].includes(status)) throw new Error('OBSERVER_RUN_STATUS_INVALID');
  if(!startedAtMs||!completedAtMs||completedAtMs<startedAtMs) throw new Error('OBSERVER_RUN_TIME_INVALID');

  const result=await db.prepare(`
    INSERT OR IGNORE INTO autonomy_observer_runs (
      run_id,trigger_kind,status,state,reason,
      baseline_candidates,strict_candidates,evidence_rows,
      event_inserted,decision,recommended_decision,error_code,
      started_at_ms,completed_at_ms
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    runId,
    triggerKind,
    status,
    text(input.state),
    text(input.reason),
    Math.max(0,num(input.baselineCandidates)),
    Math.max(0,num(input.strictCandidates)),
    Math.max(0,num(input.evidenceRows)),
    boolInt(input.eventInserted),
    text(input.decision),
    text(input.recommendedDecision),
    text(input.errorCode),
    startedAtMs,
    completedAtMs
  ).run();

  return {
    success:true,
    runId,
    inserted:Number(result&&result.meta&&result.meta.changes||0)>0
  };
}

export async function latestObserverRunV1(db){
  if(!db||typeof db.prepare!=='function') throw new Error('OBSERVER_RUN_DB_REQUIRED');
  const row=await db.prepare(`
    SELECT run_id AS runId,
           trigger_kind AS triggerKind,
           status,
           state,
           reason,
           baseline_candidates AS baselineCandidates,
           strict_candidates AS strictCandidates,
           evidence_rows AS evidenceRows,
           event_inserted AS eventInserted,
           decision,
           recommended_decision AS recommendedDecision,
           error_code AS errorCode,
           started_at_ms AS startedAtMs,
           completed_at_ms AS completedAtMs
      FROM autonomy_observer_runs
     ORDER BY started_at_ms DESC,run_id DESC
     LIMIT 1
  `).first();

  if(!row) return null;
  return {
    runId:text(row.runId),
    triggerKind:text(row.triggerKind),
    status:text(row.status),
    state:text(row.state),
    reason:text(row.reason),
    baselineCandidates:num(row.baselineCandidates),
    strictCandidates:num(row.strictCandidates),
    evidenceRows:num(row.evidenceRows),
    eventInserted:num(row.eventInserted)===1,
    decision:text(row.decision),
    recommendedDecision:text(row.recommendedDecision),
    errorCode:text(row.errorCode),
    startedAtMs:num(row.startedAtMs),
    completedAtMs:num(row.completedAtMs)
  };
}
