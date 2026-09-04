/* TrendOS Cloud Write Order V2 — Staging Auth Bridge Qualification V1
 *
 * READ-ONLY qualification for the synthetic staging-only Apps Script identity.
 *
 * Safety contract:
 * - only the dedicated staging spreadsheet is accepted;
 * - credentials MUST NOT come from the Cloud V2 plan;
 * - the synthetic account must be cw_stage_service and service-authorized;
 * - token value is never returned or logged;
 * - authorize_() is intentionally NOT called because its failure path may clear
 *   an expired/invalid token cell; this gate must remain read-only;
 * - this gate does NOT call createManualOrder_().
 */

var CW_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_V1_20260905";
var CW_V2_STAGING_AUTH_SPREADSHEET_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";
var CW_V2_PRODUCTION_AUTH_SPREADSHEET_ID_V1 =
  "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
var CW_V2_STAGING_SYNTHETIC_USERNAME_V1 = "cw_stage_service";

function cwV2StagingAuthTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2StagingAuthKeyV1_(value) {
  return cwV2StagingAuthTextV1_(value).toLowerCase();
}

function cwV2StagingAuthFailV1_(code, details) {
  return {
    success: false,
    qualified: false,
    version: CW_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_VERSION_V1,
    code: String(code || "staging-auth-bridge-refused"),
    details: details || null,
    readOnly: true,
    stagingTargetVerified: false,
    syntheticAccountVerified: false,
    tokenPresent: false,
    tokenValueReturned: false,
    authorizeInvoked: false,
    authBridgeQualified: false,
    canonicalInvocationAllowed: false,
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function cwV2StagingAuthHeaderIndexV1_(headers, aliases) {
  headers = Array.isArray(headers) ? headers : [];
  aliases = Array.isArray(aliases) ? aliases : [];
  var normalized = headers.map(cwV2StagingAuthKeyV1_);
  for (var i = 0; i < aliases.length; i++) {
    var idx = normalized.indexOf(cwV2StagingAuthKeyV1_(aliases[i]));
    if (idx !== -1) return idx;
  }
  return -1;
}

function trendosCloudWriteOrderV2StagingAuthBridgeQualificationV1_(adapterResult) {
  adapterResult = adapterResult && typeof adapterResult === "object" ? adapterResult : {};

  if (adapterResult.success !== true || adapterResult.valid !== true ||
      adapterResult.canonicalEnvelopeReady !== true ||
      adapterResult.canonicalInvocationAuthorized !== false ||
      adapterResult.businessOrderIdStrategy !== "apps-script-allocated") {
    return cwV2StagingAuthFailV1_("qualified-adapter-result-required");
  }

  var envelope = adapterResult.canonicalParameterEnvelope &&
    typeof adapterResult.canonicalParameterEnvelope === "object"
      ? adapterResult.canonicalParameterEnvelope
      : null;
  if (!envelope) return cwV2StagingAuthFailV1_("canonical-envelope-required");
  if (cwV2StagingAuthTextV1_(envelope.username || envelope.token || envelope.orderId)) {
    return cwV2StagingAuthFailV1_("cloud-credentials-or-order-id-refused");
  }
  if (cwV2StagingAuthTextV1_(envelope.clientRequestId).indexOf("CW-STAGE-") !== 0) {
    return cwV2StagingAuthFailV1_("staging-client-request-prefix-required");
  }

  if (typeof trendosCloudWriteOrderV2StagingRuntimePreflightV1_ !== "function") {
    return cwV2StagingAuthFailV1_("staging-runtime-preflight-required");
  }
  var preflight = trendosCloudWriteOrderV2StagingRuntimePreflightV1_();
  if (!preflight || preflight.success !== true || preflight.stagingTargetVerified !== true) {
    return cwV2StagingAuthFailV1_("staging-runtime-preflight-not-qualified", {
      preflightCode: preflight && preflight.code ? String(preflight.code) : ""
    });
  }

  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet) {
    return cwV2StagingAuthFailV1_("spreadsheet-runtime-required");
  }
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var spreadsheetId = spreadsheet && spreadsheet.getId
    ? cwV2StagingAuthTextV1_(spreadsheet.getId())
    : "";
  if (spreadsheetId === CW_V2_PRODUCTION_AUTH_SPREADSHEET_ID_V1) {
    return cwV2StagingAuthFailV1_("production-spreadsheet-refused");
  }
  if (spreadsheetId !== CW_V2_STAGING_AUTH_SPREADSHEET_ID_V1) {
    return cwV2StagingAuthFailV1_("unexpected-staging-spreadsheet");
  }

  var users = spreadsheet.getSheetByName("المستخدمين");
  if (!users || users.getLastRow() < 2) {
    return cwV2StagingAuthFailV1_("staging-users-sheet-required");
  }
  var values = users.getRange(1, 1, users.getLastRow(), users.getLastColumn()).getValues();
  var headers = values[0] || [];
  var cUsername = cwV2StagingAuthHeaderIndexV1_(headers, ["اسم المستخدم", "Username", "username"]);
  var cDepartment = cwV2StagingAuthHeaderIndexV1_(headers, ["القسم", "Department", "department"]);
  var cRole = cwV2StagingAuthHeaderIndexV1_(headers, ["الصلاحية", "Role", "role"]);
  var cActive = cwV2StagingAuthHeaderIndexV1_(headers, ["مفعل؟", "مفعل", "Active", "active"]);
  var cLastLogin = cwV2StagingAuthHeaderIndexV1_(headers, ["آخر دخول", "Last Login"]);
  var cToken = cwV2StagingAuthHeaderIndexV1_(headers, ["Token"]);
  if ([cUsername, cDepartment, cRole, cActive, cLastLogin, cToken].some(function(x){ return x < 0; })) {
    return cwV2StagingAuthFailV1_("staging-auth-columns-missing");
  }

  var matched = null;
  for (var i = 1; i < values.length; i++) {
    if (cwV2StagingAuthKeyV1_(values[i][cUsername]) === CW_V2_STAGING_SYNTHETIC_USERNAME_V1) {
      matched = values[i];
      break;
    }
  }
  if (!matched) return cwV2StagingAuthFailV1_("synthetic-staging-user-missing");

  var username = cwV2StagingAuthTextV1_(matched[cUsername]);
  var department = cwV2StagingAuthTextV1_(matched[cDepartment]);
  var role = cwV2StagingAuthTextV1_(matched[cRole]);
  var active = cwV2StagingAuthTextV1_(matched[cActive]);
  var lastLogin = matched[cLastLogin];
  var token = cwV2StagingAuthTextV1_(matched[cToken]);

  if (username !== CW_V2_STAGING_SYNTHETIC_USERNAME_V1) {
    return cwV2StagingAuthFailV1_("synthetic-username-mismatch");
  }
  if (department.indexOf("STAGING") === -1 || department.indexOf("خدمة") === -1) {
    return cwV2StagingAuthFailV1_("staging-service-department-required");
  }
  if (active !== "نعم") return cwV2StagingAuthFailV1_("synthetic-user-not-active");
  if (!token || token.indexOf("cw-stage-") !== 0 || token.length < 24) {
    return cwV2StagingAuthFailV1_("synthetic-staging-token-required");
  }

  if (typeof roleFromArabic_ !== "function" || roleFromArabic_(role, department) !== "service") {
    return cwV2StagingAuthFailV1_("synthetic-service-role-required");
  }
  var syntheticUser = {
    username: username,
    name: username,
    role: role,
    department: department,
    active: active
  };
  if (typeof canCreateOrder_ !== "function" || canCreateOrder_(syntheticUser) !== true) {
    return cwV2StagingAuthFailV1_("synthetic-user-cannot-create-order");
  }
  if (typeof sessionExpiredV1922_ !== "function" || sessionExpiredV1922_(lastLogin) === true) {
    return cwV2StagingAuthFailV1_("synthetic-staging-session-expired");
  }

  return {
    success: true,
    qualified: true,
    version: CW_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_VERSION_V1,
    readOnly: true,
    spreadsheetId: spreadsheetId,
    productionSpreadsheetRefused: true,
    stagingTargetVerified: true,
    syntheticAccountVerified: true,
    syntheticUsername: username,
    canonicalRole: "service",
    createOrderPermissionVerified: true,
    tokenPresent: true,
    tokenValueReturned: false,
    tokenSource: "staging-users-sheet-only",
    cloudCredentialsAccepted: false,
    authorizeInvoked: false,
    authBridgeQualified: true,
    canonicalInvocationAllowed: false,
    nextRequiredGate: "canonical-side-effect-isolation",
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function runTrendOSCloudWriteOrderV2StagingAuthBridgeQualification() {
  throw new Error("Call through the V2 adapter qualification harness; this helper intentionally accepts no standalone credentials.");
}
