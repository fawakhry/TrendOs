/* TrendOS Cloud Write Order V2 — Staging Side-Effect Qualification V1
 *
 * PURE policy gate describing the currently-audited createManualOrder_ side
 * effects for the FIRST isolated staging canonical write.
 *
 * Static CI separately verifies the current Code.gs call path. This helper does
 * not call Sheets, Properties, network APIs, authorize_(), or createManualOrder_().
 *
 * IMPORTANT: Side-effect SHAPE may qualify while invocation remains blocked.
 * Script-project isolation must still be proven because createManualOrder_ writes
 * two Script Properties (idempotency response + data version).
 */

var CW_V2_STAGING_SIDE_EFFECT_QUALIFICATION_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_V1_20260905";
var CW_V2_SIDE_EFFECT_STAGING_SPREADSHEET_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";

function cwV2SideEffectTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2SideEffectFailV1_(code, details) {
  return {
    success: false,
    qualified: false,
    version: CW_V2_STAGING_SIDE_EFFECT_QUALIFICATION_VERSION_V1,
    code: String(code || "side-effect-qualification-refused"),
    details: details || null,
    purePolicy: true,
    sideEffectShapeQualified: false,
    directNetworkQualified: false,
    scriptProjectIsolationVerified: false,
    canonicalInvocationAllowed: false,
    mutationCount: 0,
    networkRequests: 0
  };
}

function trendosCloudWriteOrderV2StagingSideEffectQualificationV1_(preflight, authQualification) {
  preflight = preflight && typeof preflight === "object" ? preflight : {};
  authQualification = authQualification && typeof authQualification === "object" ? authQualification : {};

  if (preflight.success !== true || preflight.stagingTargetVerified !== true ||
      cwV2SideEffectTextV1_(preflight.spreadsheetId) !== CW_V2_SIDE_EFFECT_STAGING_SPREADSHEET_ID_V1) {
    return cwV2SideEffectFailV1_("qualified-staging-preflight-required");
  }
  if (authQualification.success !== true || authQualification.authBridgeQualified !== true ||
      authQualification.syntheticUsername !== "cw_stage_service" ||
      authQualification.canonicalRole !== "service" ||
      authQualification.tokenValueReturned !== false) {
    return cwV2SideEffectFailV1_("qualified-staging-auth-bridge-required");
  }

  return {
    success: true,
    qualified: true,
    version: CW_V2_STAGING_SIDE_EFFECT_QUALIFICATION_VERSION_V1,
    purePolicy: true,
    stagingSpreadsheetId: CW_V2_SIDE_EFFECT_STAGING_SPREADSHEET_ID_V1,
    firstWriteProfile: {
      customerMode: "خارجي / عابر",
      department: "ليزر",
      status: "طلب جديد",
      heatPress: "لا",
      flyPrint: "لا",
      idempotencyPrefix: "CW-STAGE-",
      reuseOpenOrderAllowed: false
    },
    auditedCanonicalWriter: "createManualOrder_",
    allowedStagingSheetMutations: [
      "ensure canonical headers in staging copy if missing",
      "upsert one staging order summary row",
      "append one staging order-line row",
      "append one staging activity-log row",
      "append one staging automation-queue row"
    ],
    allowedScriptPropertyMutationsOnlyAfterScriptIsolation: [
      "TRENDOS_CREATE_ORDER_V1908_<CW-STAGE-request-key>",
      "TRENDOS_DATA_VERSION_V1931"
    ],
    forbiddenDirectEffects: [
      "production spreadsheet mutation",
      "direct WhatsApp send",
      "UrlFetchApp/network request",
      "D1/Cloudflare request",
      "Drive file mutation",
      "email send"
    ],
    automationQueueBehavior: "staging-sheet-queue-only-no-direct-send",
    directNetworkQualified: true,
    directWhatsAppSendQualifiedAbsent: true,
    d1DirectWriteQualifiedAbsent: true,
    sideEffectShapeQualified: true,
    scriptProjectIsolationVerified: false,
    canonicalInvocationAllowed: false,
    nextRequiredGate: "staging-bound-script-identity",
    mutationCount: 0,
    networkRequests: 0
  };
}
