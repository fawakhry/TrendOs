/* TrendOS Cloud Write -> Sheets Reconciliation DRY-RUN V1
 *
 * READ-ONLY CONTRACT VALIDATOR.
 * This helper validates a staging Cloud Write order against the live Orders
 * sheet schema and returns a deterministic mapping/plan. It never mutates a
 * Sheet and it refuses any request that is not explicit dry-run staging data.
 *
 * Required Script Property (when later deployed):
 * TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET
 */

function cwReconcileTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwReconcileBoolV1_(value) {
  return value === true || cwReconcileTextV1_(value).toLowerCase() === "true" || cwReconcileTextV1_(value) === "1";
}

function cwReconcileSafeEqualV1_(left, right) {
  left = cwReconcileTextV1_(left);
  right = cwReconcileTextV1_(right);
  if (!left || !right || left.length !== right.length) return false;
  var diff = 0;
  for (var i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function cwReconcileCanonicalV1_(value) {
  if (value === null || value === undefined) return null;
  if (Object.prototype.toString.call(value) === "[object Date]") return value.toISOString();
  if (Array.isArray(value)) return value.map(cwReconcileCanonicalV1_);
  if (typeof value === "object") {
    var out = {};
    Object.keys(value).sort().forEach(function (key) {
      var v = value[key];
      if (v !== undefined) out[key] = cwReconcileCanonicalV1_(v);
    });
    return out;
  }
  if (typeof value === "number") return isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  return String(value);
}

function cwReconcileSha256V1_(value) {
  var canonical = JSON.stringify(cwReconcileCanonicalV1_(value));
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canonical, Utilities.Charset.UTF_8);
  return digest.map(function (b) {
    var n = b < 0 ? b + 256 : b;
    return ("0" + n.toString(16)).slice(-2);
  }).join("");
}

function cwReconcileHeaderIndexV1_(headers, aliases) {
  var normalized = {};
  headers.forEach(function (header, index) {
    var key = normalizeKey_(header);
    if (key && normalized[key] === undefined) normalized[key] = index + 1;
  });
  for (var i = 0; i < aliases.length; i++) {
    var alias = normalizeKey_(aliases[i]);
    if (normalized[alias]) {
      return { column: normalized[alias], header: cwReconcileTextV1_(headers[normalized[alias] - 1]) };
    }
  }
  return { column: 0, header: "" };
}

function cwReconcileOrderMappingV1_(headers) {
  return {
    orderId: cwReconcileHeaderIndexV1_(headers, ["رقم الأوردر", "Order ID", "orderId", "order_id"]),
    customerName: cwReconcileHeaderIndexV1_(headers, ["اسم الشات / المكتب", "اسم العميل", "Customer Name", "customerName"]),
    customerPhone: cwReconcileHeaderIndexV1_(headers, ["رقم العميل الخارجي", "رقم العميل", "رقم العميل الأساسي", "رقم الهاتف", "Phone", "customerPhone"]),
    status: cwReconcileHeaderIndexV1_(headers, ["الحالة العامة", "الحالة", "General Status", "Status", "status"]),
    department: cwReconcileHeaderIndexV1_(headers, ["القسم الرئيسي", "القسم", "Department", "department"]),
    priority: cwReconcileHeaderIndexV1_(headers, ["الأولوية", "Priority", "priority"]),
    expectedDelivery: cwReconcileHeaderIndexV1_(headers, ["تاريخ التسليم المتوقع", "الوقت المتوقع", "Expected Delivery", "expectedDelivery", "expected_delivery"]),
    total: cwReconcileHeaderIndexV1_(headers, ["إجمالي الأوردر", "الإجمالي", "Total", "total"]),
    remaining: cwReconcileHeaderIndexV1_(headers, ["المتبقي", "الباقي", "Remaining", "remaining"]),
    updatedAt: cwReconcileHeaderIndexV1_(headers, ["آخر تحديث", "Updated At", "updatedAt", "updated_at"])
  };
}

function cwReconcilePlanV1_(mapping, payload) {
  var fields = {
    orderId: cwReconcileTextV1_(payload.orderId || payload.order_id || payload["رقم الأوردر"]),
    customerName: cwReconcileTextV1_(payload.customerName || payload.name || payload["اسم العميل"] || payload["اسم الشات / المكتب"]),
    customerPhone: cleanPhone_(payload.customerPhone || payload.phone || payload["رقم الهاتف"] || payload["رقم العميل"] || payload["رقم العميل الأساسي"]),
    status: cwReconcileTextV1_(payload.status || payload.orderStatus || payload["الحالة العامة"] || payload["الحالة"]),
    department: cwReconcileTextV1_(payload.department || payload["القسم"] || payload["القسم الرئيسي"]),
    priority: cwReconcileTextV1_(payload.priority || payload["الأولوية"]),
    expectedDelivery: cwReconcileTextV1_(payload.expectedDelivery || payload.expected_delivery || payload["تاريخ التسليم المتوقع"] || payload["الوقت المتوقع"]),
    total: payload.total === undefined ? null : payload.total,
    remaining: payload.remaining === undefined ? null : payload.remaining,
    updatedAt: cwReconcileTextV1_(payload.updatedAt || payload.updated_at || payload._cloudReceivedAt)
  };

  var plan = [];
  Object.keys(fields).forEach(function (key) {
    var target = mapping[key];
    if (!target || !target.column) return;
    plan.push({
      field: key,
      header: target.header,
      column: target.column,
      value: fields[key]
    });
  });
  return { fields: fields, plan: plan };
}

function trendosCloudWriteReconcileDryRunV1_(e) {
  var p = (e && e.parameter) || e || {};

  if (!cwReconcileBoolV1_(p.dryRun)) {
    return { success: false, code: "dry-run-required", message: "dryRun=true is required.", sheetsWritten: false, mutationCount: 0 };
  }

  var configuredSecret = "";
  try {
    configuredSecret = cwReconcileTextV1_(PropertiesService.getScriptProperties().getProperty("TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET"));
  } catch (err) {}
  if (!configuredSecret) {
    return { success: false, code: "dry-run-secret-not-configured", message: "Dry-run reconciliation secret is not configured.", sheetsWritten: false, mutationCount: 0 };
  }
  if (!cwReconcileSafeEqualV1_(configuredSecret, p.reconcileSecret)) {
    return { success: false, code: "unauthorized", message: "Unauthorized dry-run reconciliation request.", sheetsWritten: false, mutationCount: 0 };
  }

  var entityType = cwReconcileTextV1_(p.entityType || "order");
  var operation = cwReconcileTextV1_(p.operation || "upsert_order_to_sheets");
  var entityId = cwReconcileTextV1_(p.entityId || p.orderId);
  if (entityType !== "order") {
    return { success: false, code: "unsupported-entity", message: "Only order dry-run reconciliation is supported.", sheetsWritten: false, mutationCount: 0 };
  }
  if (operation !== "upsert_order_to_sheets") {
    return { success: false, code: "unsupported-operation", message: "Unsupported reconciliation operation.", sheetsWritten: false, mutationCount: 0 };
  }
  if (entityId.indexOf("CW-STAGE-") !== 0) {
    return { success: false, code: "staging-id-required", message: "Dry-run currently accepts CW-STAGE-* IDs only.", sheetsWritten: false, mutationCount: 0 };
  }

  var payload = p.payload;
  if (!payload && p.payloadJson) {
    try { payload = JSON.parse(String(p.payloadJson)); }
    catch (err) {
      return { success: false, code: "invalid-payload-json", message: "payloadJson is invalid.", sheetsWritten: false, mutationCount: 0 };
    }
  }
  payload = payload && typeof payload === "object" ? payload : {};

  var payloadOrderId = cwReconcileTextV1_(payload.orderId || payload.order_id || payload["رقم الأوردر"]);
  if (!payloadOrderId || payloadOrderId !== entityId) {
    return { success: false, code: "order-id-mismatch", message: "Payload order ID does not match entityId.", sheetsWritten: false, mutationCount: 0 };
  }
  if (payload._cloudWriteV1 !== true) {
    return { success: false, code: "cloud-write-marker-required", message: "_cloudWriteV1=true is required.", sheetsWritten: false, mutationCount: 0 };
  }

  var payloadSha256 = cwReconcileSha256V1_(payload);
  var expectedSha256 = cwReconcileTextV1_(p.payloadSha256).toLowerCase();
  if (expectedSha256 && expectedSha256 !== payloadSha256) {
    return {
      success: false,
      code: "payload-fingerprint-mismatch",
      message: "Payload SHA-256 mismatch.",
      payloadSha256: payloadSha256,
      sheetsWritten: false,
      mutationCount: 0
    };
  }

  var spreadsheet = ss_();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME_ORDERS);
  if (!sheet) {
    return { success: false, code: "orders-sheet-missing", message: "Orders sheet is missing.", payloadSha256: payloadSha256, sheetsWritten: false, mutationCount: 0 };
  }

  var lastColumn = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(cwReconcileTextV1_);
  var mapping = cwReconcileOrderMappingV1_(headers);
  var missingRequired = [];
  if (!mapping.orderId.column) missingRequired.push("orderId");
  if (!mapping.customerName.column) missingRequired.push("customerName");
  if (!mapping.status.column) missingRequired.push("status");

  var schemaFingerprint = cwReconcileSha256V1_(headers);
  if (missingRequired.length) {
    return {
      success: false,
      code: "orders-schema-incompatible",
      message: "Required Orders sheet columns are missing.",
      missingRequired: missingRequired,
      headers: headers,
      schemaFingerprint: schemaFingerprint,
      payloadSha256: payloadSha256,
      sheetsWritten: false,
      mutationCount: 0
    };
  }

  var existingMatches = 0;
  var existingRows = [];
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, mapping.orderId.column, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (cwReconcileTextV1_(ids[i][0]) === entityId) {
        existingMatches++;
        existingRows.push(i + 2);
      }
    }
  }

  var planned = cwReconcilePlanV1_(mapping, payload);
  var mappedFields = planned.plan.map(function (item) { return item.field; });
  var unmappedPayloadFields = Object.keys(planned.fields).filter(function (key) {
    return planned.fields[key] !== null && planned.fields[key] !== "" && mappedFields.indexOf(key) === -1;
  });

  var decision = existingMatches === 0 ? "would_insert" : (existingMatches === 1 ? "existing_requires_idempotent_compare" : "blocked_duplicate_order_id");
  var eligibleForFutureWrite = existingMatches <= 1 && missingRequired.length === 0;

  return {
    success: true,
    version: "CLOUD_WRITE_RECONCILE_DRYRUN_V1_20260904",
    dryRun: true,
    readOnly: true,
    sheetsWritten: false,
    mutationCount: 0,
    targetSheet: SHEET_NAME_ORDERS,
    entityType: entityType,
    entityId: entityId,
    operation: operation,
    payloadSha256: payloadSha256,
    schemaFingerprint: schemaFingerprint,
    requiredColumnsPresent: true,
    mapping: mapping,
    plan: planned.plan,
    unmappedPayloadFields: unmappedPayloadFields,
    existingMatches: existingMatches,
    existingRows: existingRows,
    decision: decision,
    eligibleForFutureWrite: eligibleForFutureWrite,
    safety: {
      stagingIdsOnly: true,
      mutationMethodsCalled: false,
      noHeaderCreation: true,
      noAppend: true,
      noUpdate: true
    }
  };
}
