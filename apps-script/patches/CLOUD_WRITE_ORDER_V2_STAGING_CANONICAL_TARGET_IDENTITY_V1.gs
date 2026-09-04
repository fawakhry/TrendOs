/* TrendOS Cloud Write Order V2 — Staging Canonical Target Identity V1
 *
 * READ-ONLY runtime target gate.
 *
 * createManualOrder_ uses ss_(), and ss_() may honor TRENDOS_SPREADSHEET_ID.
 * Therefore checking only SpreadsheetApp.getActiveSpreadsheet() is insufficient.
 * This gate proves BOTH the active workbook and the canonical ss_() target are
 * the dedicated staging spreadsheet and refuses the production spreadsheet.
 */

var CW_V2_STAGING_CANONICAL_TARGET_IDENTITY_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_V1_20260905";
var CW_V2_CANONICAL_TARGET_STAGING_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";
var CW_V2_CANONICAL_TARGET_PRODUCTION_ID_V1 =
  "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";

function cwV2CanonicalTargetTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2CanonicalTargetFailV1_(code, details) {
  return {
    success: false,
    qualified: false,
    version: CW_V2_STAGING_CANONICAL_TARGET_IDENTITY_VERSION_V1,
    code: String(code || "canonical-target-identity-refused"),
    details: details || null,
    readOnly: true,
    activeSpreadsheetVerified: false,
    canonicalSpreadsheetVerified: false,
    canonicalTargetIdentityQualified: false,
    canonicalInvocationEligible: false,
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function trendosCloudWriteOrderV2StagingCanonicalTargetIdentityV1_(preflight, authQualification, sideEffectQualification) {
  preflight = preflight && typeof preflight === "object" ? preflight : {};
  authQualification = authQualification && typeof authQualification === "object" ? authQualification : {};
  sideEffectQualification = sideEffectQualification && typeof sideEffectQualification === "object" ? sideEffectQualification : {};

  if (preflight.success !== true || preflight.stagingTargetVerified !== true ||
      cwV2CanonicalTargetTextV1_(preflight.spreadsheetId) !== CW_V2_CANONICAL_TARGET_STAGING_ID_V1) {
    return cwV2CanonicalTargetFailV1_("qualified-staging-preflight-required");
  }
  if (authQualification.success !== true || authQualification.authBridgeQualified !== true) {
    return cwV2CanonicalTargetFailV1_("qualified-staging-auth-required");
  }
  if (sideEffectQualification.success !== true || sideEffectQualification.sideEffectShapeQualified !== true ||
      sideEffectQualification.directNetworkQualified !== true) {
    return cwV2CanonicalTargetFailV1_("qualified-side-effect-shape-required");
  }

  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet) {
    return cwV2CanonicalTargetFailV1_("spreadsheet-runtime-required");
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  var activeId = active && active.getId ? cwV2CanonicalTargetTextV1_(active.getId()) : "";
  if (activeId === CW_V2_CANONICAL_TARGET_PRODUCTION_ID_V1) {
    return cwV2CanonicalTargetFailV1_("production-active-spreadsheet-refused");
  }
  if (activeId !== CW_V2_CANONICAL_TARGET_STAGING_ID_V1) {
    return cwV2CanonicalTargetFailV1_("unexpected-active-spreadsheet", { activeSpreadsheetId: activeId });
  }

  if (typeof ss_ !== "function") {
    return cwV2CanonicalTargetFailV1_("canonical-ss-helper-required");
  }
  var canonical = ss_();
  var canonicalId = canonical && canonical.getId ? cwV2CanonicalTargetTextV1_(canonical.getId()) : "";
  if (canonicalId === CW_V2_CANONICAL_TARGET_PRODUCTION_ID_V1) {
    return cwV2CanonicalTargetFailV1_("production-canonical-target-refused");
  }
  if (canonicalId !== CW_V2_CANONICAL_TARGET_STAGING_ID_V1) {
    return cwV2CanonicalTargetFailV1_("unexpected-canonical-target", { canonicalSpreadsheetId: canonicalId });
  }
  if (canonicalId !== activeId) {
    return cwV2CanonicalTargetFailV1_("active-canonical-target-mismatch");
  }

  var configuredClass = "unknown";
  var configuredPresent = false;
  try {
    if (typeof PropertiesService !== "undefined") {
      var configured = cwV2CanonicalTargetTextV1_(PropertiesService.getScriptProperties().getProperty("TRENDOS_SPREADSHEET_ID"));
      configuredPresent = !!configured;
      if (!configured) configuredClass = "empty-use-bound-active";
      else if (configured === CW_V2_CANONICAL_TARGET_STAGING_ID_V1) configuredClass = "explicit-staging";
      else if (configured === CW_V2_CANONICAL_TARGET_PRODUCTION_ID_V1) configuredClass = "production-refused";
      else configuredClass = "unexpected-refused";
      if (configuredClass === "production-refused") return cwV2CanonicalTargetFailV1_("production-script-property-target-refused");
      if (configuredClass === "unexpected-refused") return cwV2CanonicalTargetFailV1_("unexpected-script-property-target-refused");
    }
  } catch (err) {
    return cwV2CanonicalTargetFailV1_("spreadsheet-target-property-read-failed");
  }

  return {
    success: true,
    qualified: true,
    version: CW_V2_STAGING_CANONICAL_TARGET_IDENTITY_VERSION_V1,
    readOnly: true,
    activeSpreadsheetId: activeId,
    canonicalSpreadsheetId: canonicalId,
    activeSpreadsheetVerified: true,
    canonicalSpreadsheetVerified: true,
    activeEqualsCanonicalTarget: true,
    productionSpreadsheetRefused: true,
    configuredSpreadsheetPropertyPresent: configuredPresent,
    configuredSpreadsheetPropertyClass: configuredClass,
    canonicalTargetIdentityQualified: true,
    canonicalInvocationEligible: true,
    nextRequiredGate: "staging-first-write-runner",
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}
