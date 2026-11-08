/* TrendOS T12: deterministic Africa/Cairo delivery-date policy.
 * Dates are calendar dates, not rolling from the day the page is opened.
 * Caller must distinguish stored deadlines from historical policy estimates.
 */
export const T12_DELIVERY_DATE_POLICY_VERSION = 'T12_DELIVERY_DATE_POLICY_V1_20261108';

function parseUtcInstant(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return null;
  // SQLite CURRENT_TIMESTAMP is UTC without an offset.
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z' : raw;
  if (!/\d{4}-\d{2}-\d{2}T/.test(iso) || !/(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)) return null;
  const parsed = new Date(iso);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
export function cairoCreationDate(value) {
  const date = parseUtcInstant(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const pick = (type) => parts.find(p => p.type === type)?.value || '';
  const y = pick('year'), m = pick('month'), d = pick('day');
  return /^\d{4}$/.test(y) && /^\d{2}$/.test(m) && /^\d{2}$/.test(d) ? y + '-' + m + '-' + d : '';
}
export function calendarDaysAfter(ymd, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd))) return '';
  const [y,m,d] = ymd.split('-').map(Number);
  const stamp = Date.UTC(y,m-1,d + days,12);
  const dt = new Date(stamp);
  if (!Number.isFinite(dt.getTime())) return '';
  return dt.toISOString().slice(0,10);
}
export function t12DeliveryForCreation(createdAtUtc, flyPrint) {
  const start = cairoCreationDate(createdAtUtc);
  if (!start) return '';
  const fly = flyPrint === 1 || flyPrint === true || ['1','true','نعم'].includes(String(flyPrint || '').toLowerCase());
  return calendarDaysAfter(start, fly ? 0 : 2);
}
export function validStoredDeliveryDay(value) {
  const date = String(value == null ? '' : value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const [y,m,d] = date.split('-').map(Number);
  const instant = new Date(Date.UTC(y,m-1,d,12));
  return instant.toISOString().slice(0,10) === date ? date : '';
}
