/* TrendOS Cloud Write Order Contract V2
 *
 * PURE / CI-ONLY canonical create-intent normalizer.
 *
 * This module intentionally does NOT:
 * - accept/preallocate a production business Order ID;
 * - read or write D1;
 * - call Apps Script;
 * - read/write Google Sheets;
 * - touch secrets/properties;
 * - expose a Worker route.
 *
 * Its only job is to validate a future Cloud-originated order create intent and
 * produce the parameter contract that a separately-qualified Apps Script adapter
 * may eventually submit through the canonical `createManualOrder_` business path.
 */

export const CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION = 'CLOUD_WRITE_ORDER_CONTRACT_V2_20260904';

function text(value) {
  return String(value == null ? '' : value).trim();
}

function boolish(value) {
  if (value === true || value === 1) return true;
  const v = text(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on' || v === 'نعم';
}

function digits(value) {
  return text(value)
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^0-9]/g, '');
}

function cleanEgyptPhone(value) {
  let d = digits(value);
  if (d.startsWith('0020') && d.length >= 14) d = `0${d.slice(4)}`;
  else if (d.startsWith('20') && d.length === 12) d = `0${d.slice(2)}`;
  else if (d.length === 10 && d.startsWith('1')) d = `0${d}`;
  return d;
}

function requestKey(value) {
  const raw = text(value);
  if (!raw) return '';
  if (raw.length > 160) return '';
  if (!/^[A-Za-z0-9_.:-]+$/.test(raw)) return '';
  return raw;
}

function normalizeDepartment(value) {
  const raw = text(value);
  const low = raw.toLowerCase();
  if (raw === 'طباعة' || low === 'print' || low === 'printing') return { department: 'طباعة', heatPress: false };
  if (raw === 'ليزر' || low === 'laser') return { department: 'ليزر', heatPress: false };
  if (raw === 'مكبس' || low === 'press' || low === 'heat press' || low === 'heat-press') return { department: 'طباعة', heatPress: true };
  if (raw === 'متعدد الأقسام' || raw === 'متعدد' || low === 'multi' || low === 'multi-department') {
    return { department: 'متعدد الأقسام', heatPress: false };
  }
  return { department: '', heatPress: false };
}

function identityMode(input) {
  const raw = text(input.customerMode || input.identityMode || input.customerIdentityMode).toLowerCase();
  const externalId = text(input.externalCustomerId || input.customerExternalId || input.lightCustomerId);
  const explicitlyExternal = raw.includes('خارجي') || raw.includes('عابر') || raw === 'external' || raw === 'transient';
  return explicitlyExternal || externalId ? 'external' : 'registered';
}

function failure(errors, normalized = {}) {
  return {
    success: false,
    valid: false,
    version: CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION,
    mutationFree: true,
    productionRouteIntegrated: false,
    errors,
    normalized
  };
}

export function buildCanonicalOrderCreateIntentV2(input = {}) {
  const errors = [];

  const key = requestKey(input.clientRequestId || input.requestId || input.idempotencyKey || input.idempotency_key);
  if (!key) errors.push('valid-client-request-id-required');

  // The live Apps Script contract owns numeric business Order ID allocation.
  // A future Cloud V2 create is an intent, not an already-created production order.
  if (text(input.orderId || input.order_id || input['رقم الأوردر'])) {
    errors.push('business-order-id-preallocation-refused');
  }

  const mode = identityMode(input);
  let customerName = text(input.customerName || input.name || input['اسم العميل'] || input['اسم الشات / المكتب']);
  let customerPhone = cleanEgyptPhone(input.customerPhone || input.phone || input['رقم العميل'] || input['رقم الهاتف']);
  let externalCustomerId = digits(input.externalCustomerId || input.customerExternalId || input.lightCustomerId);

  if (mode === 'registered') {
    if (!customerName) errors.push('registered-customer-name-required');
    // V2 is intentionally stricter than createManualOrder_: first controlled lane
    // must carry an unambiguous customer identity instead of relying on fuzzy name-only lookup.
    if (!customerPhone) errors.push('registered-customer-phone-required');
    externalCustomerId = '';
  } else {
    if (externalCustomerId.length < 3) errors.push('external-customer-id-min-3-digits');
    if (!customerName && externalCustomerId) customerName = `عميل خارجي - ${externalCustomerId}`;
    // Keep a full external phone when supplied, otherwise the external/light ID is separate.
    if (!customerPhone && externalCustomerId.length >= 10) customerPhone = cleanEgyptPhone(externalCustomerId);
  }

  const departmentInput = text(input.department || input['القسم']);
  const dep = normalizeDepartment(departmentInput);
  if (!dep.department) errors.push('supported-department-required');

  let heatPress = dep.heatPress || boolish(input.heatPress || input.press || input.isPress || input['مكبس حراري']);
  const flyPrint = boolish(input.flyPrint || input.quickPrint || input.fastPrint || input['طباعة على الطاير']);
  if (flyPrint && dep.department !== 'طباعة') errors.push('fly-print-requires-print-department');

  const itemName = text(input.itemName || input.item || input['اسم البند'] || input['نوع الشغل']);
  if (!itemName) errors.push('item-name-required');

  const qty = Number(input.qty ?? input.quantity ?? input['الكمية']);
  if (!Number.isFinite(qty) || qty <= 0) errors.push('positive-qty-required');

  const requestedStatus = text(input.status || input.orderStatus || input['الحالة']) || 'طلب جديد';
  if (requestedStatus !== 'طلب جديد') errors.push('initial-status-must-be-new');

  let priority = text(input.priority || input['الأولوية']) || 'عادي';
  if (flyPrint) priority = 'عاجل';
  if (!['عاجل', 'عادي', 'مؤجل', 'VIP'].includes(priority)) errors.push('supported-priority-required');

  const source = text(input.source || input['مصدر الطلب']) || 'Cloud Write V2';
  const notes = text(input.notes || input['ملاحظات']);
  const actor = text(input.actor || input.cloudActor || input.createdBy);

  const normalized = {
    clientRequestId: key,
    identityMode: mode,
    customerName,
    customerPhone,
    externalCustomerId,
    department: dep.department,
    originalDepartment: departmentInput,
    itemName,
    qty: Number.isFinite(qty) ? qty : null,
    priority,
    status: requestedStatus,
    heatPress,
    flyPrint,
    source,
    notes,
    actor,
    businessOrderIdStrategy: 'apps-script-allocated'
  };

  if (errors.length) return failure(errors, normalized);

  const canonicalCreateParams = {
    clientRequestId: key,
    customerName,
    customerPhone,
    customerMode: mode === 'external' ? 'خارجي / عابر' : 'عميل مسجل',
    externalCustomerId: mode === 'external' ? externalCustomerId : '',
    department: dep.department,
    itemName,
    qty,
    priority,
    status: 'طلب جديد',
    heatPress: heatPress ? 'نعم' : 'لا',
    flyPrint: flyPrint ? 'نعم' : 'لا',
    source,
    notes
  };

  return {
    success: true,
    valid: true,
    version: CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION,
    intentType: 'createManualOrder',
    businessOrderIdStrategy: 'apps-script-allocated',
    mutationFree: true,
    productionRouteIntegrated: false,
    normalized,
    canonicalCreateParams,
    requiredCanonicalSideEffects: [
      'authorize-canCreateOrder',
      'script-lock',
      'v1908-request-idempotency',
      'customer-or-external-identity',
      'debt-policy',
      'department-normalization',
      'recent-duplicate-guard',
      'open-order-department-scope',
      'apps-script-business-order-id-allocation',
      'line-id-allocation',
      'orders-summary-upsert',
      'order-lines-create',
      'activity-log',
      'trend-master-message-queue',
      'data-version-bump',
      'saved-response-replay'
    ]
  };
}
