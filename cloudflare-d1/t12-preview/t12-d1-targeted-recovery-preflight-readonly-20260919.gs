/**
 * TrendOS R4 targeted D1 recovery PRE-FLIGHT, READ ONLY.
 * Compares current authoritative Orders/Lines to current D1 GET rows,
 * estimates exact changed/missing source row counts, and projects replacing
 * the V2 baseline in Script Properties. NO D1 POST, property writes, trigger
 * changes, Sheet writes or Deploy.
 */
function trendosD1TargetedRecoveryPreflightReadOnly20260919() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_SCRIPT_LOCK');
  try {
    var props = PropertiesService.getScriptProperties();
    var names = ['الأوردرات','بنود الأوردرات'];
    var sourceBefore = d1OrdersLiveSyncV2CaptureAll_();
    if (!sourceBefore || !Array.isArray(sourceBefore.snapshots) ||
        sourceBefore.snapshots.length !== 2 || !sourceBefore.fingerprint) {
      throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_SOURCE_CAPTURE');
    }
    function getCatalog() {
      var x = d1FullGet_('/v1/mirror/sheets');
      if (!x || x.success !== true || !Array.isArray(x.sheets)) {
        throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_D1_CATALOG');
      }
      return x.sheets;
    }
    function one(all,name) {
      var x = all.filter(function(v){return v && v.sheetName === name;});
      if (x.length !== 1) throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_D1_TAB_COUNT');
      return x[0];
    }
    function tag(x) {
      return JSON.stringify([
        String(x.sheetId || ''), Number(x.sourceLastRow), Number(x.sourceLastCol),
        Number(x.rowCount), String(x.status || ''), String(x.note || ''),
        String(x.syncedAt || '')
      ]);
    }
    var beforeCatalog = getCatalog();
    var perTab = [];
    var pageSize = 250;
    names.forEach(function(name,index) {
      var src = sourceBefore.snapshots[index];
      if (!src || src.sheetName !== name || !Array.isArray(src.rows)) {
        throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_SOURCE_TAB');
      }
      var cat = one(beforeCatalog,name);
      var baseCount = Number(cat.rowCount);
      if (!Number.isInteger(baseCount) || baseCount < 1 || baseCount > 5000 ||
          cat.status !== 'ready' ||
          cat.note !== 'TrendOS orders live sync V2 quota-aware') {
        throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_D1_BASE_UNSAFE');
      }
      var sourceSheetIdentityMatchesD1 = src.sheetId != null && cat.sheetId != null &&
        String(src.sheetId) === String(cat.sheetId);
      var sourceRowsContiguous = src.rows.length === Number(src.sourceLastRow) &&
        Array.isArray(src.headers) && src.headers.length === Number(src.sourceLastCol) &&
        src.rows.every(function(row,i) {
          return Number(row.rowNumber) === i+1 &&
            Array.isArray(row.values) && row.values.length === src.sourceLastCol &&
            Array.isArray(row.display) && row.display.length === src.sourceLastCol &&
            Array.isArray(row.formulas) && row.formulas.length === src.sourceLastCol;
        });
      var remote = Object.create(null), seen = 0, duplicates = 0;
      var remoteHeadersMatchSource = true, remoteRowsInRange = true;
      var pageMetadataStable = true;
      for (var offset=0; offset<baseCount; offset+=pageSize) {
        var res = d1FullGet_('/v1/mirror/sheet?name=' + encodeURIComponent(name) +
          '&limit=' + pageSize + '&offset=' + offset);
        var sh = res && res.sheet;
        if (!res || res.success !== true || !sh || sh.sheetName !== name ||
            !Array.isArray(sh.rows)) {
          throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_D1_PAGE');
        }
        if (JSON.stringify(sh.headers) !== JSON.stringify(src.headers)) {
          remoteHeadersMatchSource = false;
        }
        if (tag(sh) !== tag(cat) || Number(sh.offset)!==offset ||
            Number(sh.limit)!==pageSize ||
            sh.rows.length !== Math.min(pageSize,baseCount-offset)) {
          pageMetadataStable = false;
        }
        sh.rows.forEach(function(row) {
          if (!row || !Number.isInteger(Number(row.rowNumber)) ||
              !Array.isArray(row.values) || !Array.isArray(row.display) ||
              !Array.isArray(row.formulas)) {
            throw new Error('R4_RECOVERY_PREFLIGHT_ABORT_D1_ROW_SHAPE');
          }
          if (Number(row.rowNumber) < 1 || Number(row.rowNumber) > baseCount ||
              row.values.length !== src.sourceLastCol ||
              row.display.length !== src.sourceLastCol ||
              row.formulas.length !== src.sourceLastCol) remoteRowsInRange = false;
          var k = String(Number(row.rowNumber));
          if (Object.prototype.hasOwnProperty.call(remote,k)) duplicates++;
          else {
            remote[k] = {
              rowNumber:Number(row.rowNumber),
              values:row.values,display:row.display,formulas:row.formulas
            };
            seen++;
          }
        });
      }
      var sourceNumbers = Object.create(null), changed=0, missing=0;
      src.rows.forEach(function(row) {
        var k=String(row.rowNumber); sourceNumbers[k]=true;
        if (!Object.prototype.hasOwnProperty.call(remote,k)) missing++;
        else if (JSON.stringify(row)!==JSON.stringify(remote[k])) changed++;
      });
      var unexpected = Object.keys(remote).filter(function(k){
        return !Object.prototype.hasOwnProperty.call(sourceNumbers,k);
      }).length;
      perTab.push({
        tabIndex:index,
        sourceRowCount:src.rows.length,
        d1BaseRowCount:baseCount,
        changedExistingRows:changed,
        missingSourceRowsInD1:missing,
        candidateRowsForUpsert:changed+missing,
        unexpectedRowsInD1:unexpected,
        duplicateRemoteRows:duplicates,
        d1PageMetadataStable:pageMetadataStable,
        sourceGrowthFromD1Base:src.sourceLastRow-baseCount,
        sourceColumnsMatchD1:Number(src.sourceLastCol)===Number(cat.sourceLastCol),
        sourceSheetIdentityMatchesD1:sourceSheetIdentityMatchesD1,
        sourceRowsContiguous:sourceRowsContiguous,
        remoteHeadersMatchSource:remoteHeadersMatchSource,
        remoteRowsInRange:remoteRowsInRange && seen===baseCount,
        catalogRowCountMatchesSourceLastRow:baseCount===Number(cat.sourceLastRow)
      });
    });
    var afterCatalog=getCatalog();
    var catalogStable=names.every(function(name){
      return tag(one(beforeCatalog,name))===tag(one(afterCatalog,name));
    });
    var sourceAfter=d1OrdersLiveSyncV2CaptureAll_();
    var sourceStable=!!sourceAfter && sourceAfter.fingerprint===sourceBefore.fingerprint;

    function bytes(x){return Utilities.newBlob(String(x==null?'':x)).getBytes().length;}
    var keys=props.getKeys(), totalBytes=0, baselineBytes=0, baselineChunkCount=0;
    keys.forEach(function(k){
      var v=props.getProperty(k);
      var n=bytes(k)+bytes(v); totalBytes+=n;
      if (/^D1_ORDERS_LIVE_SYNC_V2_BASELINE_\d+$/.test(k)) {
        baselineBytes+=n; baselineChunkCount++;
      }
    });
    var projected=d1OrdersLiveSyncV2BuildBaseline_(sourceBefore);
    var raw=JSON.stringify(projected);
    var chunkSize=7000, chunks=[];
    for(var i=0;i<raw.length;i+=chunkSize) chunks.push(raw.slice(i,i+chunkSize));
    var projectedBaselineBytes=0;
    chunks.forEach(function(chunk,i){
      projectedBaselineBytes+=bytes('D1_ORDERS_LIVE_SYNC_V2_BASELINE_'+i)+bytes(chunk);
    });
    var projectedTotal=totalBytes-baselineBytes+projectedBaselineBytes;
    var totalCandidates=perTab.reduce(function(n,x){return n+x.candidateRowsForUpsert;},0);
    var structuralSafe=catalogStable && sourceStable && perTab.every(function(x){
      return x.unexpectedRowsInD1===0 && x.duplicateRemoteRows===0 &&
        x.d1PageMetadataStable && x.sourceGrowthFromD1Base>=0 &&
        x.missingSourceRowsInD1===x.sourceGrowthFromD1Base &&
        x.sourceColumnsMatchD1 && x.sourceSheetIdentityMatchesD1 &&
        x.sourceRowsContiguous && x.remoteHeadersMatchSource &&
        x.remoteRowsInRange && x.catalogRowCountMatchesSourceLastRow;
    });
    var result={
      audit:'TRENDOS_D1_TARGETED_RECOVERY_PREFLIGHT_READ_ONLY_20260919',
      mutationPerformed:false,
      remoteMethod:'GET_ONLY',
      sourceStableDuringRead:sourceStable,
      d1CatalogStableDuringRead:catalogStable,
      tabs:perTab,
      totalCandidateRowsForUpsert:totalCandidates,
      structuralDeltaPreconditionsPass:structuralSafe,
      scriptProperties:{
        currentPropertyCount:keys.length,
        currentBytesApprox:totalBytes,
        currentBaselineChunkCount:baselineChunkCount,
        currentBaselineBytesApprox:baselineBytes,
        projectedBaselineChunkCount:chunks.length,
        projectedBaselineBytesApprox:projectedBaselineBytes,
        projectedBaselineByteDelta:projectedBaselineBytes-baselineBytes,
        projectedTotalBytesApproxAfterBaselineReplace:projectedTotal
      },
      productionWriteAuthorizedByThisAudit:false,
      triggerRestartAuthorizedByThisAudit:false,
      note:'Read-only preflight only. Candidate row count is a snapshot, not an approved write set. No D1/property/Sheet/trigger mutation.'
    };
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}
