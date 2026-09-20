/**
 * ISOLATED CANDIDATE — PRIVATE BACKUP ONLY, 2026-09-20.
 * A separately approved, ONE-TIME Drive mutation to copy a NEW exact cohort
 * of 150 historic V1908 replay key/value pairs into the owner's PRIVATE root.
 * NEVER writes/deletes Script Properties, business data, triggers or D1.
 *
 * Requires the independent read-only new150 cohort preflight already present
 * in the ORIGINAL bound production Apps Script project. DO NOT run without
 * the owner's explicit approval to create a sensitive private Drive file.
 * Never paste file name/id/URL/content, replay key/order id into logs or chat.
 * On error/timeout DO NOT rerun: inspect only private Drive for an existing
 * backup; this code refuses to create a second file with the same prefix.
 */
function trendosReplayNew150PrivateBackupOnce20260920() {
  // Independent fresh ID-presence read, outside backup's Script Lock.
  // The preflight has its own short-held Script Lock and no mutations.
  var checked = trendosReplayNew150CohortSheetPreflightReadOnly20260920();
  if (!checked || checked.sheetPresencePass !== true ||
      checked.deletionAuthorized !== false ||
      checked.proposedCohortCount !== 150 ||
      checked.uniqueBusinessOrderCount !== 112 ||
      checked.verifiedOrderAndLinesIdCount !== 112 ||
      checked.proposedCohortBytesApprox !== 98763)
    throw new Error('NEW150_BACKUP_ABORT_PREFLIGHT_NOT_EXACT_CHECKPOINT');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('NEW150_BACKUP_ABORT_LOCK_BUSY_NO_RETRY');
  try {
    var prefix='TRENDOS_R5_NEW150_PRIVATE_REPLAY_BACKUP_20260920_';
    var folder=DriveApp.getRootFolder();
    var previous=folder.getFiles();
    while (previous.hasNext()) {
      var old=previous.next();
      if (String(old.getName()||'').indexOf(prefix)===0)
        throw new Error('NEW150_BACKUP_ABORT_EXISTS_NO_RETRY');
    }

    var p=PropertiesService.getScriptProperties();
    var now=Date.now(), sevenDays=7*24*60*60*1000;
    var rx=/^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
    var eligible=[];
    function utf8(s) { return Utilities.newBlob(String(s)).getBytes().length; }
    p.getKeys().forEach(function(key) {
      var k=String(key||'');
      if (k.indexOf('TRENDOS_CREATE_ORDER_V1908_')!==0) return;
      var match=rx.exec(k);
      if (!match) return;
      var keyTime=Number(match[1]);
      if (!isFinite(keyTime)||keyTime>now||now-keyTime<sevenDays) return;
      var value=p.getProperty(k),parsed;
      try {parsed=JSON.parse(value||'');} catch(e) {return;}
      var savedAt=Date.parse(String(parsed&&parsed.savedAt||''));
      if (!parsed||parsed.success!==true||!String(parsed.orderId||'').trim()||
          !isFinite(savedAt)||savedAt>now||now-savedAt<sevenDays) return;
      eligible.push({key:k,value:value,time:keyTime,orderId:String(parsed.orderId).trim(),
                     bytes:utf8(k)+utf8(value)});
    });
    eligible.sort(function(a,b) {
      return a.time-b.time || (a.key<b.key?-1:a.key>b.key?1:0);
    });
    var selected=eligible.slice(0,150);
    var unique=Object.create(null);
    selected.forEach(function(r){unique[r.orderId]=true;});
    var selectedBytes=selected.reduce(function(sum,r){return sum+r.bytes;},0);
    // Abort rather than silently backing up a DIFFERENT age-shifted cohort.
    if (eligible.length!==447 || selected.length!==150 ||
        Object.keys(unique).length!==112 || selectedBytes!==98763)
      throw new Error('NEW150_BACKUP_ABORT_COHORT_CHANGED_RECHECK_READONLY');

    selected.forEach(function(r) {
      if (p.getProperty(r.key)!==r.value)
        throw new Error('NEW150_BACKUP_ABORT_PROPERTY_DRIFT_NO_RETRY');
    });
    // The backup is a recovery artifact, NOT a list authorized for deletion.
    var backup={
      format:'TRENDOS_R5_NEW150_PRIVATE_REPLAY_BACKUP_V1',
      createdAt:new Date().toISOString(),
      selection:'new_oldest_150_7day_success_orderid_savedat_20260920',
      deletionAuthorized:false,
      expectedUniqueBusinessOrderCount:112,
      expectedBytesApprox:98763,
      records:selected.map(function(r){return {key:r.key,value:r.value};})
    };
    var data=JSON.stringify(backup);
    var filename=prefix+
      Utilities.formatDate(new Date(),'UTC','yyyyMMdd_HHmmss')+'_'+
      Utilities.getUuid()+'.json';
    // Only new private Drive file creation; NO Script Property deletion.
    var file=DriveApp.createFile(filename,data,MimeType.PLAIN_TEXT);
    if (file.getSharingAccess()!==DriveApp.Access.PRIVATE ||
        file.getEditors().length!==0 || file.getViewers().length!==0)
      throw new Error('NEW150_BACKUP_ABORT_UNEXPECTED_SHARING_DO_NOT_RETRY');
    var readback=file.getBlob().getDataAsString('UTF-8');
    if (readback!==data)
      throw new Error('NEW150_BACKUP_ABORT_READBACK_MISMATCH_DO_NOT_RETRY');
    var verified=JSON.parse(readback);
    if (verified.format!==backup.format||
        verified.deletionAuthorized!==false||
        !Array.isArray(verified.records)||
        verified.records.length!==150||
        verified.records.some(function(r,i) {
          return r.key!==selected[i].key || r.value!==selected[i].value;
        }))
      throw new Error('NEW150_BACKUP_ABORT_RECORD_MISMATCH_DO_NOT_RETRY');

    var receipt={
      audit:'TRENDOS_R5_NEW150_PRIVATE_BACKUP_ONCE_20260920',
      backupCreated:true, backupAccessPrivate:true,
      exactReadbackVerified:true,
      backedUpRecordCount:150, uniqueBusinessOrderCount:112,
      selectedBytesApprox:98763, replayPropertiesDeleted:0,
      deletionAuthorized:false, automaticRetryAllowed:false,
      important:'This private backup holds business/customer data. Never share filename, ID, URL or raw contents. A separate decision is required before ANY deletion.'
    };
    Logger.log(JSON.stringify(receipt));
    return receipt;
  } finally { lock.releaseLock(); }
}
