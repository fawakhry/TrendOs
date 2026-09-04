/* TrendOS Cloud Write Order V2 -> Apps Script Canonical Adapter DRY-RUN V1
 *
 * PURE / READ-ONLY adapter candidate.
 *
 * Purpose:
 * - accept ONLY an already-validated Cloud Write Order Contract V2 create-intent;
 * - map its canonicalCreateParams to the exact parameter names consumed by
 *   createManualOrder_(e) in the current Apps Script backend;
 * - keep Business Order ID allocation owned by Apps Script;
 * - expose the unresolved Apps Script auth boundary explicitly.
 *
 * This file intentionally does NOT:
 * - call createManualOrder_();
 * - generate or accept a production Order ID;
 * - read/write Sheets, D1, Drive, Properties, Cache, or Lock services;
 * - call the network;
 * - carry username/token credentials.
 */

var CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1_20260904";
var CLOUD_WRITE_ORDER_CONTRACT_V2_EXPECTED_VERSION_V1 =
  "CLOUD_WRITE_ORDER_CONTRACT_V2_20260904";

function cwOrderV2AdapterTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwOrderV2AdapterNumberV1_(value) {
  var n = Number(value);
  return isFinite(n) ? n : NaN;
}

function cwOrderV2AdapterBoolTextV1_(value) {
  var v = cwOrderV2AdapterTextV1_(value).toLowerCase();
  if (value === true || value === 1 || v === "true" || v === "1" || v === "yes" || v === "on" || v === "نعم") return "نعم";
  if (value === false || value === 0 || v === "false" || v === "0" || v === "no" || v === "off" || v === "لا" || v === "") return "لا";
  return "";
}

function cwOrderV2AdapterFailV1_(code, details) {
  return {
    success: false,
    valid: false,
    version: CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_VERSION_V1,
    code: String(code || "adapter-refused"),
    details: details || null,
    dryRun: true,
    readOnly: true,
    mutationFree: true,
    wouldCall: "createManualOrder_",
    wouldInvoke: false,
    canonicalEnvelopeReady: false,
    canonicalInvocationAuthorized: false,
    businessOrderIdStrategy: "apps-script-allocated",
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function trendosCloudWriteOrderV2CanonicalAdapterDryRunV1_(plan) {
  plan = plan && typeof plan === "object" ? plan : {};

  if (plan.success !== true || plan.valid !== true) {
    return cwOrderV2AdapterFailV1_("validated-v2-plan-required");
  }
  if (cwOrderV2AdapterTextV1_(plan.version) !== CLOUD_WRITE_ORDER_CONTRACT_V2_EXPECTED_VERSION_V1) {
    return cwOrderV2AdapterFailV1_("unsupported-v2-contract-version");
  }
  if (cwOrderV2AdapterTextV1_(plan.intentType) !== "createManualOrder") {
    return cwOrderV2AdapterFailV1_("create-manual-order-intent-required");
  }
  if (cwOrderV2AdapterTextV1_(plan.businessOrderIdStrategy) !== "apps-script-allocated") {
    return cwOrderV2AdapterFailV1_("apps-script-order-id-ownership-required");
  }
  if (plan.mutationFree !== true || plan.productionRouteIntegrated !== false) {
    return cwOrderV2AdapterFailV1_("unqualified-v2-plan-state");
  }

  var p = plan.canonicalCreateParams && typeof plan.canonicalCreateParams === "object"
    ? plan.canonicalCreateParams
    : null;
  if (!p) return cwOrderV2AdapterFailV1_("canonical-create-params-required");

  // No Business Order ID may cross this boundary. createManualOrder_ owns allocation/reuse.
  if (cwOrderV2AdapterTextV1_(p.orderId || p.order_id || p["رقم الأوردر"] || plan.orderId || plan.order_id || plan["رقم الأوردر"])) {
    return cwOrderV2AdapterFailV1_("business-order-id-preallocation-refused");
  }

  // Authentication must be resolved later by a separately-qualified internal bridge.
  // Credentials are intentionally refused from the Cloud V2 plan itself.
  if (cwOrderV2AdapterTextV1_(p.username || p.token || plan.username || plan.token)) {
    return cwOrderV2AdapterFailV1_("credentials-in-v2-plan-refused");
  }

  var clientRequestId = cwOrderV2AdapterTextV1_(p.clientRequestId || p.requestId || p.idempotencyKey || p.idempotency_key);
  var customerName = cwOrderV2AdapterTextV1_(p.customerName);
  var customerPhone = cwOrderV2AdapterTextV1_(p.customerPhone);
  var customerMode = cwOrderV2AdapterTextV1_(p.customerMode);
  var externalCustomerId = cwOrderV2AdapterTextV1_(p.externalCustomerId || p.customerExternalId || p.lightCustomerId);
  var department = cwOrderV2AdapterTextV1_(p.department);
  var itemName = cwOrderV2AdapterTextV1_(p.itemName);
  var qty = cwOrderV2AdapterNumberV1_(p.qty);
  var priority = cwOrderV2AdapterTextV1_(p.priority) || "عادي";
  var status = cwOrderV2AdapterTextV1_(p.status) || "طلب جديد";
  var heatPress = cwOrderV2AdapterBoolTextV1_(p.heatPress);
  var flyPrint = cwOrderV2AdapterBoolTextV1_(p.flyPrint);
  var source = cwOrderV2AdapterTextV1_(p.source) || "Cloud Write V2";
  var notes = cwOrderV2AdapterTextV1_(p.notes);

  if (!clientRequestId) return cwOrderV2AdapterFailV1_("client-request-id-required");
  if (!customerName) return cwOrderV2AdapterFailV1_("customer-name-required");
  if (!department) return cwOrderV2AdapterFailV1_("department-required");
  if (["طباعة", "ليزر", "متعدد الأقسام"].indexOf(department) === -1) {
    return cwOrderV2AdapterFailV1_("canonical-department-required");
  }
  if (!itemName) return cwOrderV2AdapterFailV1_("item-name-required");
  if (!isFinite(qty) || qty <= 0) return cwOrderV2AdapterFailV1_("positive-qty-required");
  if (status !== "طلب جديد") return cwOrderV2AdapterFailV1_("initial-status-must-be-new");
  if (["عاجل", "عادي", "مؤجل", "VIP"].indexOf(priority) === -1) {
    return cwOrderV2AdapterFailV1_("canonical-priority-required");
  }
  if (!heatPress || !flyPrint) return cwOrderV2AdapterFailV1_("boolean-flags-not-canonical");
  if (flyPrint === "نعم" && department !== "طباعة") {
    return cwOrderV2AdapterFailV1_("fly-print-requires-print-department");
  }
  if (flyPrint === "نعم" && priority !== "عاجل") {
    return cwOrderV2AdapterFailV1_("fly-print-requires-urgent-priority");
  }

  var isExternal = customerMode.indexOf("خارجي") !== -1 || customerMode.indexOf("عابر") !== -1;
  if (isExternal) {
    if (!externalCustomerId || externalCustomerId.replace(/[^0-9]/g, "").length < 3) {
      return cwOrderV2AdapterFailV1_("external-customer-id-required");
    }
  } else {
    if (!customerPhone) return cwOrderV2AdapterFailV1_("registered-customer-phone-required");
    externalCustomerId = "";
    customerMode = "عميل مسجل";
  }

  // Exact public parameter aliases consumed by createManualOrder_(e).
  // No username/token and no orderId are included by design.
  var envelope = {
    clientRequestId: clientRequestId,
    customerName: customerName,
    customerPhone: customerPhone,
    customerMode: isExternal ? "خارجي / عابر" : customerMode,
    externalCustomerId: isExternal ? externalCustomerId : "",
    department: department,
    itemName: itemName,
    qty: qty,
    priority: priority,
    status: "طلب جديد",
    heatPress: heatPress,
    flyPrint: flyPrint,
    source: source,
    notes: notes
  };

  return {
    success: true,
    valid: true,
    version: CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_VERSION_V1,
    sourceContractVersion: cwOrderV2AdapterTextV1_(plan.version),
    dryRun: true,
    readOnly: true,
    mutationFree: true,
    wouldCall: "createManualOrder_",
    wouldInvoke: false,
    canonicalEnvelopeReady: true,
    canonicalInvocationAuthorized: false,
    authBoundary: {
      requiredByCanonicalPath: true,
      requiredFields: ["username", "token"],
      credentialsAcceptedFromCloudPlan: false,
      supplied: false,
      resolution: "separate-authorized-internal-bridge-required"
    },
    businessOrderIdStrategy: "apps-script-allocated",
    orderIdPresent: false,
    canonicalParameterEnvelope: envelope,
    requiredCanonicalSideEffects: Array.isArray(plan.requiredCanonicalSideEffects)
      ? plan.requiredCanonicalSideEffects.slice()
      : [],
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0,
    safeForCanonicalInvocation: false
  };
}
