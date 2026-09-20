/**
 * ISOLATED R5 safety observer candidate — READ ONLY, not installed/scheduled.
 * No trigger creation, Worker POST, Sheet or Script Property writes or emails.
 * Run manually only after confirming exact original bound Head dependencies.
 *
 * This detects missing/multiple R5 triggers and source-row growth beyond R5's
 * +5-per-tab guard. It does NOT observe last tick log/whole-row parity, so
 * "monitorReady" is only an early-warning observation, NOT proof sync is live.
 */
function trendosR5SyncRiskReadOnlyObserverCandidate20260920() {
  var handlers=ScriptApp.getProjectTriggers().map(function(t){
    return String(t.getHandlerFunction()||'');
  });
  var r5Count=handlers.filter(function(x){
    return x==='trendosR5PeriodicOrdersTick20260920';
  }).length;
  var legacy=['d1OrdersLowUsageTickV1','d1OrdersLiveSyncTickV2',
    'd1OrdersLiveSyncTick','d1OperationalEnrichmentLiveSyncTick02CR'];
  var legacyActive=handlers.filter(function(x){
    return legacy.indexOf(x)>=0;
  }).length;
  var wb=d1FullSpreadsheet_();
  if(wb.getId()!=='1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI')
    throw new Error('R5_OBSERVER_WRONG_WORKBOOK');
  var catalog=d1FullGet_('/v1/mirror/sheets');
  if(!catalog||catalog.success!==true||!Array.isArray(catalog.sheets))
    throw new Error('R5_OBSERVER_CATALOG_UNAVAILABLE');
  var names=['الأوردرات','بنود الأوردرات'];
  var tabs=names.map(function(name,index){
    var sheet=wb.getSheetByName(name);
    if(!sheet)throw new Error('R5_OBSERVER_SOURCE_TAB_MISSING');
    var remote=catalog.sheets.filter(function(s){return s&&s.sheetName===name;});
    if(remote.length!==1)throw new Error('R5_OBSERVER_REMOTE_TAB_NOT_UNIQUE');
    var c=remote[0],sourceRows=sheet.getLastRow(),d1Rows=Number(c.rowCount);
    var missingRows=sourceRows-d1Rows;
    var idMatches=String(sheet.getSheetId())===String(c.sheetId||'');
    var columnsMatch=Number(sheet.getLastColumn())===Number(c.sourceLastCol);
    var catalogInternallyConsistent=d1Rows===Number(c.sourceLastRow);
    var noteMatches=c.note==='TrendOS orders live sync V2 quota-aware';
    return {tabIndex:index,sourceLastRow:sourceRows,
      d1Rows:d1Rows,deltaRows:missingRows,
      d1Ready:c.status==='ready',
      sourceLastRowEqualsD1:sourceRows===d1Rows,
      growthBeyondR5Five:missingRows>5,
      d1MoreRowsThanSource:missingRows<0,
      sheetIdentityMatches:idMatches,
      sourceLastColMatchesD1:columnsMatch,
      d1CatalogRowCountConsistent:catalogInternallyConsistent,
      expectedR5LegacyNoteMatches:noteMatches};
  });
  var riskCodes=[];
  if(r5Count!==1)riskCodes.push('R5_TRIGGER_COUNT_NOT_ONE');
  if(legacyActive)riskCodes.push('LEGACY_SYNC_TRIGGER_ACTIVE');
  tabs.forEach(function(t) {
    if(!t.d1Ready)riskCodes.push('R5_D1_TAB_NOT_READY_'+t.tabIndex);
    if(t.growthBeyondR5Five)riskCodes.push('R5_GROWTH_OVER_FIVE_'+t.tabIndex);
    if(t.d1MoreRowsThanSource)riskCodes.push('R5_D1_ROWS_EXCEED_SOURCE_'+t.tabIndex);
    if(!t.sheetIdentityMatches)riskCodes.push('R5_SOURCE_SHEET_ID_MISMATCH_'+t.tabIndex);
    if(!t.sourceLastColMatchesD1)riskCodes.push('R5_SOURCE_COLUMN_DRIFT_'+t.tabIndex);
    if(!t.d1CatalogRowCountConsistent)riskCodes.push('R5_D1_CATALOG_SHAPE_'+t.tabIndex);
    if(!t.expectedR5LegacyNoteMatches)riskCodes.push('R5_D1_EXPECTED_NOTE_MISMATCH_'+t.tabIndex);
  });
  var report={
    audit:'TRENDOS_R5_READ_ONLY_EARLY_WARNING_CANDIDATE_20260920',
    mutationPerformed:false,triggerCreated:false,workerPostPerformed:false,
    r5TriggerCount:r5Count,legacySyncTriggerCount:legacyActive,
    tabCounts:tabs,earlyWarning:riskCodes.length>0,
    riskCodes:riskCodes,fullRowParityVerified:false,
    latestTickExecutionStatusVerified:false,quotaBytesMeasured:false,
    existingRowContentOrMax64CandidateCountVerified:false,
    note:'READ ONLY. Healthy dimension/trigger checks do not prove full row parity, existing-row upsert count <=64, future stability, or Apps Script Property quota; a lag can clear on next scheduled tick. Do not manually restart on this result.'
  };
  Logger.log(JSON.stringify(report));return report;
}
