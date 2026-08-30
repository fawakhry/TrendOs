/**
 * TrendOS Integrity Foundation V1
 * --------------------------------
 * GitHub-only implementation checkpoint. DO NOT deploy blindly.
 *
 * Goals:
 * - canonical Order/Line ID normalization without reconstructing corrupted Date values
 * - one Cairo business calendar shared by attendance/cleaning/press/handover automation
 * - deterministic event keys that do not use timestamps as uniqueness
 * - durable retry-safe idempotency ledger with explicit claim/complete states
 * - shared lock wrapper for check-then-write paths
 * - automation run ledger
 * - centralized open/closed status helpers
 *
 * Google Sheets remains the authoritative write source.
 */

const TRENDOS_INTEGRITY_VERSION_V1 = 'TRENDOS_INTEGRITY_V1_20260830';
const TRENDOS_TZ_V1 = 'Africa/Cairo';
const TRENDOS_SPECIAL_SCHEDULE_SHEET_V1 = 'تشغيل - مواعيد خاصة';
const TRENDOS_ATTENDANCE_SETTINGS_SHEET_V1 = 'إعدادات الدوام';
const TRENDOS_IDEMPOTENCY_SHEET_V1 = 'إدارة - سجل التكامل';
const TRENDOS_AUTOMATION_RUN_SHEET_V1 = 'إدارة - سجل تشغيل الأتمتة';

const TRENDOS_IDEMPOTENCY_HEADERS_V1 = [
  'مفتاح الحدث','نوع الحدث','الكيان','تاريخ العمل','الحالة','وقت الحجز','وقت الإكمال',
  'النتيجة JSON','آخر خطأ','عدد المحاولات','بواسطة','آخر تحديث'
];

const TRENDOS_AUTOMATION_RUN_HEADERS_V1 = [
  'Run ID','مفتاح التشغيل','الدالة','تاريخ العمل','وقت البداية','وقت النهاية','الحالة',
  'صفوف مقروءة','صفوف مضافة','صفوف محدثة','تكرارات متجاهلة','عدد الأخطاء','Retry Count',
  'التفاصيل JSON','آخر خطأ','آخر تحديث'
];

function trendosTextV1_(value) {
  return String(value == null ? '' : value).trim();
}

function trendosAsciiDigitsV1_(value) {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return trendosTextV1_(value).replace(/[٠-٩۰-۹]/g, function(ch){ return map[ch] || ch; });
}

function trendosIsDateObjectV1_(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}

function trendosNormalizeIdTokenV1_(value) {
  if (value == null || value === '') return '';
  if (trendosIsDateObjectV1_(value)) return '';
  if (typeof value === 'number') {
    if (!isFinite(value) || Math.floor(value) !== value) return '';
    return String(value);
  }
  let text = trendosAsciiDigitsV1_(value)
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\u00a0/g, ' ')
    .trim();
  if (text.charAt(0) === "'") text = text.slice(1).trim();
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/i.test(text)) return '';
  if (/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(text)) return '';
  if (/^\d+\.0+$/.test(text)) text = text.replace(/\.0+$/, '');
  text = text.replace(/\s+/g, '');
  return text.toUpperCase();
}

function trendosNormalizeOrderId_(value) {
  const text = trendosNormalizeIdTokenV1_(value);
  if (!text || !/^[A-Z0-9][A-Z0-9_-]*$/.test(text)) return '';
  return text;
}

function trendosNormalizeLineId_(value) {
  const text = trendosNormalizeIdTokenV1_(value);
  if (!text) return '';
  const match = text.match(/^(.+)-(\d{1,3})$/);
  if (!match) return '';
  const orderId = trendosNormalizeOrderId_(match[1]);
  if (!orderId) return '';
  const lineNo = Number(match[2]);
  if (!isFinite(lineNo) || lineNo < 1 || lineNo > 999) return '';
  return orderId + '-' + String(lineNo).padStart(2, '0');
}

function trendosBusinessDate_(value) {
  if (value == null || value === '') value = new Date();
  if (trendosIsDateObjectV1_(value)) {
    if (isNaN(value.getTime())) return '';
    return Utilities.formatDate(value, TRENDOS_TZ_V1, 'yyyy-MM-dd');
  }
  const text = trendosAsciiDigitsV1_(value).trim();
  const iso = text.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const prefix = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (prefix) return prefix[1] + '-' + prefix[2] + '-' + prefix[3];
  return '';
}

function trendosBusinessWeekdayV1_(dateKey) {
  const m = trendosTextV1_(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return -1;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)).getUTCDay();
}

function trendosTimeHHmmV1_(value, fallback) {
  const text = trendosAsciiDigitsV1_(value);
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback || '';
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return fallback || '';
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

function trendosResolveBusinessScheduleV1_(dateKey, settingsMap, specialRows) {
  dateKey = trendosBusinessDate_(dateKey);
  if (!dateKey) return {date:'',businessDay:false,start:'',end:'',source:'INVALID_DATE',description:'Invalid business date',special:false};
  settingsMap = settingsMap || {};
  specialRows = Array.isArray(specialRows) ? specialRows : [];
  const defaultStart = trendosTimeHHmmV1_(settingsMap.DEFAULT_WORKDAY_START || settingsMap.ATTENDANCE_SCHEDULE_START, '12:00');
  const defaultEnd = trendosTimeHHmmV1_(settingsMap.DEFAULT_WORKDAY_END, '21:00');
  const friday = trendosBusinessWeekdayV1_(dateKey) === 5;
  let result = {
    date:dateKey,businessDay:!friday,start:defaultStart,end:defaultEnd,
    source:friday ? 'DEFAULT_FRIDAY_CLOSED' : 'DEFAULT_WORKDAY',
    description:friday ? 'Friday weekly holiday' : 'Default workday',special:false
  };
  for (let i = specialRows.length - 1; i >= 0; i--) {
    const row = specialRows[i] || {};
    const rowDate = trendosBusinessDate_(row.date || row['التاريخ']);
    if (rowDate !== dateKey) continue;
    const enabled = trendosTextV1_(row.enabled != null ? row.enabled : row['مفعل؟']);
    if (enabled === 'لا' || /^no$/i.test(enabled) || enabled === '0' || /^false$/i.test(enabled)) continue;
    result = {
      date:dateKey,businessDay:true,
      start:trendosTimeHHmmV1_(row.start || row['بداية العمل'], defaultStart),
      end:trendosTimeHHmmV1_(row.end || row['نهاية العمل'], defaultEnd),
      source:'SPECIAL_SCHEDULE',description:trendosTextV1_(row.description || row['الوصف']) || 'Special schedule',special:true
    };
    break;
  }
  return result;
}

function trendosRowsAsObjectsV1_(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  if (!values.length) return [];
  const headers = values[0].map(trendosTextV1_);
  return values.slice(1).map(function(row){
    const out = {};
    headers.forEach(function(header, i){ if (header) out[header] = row[i]; });
    return out;
  });
}

function trendosSettingsMapV1_() {
  const ss = trendosSpreadsheetV1_();
  const sheet = ss.getSheetByName(TRENDOS_ATTENDANCE_SETTINGS_SHEET_V1);
  const out = {};
  trendosRowsAsObjectsV1_(sheet).forEach(function(row){
    const key = trendosTextV1_(row['الإعداد']);
    const enabled = trendosTextV1_(row['مفعل؟']);
    if (key && enabled !== 'لا') out[key] = row['القيمة'];
  });
  return out;
}

function trendosSpecialScheduleRowsV1_() {
  const ss = trendosSpreadsheetV1_();
  return trendosRowsAsObjectsV1_(ss.getSheetByName(TRENDOS_SPECIAL_SCHEDULE_SHEET_V1));
}

function trendosBusinessSchedule_(value) {
  const dateKey = trendosBusinessDate_(value);
  return trendosResolveBusinessScheduleV1_(dateKey, trendosSettingsMapV1_(), trendosSpecialScheduleRowsV1_());
}

function trendosIsBusinessDay_(value) {
  return !!trendosBusinessSchedule_(value).businessDay;
}

function trendosStableValueV1_(value) {
  if (value === null || value === undefined) return null;
  if (trendosIsDateObjectV1_(value)) return isNaN(value.getTime()) ? null : value.toISOString();
  if (Array.isArray(value)) return value.map(trendosStableValueV1_);
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach(function(key){ out[key] = trendosStableValueV1_(value[key]); });
    return out;
  }
  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return trendosTextV1_(value);
}

function trendosStableJsonV1_(value) {
  return JSON.stringify(trendosStableValueV1_(value));
}

function trendosSha256HexV1_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, trendosTextV1_(value), Utilities.Charset.UTF_8);
  return bytes.map(function(b){ const n = b < 0 ? b + 256 : b; return ('0' + n.toString(16)).slice(-2); }).join('');
}

function trendosEventKey_(eventType, entityId, businessDate, relevantState) {
  const type = trendosTextV1_(eventType).toUpperCase().replace(/\s+/g, '_');
  const entity = trendosNormalizeLineId_(entityId) || trendosNormalizeOrderId_(entityId) || trendosTextV1_(entityId);
  const dateKey = trendosBusinessDate_(businessDate);
  if (!type || !entity || !dateKey) throw new Error('TrendOS event key requires eventType, entityId and businessDate.');
  const material = [type, entity, dateKey, trendosStableJsonV1_(relevantState)].join('|');
  return 'TR1|' + type + '|' + entity + '|' + dateKey + '|' + trendosSha256HexV1_(material).slice(0, 32);
}

function trendosSpreadsheetV1_() {
  if (typeof ss_ === 'function') return ss_();
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getActiveSpreadsheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  }
  throw new Error('TrendOS spreadsheet is unavailable.');
}

function trendosEnsureSheetV1_(name, headers) {
  const ss = trendosSpreadsheetV1_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(trendosTextV1_);
  let needsHeader = false;
  for (let i = 0; i < headers.length; i++) if (current[i] !== headers[i]) { needsHeader = true; break; }
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function trendosHeaderMapV1_(sheet) {
  const out = {};
  if (!sheet || sheet.getLastColumn() < 1) return out;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach(function(value, i){ const key = trendosTextV1_(value); if (key) out[key] = i + 1; });
  return out;
}

function trendosCellValueV1_(sheet, row, headerMap, header) {
  const col = headerMap[header];
  return col ? sheet.getRange(row, col).getValue() : '';
}

function trendosSetByHeadersV1_(sheet, rowNumber, values) {
  const map = trendosHeaderMapV1_(sheet);
  Object.keys(values || {}).forEach(function(header){ const col = map[header]; if (col) sheet.getRange(rowNumber, col).setValue(values[header]); });
}

function trendosAppendByHeadersV1_(sheet, values, headers) {
  const map = trendosHeaderMapV1_(sheet);
  const width = Math.max(sheet.getLastColumn(), headers ? headers.length : 0);
  const row = new Array(width).fill('');
  Object.keys(values || {}).forEach(function(header){ const col = map[header]; if (col) row[col - 1] = values[header]; });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function trendosGetLockV1_(scope) {
  scope = trendosTextV1_(scope || 'script').toLowerCase();
  if (scope === 'user') return LockService.getUserLock();
  if (scope === 'document' && LockService.getDocumentLock) {
    const lock = LockService.getDocumentLock();
    if (lock) return lock;
  }
  return LockService.getScriptLock();
}

function trendosWithLock_(scope, fn, waitMs) {
  if (typeof fn !== 'function') throw new Error('trendosWithLock_ requires a function.');
  const lock = trendosGetLockV1_(scope);
  const timeout = Math.max(1000, Number(waitMs || 30000) || 30000);
  lock.waitLock(timeout);
  try { return fn(); } finally { lock.releaseLock(); }
}

function trendosIdempotencySheetV1_() {
  return trendosEnsureSheetV1_(TRENDOS_IDEMPOTENCY_SHEET_V1, TRENDOS_IDEMPOTENCY_HEADERS_V1);
}

function trendosFindEventRowV1_(sheet, eventKey) {
  eventKey = trendosTextV1_(eventKey);
  if (!eventKey || sheet.getLastRow() < 2) return 0;
  const map = trendosHeaderMapV1_(sheet), col = map['مفتاح الحدث'];
  if (!col) return 0;
  const values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) if (trendosTextV1_(values[i][0]) === eventKey) return i + 2;
  return 0;
}

function trendosIdempotencyLookup_(eventKey) {
  const sheet = trendosIdempotencySheetV1_();
  const row = trendosFindEventRowV1_(sheet, eventKey);
  if (!row) return null;
  const map = trendosHeaderMapV1_(sheet);
  let result = null;
  const rawResult = trendosTextV1_(trendosCellValueV1_(sheet, row, map, 'النتيجة JSON'));
  if (rawResult) { try { result = JSON.parse(rawResult); } catch (err) { result = rawResult; } }
  return {
    eventKey:trendosCellValueV1_(sheet,row,map,'مفتاح الحدث'),
    eventType:trendosCellValueV1_(sheet,row,map,'نوع الحدث'),
    entityId:trendosCellValueV1_(sheet,row,map,'الكيان'),
    businessDate:trendosCellValueV1_(sheet,row,map,'تاريخ العمل'),
    status:trendosCellValueV1_(sheet,row,map,'الحالة'),
    claimedAt:trendosCellValueV1_(sheet,row,map,'وقت الحجز'),
    completedAt:trendosCellValueV1_(sheet,row,map,'وقت الإكمال'),
    result:result,lastError:trendosCellValueV1_(sheet,row,map,'آخر خطأ'),
    attempts:Number(trendosCellValueV1_(sheet,row,map,'عدد المحاولات') || 0),rowNumber:row
  };
}

function trendosIdempotencyClaimUnlockedV1_(eventKey, meta) {
  meta = meta || {};
  const sheet = trendosIdempotencySheetV1_(), existingRow = trendosFindEventRowV1_(sheet, eventKey), now = new Date();
  if (existingRow) {
    const map = trendosHeaderMapV1_(sheet);
    const status = trendosTextV1_(trendosCellValueV1_(sheet, existingRow, map, 'الحالة'));
    const attempts = Number(trendosCellValueV1_(sheet, existingRow, map, 'عدد المحاولات') || 0) + 1;
    trendosSetByHeadersV1_(sheet, existingRow, {'عدد المحاولات':attempts,'آخر تحديث':now});
    const existing = trendosIdempotencyLookup_(eventKey);
    return {claimed:false,duplicate:true,completed:status === 'COMPLETED',inProgress:status === 'CLAIMED',failed:status === 'FAILED',existing:existing};
  }
  const rowNumber = trendosAppendByHeadersV1_(sheet, {
    'مفتاح الحدث':eventKey,'نوع الحدث':trendosTextV1_(meta.eventType),'الكيان':trendosTextV1_(meta.entityId),
    'تاريخ العمل':trendosBusinessDate_(meta.businessDate),'الحالة':'CLAIMED','وقت الحجز':now,'وقت الإكمال':'',
    'النتيجة JSON':'','آخر خطأ':'','عدد المحاولات':1,'بواسطة':trendosTextV1_(meta.by),'آخر تحديث':now
  }, TRENDOS_IDEMPOTENCY_HEADERS_V1);
  return {claimed:true,duplicate:false,completed:false,inProgress:true,failed:false,eventKey:eventKey,rowNumber:rowNumber};
}

function trendosIdempotencyClaim_(eventKey, meta, options) {
  options = options || {};
  if (!trendosTextV1_(eventKey)) throw new Error('eventKey is required.');
  if (options.alreadyLocked) return trendosIdempotencyClaimUnlockedV1_(eventKey, meta);
  return trendosWithLock_('script', function(){ return trendosIdempotencyClaimUnlockedV1_(eventKey, meta); }, options.waitMs || 30000);
}

function trendosIdempotencyCompleteUnlockedV1_(eventKey, result, options) {
  options = options || {};
  const sheet = trendosIdempotencySheetV1_(), row = trendosFindEventRowV1_(sheet, eventKey);
  if (!row) throw new Error('Cannot complete unknown TrendOS event: ' + eventKey);
  const now = new Date();
  trendosSetByHeadersV1_(sheet, row, {
    'الحالة':options.failed ? 'FAILED' : 'COMPLETED','وقت الإكمال':options.failed ? '' : now,
    'النتيجة JSON':result === undefined ? '' : trendosStableJsonV1_(result),
    'آخر خطأ':options.failed ? trendosTextV1_(options.error || result) : '','آخر تحديث':now
  });
  return trendosIdempotencyLookup_(eventKey);
}

function trendosIdempotencyComplete_(eventKey, result, options) {
  options = options || {};
  if (options.alreadyLocked) return trendosIdempotencyCompleteUnlockedV1_(eventKey, result, options);
  return trendosWithLock_('script', function(){ return trendosIdempotencyCompleteUnlockedV1_(eventKey, result, options); }, options.waitMs || 30000);
}

function trendosIdempotencyFail_(eventKey, error, options) {
  options = options || {};
  options.failed = true;
  options.error = error && error.message ? error.message : trendosTextV1_(error);
  return trendosIdempotencyComplete_(eventKey, {error:options.error}, options);
}

function trendosAutomationRunSheetV1_() {
  return trendosEnsureSheetV1_(TRENDOS_AUTOMATION_RUN_SHEET_V1, TRENDOS_AUTOMATION_RUN_HEADERS_V1);
}

function trendosAutomationRunStart_(functionName, options) {
  options = options || {};
  const now = new Date(), businessDate = trendosBusinessDate_(options.businessDate || now);
  const runId = trendosTextV1_(options.runId) || ('RUN-' + businessDate.replace(/-/g, '') + '-' + Utilities.getUuid().slice(0, 8).toUpperCase());
  const sheet = trendosAutomationRunSheetV1_();
  const rowNumber = trendosAppendByHeadersV1_(sheet, {
    'Run ID':runId,'مفتاح التشغيل':trendosTextV1_(options.runKey),'الدالة':trendosTextV1_(functionName),'تاريخ العمل':businessDate,
    'وقت البداية':now,'وقت النهاية':'','الحالة':'RUNNING','صفوف مقروءة':0,'صفوف مضافة':0,'صفوف محدثة':0,
    'تكرارات متجاهلة':0,'عدد الأخطاء':0,'Retry Count':Number(options.retryCount || 0),
    'التفاصيل JSON':options.details === undefined ? '' : trendosStableJsonV1_(options.details),'آخر خطأ':'','آخر تحديث':now
  }, TRENDOS_AUTOMATION_RUN_HEADERS_V1);
  return {runId:runId,rowNumber:rowNumber,businessDate:businessDate,startedAt:now};
}

function trendosFindAutomationRunRowV1_(sheet, runId) {
  runId = trendosTextV1_(runId);
  if (!runId || sheet.getLastRow() < 2) return 0;
  const map = trendosHeaderMapV1_(sheet), col = map['Run ID'];
  if (!col) return 0;
  const values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) if (trendosTextV1_(values[i][0]) === runId) return i + 2;
  return 0;
}

function trendosAutomationRunFinish_(runId, summary) {
  summary = summary || {};
  const sheet = trendosAutomationRunSheetV1_(), row = trendosFindAutomationRunRowV1_(sheet, runId);
  if (!row) throw new Error('Unknown automation Run ID: ' + runId);
  const now = new Date(), status = trendosTextV1_(summary.status || (summary.error ? 'FAILED' : 'SUCCESS')).toUpperCase();
  trendosSetByHeadersV1_(sheet, row, {
    'وقت النهاية':now,'الحالة':status,'صفوف مقروءة':Number(summary.rowsRead || 0),'صفوف مضافة':Number(summary.rowsCreated || 0),
    'صفوف محدثة':Number(summary.rowsUpdated || 0),'تكرارات متجاهلة':Number(summary.duplicatesSkipped || 0),
    'عدد الأخطاء':Number(summary.errorCount || (summary.error ? 1 : 0)),'Retry Count':Number(summary.retryCount || 0),
    'التفاصيل JSON':summary.details === undefined ? '' : trendosStableJsonV1_(summary.details),
    'آخر خطأ':summary.error && summary.error.message ? summary.error.message : trendosTextV1_(summary.error),'آخر تحديث':now
  });
  return {runId:runId,rowNumber:row,status:status,finishedAt:now};
}

function trendosNormalizeStatusV1_(status) { return trendosTextV1_(status).replace(/\s+/g, ' '); }
function trendosIsDuplicateStatus_(status) { return trendosNormalizeStatusV1_(status) === 'مكرر'; }
function trendosIsCancelledStatus_(status) {
  status = trendosNormalizeStatusV1_(status);
  return status === 'ملغي' || status === 'ملغى' || status === 'ملغية';
}
function trendosIsDeliveredStatus_(status) { return trendosNormalizeStatusV1_(status) === 'تم التسليم'; }
function trendosIsClosedLineStatus_(status) { return trendosIsDuplicateStatus_(status) || trendosIsCancelledStatus_(status) || trendosIsDeliveredStatus_(status); }
function trendosIsOpenLineStatus_(status) { const normalized = trendosNormalizeStatusV1_(status); return !!normalized && !trendosIsClosedLineStatus_(normalized); }
function trendosIsFinalInvoiceStatus_(status) {
  status = trendosNormalizeStatusV1_(status);
  return status === 'تم التقفيل' || status === 'مقفلة' || status === 'مقفل';
}

function trendosIntegritySelfTestV1_() {
  const checks = [];
  function check(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    checks.push({name:name,expected:expected,actual:actual,pass:pass});
  }
  check('order numeric', trendosNormalizeOrderId_(3637), '3637');
  check('order TM uppercase', trendosNormalizeOrderId_(" tm2606150097 "), 'TM2606150097');
  check('line pad suffix', trendosNormalizeLineId_('3637-2'), '3637-02');
  check('line arabic digits', trendosNormalizeLineId_('٣٦٣٧-٠٢'), '3637-02');
  check('date object rejected as line ID', trendosNormalizeLineId_(new Date()), '');
  check('duplicate closed', trendosIsClosedLineStatus_('مكرر'), true);
  check('delivered closed', trendosIsClosedLineStatus_('تم التسليم'), true);
  check('in progress open', trendosIsOpenLineStatus_('تحت التنفيذ'), true);
  const stateA = {b:2,a:1}, stateB = {a:1,b:2};
  check('stable event key object order', trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',stateA), trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',stateB));
  const friday = trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[]);
  check('Friday default closed', friday.businessDay, false);
  const fridaySpecial = trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[
    {'التاريخ':'2026-09-04','بداية العمل':'10:00','نهاية العمل':'22:00','الوصف':'استثناء','مفعل؟':'نعم'}
  ]);
  check('Friday special opens', fridaySpecial.businessDay, true);
  check('Friday special start', fridaySpecial.start, '10:00');
  check('Friday special end', fridaySpecial.end, '22:00');
  return {success:checks.every(function(x){ return x.pass; }),version:TRENDOS_INTEGRITY_VERSION_V1,checks:checks};
}
