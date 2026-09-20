/** ISOLATED R5 candidate: not saved/routed in production. Baseline-free, no Sheet, Script Properties, or replay writes. */
function trendosR5PeriodicOrdersOnce_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('R5_PERIODIC_ABORT_LOCK_NOT_AVAILABLE');
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
      fail('R5_PERIODIC_ABORT_CATALOG_GET');
    return out.sheets;
  }
  function one(all,name) {
    var found=all.filter(function(x){return x && x.sheetName===name;});
    if(found.length!==1) fail('R5_PERIODIC_ABORT_TAB_NOT_UNIQUE');
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
        fail('R5_PERIODIC_ABORT_REMOTE_PAGE_CHANGED');
      page.rows.forEach(function(row,index){
        if(!row||Number(row.rowNumber)!==offset+index+1||
            !Array.isArray(row.values)||!Array.isArray(row.display)||
            !Array.isArray(row.formulas)) fail('R5_PERIODIC_ABORT_REMOTE_ROW_SHAPE');
        rows.push({rowNumber:Number(row.rowNumber),values:row.values,
          display:row.display,formulas:row.formulas});
      });
    }
    return rows;
  }
  try {
    var wb=d1FullSpreadsheet_();
    if(wb.getId()!=='1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI')
      fail('R5_PERIODIC_ABORT_WRONG_WORKBOOK');
    var blocked={d1OrdersLowUsageTickV1:true,d1OrdersLiveSyncTickV2:true,
      d1OrdersLiveSyncTick:true,d1OperationalEnrichmentLiveSyncTick02CR:true};
    if(ScriptApp.getProjectTriggers().some(function(t){
      return blocked[String(t.getHandlerFunction()||'')]===true;
    })) fail('R5_PERIODIC_ABORT_SYNC_TRIGGER_ACTIVE');
    var source=d1OrdersLiveSyncV2CaptureAll_();
    if(!source||!Array.isArray(source.snapshots)||source.snapshots.length!==2||
        !source.fingerprint) fail('R5_PERIODIC_ABORT_SOURCE_CAPTURE');
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
        fail('R5_PERIODIC_ABORT_SOURCE_REMOTE_SHAPE');
      var remote=readRemote(name,cat,src.headers),upserts=[],changed=0,appended=0;
      src.rows.forEach(function(row,i){
        if(Number(row.rowNumber)!==i+1) fail('R5_PERIODIC_ABORT_SOURCE_ORDER');
        var after={rowNumber:i+1,values:row.values,display:row.display,formulas:row.formulas};
        var old=i<remote.length?remote[i]:null;
        if(!old||JSON.stringify(old)!==JSON.stringify(after)) {
          upserts.push({rowNumber:i+1,expectedBefore:old,replacement:after});
          if(old) changed++; else appended++;
        }
      });
      total+=upserts.length;
      if(total>maxCandidates) fail('R5_PERIODIC_ABORT_CANDIDATE_LIMIT');
      sheets.push({sheetName:name,sheetId:String(src.sheetId),
        sourceLastRow:Number(src.sourceLastRow),sourceLastCol:Number(src.sourceLastCol),
        baseRowCount:Number(cat.rowCount),expectedNote:'TrendOS orders live sync V2 quota-aware',
        headers:src.headers,upserts:upserts,changedExistingRows:changed,appendedRows:appended});
      publicTabs.push({tabIndex:index,d1BaseRows:Number(cat.rowCount),
        sourceRows:Number(src.sourceLastRow),changedExistingRows:changed,
        appendedRows:appended,candidateUpserts:upserts.length});
    });
    if(total===0) {
      var idleCatalog=catalog(),idleSource=d1OrdersLiveSyncV2CaptureAll_();
      if(!names.every(function(n){return tag(one(before,n))===tag(one(idleCatalog,n));})||
          !idleSource||idleSource.fingerprint!==source.fingerprint)
        fail('R5_PERIODIC_ABORT_IDLE_SOURCE_OR_D1_CHANGED');
      return {audit:'TRENDOS_R5_PERIODIC_20260920',mutationPerformed:false,
        alreadyInParity:true,postflightRowParityVerified:true,
        totalCandidateUpserts:0,tabCounts:publicTabs};
    }
    var afterCatalog=catalog();
    if(!names.every(function(n){return tag(one(before,n))===tag(one(afterCatalog,n));}))
      fail('R5_PERIODIC_ABORT_CATALOG_CHANGED');
    var sourceAfter=d1OrdersLiveSyncV2CaptureAll_();
    if(!sourceAfter||sourceAfter.fingerprint!==source.fingerprint)
      fail('R5_PERIODIC_ABORT_SOURCE_CHANGED');
    var proposal={sheets:sheets,publicSummary:{tabCounts:publicTabs,
      totalCandidateUpserts:total,estimatedPrivateProposalBytes:0,
      requiresTransactionalD1CompareAndSwap:true,productionWriteAuthorized:false,
      triggerRestartAuthorized:false},productionWriteAuthorized:false};
    var payload={operation:'r5-orders-periodic-apply',proposal:proposal};
    var bytes=Utilities.newBlob(JSON.stringify(payload)).getBytes().length;
    proposal.publicSummary.estimatedPrivateProposalBytes=bytes;
    payload={operation:'r5-orders-periodic-apply',proposal:proposal};
    bytes=Utilities.newBlob(JSON.stringify(payload)).getBytes().length;
    if(bytes>maxPayloadBytes) fail('R5_PERIODIC_ABORT_PAYLOAD_LIMIT');
    postAttempted=true;
    var reply=d1FullPost_('/v1/admin/r5/orders-periodic/apply',payload);
    if(!reply||reply.success!==true||reply.reason!=='periodic-d1-commit-observed'||
        !reply.summary||Number(reply.summary.totalCandidateUpserts)!==total)
      fail('R5_PERIODIC_POST_UNEXPECTED_NO_RETRY');
    postConfirmed=true;
    // Verify source and ALL D1 rows after COMMIT, not just catalog counts.
    var finalSource=d1OrdersLiveSyncV2CaptureAll_();
    if(!finalSource||finalSource.fingerprint!==source.fingerprint)
      fail('R5_PERIODIC_ABORT_POSTFLIGHT_SOURCE_CHANGED');
    var finalCatalog=catalog();
    names.forEach(function(n,i) {
      var src=source.snapshots[i],cat=one(finalCatalog,n);
      if(String(src.sheetId)!==String(cat.sheetId)||
          Number(cat.rowCount)!==src.sourceLastRow||
          Number(cat.sourceLastRow)!==src.sourceLastRow||
          Number(cat.sourceLastCol)!==src.sourceLastCol||
          cat.status!=='ready') fail('R5_PERIODIC_ABORT_POSTFLIGHT_DIMENSIONS');
      var remote=readRemote(n,cat,src.headers);
      if(remote.length!==src.rows.length||src.rows.some(function(row,j){
        return JSON.stringify(remote[j])!==JSON.stringify({
          rowNumber:j+1,values:row.values,display:row.display,formulas:row.formulas
        });
      })) fail('R5_PERIODIC_ABORT_POSTFLIGHT_CONTENT');
    });
    return {audit:'TRENDOS_R5_PERIODIC_20260920',mutationPerformed:true,
      remoteAtomicPostConfirmed:true,totalCandidateUpserts:total,tabCounts:publicTabs,
      payloadBytes:bytes,localBaselineChanged:false,scheduledTriggersChanged:false,
      postflightRowParityVerified:true,automaticRetryAllowed:false};
  } catch(e) {
    return {audit:'TRENDOS_R5_PERIODIC_20260920',mutationPerformed:postAttempted,
      postAttempted:postAttempted,postConfirmed:postConfirmed,
      outcomeUnknown:postAttempted&&!postConfirmed,automaticRetryAllowed:false,
      errorCode:postAttempted&&!postConfirmed?'R5_PERIODIC_POST_OUTCOME_UNCERTAIN_NO_RETRY':
        (/^R5_PERIODIC_[A-Z0-9_]+$/.test(String(e&&e.message||''))?
          String(e.message):postConfirmed?'R5_PERIODIC_ABORT_POSTFLIGHT_UNVERIFIED':
          'R5_PERIODIC_ABORT_UNKNOWN_PREFLIGHT')};
  } finally { lock.releaseLock(); }
}

function trendosR5PeriodicOrdersRemoveOwnTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(String(t.getHandlerFunction()||'')==='trendosR5PeriodicOrdersTick20260920')
      ScriptApp.deleteTrigger(t);
  });
}
function trendosR5PeriodicOrdersTick20260920() {
  var result;
  try {result=trendosR5PeriodicOrdersOnce_();}
  catch(e) {
    result={errorCode:String(e&&e.message||'')==='R5_PERIODIC_ABORT_LOCK_NOT_AVAILABLE'?
      'R5_PERIODIC_ABORT_LOCK_NOT_AVAILABLE':'R5_PERIODIC_ABORT_UNEXPECTED',
      postAttempted:false,postConfirmed:false,mutationPerformed:false,
      postflightRowParityVerified:false,outcomeUnknown:false};
  }
  if(!result||result.postflightRowParityVerified!==true) {
    var retryable=result&&result.postAttempted!==true&&
      ['R5_PERIODIC_ABORT_LOCK_NOT_AVAILABLE','R5_PERIODIC_ABORT_SOURCE_CHANGED',
       'R5_PERIODIC_ABORT_CATALOG_CHANGED',
       'R5_PERIODIC_ABORT_IDLE_SOURCE_OR_D1_CHANGED'].indexOf(result.errorCode)>=0;
    // A confirmed COMMIT with a newer source is not an ambiguous POST: the
    // next scheduled tick can capture fresh source+remote snapshots safely.
    if(result&&result.postConfirmed===true&&result.outcomeUnknown!==true&&
        result.errorCode==='R5_PERIODIC_ABORT_POSTFLIGHT_SOURCE_CHANGED')
      retryable=true;
    if(!retryable){
      trendosR5PeriodicOrdersRemoveOwnTrigger_();
      result=Object.assign({},result||{}, {scheduledSyncDisarmed:true});
    }
  }
  // Aggregate receipt only. No names, customer values, row hashes or secrets.
  Logger.log(JSON.stringify({
    audit:'TRENDOS_R5_PERIODIC_20260920',
    success:!!(result&&result.postflightRowParityVerified===true),
    mutationPerformed:!!(result&&result.mutationPerformed===true),
    outcomeUnknown:!!(result&&result.outcomeUnknown===true),
    postflightRowParityVerified:!!(result&&result.postflightRowParityVerified===true),
    totalCandidateUpserts:Number(result&&result.totalCandidateUpserts||0),
    errorCode:String(result&&result.errorCode||''),
    scheduledSyncDisarmed:!!(result&&result.scheduledSyncDisarmed===true)
  }));
  return result;
}
/** Manual release, only AFTER R5 endpoint is reviewed, deployed and enabled. */
function trendosR5StartPeriodicOrders20260920() {
  if(ScriptApp.getProjectTriggers().some(function(t){
    return String(t.getHandlerFunction()||'')==='trendosR5PeriodicOrdersTick20260920';
  })) throw new Error('R5_PERIODIC_ABORT_TRIGGER_ALREADY_EXISTS');
  var receipt=trendosR5PeriodicOrdersTick20260920();
  if(!receipt||receipt.postflightRowParityVerified!==true)
    throw new Error('R5_PERIODIC_ABORT_INITIAL_PARITY_NOT_VERIFIED');
  ScriptApp.newTrigger('trendosR5PeriodicOrdersTick20260920')
    .timeBased().everyMinutes(10).create();
  Logger.log('TRENDOS_R5_PERIODIC_TRIGGER_CREATED: intervalMinutes=10');
  return {success:true,initialFullRowParityVerified:true,intervalMinutes:10,
    legacyBaselineChanged:false,scriptPropertiesChanged:false};
}
function trendosR5StopPeriodicOrders20260920() {
  trendosR5PeriodicOrdersRemoveOwnTrigger_();
  return {success:true,ownTriggerRemoved:true,legacyTriggersChanged:false,
    scriptPropertiesChanged:false};
}
