// Owner-scoped Cloudflare D1 native T12 bulk-status writer. Default OFF.
// Imported Google/Core rows are NEVER updated by this module.
// Bounded 20 native lines per HTTP call, atomic changes + ledger + events.
// No external Google, finance or customer network calls.
export const T12_BULK_STATUS_V2='T12_NATIVE_BULK_STATUS_BATCH_V2';
export const T12_BULK_COUNT_ACTION='getBulkStatusEligibilityV1';
export const T12_BULK_ACTION='bulkUpdateDepartmentStatusV1926';
const STATUSES=new Set(['طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام','تم التسليم','متوقف','مكرر','ملغى']);
const txt=v=>String(v==null?'':v).trim();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
export const enabled=env=>env?.TRENDOS_T12_NATIVE_BULK_STATUS_V2_ENABLED==='true';
function valid(screen,from,to){
  return ['print','laser'].includes(txt(screen)) && STATUSES.has(txt(from)) &&
    STATUSES.has(txt(to)) && from!==to;
}
function denial(code){return {success:false,code,version:T12_BULK_STATUS_V2};}
async function snapshot(env,screen,fromStatus,toStatus,coreRows){
  // Read archive ORDER and partial LINE membership separately to avoid changing
  // an active line of a partially archived order. Never alter historic imports.
  const [rows,archiveOrders,archiveLines]=await Promise.all([
    coreRows(env,screen),
    env.DB.prepare('SELECT order_id AS orderId FROM employee_core_archive_orders_v1').all(),
    env.DB.prepare('SELECT DISTINCT order_id AS orderId FROM employee_core_archive_lines_v1').all()
  ]);
  const closed=new Set((archiveOrders.results||[]).map(x=>txt(x.orderId)));
  const partial=new Set((archiveLines.results||[]).map(x=>txt(x.orderId)));
  const native=(rows||[]).filter(r=>r.sourceKind==='t12-prod'&&txt(r.status)===fromStatus);
  const legacyExcluded=(rows||[]).filter(r=>r.sourceKind!=='t12-prod'&&txt(r.status)===fromStatus).length;
  const excludedArchived=native.filter(r=>closed.has(txt(r.orderId))||partial.has(txt(r.orderId)));
  const available=native.filter(r=>!closed.has(txt(r.orderId))&&!partial.has(txt(r.orderId)));
  const blocked=toStatus==='تم التسليم'?available.filter(r=>r.deliveryDebtRestricted):[];
  const eligible=available.filter(r=>!blocked.includes(r)).sort((a,b)=>
    txt(a.orderId).localeCompare(txt(b.orderId),'en',{numeric:true})||
    txt(a.lineId).localeCompare(txt(b.lineId),'en',{numeric:true}));
  return {eligible,legacyExcluded,excludedArchived:excludedArchived.length,
    skippedDebt:blocked.length,eligibleOrders:new Set(eligible.map(r=>r.orderId)).size};
}
export async function nativeBulkStatusEligibilityV2(env,user,body,coreRows,screenAllowed){
  if(!enabled(env))return denial('native-bulk-status-v2-off');
  const screen=txt(body.screen),fromStatus=txt(body.fromStatus),toStatus=txt(body.toStatus);
  if(!screenAllowed(user,screen))return denial('bulk-screen-forbidden');
  if(!valid(screen,fromStatus,toStatus))return denial('bulk-status-invalid');
  try{
    const s=await snapshot(env,screen,fromStatus,toStatus,coreRows);
    return {success:true,available:true,version:T12_BULK_STATUS_V2,
      screen,fromStatus,toStatus,eligibleLines:s.eligible.length,eligibleOrders:s.eligibleOrders,
      blockedDebtLines:s.skippedDebt,excludedArchivedLines:s.excludedArchived,
      excludedHistoricalLines:s.legacyExcluded,source:'original-t12-d1'};
  }catch{return denial('native-bulk-eligibility-unavailable');}
}
export async function nativeBulkStatusV2(env,user,body,coreRows,screenAllowed){
  if(!enabled(env))return denial('native-bulk-status-v2-off');
  const screen=txt(body.screen),fromStatus=txt(body.fromStatus),toStatus=txt(body.toStatus),
    requestId=txt(body.requestId),actor=txt(user.username);
  if(!screenAllowed(user,screen))return denial('bulk-screen-forbidden');
  if(!valid(screen,fromStatus,toStatus))return denial('bulk-status-invalid');
  if(!/^[a-zA-Z0-9:._-]{12,80}$/.test(requestId))return denial('bulk-request-id-invalid');
  const canonical=JSON.stringify({screen,fromStatus,toStatus});
  let old;
  try{old=await env.DB.prepare(
    'SELECT action,actor,canonical_json AS canonicalJson,response_json AS responseJson,status FROM employee_core_request_ledger_v1 WHERE request_key=?'
  ).bind(requestId).first();}
  catch{return denial('native-bulk-ledger-read-failed');}
  if(old){
    if(txt(old.action)!==T12_BULK_ACTION||txt(old.actor)!==actor||
      txt(old.canonicalJson)!==canonical)return denial('request-id-payload-mismatch');
    if(txt(old.status)==='COMMITTED'){
      try{return {...JSON.parse(old.responseJson),idempotent:true};}
      catch{return denial('native-bulk-ledger-replay-corrupt');}
    }
    return denial('native-bulk-request-in-flight');
  }
  let snap;
  try{snap=await snapshot(env,screen,fromStatus,toStatus,coreRows);}
  catch{return denial('native-bulk-candidates-unavailable');}
  const selected=snap.eligible.slice(0,20),changed=selected.length;
  const remainingBefore=snap.eligible.length-changed;
  const summary={success:true,version:T12_BULK_STATUS_V2,
    changed,affectedOrders:new Set(selected.map(r=>r.orderId)).size,
    skippedDebt:snap.skippedDebt,excludedArchivedLines:snap.excludedArchived,
    excludedHistoricalLines:snap.legacyExcluded,
    remainingEligible:remainingBefore,hasMore:remainingBefore>0,
    screen,fromStatus,toStatus,requestId,cloudNative:true,googleBusinessCalls:0,
    message:changed
      ?'تم تحويل '+changed+' بند سحابي. المتبقي المؤهل: '+remainingBefore+
       (snap.skippedDebt?'؛ محظور بالمديونية: '+snap.skippedDebt:'')
      :'لا توجد بنود سحابية مؤهلة للتحويل لهذه الحالة.'};
  const statements=[];
  // Each preflight insert enforces original live status, no archived order or line,
  // and no new partial archive. If a row changed after read, NOT NULL actor aborts
  // the ENTIRE SQLite D1.batch, so no partial/misreported operation can commit.
  for(const row of selected){
    const context=JSON.stringify({orderId:row.orderId,screen,requestId,
      oldStatus:fromStatus,newStatus:toStatus,phase:'native-guard'});
    statements.push(env.DB.prepare(`
      INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json)
      SELECT 'native-bulk-preflight','line',?,
       CASE WHEN EXISTS(
         SELECT 1 FROM t12_prod_lines l
         LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
         WHERE l.line_id=? AND l.order_id=?
         AND COALESCE(r.status,l.status)=?
         AND NOT EXISTS(SELECT 1 FROM employee_core_archive_orders_v1 a WHERE a.order_id=l.order_id)
         AND NOT EXISTS(SELECT 1 FROM employee_core_archive_lines_v1 a WHERE a.order_id=l.order_id)
       ) THEN ? ELSE NULL END,?
    `).bind(row.lineId,row.lineId,row.orderId,fromStatus,actor,context));
    statements.push(env.DB.prepare(`
      INSERT INTO t12_prod_line_runtime(line_id,order_id,status,notes,updated_by,version,updated_at)
      VALUES(?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(line_id) DO UPDATE SET status=excluded.status,
        updated_by=excluded.updated_by,version=t12_prod_line_runtime.version+1,
        updated_at=CURRENT_TIMESTAMP
    `).bind(row.lineId,row.orderId,toStatus,row.notes||'',actor));
    statements.push(env.DB.prepare(`
      INSERT INTO t12_prod_runtime_events(order_id,line_id,event_type,old_status,new_status,actor,payload_json)
      VALUES(?,?,?,?,?,?,?)
    `).bind(row.orderId,row.lineId,'bulk-status',fromStatus,toStatus,actor,
      JSON.stringify({screen,requestId,nativeBatchV2:true})));
  }
  if(changed){
    statements.push(env.DB.prepare(
      'UPDATE employee_core_control_v1 SET data_version=data_version+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1'));
    statements.push(env.DB.prepare(
      "INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json) VALUES('bulkUpdateDepartmentStatusV1926','screen',?,?,?)"
    ).bind(screen,actor,JSON.stringify({fromStatus,toStatus,changed,requestId,version:T12_BULK_STATUS_V2})));
  }
  statements.push(env.DB.prepare(`
    INSERT INTO employee_core_request_ledger_v1
      (request_key,action,actor,canonical_json,response_json,status)
    VALUES(?,?,?,?,?,'COMMITTED')
  `).bind(requestId,T12_BULK_ACTION,actor,canonical,JSON.stringify(summary)));
  try{await env.DB.batch(statements);}
  catch{
    // Lost ACK after COMMIT: read the precise committed ledger; never retry
    // writes on ambiguous failure.
    try{
      const r=await env.DB.prepare('SELECT action,actor,canonical_json AS canonicalJson,response_json AS responseJson,status FROM employee_core_request_ledger_v1 WHERE request_key=?')
        .bind(requestId).first();
      if(r?.status==='COMMITTED'&&r?.action===T12_BULK_ACTION&&r?.actor===actor&&
         r?.canonicalJson===canonical)return {...JSON.parse(r.responseJson),idempotent:true};
    }catch{}
    return denial('native-bulk-batch-failed-review');
  }
  // Snapshot-based remaining is an upper bound when concurrent operators work.
  // Re-read the same live eligibility for an accurate count after the batch.
  const next=await nativeBulkStatusEligibilityV2(env,user,body,coreRows,screenAllowed);
  if(next.success){
    summary.remainingEligible=next.eligibleLines;
    summary.hasMore=next.eligibleLines>0;
    summary.skippedDebt=next.blockedDebtLines;
    summary.excludedArchivedLines=next.excludedArchivedLines;
    summary.excludedHistoricalLines=next.excludedHistoricalLines;
  }
  // We deliberately return the ledger-persisted summary in a lost ACK replay;
  // that is safe even if the live remaining count has since changed.
  return summary;
}
