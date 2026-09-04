/* TrendOS Cloud Write -> Sheets Authenticated Dry-Run Self-Test V1
 *
 * Purpose:
 * - Reads the existing dry-run secret from Script Properties internally.
 * - Calls the already-deployed read-only dry-run handler directly.
 * - Uses a synthetic CW-STAGE-* order only.
 * - Never logs or returns the secret.
 * - Never writes to Sheets, D1, Drive, Script Properties, or the network.
 */

function runTrendOSCloudWriteDryRunSelfTest() {
  var secret = "";
  try {
    secret = String(
      PropertiesService.getScriptProperties().getProperty(
        "TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET"
      ) || ""
    ).trim();
  } catch (err) {}

  if (!secret) {
    throw new Error("AUTH_DRYRUN_SELFTEST_NO_SECRET");
  }

  if (typeof trendosCloudWriteReconcileDryRunV1_ !== "function") {
    throw new Error("AUTH_DRYRUN_SELFTEST_HANDLER_MISSING");
  }

  var now = new Date();
  var entityId = "CW-STAGE-SELFTEST-" + now.getTime();
  var payload = {
    orderId: entityId,
    customerName: "TrendOS Auth Dry-Run Self Test",
    customerPhone: "01000000000",
    status: "cloud-draft",
    department: "SELFTEST",
    priority: "عادي",
    expectedDelivery: "",
    total: 0,
    remaining: 0,
    updatedAt: now.toISOString(),
    _cloudWriteV1: true,
    _cloudActor: "apps-script-auth-selftest"
  };

  var result = trendosCloudWriteReconcileDryRunV1_({
    parameter: {
      dryRun: true,
      reconcileSecret: secret,
      entityType: "order",
      operation: "upsert_order_to_sheets",
      entityId: entityId,
      payload: payload
    }
  }) || {};

  var safe = {
    success: result.success === true,
    code: String(result.code || ""),
    version: String(result.version || ""),
    dryRun: result.dryRun === true,
    readOnly: result.readOnly === true,
    sheetsWritten: result.sheetsWritten === true,
    mutationCount: Number(result.mutationCount || 0),
    entityId: String(result.entityId || entityId),
    targetSheet: String(result.targetSheet || ""),
    requiredColumnsPresent: result.requiredColumnsPresent === true,
    existingMatches: Number(result.existingMatches || 0),
    decision: String(result.decision || ""),
    eligibleForFutureWrite: result.eligibleForFutureWrite === true,
    planCount: Array.isArray(result.plan) ? result.plan.length : 0,
    schemaFingerprintPresent: !!String(result.schemaFingerprint || ""),
    payloadSha256Present: !!String(result.payloadSha256 || "")
  };

  if (!safe.success) {
    throw new Error(
      "AUTH_DRYRUN_SELFTEST_HANDLER_REJECTED:" + (safe.code || "unknown")
    );
  }
  if (!safe.dryRun || !safe.readOnly) {
    throw new Error("AUTH_DRYRUN_SELFTEST_NOT_READONLY");
  }
  if (safe.sheetsWritten || safe.mutationCount !== 0) {
    throw new Error("AUTH_DRYRUN_SELFTEST_MUTATION_DETECTED");
  }
  if (safe.entityId.indexOf("CW-STAGE-") !== 0) {
    throw new Error("AUTH_DRYRUN_SELFTEST_NON_STAGING_ID");
  }
  if (!safe.requiredColumnsPresent) {
    throw new Error("AUTH_DRYRUN_SELFTEST_SCHEMA_NOT_READY");
  }

  Logger.log("AUTH_DRYRUN_SELFTEST_PASS=" + JSON.stringify(safe));
  return safe;
}
