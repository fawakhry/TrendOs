/**
 * TrendOS T12 one-shot atomic full rebase for Orders + Order Lines.
 * 2026-09-26.
 *
 * PRODUCTION SAFETY CONTRACT:
 * - Google Sheets remains authoritative and is never mutated here.
 * - No Script Properties are written or deleted.
 * - No trigger is created/deleted and no enable flag is changed.
 * - Requires the exact operational workbook and zero known sync triggers.
 * - Stages BOTH source snapshots first; live mirror is unchanged during staging.
 * - Re-captures source and re-reads live catalog BEFORE one atomic promote.
 * - If source/catalog changed, aborts before promote.
 * - After promote, reads the complete live mirror and verifies exact row parity.
 * - Re-captures the authoritative source after promote; success requires the source fingerprint to remain unchanged.
 * - A lost/ambiguous promote response is NEVER blindly retried; GET reconciliation decides.
 *
 * Dependencies already present in the production Apps Script project:
 *   d1FullSpreadsheet_
 *   d1FullGet_
 *   d1FullPost_
 *   d1OrdersLiveSyncV2CaptureAll_
 *   d1OrdersLiveSyncV2StageSnapshot_
 *   d1OrdersLiveSyncV2DigestHex_
 *   D1_ORDERS_LIVE_SYNC_V2_NOTE
 */
function trendosT12OneShotAtomicFullRebase20260926() {
  var AUDIT = 'TRENDOS_T12_ONE_SHOT_ATOMIC_FULL_REBASE_20260926';
  var WORKBOOK_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
  var NAMES = ['الأوردرات', 'بنود الأوردرات'];
  var MAX_SOURCE_ROWS = 5000;
  var MAX_GROWTH_PER_TAB = 200;
  var PAGE_SIZE = 500;
  var lock = LockService.getScriptLock();
  var promoteAttempted = false;
  var promoteConfirmed = false;

  function fail(code) {
    var e = new Error(code);
    e.trendosCode = code;
    throw e;
  }

  function catalogTag(item) {
    return JSON.stringify([
      String(item && item.sheetName || ''),
      String(item && item.sheetId || ''),
      Number(item && item.sourceLastRow || 0),
      Number(item && item.sourceLastCol || 0),
      Number(item && item.rowCount || 0),
      String(item && item.status || ''),
      String(item && item.syncedAt || ''),
      String(item && item.note || '')
    ]);
  }

  function getCatalog() {
    var out = d1FullGet_('/v1/mirror/sheets');
    if (!out || out.success !== true || !Array.isArray(out.sheets)) {
      fail('T12_REBASE_ABORT_CATALOG_GET');
    }
    return out.sheets;
  }

  function getOneCatalog(all, name) {
    var found = all.filter(function(item) {
      return item && String(item.sheetName || '') === name;
    });
    if (found.length !== 1) fail('T12_REBASE_ABORT_CATALOG_IDENTITY');
    return found[0];
  }

  function assertNoKnownSyncTriggers() {
    var blocked = {
      d1OrdersLowUsageTickV1: true,
      d1OrdersLiveSyncTickV2: true,
      d1OrdersLiveSyncTick: true,
      d1OperationalEnrichmentLiveSyncTick02CR: true
    };
    var active = ScriptApp.getProjectTriggers().filter(function(t) {
      return blocked[String(t.getHandlerFunction() || '')] === true;
    });
    if (active.length) fail('T12_REBASE_ABORT_SYNC_TRIGGER_ACTIVE');
  }

  function validateSourceVsCatalog(capture, catalog) {
    if (!capture || !Array.isArray(capture.snapshots) ||
        capture.snapshots.length !== 2 || !capture.fingerprint) {
      fail('T12_REBASE_ABORT_SOURCE_CAPTURE');
    }
    var summary = [];
    NAMES.forEach(function(name, index) {
      var src = capture.snapshots[index];
      var cat = getOneCatalog(catalog, name);
      if (!src || src.sheetName !== name ||
          !Array.isArray(src.rows) ||
          Number(src.sourceLastRow) !== src.rows.length ||
          src.rows.length < 1 ||
          src.rows.length > MAX_SOURCE_ROWS ||
          String(src.sheetId) !== String(cat.sheetId) ||
          Number(src.sourceLastCol) !== Number(cat.sourceLastCol) ||
          cat.status !== 'ready' ||
          cat.note !== D1_ORDERS_LIVE_SYNC_V2_NOTE ||
          Number(cat.rowCount) !== Number(cat.sourceLastRow) ||
          Number(cat.rowCount) > Number(src.sourceLastRow) ||
          Number(src.sourceLastRow) - Number(cat.rowCount) > MAX_GROWTH_PER_TAB) {
        fail('T12_REBASE_ABORT_SOURCE_REMOTE_SHAPE');
      }
      summary.push({
        sheetName: name,
        sourceRows: Number(src.sourceLastRow),
        d1BaseRows: Number(cat.rowCount),
        growthRows: Number(src.sourceLastRow) - Number(cat.rowCount),
        sourceCols: Number(src.sourceLastCol)
      });
    });
    return summary;
  }

  function assertCatalogStable(before, after) {
    NAMES.forEach(function(name) {
      if (catalogTag(getOneCatalog(before, name)) !==
          catalogTag(getOneCatalog(after, name))) {
        fail('T12_REBASE_ABORT_CATALOG_CHANGED_BEFORE_PROMOTE');
      }
    });
  }

  function readAndVerifyRemote(snapshot) {
    var rows = [];
    var catalog = null;
    for (var offset = 0; offset < Number(snapshot.sourceLastRow); offset += PAGE_SIZE) {
      var out = d1FullGet_('/v1/mirror/sheet?name=' + encodeURIComponent(snapshot.sheetName) +
        '&limit=' + PAGE_SIZE + '&offset=' + offset);
      var page = out && out.sheet;
      if (!out || out.success !== true || !page ||
          page.sheetName !== snapshot.sheetName ||
          !Array.isArray(page.rows) ||
          Number(page.offset) !== offset ||
          JSON.stringify(page.headers || []) !== JSON.stringify(snapshot.headers || [])) {
        fail('T12_REBASE_POSTFLIGHT_PAGE_INVALID');
      }
      if (!catalog) {
        catalog = page;
      } else if (catalogTag(catalog) !== catalogTag(page)) {
        fail('T12_REBASE_POSTFLIGHT_CATALOG_DRIFT');
      }
      page.rows.forEach(function(row, i) {
        if (!row || Number(row.rowNumber) !== offset + i + 1) {
          fail('T12_REBASE_POSTFLIGHT_ROW_SHAPE');
        }
        rows.push({
          rowNumber: Number(row.rowNumber),
          values: row.values,
          display: row.display,
          formulas: row.formulas
        });
      });
    }

    if (!catalog ||
        catalog.status !== 'ready' ||
        String(catalog.sheetId) !== String(snapshot.sheetId) ||
        Number(catalog.sourceLastRow) !== Number(snapshot.sourceLastRow) ||
        Number(catalog.rowCount) !== Number(snapshot.sourceLastRow) ||
        Number(catalog.sourceLastCol) !== Number(snapshot.sourceLastCol) ||
        catalog.note !== D1_ORDERS_LIVE_SYNC_V2_NOTE ||
        rows.length !== snapshot.rows.length) {
      return {
        sheetName: snapshot.sheetName,
        exact: false,
        rowCount: rows.length,
        expectedRows: snapshot.rows.length
      };
    }

    var sourceHash = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(snapshot.rows));
    var remoteHash = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(rows));
    return {
      sheetName: snapshot.sheetName,
      exact: sourceHash === remoteHash,
      rowCount: rows.length,
      expectedRows: snapshot.rows.length,
      sourceHash: sourceHash,
      remoteHash: remoteHash,
      syncedAt: String(catalog.syncedAt || '')
    };
  }

  if (!lock.tryLock(5000)) {
    return {
      audit: AUDIT,
      success: false,
      mutationPerformed: false,
      automaticRetryAllowed: false,
      errorCode: 'T12_REBASE_ABORT_LOCK_NOT_AVAILABLE'
    };
  }

  try {
    var wb = d1FullSpreadsheet_();
    if (!wb || wb.getId() !== WORKBOOK_ID) fail('T12_REBASE_ABORT_WRONG_WORKBOOK');
    assertNoKnownSyncTriggers();

    var caps = d1FullGet_('/v1/mirror/capabilities');
    if (!caps || caps.success !== true || !caps.capabilities ||
        caps.capabilities.schemaMutationFree !== true ||
        caps.capabilities.atomicSupported !== true) {
      fail('T12_REBASE_ABORT_ATOMIC_CAPABILITY');
    }

    var beforeCatalog = getCatalog();
    var source = d1OrdersLiveSyncV2CaptureAll_();
    var sourceSummary = validateSourceVsCatalog(source, beforeCatalog);
    var runId = 't12-rebase-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);

    var staged = source.snapshots.map(function(snapshot) {
      return d1OrdersLiveSyncV2StageSnapshot_(snapshot, runId);
    });

    // Critical pre-promote fence: source and live catalog must still match
    // the exact preflight state. If not, staged rows remain isolated and
    // the live mirror is NOT promoted.
    var sourceAgain = d1OrdersLiveSyncV2CaptureAll_();
    if (!sourceAgain || sourceAgain.fingerprint !== source.fingerprint) {
      fail('T12_REBASE_ABORT_SOURCE_CHANGED_BEFORE_PROMOTE');
    }
    var catalogAgain = getCatalog();
    assertCatalogStable(beforeCatalog, catalogAgain);
    assertNoKnownSyncTriggers();

    var promote = null;
    var promoteError = '';
    try {
      promoteAttempted = true;
      promote = d1FullPost_('/v1/import/sheet', {
        atomicAction: 'promote',
        runId: runId,
        sheetNames: NAMES
      });
      if (!promote || promote.success !== true || promote.atomic !== true ||
          promote.action !== 'promote') {
        throw new Error('T12_REBASE_PROMOTE_RESPONSE_INVALID');
      }
      var promoted = (promote.promotedSheets || []).map(function(item) {
        return String(item && item.sheetName || '');
      });
      NAMES.forEach(function(name) {
        if (promoted.indexOf(name) === -1) {
          throw new Error('T12_REBASE_PROMOTE_OMITTED_TAB');
        }
      });
      promoteConfirmed = true;
    } catch (promoteErr) {
      promoteError = String(promoteErr && promoteErr.message || promoteErr || '');
    }

    // Never blind-retry an ambiguous promote. Reconcile only with GET.
    var postflight = source.snapshots.map(readAndVerifyRemote);
    var exactParity = postflight.every(function(item) { return item.exact === true; });
    var sourceAfter = d1OrdersLiveSyncV2CaptureAll_();
    var sourceStillSame = !!sourceAfter && sourceAfter.fingerprint === source.fingerprint;

    if (exactParity && sourceStillSame) {
      return {
        audit: AUDIT,
        success: true,
        mutationPerformed: true,
        promoteAttempted: promoteAttempted,
        promoteConfirmedByResponse: promoteConfirmed,
        promoteConfirmedByReadback: true,
        commitEvidence: promoteConfirmed ? 'POST_AND_GET' : 'GET_RECONCILIATION_AFTER_AMBIGUOUS_POST',
        automaticRetryAllowed: false,
        sourceStillSameAfterPromote: sourceStillSame,
        runId: runId,
        sourceSummary: sourceSummary,
        staged: staged.map(function(item) {
          return {
            sheetName: item.sheetName,
            copiedRows: Number(item.copiedRows || 0),
            sourceLastRow: Number(item.sourceLastRow || 0)
          };
        }),
        postflight: postflight.map(function(item) {
          return {
            sheetName: item.sheetName,
            exact: item.exact,
            rowCount: item.rowCount,
            expectedRows: item.expectedRows,
            syncedAt: item.syncedAt
          };
        })
      };
    }

    return {
      audit: AUDIT,
      success: false,
      mutationPerformed: promoteAttempted,
      promoteAttempted: promoteAttempted,
      promoteConfirmedByResponse: promoteConfirmed,
      outcomeUnknown: promoteAttempted && !promoteConfirmed,
      automaticRetryAllowed: false,
      sourceStillSameAfterPromote: sourceStillSame,
      parityReachedButSourceAdvanced: exactParity && !sourceStillSame,
      errorCode: exactParity && !sourceStillSame ?
        'T12_REBASE_POSTFLIGHT_SOURCE_CHANGED_NO_RETRY' :
        promoteConfirmed ?
        'T12_REBASE_POSTFLIGHT_PARITY_FAILED_NO_RETRY' :
        'T12_REBASE_PROMOTE_OUTCOME_UNCERTAIN_NO_RETRY',
      promoteError: promoteError ? 'captured-not-logged' : '',
      postflight: postflight.map(function(item) {
        return {
          sheetName: item.sheetName,
          exact: item.exact,
          rowCount: item.rowCount,
          expectedRows: item.expectedRows,
          syncedAt: item.syncedAt
        };
      })
    };
  } catch (e) {
    var code = String(e && (e.trendosCode || e.message) || '');
    return {
      audit: AUDIT,
      success: false,
      mutationPerformed: promoteAttempted,
      promoteAttempted: promoteAttempted,
      promoteConfirmedByResponse: promoteConfirmed,
      outcomeUnknown: promoteAttempted && !promoteConfirmed,
      automaticRetryAllowed: false,
      errorCode: /^T12_REBASE_[A-Z0-9_]+$/.test(code) ? code :
        'T12_REBASE_ABORT_UNKNOWN'
    };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
