/* TrendOS PERF-CF-02CR — operational orders enrichment candidate.
 * Pure/read-only helpers. No routing, deploy, D1 mutation, or frontend cutover here.
 * Mirrors Apps Script getRowsPageV1931 enrichment semantics for customer/debt fields.
 */

function text(value) { return String(value == null ? '' : value).trim(); }

function normalizeArabic(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
}

function searchKey(value) {
  return normalizeArabic(value).replace(/[^0-9a-z\u0600-\u06ff ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}

function arabicDigits(value) {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  return String(value == null ? '' : value).replace(/[٠-٩]/g, (d) => map[d] || d);
}

export function parseDebtAmount02CR(value) {
  let s = arabicDigits(value).trim();
  if (!s || /^#/.test(s)) return 0;
  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) return 0;
  s = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 500000) return 0;
  return n;
}

// Apps Script headersMap_ is last-write-wins for duplicate exact headers,
// while firstCol_ preserves alias priority. This function reproduces both.
export function headerIndex02CR(headers, aliases, fallback = -1) {
  const normalized = (headers || []).map((h) => text(h));
  for (const alias of aliases || []) {
    const idx = normalized.lastIndexOf(text(alias));
    if (idx >= 0) return idx;
  }
  return Number.isInteger(fallback) && fallback >= 0 ? fallback : -1;
}

function valueAt(row, index) {
  return index >= 0 && Array.isArray(row) && index < row.length ? row[index] : '';
}

function rowValues(item) {
  if (Array.isArray(item && item.display) && item.display.length) return item.display;
  if (Array.isArray(item && item.values)) return item.values;
  return [];
}

function parseDay(value) {
  const raw = arabicDigits(text(value));
  if (!raw) return null;
  let m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(value) {
  const d = value instanceof Date ? new Date(value) : parseDay(value);
  if (!d || Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildCustomerLookup02CR(headers, mirrorRows) {
  const c = {
    name: headerIndex02CR(headers, ['اسم الشات / المكتب','اسم العميل','Customer Name'], 0),
    phone: headerIndex02CR(headers, ['رقم العميل الأساسي','رقم العميل','رقم الهاتف','Phone'], -1),
    extra: headerIndex02CR(headers, ['رقم إضافي','رقم إضافى','Extra Phone'], -1),
    debt: headerIndex02CR(headers, ['مديونية'], -1),
    debtNotes: headerIndex02CR(headers, ['ملاحظات المديونية','ملاحظات الدين','Debt Notes'], -1)
  };
  const out = Object.create(null);
  for (const item of mirrorRows || []) {
    if (Number(item && item.rowNumber || 0) <= 1) continue;
    const row = rowValues(item);
    const name = text(valueAt(row, c.name));
    const key = searchKey(name);
    if (!key) continue;
    out[key] = {
      name,
      phone: cleanPhone(valueAt(row, c.phone)),
      extraPhone: cleanPhone(valueAt(row, c.extra)),
      debtAmount: parseDebtAmount02CR(valueAt(row, c.debt)),
      debtNotes: text(valueAt(row, c.debtNotes))
    };
  }
  return out;
}

export function buildDebtRestrictionLookup02CR(headers, mirrorRows, now = new Date()) {
  const c = {
    customer: headerIndex02CR(headers, ['اسم العميل'], -1),
    active: headerIndex02CR(headers, ['منع فعال؟'], -1),
    reason: headerIndex02CR(headers, ['سبب المنع'], -1),
    validUntil: headerIndex02CR(headers, ['صالح حتى'], -1)
  };
  const today = startOfDay(now) || new Date();
  const out = Object.create(null);
  for (const item of mirrorRows || []) {
    if (Number(item && item.rowNumber || 0) <= 1) continue;
    const row = rowValues(item);
    const customer = text(valueAt(row, c.customer));
    const key = searchKey(customer);
    if (!key) continue;
    const active = text(valueAt(row, c.active) || 'نعم') === 'نعم';
    const untilRaw = valueAt(row, c.validUntil);
    const until = startOfDay(untilRaw);
    const expired = !!(until && until.getTime() < today.getTime());
    if (!active || expired) continue;
    out[key] = {
      customer,
      reason: text(valueAt(row, c.reason)),
      validUntil: text(untilRaw),
      active: true
    };
  }
  return out;
}

export function enrichOperationalRows02CR(rows, customerLookup, restrictionLookup) {
  return (rows || []).map((source) => {
    const row = { ...(source || {}) };
    const key = searchKey(row.customer);
    const customer = (customerLookup && customerLookup[key]) || null;
    const restriction = (restrictionLookup && restrictionLookup[key]) || null;

    if (!cleanPhone(row.customerPhone) && customer) {
      row.customerPhone = customer.phone || customer.extraPhone || '';
    } else {
      row.customerPhone = cleanPhone(row.customerPhone);
    }

    // Apps Script getRowsPageV1931 intentionally trusts the customer sheet for debt.
    const debtAmount = customer ? parseDebtAmount02CR(customer.debtAmount) : 0;
    row.debtAmount = debtAmount;
    row.debtHold = debtAmount > 0 ? 'نعم' : 'لا';
    row.deliveryDebtRestricted = !!(debtAmount > 0 && restriction && restriction.active);
    row.debtRestrictionReason = row.deliveryDebtRestricted ? text(restriction.reason) : '';
    row.debtNotes = text(row.debtNotes) || (customer ? text(customer.debtNotes) : '');
    return row;
  });
}

export function enrichFromMirrors02CR(rows, customerMirror, restrictionMirror, now = new Date()) {
  const customers = buildCustomerLookup02CR(
    (customerMirror && customerMirror.headers) || [],
    (customerMirror && customerMirror.rows) || []
  );
  const restrictions = buildDebtRestrictionLookup02CR(
    (restrictionMirror && restrictionMirror.headers) || [],
    (restrictionMirror && restrictionMirror.rows) || [],
    now
  );
  return enrichOperationalRows02CR(rows, customers, restrictions);
}
