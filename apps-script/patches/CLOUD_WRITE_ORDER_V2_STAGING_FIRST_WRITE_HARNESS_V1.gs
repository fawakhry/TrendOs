/* TrendOS Cloud Write Order V2 — Isolated Staging First Write Harness V1
 *
 * MANUAL STAGING-ONLY harness. No doGet/doPost route is added.
 *
 * Install this file ONLY in the Apps Script project bound to the dedicated
 * staging spreadsheet copy, then manually run:
 *   runTrendOSCloudWriteOrderV2StagingFirstWrite
 *
 * Safety sequence before createManualOrder_ is invoked:
 * 1) active spreadsheet must be the dedicated staging copy;
 * 2) canonical ss_() target must resolve to the same staging copy;
 * 3) TRENDOS_SPREADSHEET_ID may be empty or explicit staging only;
 * 4) staging guard + V2 CI PASS marker + exact pre-write 274/315 baseline;
 * 5) current bound Script ID is pinned in Script Properties only AFTER the
 *    staging workbook identity checks pass;
 * 6) exact synthetic staging service user is resolved internally; its token is
 *    never logged or returned;
 * 7) the synthetic session timestamp is refreshed in STAGING only;
 * 8) one external/light-customer Laser order is created with no preallocated
 *    Business Order ID;
 * 9) the same clientRequestId is replayed once and must be idempotently blocked;
 * 10) Orders/Lines row counts and returned IDs are verified after both calls.
 *
 * Production Cloud Write remains OFF. This harness never changes Cloudflare.
 */

var CW_V2_FIRST_WRITE_HARNESS_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_V1_20260905";
var CW_V2_FIRST_WRITE_STAGING_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";
var CW_V2_FIRST_WRITE_PRODUCTION_ID_V1 =
  "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
var CW_V2_FIRST_WRITE_GUARD_SHEET_V1 =
  "__TRENDOS_V2_CANONICAL_STAGING_GUARD";
var CW_V2_FIRST_WRITE_USERNAME_V1 = "cw_stage_service";
var CW_V2_FIRST_WRITE_ORDERS_BASELINE_V1 = 274;
var CW_V2_FIRST_WRITE_LINES_BASELINE_V1 = 315;
var CW_V2_FIRST_WRITE_CONFIRM_V1 = "CW-STAGE-FIRST-WRITE";
var CW_V2_FIRST_WRITE_SCRIPT_PIN_PROPERTY_V1 = "CW_V2_STAGING_BOUND_SCRIPT_ID_V1";

function cwV2FirstWriteTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2FirstWriteFailV1_(code, details) {
  return {
    success: false,
    verified: false,
    version: CW_V2_FIRST_WRITE_HARNESS_VERSION_V1,
    code: String(code || "staging-first-write-refused"),
    details: details || null,
    productionSpreadsheetRefused: true,
    tokenReturned: false,
    canonicalWriteAttempted: false,
    canonicalWriteVerified: false,
    idempotencyReplayVerified: false,
    productionCloudWriteChanged: false
  };
}

function cwV2FirstWriteHeaderIndexV1_(headers, aliases) {
  headers = Array.isArray(headers) ? headers : [];
  aliases = Array.isArray(aliases) ? aliases : [];
  var normalized = headers.map(function(v){ return cwV2FirstWriteTextV1_(v).toLowerCase(); });
  for (var i = 0; i < aliases.length; i++) {
    var idx = normalized.indexOf(cwV2FirstWriteTextV1_(aliases[i]).toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function cwV2FirstWriteGuardMapV1_(guardSheet) {
  var values = guardSheet.getRange(1, 1, 17, 2).getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var key = cwV2FirstWriteTextV1_(values[i][0]);
    if (key) map[key] = cwV2FirstWriteTextV1_(values[i][1]);
  }
  return {
    banner: cwV2FirstWriteTextV1_(values[0][0]),
    map: map
  };
}

function cwV2FirstWriteResolveTargetsV1_() {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet) {
    return cwV2FirstWriteFailV1_("spreadsheet-runtime-required");
  }
  if (typeof ss_ !== "function") return cwV2FirstWriteFailV1_("canonical-ss-helper-required");

  var active = SpreadsheetApp.getActiveSpreadsheet();
  var activeId = active && active.getId ? cwV2FirstWriteTextV1_(active.getId()) : "";
  if (activeId === CW_V2_FIRST_WRITE_PRODUCTION_ID_V1) {
    return cwV2FirstWriteFailV1_("production-active-spreadsheet-refused");
  }
  if (activeId !== CW_V2_FIRST_WRITE_STAGING_ID_V1) {
    return cwV2FirstWriteFailV1_("unexpected-active-spreadsheet", { activeSpreadsheetId: activeId });
  }

  var canonical = ss_();
  var canonicalId = canonical && canonical.getId ? cwV2FirstWriteTextV1_(canonical.getId()) : "";
  if (canonicalId === CW_V2_FIRST_WRITE_PRODUCTION_ID_V1) {
    return cwV2FirstWriteFailV1_("production-canonical-target-refused");
  }
  if (canonicalId !== CW_V2_FIRST_WRITE_STAGING_ID_V1 || canonicalId !== activeId) {
    return cwV2FirstWriteFailV1_("canonical-staging-target-mismatch", {
      activeSpreadsheetId: activeId,
      canonicalSpreadsheetId: canonicalId
    });
  }

  var props = null;
  try { props = PropertiesService.getScriptProperties(); }
  catch (err) { return cwV2FirstWriteFailV1_("script-properties-required"); }
  var configured = cwV2FirstWriteTextV1_(props.getProperty("TRENDOS_SPREADSHEET_ID"));
  if (configured === CW_V2_FIRST_WRITE_PRODUCTION_ID_V1) {
    return cwV2FirstWriteFailV1_("production-script-property-target-refused");
  }
  if (configured && configured !== CW_V2_FIRST_WRITE_STAGING_ID_V1) {
    return cwV2FirstWriteFailV1_("unexpected-script-property-target-refused");
  }

  return {
    success: true,
    active: active,
    canonical: canonical,
    activeId: activeId,
    canonicalId: canonicalId,
    props: props,
    configuredTargetClass: configured ? "explicit-staging" : "empty-use-bound-active"
  };
}

function cwV2FirstWriteVerifyGuardAndBaselineV1_(spreadsheet) {
  var guardSheet = spreadsheet.getSheetByName(CW_V2_FIRST_WRITE_GUARD_SHEET_V1);
  if (!guardSheet) return cwV2FirstWriteFailV1_("staging-guard-missing");
  var guard = cwV2FirstWriteGuardMapV1_(guardSheet);
  var g = guard.map;
  if (guard.banner !== "TRENDOS V2 CANONICAL WRITE STAGING — DO NOT USE FOR PRODUCTION" ||
      g.stagingSpreadsheetId !== CW_V2_FIRST_WRITE_STAGING_ID_V1 ||
      g.sourceProductionSpreadsheetId !== CW_V2_FIRST_WRITE_PRODUCTION_ID_V1 ||
      g.productionCloudWrite !== "OFF" ||
      g.allowedSyntheticOrderPrefix !== "CW-STAGE-" ||
      g.canonicalWriteTarget !== "THIS STAGING COPY ONLY" ||
      g.productionSpreadsheetMutationAllowed !== "NO" ||
      g.productionAccountUsed !== "NO" ||
      g.v2GateConclusion !== "PASS" ||
      g.latestCheckpoint !== "PERF-CF-02BJ") {
    return cwV2FirstWriteFailV1_("staging-guard-contract-mismatch");
  }

  var orders = spreadsheet.getSheetByName("الأوردرات");
  var lines = spreadsheet.getSheetByName("بنود الأوردرات");
  if (!orders || !lines) return cwV2FirstWriteFailV1_("canonical-sheets-missing");
  var ordersLastRow = Number(orders.getLastRow() || 0);
  var linesLastRow = Number(lines.getLastRow() || 0);
  if (ordersLastRow !== CW_V2_FIRST_WRITE_ORDERS_BASELINE_V1 ||
      linesLastRow !== CW_V2_FIRST_WRITE_LINES_BASELINE_V1) {
    return cwV2FirstWriteFailV1_("first-write-baseline-mismatch", {
      expectedOrdersLastRow: CW_V2_FIRST_WRITE_ORDERS_BASELINE_V1,
      actualOrdersLastRow: ordersLastRow,
      expectedLinesLastRow: CW_V2_FIRST_WRITE_LINES_BASELINE_V1,
      actualLinesLastRow: linesLastRow
    });
  }
  return {
    success: true,
    guardSheet: guardSheet,
    orders: orders,
    lines: lines,
    ordersLastRow: ordersLastRow,
    linesLastRow: linesLastRow
  };
}

function cwV2FirstWritePinScriptIdentityV1_(props) {
  if (typeof ScriptApp === "undefined" || !ScriptApp.getScriptId) {
    return cwV2FirstWriteFailV1_("bound-script-identity-required");
  }
  var currentScriptId = cwV2FirstWriteTextV1_(ScriptApp.getScriptId());
  if (!currentScriptId) return cwV2FirstWriteFailV1_("script-id-required");
  var pinned = cwV2FirstWriteTextV1_(props.getProperty(CW_V2_FIRST_WRITE_SCRIPT_PIN_PROPERTY_V1));
  if (pinned && pinned !== currentScriptId) {
    return cwV2FirstWriteFailV1_("staging-script-identity-mismatch");
  }
  if (!pinned) props.setProperty(CW_V2_FIRST_WRITE_SCRIPT_PIN_PROPERTY_V1, currentScriptId);
  return { success: true, pinned: true, newlyPinned: !pinned };
}

function cwV2FirstWriteResolveSyntheticAuthV1_(spreadsheet) {
  var users = spreadsheet.getSheetByName("المستخدمين");
  if (!users || users.getLastRow() < 2) return cwV2FirstWriteFailV1_("staging-users-sheet-required");
  var values = users.getRange(1, 1, users.getLastRow(), users.getLastColumn()).getValues();
  var headers = values[0] || [];
  var cUsername = cwV2FirstWriteHeaderIndexV1_(headers, ["اسم المستخدم", "Username", "username"]);
  var cDepartment = cwV2FirstWriteHeaderIndexV1_(headers, ["القسم", "Department", "department"]);
  var cRole = cwV2FirstWriteHeaderIndexV1_(headers, ["الصلاحية", "Role", "role"]);
  var cActive = cwV2FirstWriteHeaderIndexV1_(headers, ["مفعل؟", "مفعل", "Active", "active"]);
  var cLastLogin = cwV2FirstWriteHeaderIndexV1_(headers, ["آخر دخول", "Last Login"]);
  var cToken = cwV2FirstWriteHeaderIndexV1_(headers, ["Token"]);
  if ([cUsername, cDepartment, cRole, cActive, cLastLogin, cToken].some(function(x){ return x < 0; })) {
    return cwV2FirstWriteFailV1_("staging-auth-columns-missing");
  }

  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (cwV2FirstWriteTextV1_(values[i][cUsername]) === CW_V2_FIRST_WRITE_USERNAME_V1) {
      rowIndex = i;
      break;
    }
  }
  if (rowIndex < 1) return cwV2FirstWriteFailV1_("synthetic-staging-user-missing");

  var row = values[rowIndex];
  var username = cwV2FirstWriteTextV1_(row[cUsername]);
  var department = cwV2FirstWriteTextV1_(row[cDepartment]);
  var role = cwV2FirstWriteTextV1_(row[cRole]);
  var active = cwV2FirstWriteTextV1_(row[cActive]);
  var token = cwV2FirstWriteTextV1_(row[cToken]);
  if (username !== CW_V2_FIRST_WRITE_USERNAME_V1 ||
      department.indexOf("STAGING") === -1 || department.indexOf("خدمة") === -1 ||
      active !== "نعم" || !token || token.indexOf("cw-stage-") !== 0 || token.length < 24) {
    return cwV2FirstWriteFailV1_("synthetic-staging-auth-contract-mismatch");
  }
  if (typeof roleFromArabic_ !== "function" || roleFromArabic_(role, department) !== "service") {
    return cwV2FirstWriteFailV1_("synthetic-service-role-required");
  }
  if (typeof canCreateOrder_ !== "function" || canCreateOrder_({
    username: username,
    name: username,
    role: role,
    department: department,
    active: active
  }) !== true) {
    return cwV2FirstWriteFailV1_("synthetic-user-cannot-create-order");
  }

  // Refresh only the synthetic STAGING session timestamp immediately before the
  // first canonical invocation. No production user row is ever touched.
  users.getRange(rowIndex + 1, cLastLogin + 1).setValue(new Date());
  return {
    success: true,
    username: username,
    token: token,
    tokenReturned: false,
    sessionRefreshedInStaging: true
  };
}

function cwV2FirstWriteLastIdV1_(sheet, aliases) {
  if (!sheet || sheet.getLastRow() < 2) return "";
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  var idx = cwV2FirstWriteHeaderIndexV1_(headers, aliases);
  if (idx < 0) return "";
  return cwV2FirstWriteTextV1_(sheet.getRange(sheet.getLastRow(), idx + 1).getValue());
}

function cwV2FirstWriteSanitizeWriterResultV1_(result) {
  result = result && typeof result === "object" ? result : {};
  return {
    success: result.success === true,
    version: cwV2FirstWriteTextV1_(result.version),
    orderId: cwV2FirstWriteTextV1_(result.orderId),
    lineId: cwV2FirstWriteTextV1_(result.lineId),
    linesCreated: Number(result.linesCreated || 0),
    duplicatePrevented: result.duplicatePrevented === true,
    idempotentReplay: result.idempotentReplay === true,
    reusedOpenOrder: result.reusedOpenOrder === true,
    message: cwV2FirstWriteTextV1_(result.message)
  };
}

function trendosCloudWriteOrderV2StagingFirstWriteV1_(confirm) {
  if (cwV2FirstWriteTextV1_(confirm) !== CW_V2_FIRST_WRITE_CONFIRM_V1) {
    return cwV2FirstWriteFailV1_("explicit-first-write-confirmation-required");
  }
  if (typeof createManualOrder_ !== "function") {
    return cwV2FirstWriteFailV1_("canonical-create-manual-order-required");
  }

  // No mutations before both active and canonical target identities are staging.
  var target = cwV2FirstWriteResolveTargetsV1_();
  if (!target.success) return target;

  var baseline = cwV2FirstWriteVerifyGuardAndBaselineV1_(target.canonical);
  if (!baseline.success) return baseline;

  // Script-property pinning is allowed only after the canonical staging target
  // and exact pre-write baseline have been proven.
  var scriptPin = cwV2FirstWritePinScriptIdentityV1_(target.props);
  if (!scriptPin.success) return scriptPin;

  var auth = cwV2FirstWriteResolveSyntheticAuthV1_(target.canonical);
  if (!auth.success) return auth;

  var now = Date.now();
  var externalId = String(now).slice(-9);
  var suffix = "";
  try { suffix = Utilities.getUuid().replace(/[^A-Za-z0-9]/g, "").slice(0, 8); }
  catch (err) { suffix = String(now).slice(-8); }
  var clientRequestId = "CW-STAGE-FIRST-WRITE-" + String(now) + "-" + suffix;

  var event = {
    parameter: {
      username: auth.username,
      token: auth.token,
      clientRequestId: clientRequestId,
      customerName: "عميل خارجي - STAGING - " + externalId,
      customerMode: "خارجي / عابر",
      externalCustomerId: externalId,
      department: "ليزر",
      itemName: "CW V2 STAGING FIRST WRITE",
      qty: "1",
      priority: "عادي",
      status: "طلب جديد",
      heatPress: "لا",
      flyPrint: "لا",
      source: "Cloud Write V2 STAGING FIRST WRITE",
      notes: "PERF-CF-02BK isolated synthetic canonical first write"
    }
  };

  var before = {
    orders: Number(baseline.orders.getLastRow() || 0),
    lines: Number(baseline.lines.getLastRow() || 0)
  };

  var firstRaw = createManualOrder_(event);
  var first = cwV2FirstWriteSanitizeWriterResultV1_(firstRaw);
  if (!first.success || !first.orderId || !first.lineId || first.linesCreated !== 1 || first.reusedOpenOrder) {
    return {
      success: false,
      verified: false,
      version: CW_V2_FIRST_WRITE_HARNESS_VERSION_V1,
      code: "first-canonical-write-return-contract-failed",
      writerResult: first,
      productionSpreadsheetRefused: true,
      tokenReturned: false,
      canonicalWriteAttempted: true,
      canonicalWriteVerified: false,
      idempotencyReplayVerified: false,
      productionCloudWriteChanged: false
    };
  }

  var afterFirst = {
    orders: Number(baseline.orders.getLastRow() || 0),
    lines: Number(baseline.lines.getLastRow() || 0)
  };
  var orderLastId = cwV2FirstWriteLastIdV1_(baseline.orders, ["رقم الأوردر", "Order ID"]);
  var lineLastOrderId = cwV2FirstWriteLastIdV1_(baseline.lines, ["رقم الأوردر", "Order ID"]);
  var lineLastId = cwV2FirstWriteLastIdV1_(baseline.lines, ["رقم البند", "Line ID"]);
  if (afterFirst.orders !== before.orders + 1 ||
      afterFirst.lines !== before.lines + 1 ||
      orderLastId !== first.orderId ||
      lineLastOrderId !== first.orderId ||
      lineLastId !== first.lineId) {
    return {
      success: false,
      verified: false,
      version: CW_V2_FIRST_WRITE_HARNESS_VERSION_V1,
      code: "first-canonical-write-sheet-verification-failed",
      writerResult: first,
      before: before,
      afterFirst: afterFirst,
      observedLastIds: { orderId: orderLastId, lineOrderId: lineLastOrderId, lineId: lineLastId },
      productionSpreadsheetRefused: true,
      tokenReturned: false,
      canonicalWriteAttempted: true,
      canonicalWriteVerified: false,
      idempotencyReplayVerified: false,
      productionCloudWriteChanged: false
    };
  }

  // Same request, same credentials, second call: it must return the saved V1908
  // response without adding any Orders/Lines rows.
  var replayRaw = createManualOrder_(event);
  var replay = cwV2FirstWriteSanitizeWriterResultV1_(replayRaw);
  var afterReplay = {
    orders: Number(baseline.orders.getLastRow() || 0),
    lines: Number(baseline.lines.getLastRow() || 0)
  };
  if (!replay.success || replay.duplicatePrevented !== true || replay.orderId !== first.orderId ||
      afterReplay.orders !== afterFirst.orders || afterReplay.lines !== afterFirst.lines) {
    return {
      success: false,
      verified: false,
      version: CW_V2_FIRST_WRITE_HARNESS_VERSION_V1,
      code: "idempotency-replay-verification-failed",
      writerResult: first,
      replayResult: replay,
      before: before,
      afterFirst: afterFirst,
      afterReplay: afterReplay,
      productionSpreadsheetRefused: true,
      tokenReturned: false,
      canonicalWriteAttempted: true,
      canonicalWriteVerified: true,
      idempotencyReplayVerified: false,
      productionCloudWriteChanged: false
    };
  }

  // Persist only non-secret result markers in the staging guard. The token and
  // Script ID are intentionally never written to this sheet or returned.
  baseline.guardSheet.getRange(18, 1, 3, 2).setValues([
    ["firstCanonicalWriteStatus", "PASS"],
    ["firstCanonicalOrderId", first.orderId],
    ["firstCanonicalLineId", first.lineId]
  ]);

  return {
    success: true,
    verified: true,
    version: CW_V2_FIRST_WRITE_HARNESS_VERSION_V1,
    stagingSpreadsheetId: CW_V2_FIRST_WRITE_STAGING_ID_V1,
    productionSpreadsheetRefused: true,
    canonicalTargetVerified: true,
    scriptIdentityPinned: true,
    configuredTargetClass: target.configuredTargetClass,
    syntheticUsername: auth.username,
    tokenPresent: true,
    tokenReturned: false,
    sessionRefreshedInStaging: true,
    clientRequestId: clientRequestId,
    externalCustomerId: externalId,
    orderId: first.orderId,
    lineId: first.lineId,
    before: before,
    afterFirst: afterFirst,
    afterReplay: afterReplay,
    canonicalWriteAttempted: true,
    canonicalWriteVerified: true,
    idempotencyReplayVerified: true,
    duplicatePreventedOnReplay: true,
    productionCloudWriteChanged: false,
    productionWriteExecuted: false,
    nextRequiredGate: "post-write-staging-live-verification"
  };
}

function runTrendOSCloudWriteOrderV2StagingFirstWrite() {
  var result = trendosCloudWriteOrderV2StagingFirstWriteV1_(CW_V2_FIRST_WRITE_CONFIRM_V1);
  Logger.log("CLOUD_WRITE_V2_STAGING_FIRST_WRITE=" + JSON.stringify(result));
  return result;
}
