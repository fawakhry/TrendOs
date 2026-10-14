/* TrendOS Order Watch Agent V0 — SOURCE_ONLY / OFF.
 * Pure offline analysis over complete, previously authorized 02CR read pages.
 * No fetch, D1 access, timers, notifications, AI requests, or mutations.
 * Does NOT authenticate callers or assert that the upstream is live.
 */
export const ORDER_WATCH_AGENT_MODE = 'OFF_SOURCE_ONLY';
const API_VERSION = 'D1_ORDERS_READ_02CR_T12_LEGACY_RUNTIME_V1';
const SOURCE = 'd1-edge-orders-02cr+legacy-runtime+t12-native';
const CLOSED = new Set(['تم التسليم', 'جاهز للاستلام', 'تم التنفيذ', 'جاهز للطباعة', 'مكرر', 'ملغى', 'ملغي']);
const IDENTIFIER = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_PAGES = 250;
const MAX_ROWS = 10000;

function str(x) { return String(x == null ? '' : x).trim(); }
function fail(code) { const e = new Error(code); e.code = code; throw e; }
function integer(x, min, max) { return Number.isInteger(x) && x >= min && x <= max; }

function parseDay(raw) {
  const value = str(raw);
  // An explicitly offset timestamp is an instant: compare its Cairo calendar day,
  // not the UTC date portion (which can differ after midnight in Cairo).
  const zoned = value.match(/^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/);
  let y, m, d;
  if (zoned) {
    [, y, m, d] = zoned;
  } else {
    // Legacy calendar dates / SQLite-local timestamps: preserve their date.
    // Never accept arbitrary trailing text or ambiguous unzoned ISO T strings.
    let match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?: (?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?)?$/);
    if (match) { [, y, m, d] = match; }
    else {
      match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return null;
      [, d, m, y] = match;
    }
  }
  y = Number(y); m = Number(m); d = Number(d);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() + 1 !== m || date.getUTCDate() !== d) return null;
  if (zoned) {
    const instant = new Date(value);
    return Number.isNaN(instant.getTime()) ? null : cairoDay(instant);
  }
  return String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

function cairoDay(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const field = (key) => parts.find((part) => part.type === key)?.value || '';
  return field('year') + '-' + field('month') + '-' + field('day');
}

function completeRows(pages) {
  if (!Array.isArray(pages) || !pages.length || pages.length > MAX_PAGES) fail('PAGES_INVALID');
  let expectedRows = null;
  let expectedPages = null;
  let expectedSize = null;
  let version = null;
  const rows = [];
  for (let index = 0; index < pages.length; index++) {
    const p = pages[index];
    if (!p || p.success !== true || p.serverPaged !== true || p.version !== API_VERSION ||
        p.dataSource !== SOURCE || !str(p.dataVersion)) fail('SOURCE_NOT_QUALIFIED');
    const nav = p.pagination;
    if (!nav || !integer(nav.page, 1, MAX_PAGES) || nav.page !== index + 1 ||
        !integer(nav.pageSize, 1, 100) || !integer(nav.totalRows, 0, MAX_ROWS) ||
        !integer(nav.totalPages, 1, MAX_PAGES) ||
        nav.totalPages !== Math.max(1, Math.ceil(nav.totalRows / nav.pageSize)) ||
        !Array.isArray(p.rows) || p.rows.length > nav.pageSize) fail('PAGINATION_INVALID');
    if (expectedRows === null) {
      expectedRows = nav.totalRows;
      expectedPages = nav.totalPages;
      expectedSize = nav.pageSize;
      version = p.dataVersion;
    } else if (expectedRows !== nav.totalRows || expectedPages !== nav.totalPages ||
               expectedSize !== nav.pageSize || version !== p.dataVersion) {
      fail('PAGES_DRIFTED');
    }
    // Each page must contain its exact slice, not just the correct aggregate
    // count. A short early page and an overlong final page can hide lost rows.
    const expectedOnPage = Math.max(0, Math.min(nav.pageSize, nav.totalRows - index * nav.pageSize));
    if (p.rows.length !== expectedOnPage) fail('INCOMPLETE_SNAPSHOT');
    rows.push(...p.rows);
  }
  if (pages.length !== expectedPages || rows.length !== expectedRows) fail('INCOMPLETE_SNAPSHOT');
  return { rows, dataVersion: version };
}

export function analyzeOrderWatchSnapshot({ pages, asOf } = {}) {
  // Caller must have already authorized the 02CR GET, checked freshness,
  // and fetched ALL pages under one consistent snapshot. No network inside.
  if (typeof asOf !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(asOf)) fail('AS_OF_REQUIRES_OFFSET');
  const instant = new Date(asOf);
  if (Number.isNaN(instant.getTime())) fail('AS_OF_INVALID');
  const snapshot = completeRows(pages);
  const today = cairoDay(instant);
  const seen = new Set();
  const summary = {
    sourceLines: snapshot.rows.length, activeLines: 0, flaggedLines: 0,
    overdue: 0, unassigned: 0, missingItem: 0,
    missingDeliveryDate: 0, invalidDeliveryDate: 0, unknownStatus: 0,
    stopped: 0, waitingCustomer: 0
  };
  const alerts = [];
  for (const row of snapshot.rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('ROW_INVALID');
    const orderId = str(row.orderId);
    const lineId = str(row.lineId);
    if (!IDENTIFIER.test(orderId) || !IDENTIFIER.test(lineId)) fail('STABLE_ID_REQUIRED');
    if (seen.has(lineId)) fail('DUPLICATE_LINE_ID');
    seen.add(lineId);
    const status = str(row.status);
    if (CLOSED.has(status)) continue;
    summary.activeLines++;
    const codes = [];
    if (!status) { codes.push('UNKNOWN_STATUS'); summary.unknownStatus++; }
    if (status === 'متوقف' || status === 'مشكلة/متوقف') {
      codes.push('STOPPED'); summary.stopped++;
    }
    if (status === 'في انتظار موافقة العميل') {
      codes.push('WAITING_CUSTOMER'); summary.waitingCustomer++;
    }
    if (!str(row.assignedTo)) { codes.push('UNASSIGNED'); summary.unassigned++; }
    if (!str(row.itemName)) { codes.push('ITEM_MISSING'); summary.missingItem++; }
    const rawDue = str(row.expectedDeliveryAt || row.expectedDeliveryText);
    if (!rawDue) { codes.push('DELIVERY_DATE_MISSING'); summary.missingDeliveryDate++; }
    else {
      const due = parseDay(rawDue);
      if (!due) { codes.push('DELIVERY_DATE_INVALID'); summary.invalidDeliveryDate++; }
      else if (due < today) { codes.push('OVERDUE'); summary.overdue++; }
    }
    if (!codes.length) continue;
    summary.flaggedLines++;
    const urgent = ['VIP', 'عاجل'].includes(str(row.priority));
    const severity = codes.includes('OVERDUE') || codes.includes('STOPPED') || (urgent && codes.includes('UNASSIGNED'))
      ? 'HIGH'
      : codes.some((code) => ['UNASSIGNED', 'WAITING_CUSTOMER', 'ITEM_MISSING', 'DELIVERY_DATE_INVALID', 'UNKNOWN_STATUS'].includes(code))
        ? 'MEDIUM' : 'LOW';
    // No customer name, phone, notes, personal details, or message contents leave this function.
    alerts.push({ orderId, lineId, severity, codes });
  }
  const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || a.orderId.localeCompare(b.orderId) || a.lineId.localeCompare(b.lineId));
  return {
    agent: 'TrendOS_Order_Watch_V0',
    mode: ORDER_WATCH_AGENT_MODE,
    readOnly: true,
    sentNotifications: false,
    productionReady: false,
    // Even identical 02CR dataVersion values do not certify an atomic snapshot.
    snapshotAtomicityVerified: false,
    asOf: instant.toISOString(),
    cairoDay: today,
    sourceVersion: snapshot.dataVersion,
    summary,
    alerts
  };
}
