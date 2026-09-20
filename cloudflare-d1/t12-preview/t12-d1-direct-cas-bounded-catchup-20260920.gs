/**
 * TrendOS R4 approved one-time Orders/Lines recovery caller.
 * Original bound Apps Script Head only; no Deploy and no trigger creation.
 * It never writes Sheets, Script Properties or the local baseline.
 */
function trendosD1DirectCasBoundedCatchup20260920() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('R4_CAS_ABORT_LOCK_NOT_AVAILABLE');
  var postAttempted = false, postConfirmed = false;
  var names = ['الأوردرات', 'بنود الأوردرات'];
  var maxCandidates = 64, maxGrowPerTab = 5, maxPayloadBytes = 250000, pageSize = 200;
  function fail(code) { throw new Error(code); }
  function tag(s) {
    return JSON.stringify([String(s.sheetId || ''),Number(s.rowCount),
      Number(s.sourceLastRow),Number(s.sourceLastCol),String(s.status || ''),
      String(s.syncedAt || ''),String(s.note || '')]);
  }
  function catalog() {
    var out = d1FullGet_('/v1/mirror/sheets');
    if (!out || out.success !== true || !Array.isArray(out.sheets))
      fail('R4_CAS_ABORT_CATALOG_GET');
    return out.sheets;
  }
  function one(all,name) {
    var found=all.filter(function(x){return x && x.sheetName===name;});
    if(found.length!==1) fail('R4_CAS_ABORT_TAB_NOT_UNIQUE');
    return found[0];
  }
  function readRemote(name,cat,headers) {
    var rows=[];
    for(var offset=0;offset<Number(cat.rowCount);offset+=pageSize) {
      var out=d1FullGet_('/v1/mirror/sheet?name='+encodeURIComponent(name)+
        '&limit='+pageSize+'&offset='+offset), page=out&&out.sheet;
      if(!out||out.success!==true||!page||page.sheetName!==name||
          !Array.isArray(page.rows)||tag(page)!==tag(cat)||
          Number(page.offset)!==offset||page.rows.length!==
          Math.min(pageSize,Number(cat.rowCount)-offset)||
          JSON.stringify(page.headers)!==JSON.stringify(headers))
        fail('R4_CAS_ABORT_REMOTE_PAGE_CHANGED');
      page.rows.forEach(function(row,index){
        if(!row||Number(row.rowNumber)!==offset+index+1||
            !Array.isArray(row.values)||!Array.isArray(row.display)||
            !Array.isArray(row.formulas)) fail('R4_CAS_ABORT_REMOTE_ROW_SHAPE');
        rows.push({rowNumber:Number(row.rowNumber),values:row.values,
          display:row.display,formulas:row.formulas});
      });
    }
    return rows;
  }
  try {
    var wb=d1FullSpreadsheet_();
    if(wb.getId()!=='1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI')
      fail('R4_CAS_ABORT_WRONG_WORKBOOK');
    var blocked={d1OrdersLowUsageTickV1:true,d1OrdersLiveSyncTickV2:true,
      d1OrdersLiveSyncTick:true,d1OperationalEnrichmentLiveSyncTick02CR:true};
    if(ScriptApp.getProjectTriggers().some(function(t){
      return blocked[String(t.getHandlerFunction()||'')]===true;
    })) fail('R4_CAS_ABORT_SYNC_TRIGGER_ACTIVE');
    var source=d1OrdersLiveSyncV2CaptureAll_();
    if(!source||!Array.isArray(source.snapshots)||source.snapshots.length!==2||
        !source.fingerprint) fail('R4_CAS_ABORT_SOURCE_CAPTURE');
    var before=catalog(), total=0, sheets=[], publicTabs=[];
    names.forEach(function(name,index){
      var src=source.snapshots[index],cat=one(before,name);
      if(!src||src.sheetName!==name||!Array.isArray(src.rows)||
          src.rows.length!==Number(src.sourceLastRow)||src.rows.length<1||
          src.rows.length>5000||String(src.sheetId)!==String(cat.sheetId)||
          Number(src.sourceLastCol)!==Number(cat.sourceLastCol)||
          Number(cat.rowCount)!==Number(cat.sourceLastRow)||cat.status!=='ready'||
          cat.note!=='TrendOS orders live sync V2 quota-aware'||
          src.sourceLastRow-Number(cat.rowCount)<0||
          src.sourceLastRow-Number(cat.rowCount)>maxGrowPerTab)
        fail('R4_CAS_ABORT_SOURCE_REMOTE_SHAPE');
      var remote=readRemote(name,cat,src.headers),upserts=[],changed=0,appended=0;
      src.rows.forEach(function(row,i){
        if(Number(row.rowNumber)!==i+1) fail('R4_CAS_ABORT_SOURCE_ORDER');
        var after={rowNumber:i+1,values:row.values,display:row.display,formulas:row.formulas};
        var old=i<remote.length?remote[i]:null;
        if(!old||JSON.stringify(old)!==JSON.stringify(after)) {
          upserts.push({rowNumber:i+1,expectedBefore:old,replacement:after});
          if(old) changed++; else appended++;
        }
      });
      total+=upserts.length;
      if(total>maxCandidates) fail('R4_CAS_ABORT_CANDIDATE_LIMIT');
      sheets.push({sheetName:name,sheetId:String(src.sheetId),
        sourceLastRow:Number(src.sourceLastRow),sourceLastCol:Number(src.sourceLastCol),
        baseRowCount:Number(cat.rowCount),expectedNote:'TrendOS orders live sync V2 quota-aware',
        headers:src.headers,upserts:upserts,changedExistingRows:changed,appendedRows:appended});
      publicTabs.push({tabIndex:index,d1BaseRows:Number(cat.rowCount),
        sourceRows:Number(src.sourceLastRow),changedExistingRows:changed,
        appendedRows:appended,candidateUpserts:upserts.length});
    });
    if(total===0) return {audit:'TRENDOS_R4_CAS_CATCHUP_20260920',mutationPerformed:false,
      alreadyInParity:true,totalCandidateUpserts:0,tabCounts:publicTabs};
    var afterCatalog=catalog();
    if(!names.every(function(n){return tag(one(before,n))===tag(one(afterCatalog,n));}))
      fail('R4_CAS_ABORT_CATALOG_CHANGED');
    var sourceAfter=d1OrdersLiveSyncV2CaptureAll_();
    if(!sourceAfter||sourceAfter.fingerprint!==source.fingerprint)
      fail('R4_CAS_ABORT_SOURCE_CHANGED');
    var proposal={sheets:sheets,publicSummary:{tabCounts:publicTabs,
      totalCandidateUpserts:total,estimatedPrivateProposalBytes:0,
      requiresTransactionalD1CompareAndSwap:true,productionWriteAuthorized:false,
      triggerRestartAuthorized:false},productionWriteAuthorized:false};
    var payload={operation:'r4-orders-recovery-apply',proposal:proposal};
    var bytes=Utilities.newBlob(JSON.stringify(payload)).getBytes().length;
    proposal.publicSummary.estimatedPrivateProposalBytes=bytes;
    payload={operation:'r4-orders-recovery-apply',proposal:proposal};
    bytes=Utilities.newBlob(JSON.stringify(payload)).getBytes().length;
    if(bytes>maxPayloadBytes) fail('R4_CAS_ABORT_PAYLOAD_LIMIT');
    postAttempted=true;
    var reply=d1FullPost_('/v1/admin/r4/orders-recovery/apply',payload);
    if(!reply||reply.success!==true||reply.reason!=='production-d1-commit-observed'||
        !reply.summary||Number(reply.summary.totalCandidateUpserts)!==total)
      fail('R4_CAS_POST_UNEXPECTED_NO_RETRY');
    postConfirmed=true;
    return {audit:'TRENDOS_R4_CAS_CATCHUP_20260920',mutationPerformed:true,
      remoteAtomicPostConfirmed:true,totalCandidateUpserts:total,tabCounts:publicTabs,
      payloadBytes:bytes,localBaselineChanged:false,scheduledTriggersChanged:false,
      postflightRowParityVerified:false,automaticRetryAllowed:false};
  } catch(e) {
    return {audit:'TRENDOS_R4_CAS_CATCHUP_20260920',mutationPerformed:postAttempted,
      postAttempted:postAttempted,postConfirmed:postConfirmed,
      outcomeUnknown:postAttempted&&!postConfirmed,automaticRetryAllowed:false,
      errorCode:postAttempted?'R4_CAS_POST_OUTCOME_UNCERTAIN_NO_RETRY':
        (/^R4_CAS_[A-Z0-9_]+$/.test(String(e&&e.message||''))?
          String(e.message):'R4_CAS_ABORT_UNKNOWN_PREFLIGHT')};
  } finally { lock.releaseLock(); }
}
