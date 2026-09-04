import { inspectOrdersMirrorCatalog } from './edge-orders-freshness-gate.mjs';
import {
  inspectOrdersIdleHeartbeat,
  ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS
} from './edge-orders-idle-heartbeat.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from './edge-orders-idle-verifier.mjs';
import { validateOrderLineIdentity } from './accounting-foundation-v1.mjs';

export const TRENDOS_ACCOUNTING_OPERATIONS_READ_VERSION = 'TRENDOS_ACCOUNTING_OPS_READ_V1_1_20260905';

const ORDERS_SHEET = 'الأوردرات';
const LINES_SHEET = 'بنود الأوردرات';

function text(value) { return String(value == null ? '' : value).trim(); }
function numOrNull(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function parseArray(value) {
  try {
    const x = JSON.parse(value || '[]');
    return Array.isArray(x) ? x : [];
  } catch (err) { return []; }
}
function normalizeHeader(value) { return text(value).toLowerCase().replace(/\s+/g, ' '); }
function headerIndex(headers, aliases) {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(normalizeHeader(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}
function at(row, idx) { return idx >= 0 && idx < row.length ? row[idx] : ''; }
function structurallyReady(x) { return !!(x && x.statusReady && x.parity && x.live); }

async function readCatalog(env, sheetName) {
  return env.DB.prepare(`
    SELECT headers_json AS headersJson,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     WHERE sheet_name = ?
     LIMIT 1
  `).bind(sheetName).first();
}

async function readRows(env, sheetName) {
  const result = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(sheetName).all();
  return (result.results || []).map((row) => ({
    rowNumber: Number(row.rowNumber || 0),
    values: parseArray(row.valuesJson),
    display: parseArray(row.displayJson)
  }));
}

function effectiveRow(row) {
  const display = Array.isArray(row.display) ? row.display : [];
  const values = Array.isArray(row.values) ? row.values : [];
  return display.length ? display.map((v, i) => text(v) || values[i] || '') : values;
}

export async function inspectAccountingOperationsMirror(env, nowMs = Date.now(), options = {}) {
  if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
    return { ready: false, code: 'd1-unavailable', message: 'D1 mirror is unavailable.' };
  }
  let ordersCatalog;
  let linesCatalog;
  try {
    [ordersCatalog, linesCatalog] = await Promise.all([readCatalog(env, ORDERS_SHEET), readCatalog(env, LINES_SHEET)]);
  } catch (err) {
    return { ready: false, code: 'mirror-catalog-error', message: 'Orders/Lines mirror metadata check failed.' };
  }
  if (!ordersCatalog || !linesCatalog) {
    return { ready: false, code: 'mirror-not-ready', message: 'Orders/Lines mirror metadata is missing.' };
  }
  const configured = Number(env.EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS);
  const maxAgeSeconds = Number.isFinite(configured) ? configured : 600;
  const orders = inspectOrdersMirrorCatalog(ordersCatalog, nowMs, maxAgeSeconds);
  const lines = inspectOrdersMirrorCatalog(linesCatalog, nowMs, maxAgeSeconds);
  if (orders.ready && lines.ready) {
    return { ready: true, code: 'ready', freshnessMode: 'mirror-write-age', orders, lines, checkedAt: new Date(nowMs).toISOString() };
  }

  const staleOnly = structurallyReady(orders) && structurallyReady(lines) && (!orders.fresh || !lines.fresh);
  let idleHeartbeat = null;
  if (staleOnly && ordersIdleHeartbeatVerifierEnabled(env)) {
    try {
      const fetcher = typeof options.fetchHeartbeat === 'function'
        ? options.fetchHeartbeat
        : () => fetchOrdersIdleHeartbeat(env, options.heartbeatOptions || {});
      const status = await fetcher();
      const idleMax = Number(env.EDGE_ORDERS_IDLE_HEARTBEAT_MAX_AGE_SECONDS);
      idleHeartbeat = inspectOrdersIdleHeartbeat(status, {
        nowMs,
        maxAgeSeconds: Number.isFinite(idleMax) ? idleMax : ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS,
        expectedOrdersSourceLastRow: orders.sourceLastRow,
        expectedOrdersSourceLastCol: orders.sourceLastCol,
        expectedLinesSourceLastRow: lines.sourceLastRow,
        expectedLinesSourceLastCol: lines.sourceLastCol
      });
      if (idleHeartbeat.ok) {
        return {
          ready: true,
          code: 'ready-idle-verified',
          freshnessMode: 'verified-idle-source-unchanged',
          orders,
          lines,
          idleHeartbeat,
          checkedAt: new Date(nowMs).toISOString()
        };
      }
    } catch (err) {
      idleHeartbeat = { ok: false, mode: 'idle-heartbeat-verification-error', message: String(err && err.message ? err.message : err) };
    }
  }

  return {
    ready: false,
    code: staleOnly ? 'stale-orders-mirror' : 'mirror-not-ready',
    freshnessMode: staleOnly ? 'stale-write-age' : 'structural-failure',
    orders,
    lines,
    ...(idleHeartbeat ? { idleHeartbeat } : {}),
    checkedAt: new Date(nowMs).toISOString()
  };
}

function mapLine(headers, rawRow) {
  const row = effectiveRow(rawRow);
  const c = {
    orderId: headerIndex(headers, ['رقم الأوردر','Order ID']),
    lineId: headerIndex(headers, ['رقم البند','Line ID']),
    itemId: headerIndex(headers, ['Item ID','كود الصنف','معرف الصنف']),
    itemName: headerIndex(headers, ['اسم البند / نوع الشغل','اسم البند','اسم الصنف','Item Name']),
    customerId: headerIndex(headers, ['Customer ID','كود العميل','معرف العميل']),
    customerName: headerIndex(headers, ['اسم الشات / المكتب','اسم العميل','Customer Name']),
    departmentId: headerIndex(headers, ['Department ID','كود القسم','معرف القسم']),
    department: headerIndex(headers, ['القسم','Department']),
    profitCenterId: headerIndex(headers, ['Profit Center ID','مركز الربح','معرف مركز الربح']),
    qty: headerIndex(headers, ['الكمية','Qty','Quantity']),
    status: headerIndex(headers, ['الحالة','Status']),
    approvedUnitPrice: headerIndex(headers, ['سعر البيع المعتمد','سعر البيع','سعر الوحدة','Unit Price','Sale Price']),
    approvedLineAmount: headerIndex(headers, ['إجمالي البند','قيمة البند','Line Total','Approved Line Amount']),
    updatedAt: headerIndex(headers, ['آخر تحديث','Updated At'])
  };
  const qty = numOrNull(at(row, c.qty));
  const unitPrice = numOrNull(at(row, c.approvedUnitPrice));
  const explicitTotal = numOrNull(at(row, c.approvedLineAmount));
  return {
    sourceRow: rawRow.rowNumber,
    orderId: text(at(row, c.orderId)),
    lineId: text(at(row, c.lineId)),
    itemId: text(at(row, c.itemId)) || null,
    itemName: text(at(row, c.itemName)) || null,
    customerId: text(at(row, c.customerId)) || null,
    customerName: text(at(row, c.customerName)) || null,
    departmentId: text(at(row, c.departmentId)) || null,
    department: text(at(row, c.department)) || null,
    profitCenterId: text(at(row, c.profitCenterId)) || null,
    quantity: qty,
    operationalStatus: text(at(row, c.status)) || null,
    approvedUnitPrice: unitPrice,
    approvedLineAmount: explicitTotal,
    updatedAt: text(at(row, c.updatedAt)) || null,
    priceSource: explicitTotal !== null ? 'explicit-line-amount' : (unitPrice !== null ? 'explicit-unit-price' : 'not-present')
  };
}

function mapOrder(headers, rawRow) {
  const row = effectiveRow(rawRow);
  const c = {
    orderId: headerIndex(headers, ['رقم الأوردر','Order ID']),
    customerId: headerIndex(headers, ['Customer ID','كود العميل','معرف العميل']),
    customerName: headerIndex(headers, ['اسم العميل','Customer Name','اسم الشات / المكتب']),
    status: headerIndex(headers, ['الحالة','Status']),
    total: headerIndex(headers, ['الإجمالي','إجمالي الأوردر','Total']),
    paid: headerIndex(headers, ['المدفوع','Paid']),
    remaining: headerIndex(headers, ['المتبقي','Remaining']),
    updatedAt: headerIndex(headers, ['آخر تحديث','Updated At'])
  };
  return {
    sourceRow: rawRow.rowNumber,
    orderId: text(at(row, c.orderId)),
    customerId: text(at(row, c.customerId)) || null,
    customerName: text(at(row, c.customerName)) || null,
    operationalStatus: text(at(row, c.status)) || null,
    legacyTotal: numOrNull(at(row, c.total)),
    legacyPaid: numOrNull(at(row, c.paid)),
    legacyRemaining: numOrNull(at(row, c.remaining)),
    updatedAt: text(at(row, c.updatedAt)) || null
  };
}

export async function readAccountingOrderLineFacts(env, input = {}, nowMs = Date.now(), options = {}) {
  const identity = validateOrderLineIdentity(input);
  if (!identity.ok) return { success: false, code: 'invalid-identity', errors: identity.errors, authoritative: false };

  const freshness = await inspectAccountingOperationsMirror(env, nowMs, options);
  if (!freshness.ready) {
    return {
      success: false,
      code: freshness.code || 'mirror-not-ready',
      message: 'TrendOS Orders/Lines mirror is not safe for Accounting reads.',
      fallback: 'apps-script',
      authoritative: false,
      freshness
    };
  }

  const [ordersCatalog, linesCatalog, orderRows, lineRows] = await Promise.all([
    readCatalog(env, ORDERS_SHEET), readCatalog(env, LINES_SHEET), readRows(env, ORDERS_SHEET), readRows(env, LINES_SHEET)
  ]);
  const orderHeaders = parseArray(ordersCatalog.headersJson);
  const lineHeaders = parseArray(linesCatalog.headersJson);
  const line = lineRows.map((row) => mapLine(lineHeaders, row)).find((row) => row.lineId === identity.lineId && row.orderId === identity.orderId) || null;
  if (!line) {
    return {
      success: false,
      code: 'order-line-not-found',
      message: 'Exact Order ID + Line ID pair was not found in the safe mirror.',
      orderId: identity.orderId,
      lineId: identity.lineId,
      authoritative: false,
      freshness
    };
  }
  const order = orderRows.map((row) => mapOrder(orderHeaders, row)).find((row) => row.orderId === identity.orderId) || null;
  const missingForAccounting = [];
  if (!line.itemId) missingForAccounting.push('Item ID');
  if (!line.customerId && !(order && order.customerId)) missingForAccounting.push('Customer ID / Party ID');
  if (!line.departmentId) missingForAccounting.push('Department ID');
  if (!line.profitCenterId) missingForAccounting.push('Profit Center ID');
  if (line.approvedLineAmount === null && line.approvedUnitPrice === null) missingForAccounting.push('approved selling price / approved line amount');

  return {
    success: true,
    version: TRENDOS_ACCOUNTING_OPERATIONS_READ_VERSION,
    authoritative: false,
    dataSource: 'trendos-d1-orders-lines-mirror',
    writeAuthority: 'google-sheets-apps-script',
    orderId: identity.orderId,
    lineId: identity.lineId,
    order,
    line,
    missingForAccounting,
    canCreateFinancialWrite: false,
    freshness
  };
}
