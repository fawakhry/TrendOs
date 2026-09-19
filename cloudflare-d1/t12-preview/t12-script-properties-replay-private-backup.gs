/**
 * TrendOS R2 private backup / 2026-09-19 — ONE-TIME MANUAL ACTION.
 * Save full, validated oldest 150 replay key-value pairs to a NEW owner-private
 * My Drive file; re-read file, byte-for-byte verify contents; DO NOT DELETE
 * any Script Property, edit orders, modify a trigger, or Deploy the web app.
 *
 * IMPORTANT: backup contains sensitive customer/business information.
 * Do not paste its filename, URL, file ID, contents, or raw logs into chat
 * or GitHub. Store in the owner's private My Drive root, NOT a shared folder.
 * After a timeout/disconnect check My Drive for an existing backup before
 * re-running this function. Never use this as a deletion authorization.
 */
function trendosReplayPrivateBackupOnce20260919() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var properties = PropertiesService.getScriptProperties();
    var now = Date.now();
    var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    var prefix = 'TRENDOS_CREATE_ORDER_V1908_';
    var pattern = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
    var candidates = [];
    properties.getKeys().forEach(function(key) {
      if (String(key).indexOf(prefix) !== 0) return;
      var match = pattern.exec(key);
      if (!match) return;
      var keyTime = Number(match[1]);
      if (!isFinite(keyTime) || keyTime > now || now - keyTime < sevenDaysMs) return;
      var raw = properties.getProperty(key);
      var response;
      try { response = JSON.parse(raw || ''); }
      catch (err) { return; }
      if (!response || response.success !== true || !String(response.orderId || '').trim()) return;
      var savedTime = Date.parse(String(response.savedAt || ''));
      if (!isFinite(savedTime) || savedTime > now || now - savedTime < sevenDaysMs) return;
      candidates.push({key: key, value: raw, keyTime: keyTime});
    });
    candidates.sort(function(a, b) {
      return a.keyTime - b.keyTime || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
    });
    if (candidates.length < 150) {
      throw new Error('R2_ABORT_TOO_FEW_ELIGIBLE_CANDIDATES: no backup created');
    }
    // Do not alter the selection after the backup, including on a later day.
    var records = candidates.slice(0, 150).map(function(c) {
      return {key: c.key, value: c.value};
    });
    // Re-read before creating backup to catch a concurrent change.
    records.forEach(function(rec) {
      if (properties.getProperty(rec.key) !== rec.value) {
        throw new Error('R2_ABORT_REPLAY_CHANGED_DURING_BACKUP: no backup created');
      }
    });
    var backup = {
      format: 'TRENDOS_R2_REPLAY_PRIVATE_BACKUP_V1',
      createdAt: new Date(now).toISOString(),
      selection: 'oldest_150_eligible_with_seven_day_retention',
      records: records
    };
    var data = JSON.stringify(backup);
    var filename = 'TRENDOS_R2_PRIVATE_REPLAY_BACKUP_20260919_' +
      Utilities.formatDate(new Date(now), 'UTC', 'yyyyMMdd_HHmmss') +
      '_' + Utilities.getUuid() + '.json';
    // DriveApp.createFile creates in the user's My Drive root. Do not use a
    // shared folder. A file created successfully is a real mutation in Drive.
    var file = DriveApp.createFile(filename, data, MimeType.PLAIN_TEXT);
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE ||
        file.getEditors().length !== 0 || file.getViewers().length !== 0) {
      // Fail closed if the user's Drive environment grants unexpected access.
      file.setTrashed(true);
      throw new Error('R2_ABORT_BACKUP_NOT_PRIVATE: created file moved to trash');
    }
    var restored = file.getBlob().getDataAsString('UTF-8');
    if (restored !== data) {
      throw new Error('R2_BACKUP_READBACK_MISMATCH: DO NOT DELETE ANY PROPERTY');
    }
    var parsed = JSON.parse(restored);
    if (parsed.format !== backup.format || parsed.records.length !== 150 ||
        parsed.records.some(function(rec, i) {
          return rec.key !== records[i].key || rec.value !== records[i].value;
        })) {
      throw new Error('R2_BACKUP_RECORD_MISMATCH: DO NOT DELETE ANY PROPERTY');
    }
    var result = {
      audit: 'TRENDOS_R2_PRIVATE_BACKUP_VERIFIED_20260919',
      success: true,
      backupCreated: true,
      backupAccessPrivate: true,
      exactReadbackVerified: true,
      backedUpRecordCount: records.length,
      replayPropertiesDeleted: 0,
      cleanupAllowedAutomatically: false,
      important: 'KEEP THE PRIVATE BACKUP IN MY DRIVE. Never paste backup contents, filename, URL, ID, or customer data into chat.'
    };
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}
