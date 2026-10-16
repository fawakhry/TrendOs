// BOOK28-CORE-RECOVERY-LEGACY-PREPARED
// Diagnostic only. No write statement, no mutation, no auto-replay, no
// inferred success. The caller must independently enforce verified admin auth.
function boundedInt(value,defaultValue,min,max){
  const n=Number(value);
  return Number.isSafeInteger(n)?Math.max(min,Math.min(max,n)):defaultValue;
}
function asCount(value){const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:0;}
function safeText(value){return String(value??'').trim();}

/**
 * Inventory legacy Core PREPARED requests with non-PII evidence counts.
 * PREPARED does not prove that the business mutation failed OR succeeded.
 * The two archive counts are snapshots, not a complete mutation audit.
 * NEVER change ledger status or automatically replay based on this result.
 */
export async function readCorePreparedRequestsV1(env,options={}){
  const page=boundedInt(options.page,1,1,50);
  const pageSize=boundedInt(options.pageSize,20,1,50);
  const offset=(page-1)*pageSize;
  const counter=await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM employee_core_request_ledger_v1 WHERE status='PREPARED'"
  ).first();
  const result=await env.DB.prepare(`
    SELECT l.request_key AS requestKey,l.action,l.created_at AS createdAt,
      (SELECT COUNT(*) FROM employee_core_archive_lines_v1 al
       WHERE al.request_key=l.request_key) AS archiveLineCount,
      (SELECT COUNT(*) FROM employee_core_archive_orders_v1 ao
       WHERE ao.request_key=l.request_key) AS archiveOrderCount
    FROM employee_core_request_ledger_v1 l
    WHERE l.status='PREPARED'
    ORDER BY l.created_at ASC,l.request_key ASC
    LIMIT ? OFFSET ?
  `).bind(pageSize,offset).all();
  const rows=(result.results||[]).map(row=>{
    const action=safeText(row.action);
    const archiveLineCount=asCount(row.archiveLineCount);
    const archiveOrderCount=asCount(row.archiveOrderCount);
    return {
      requestId:safeText(row.requestKey),
      action,createdAt:safeText(row.createdAt),
      archiveLineCount,archiveOrderCount,
      evidenceCategory:action==='archiveDeliveredDepartmentV1926'
        ?(archiveLineCount||archiveOrderCount
          ?'ARCHIVE_SNAPSHOTS_PRESENT':'NO_ARCHIVE_SNAPSHOT_FOUND')
        :'ARCHIVE_COUNTS_NOT_ACTION_PROOF',
      reconciliationStatus:'MANUAL_RECONCILIATION_REQUIRED',
      safeToReplay:false,safeToDelete:false
    };
  });
  const total=asCount(counter&&counter.n);
  return {
    success:true,code:'CORE_PREPARED_AUDIT_READONLY_V1',
    source:'employee-core-d1',authoritativeBusinessOutcome:false,
    statusFilter:'PREPARED',total,page,pageSize,
    hasMore:offset+rows.length<total,
    rows,autoRepairEnabled:false,ledgerMutations:0,
    message:'هذا جرد تشخيصي فقط. وجود PREPARED لا يثبت نجاح العملية أو فشلها. لا تُعد تنفيذ الطلب ولا تمسح السجل قبل مراجعة أدلة التشغيل واعتماد المالك.'
  };
}
