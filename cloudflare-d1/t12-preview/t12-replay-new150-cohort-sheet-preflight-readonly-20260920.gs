/**
 * ISOLATED / READ-ONLY candidate, 2026-09-20.
 * Proves a NEW prospective oldest-150 V1908 cohort has existing Order+Line IDs
 * in the original workbook. It does NOT backup, mutate, authorize deletion, or
 * preserve same-request idempotency after a future deletion.
 *
 * Only run manually in the confirmed original bound project AFTER source review.
 * Do not log raw keys, replay contents, filenames, order IDs, or customer data.
 */
function trendosReplayNew150CohortSheetPreflightReadOnly20260920() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('REPLAY_PREFLIGHT_LOCK_BUSY_NO_RETRY');
  try {
    var props = PropertiesService.getScriptProperties();
    var now = Date.now(), oldMs = 7 * 24 * 60 * 60 * 1000;
    var pattern = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
    var eligible = [], skipped = {malformed:0,notOldEnough:0,invalidResponse:0};
    function bytes(s) { return Utilities.newBlob(String(s)).getBytes().length; }
    props.getKeys().forEach(function(key) {
      if (String(key).indexOf('TRENDOS_CREATE_ORDER_V1908_') !== 0) return;
      var match = pattern.exec(String(key));
      if (!match) { skipped.malformed++; return; }
      var keyMs = Number(match[1]);
      if (!isFinite(keyMs) || keyMs > now || now - keyMs < oldMs) {
        skipped.notOldEnough++; return;
      }
      var raw = props.getProperty(key), value;
      try { value = JSON.parse(raw || ''); } catch(e) { skipped.invalidResponse++; return; }
      var savedMs = Date.parse(String(value && value.savedAt || ''));
      var id = String(value && value.orderId || '').trim();
      if (!value || value.success !== true || !id ||
          !isFinite(savedMs) || savedMs > now || now - savedMs < oldMs) {
        skipped.invalidResponse++; return;
      }
      eligible.push({key:String(key), raw:raw, ms:keyMs, id:id,
                     bytes:bytes(key)+bytes(raw)});
    });
    // Explicit total ordering so any independently prepared backup must compare
    // exact key/value bytes, not presume the old 2026-09-19 cohort is reusable.
    eligible.sort(function(a,b) {
      return a.ms-b.ms || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
    });
    var cohort=eligible.slice(0,150);
    if (cohort.length !== 150) throw new Error('REPLAY_PREFLIGHT_COHORT_NOT_150');
    var ss=ss_();
    if (ss.getId() !== '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI' ||
        ss.getName() !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY')
      throw new Error('REPLAY_PREFLIGHT_WRONG_WORKBOOK');
    var idState=Object.create(null);
    cohort.forEach(function(x) {
      if (!idState[x.id]) idState[x.id]={summary:false,lines:false};
    });
    var sourceDefs=[
      {name:'الأوردرات',part:'summary',mandatory:true},
      {name:'بنود الأوردرات',part:'lines',mandatory:true},
      {name:'أرشيف الأوردرات',part:'summary',mandatory:false},
      {name:'أرشيف بنود الأوردرات',part:'lines',mandatory:false}
    ];
    var sourceStats=[], requiredMissing=0;
    sourceDefs.forEach(function(def,i) {
      var sheet=ss.getSheetByName(def.name);
      if (!sheet) {
        if (def.mandatory) requiredMissing++;
        sourceStats.push({tabIndex:i,found:false,orderIdHeader:false,rowsScanned:0});
        return;
      }
      var lastCol=sheet.getLastColumn();
      if (lastCol < 1) {
        if (def.mandatory) requiredMissing++;
        sourceStats.push({tabIndex:i,found:true,orderIdHeader:false,rowsScanned:0});
        return;
      }
      var headers=sheet.getRange(1,1,1,lastCol).getDisplayValues()[0];
      var col=0;
      headers.forEach(function(cell,j) {
        var h=String(cell||'').replace(/[\u200e\u200f\u200b]/g,'').trim().toLowerCase();
        if (h==='رقم الأوردر'||h==='order id'||h==='رقم الطلب') col=j+1;
      });
      if (!col) {
        if (def.mandatory) requiredMissing++;
        sourceStats.push({tabIndex:i,found:true,orderIdHeader:false,rowsScanned:0});
        return;
      }
      var rowCount=Math.max(0,sheet.getLastRow()-1);
      if (rowCount>100000) throw new Error('REPLAY_PREFLIGHT_SOURCE_TOO_LARGE');
      if (rowCount) sheet.getRange(2,col,rowCount,1).getDisplayValues().forEach(function(row) {
        var id=String(row[0]||'').trim();
        if (Object.prototype.hasOwnProperty.call(idState,id)) idState[id][def.part]=true;
      });
      sourceStats.push({tabIndex:i,found:true,orderIdHeader:true,rowsScanned:rowCount});
    });
    // A concurrent order creation may be ongoing; never bless a drifting set.
    var stable=cohort.every(function(x) { return props.getProperty(x.key)===x.raw; });
    var missingSummary=0, missingLines=0, verifiedIds=0;
    Object.keys(idState).forEach(function(id) {
      if (!idState[id].summary) missingSummary++;
      if (!idState[id].lines) missingLines++;
      if (idState[id].summary && idState[id].lines) verifiedIds++;
    });
    var result={
      audit:'TRENDOS_NEW150_REPLAY_COHORT_SHEET_PREFLIGHT_READ_ONLY_20260920',
      mutationPerformed:false, backupCreated:false, deletionPerformed:false,
      totalEligible:eligible.length, proposedCohortCount:cohort.length,
      proposedCohortBytesApprox:cohort.reduce(function(n,x){return n+x.bytes;},0),
      uniqueBusinessOrderCount:Object.keys(idState).length,
      verifiedOrderAndLinesIdCount:verifiedIds,
      missingSummaryCount:missingSummary, missingLinesCount:missingLines,
      requiredSourceMissingCount:requiredMissing,
      exactCohortCurrentValuesStable:stable,
      skipped:skipped, sourceStats:sourceStats,
      sheetPresencePass:stable && !requiredMissing && !missingSummary && !missingLines,
      oldRequestReplayStillUnsafeAfterDeletion:true,
      deletionAuthorized:false,
      important:'Only new-cohort order/line presence and key/value stability. Does not backup or allow deletion; original 150-record backup is a DIFFERENT old cohort.'
    };
    Logger.log(JSON.stringify(result)); return result;
  } finally { lock.releaseLock(); }
}
