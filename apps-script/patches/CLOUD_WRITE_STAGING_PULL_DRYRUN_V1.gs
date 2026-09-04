/* TrendOS Staging D1 -> Apps Script Authenticated Dry-Run Pull V1
 *
 * READ-ONLY END-TO-END BRIDGE.
 * - GETs one known synthetic CW-STAGE-* payload from the dedicated staging Worker.
 * - Reads TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET internally.
 * - Calls trendosCloudWriteReconcileDryRunV1_ directly; the secret never leaves Apps Script.
 * - Never writes Sheets, D1, Drive, Script Properties, or any production API.
 */

function runTrendOSCloudWriteStagingPullDryRun() {
  var stagingUrl = "https://trendos-d1-staging.trendmall-contact.workers.dev/v1/staging/cloud-write/reconcile/sample";
  var response = UrlFetchApp.fetch(stagingUrl, {
    method: "get",
    muteHttpExceptions: true,
    headers: { Accept: "application/json" }
  });

  var httpCode = Number(response.getResponseCode() || 0);
  var body = {};
  try {
    body = JSON.parse(String(response.getContentText() || "{}"));
  } catch (err) {
    throw new Error("STAGING_PULL_DRYRUN_INVALID_JSON");
  }

  if (httpCode !== 200 || body.success !== true) {
    throw new Error("STAGING_PULL_DRYRUN_SOURCE_UNAVAILABLE:" + httpCode + ":" + String(body.code || "unknown"));
  }
  if (body.stagingOnly !== true || body.syntheticOnly !== true || body.readOnly !== true || body.sheetsWritten !== false) {
    throw new Error("STAGING_PULL_DRYRUN_SOURCE_SAFETY_FAILED");
  }

  var entityType = String(body.entityType || "").trim();
  var entityId = String(body.entityId || "").trim();
  var operation = String(body.operation || "").trim();
  var payload = body.payload && typeof body.payload === "object" ? body.payload : null;

  if (entityType !== "order" || operation !== "upsert_order_to_sheets") {
    throw new Error("STAGING_PULL_DRYRUN_SOURCE_CONTRACT_FAILED");
  }
  if (entityId.indexOf("CW-STAGE-") !== 0) {
    throw new Error("STAGING_PULL_DRYRUN_NON_STAGING_ID");
  }
  if (!payload || String(payload.orderId || "").trim() !== entityId || payload._cloudWriteV1 !== true) {
    throw new Error("STAGING_PULL_DRYRUN_PAYLOAD_IDENTITY_FAILED");
  }
  if (String(payload.customerName || "").trim() !== "Staging Cloud Write Qualification" ||
      String(payload.customerPhone || "").trim() !== "01001112233") {
    throw new Error("STAGING_PULL_DRYRUN_NON_SYNTHETIC_PAYLOAD");
  }

  var secret = "";
  try {
    secret = String(
      PropertiesService.getScriptProperties().getProperty(
        "TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET"
      ) || ""
    ).trim();
  } catch (err) {}

  if (!secret) {
    throw new Error("STAGING_PULL_DRYRUN_NO_INTERNAL_SECRET");
  }
  if (typeof trendosCloudWriteReconcileDryRunV1_ !== "function") {
    throw new Error("STAGING_PULL_DRYRUN_HANDLER_MISSING");
  }

  var result = trendosCloudWriteReconcileDryRunV1_({
    parameter: {
      dryRun: true,
      reconcileSecret: secret,
      entityType: entityType,
      operation: operation,
      entityId: entityId,
      payload: payload
    }
  }) || {};

  var safe = {
    success: result.success === true,
    source: "trendos-d1-staging",
    stagingOnly: true,
    syntheticOnly: true,
    entityId: entityId,
    sourceOutboxStatus: String(body.outboxStatus || ""),
    sourceEventStatus: String(body.eventStatus || ""),
    sourceSheetsStatus: String(body.sheetsStatus || ""),
    dryRun: result.dryRun === true,
    readOnly: result.readOnly === true,
    sheetsWritten: result.sheetsWritten === true,
    mutationCount: Number(result.mutationCount || 0),
    requiredColumnsPresent: result.requiredColumnsPresent === true,
    existingMatches: Number(result.existingMatches || 0),
    decision: String(result.decision || ""),
    eligibleForFutureWrite: result.eligibleForFutureWrite === true,
    planCount: Array.isArray(result.plan) ? result.plan.length : 0,
    schemaFingerprintPresent: !!String(result.schemaFingerprint || ""),
    payloadSha256Present: !!String(result.payloadSha256 || "")
  };

  if (!safe.success) {
    throw new Error("STAGING_PULL_DRYRUN_HANDLER_REJECTED:" + String(result.code || "unknown"));
  }
  if (!safe.dryRun || !safe.readOnly || safe.sheetsWritten || safe.mutationCount !== 0) {
    throw new Error("STAGING_PULL_DRYRUN_MUTATION_SAFETY_FAILED");
  }
  if (!safe.requiredColumnsPresent) {
    throw new Error("STAGING_PULL_DRYRUN_SCHEMA_NOT_READY");
  }

  Logger.log("STAGING_PULL_DRYRUN_PASS=" + JSON.stringify(safe));
  return safe;
}
