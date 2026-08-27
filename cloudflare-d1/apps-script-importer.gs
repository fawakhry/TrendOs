/************************************************************
 * TrendOS -> Cloudflare D1 migration helper
 *
 * لا يغيّر TrendOS ولا يحذف من Google Sheets.
 * يقرأ البيانات الحالية ويرسل نسخة إلى D1 على دفعات.
 *
 * Script Properties المطلوبة بعد نشر Worker:
 * D1_API_URL             مثال: https://trendos-d1-api.<account>.workers.dev
 * D1_MIGRATION_SECRET    سر طويل خاص بالاستيراد
 ************************************************************/

function d1MigrationConfig_() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = String(props.getProperty('D1_API_URL') || '').replace(/\/+$/, '');
  const secret = String(props.getProperty('D1_MIGRATION_SECRET') || '');
  if (!apiUrl) throw new Error('D1_API_URL غير مضبوط في Script Properties.');
  if (!secret) throw new Error('D1_MIGRATION_SECRET غير مضبوط في Script Properties.');
  return { apiUrl: apiUrl, secret: secret };
}

function d1JsonFetch_(path, options) {
  const cfg = d1MigrationConfig_();
  const opt = Object.assign({ muteHttpExceptions: true }, options || {});
  opt.headers = Object.assign({}, opt.headers || {}, {
    'x-migration-secret': cfg.secret
  });
  const res = UrlFetchApp.fetch(cfg.apiUrl + path, opt);
  const code = res.getResponseCode();
  let data = {};
  try { data = JSON.parse(res.getContentText() || '{}'); }
  catch (e) { data = { success: false, message: res.getContentText() }; }
  if (code < 200 || code >= 300 || data.success === false) {
    throw new Error('D1 ' + code + ': ' + (data.message || 'request failed'));
  }
  return data;
}

function d1SheetObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(function (x) { return String(x || '').trim(); });
  return values.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) {
      if (h) obj[h] = row[i];
    });
    return obj;
  }).filter(function (obj) {
    return Object.keys(obj).some(function (k) { return String(obj[k] || '').trim() !== ''; });
  });
}

function d1ImportRows_(entity, rows, note) {
  const CHUNK = 100;
  let imported = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const body = { note: note || '' };
    body[entity] = chunk;
    const result = d1JsonFetch_('/v1/import/batch', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(body)
    });
    imported += Number((result.imported || {})[entity] || 0);
    Logger.log(entity + ': ' + Math.min(i + CHUNK, rows.length) + '/' + rows.length);
  }
  return imported;
}

function testD1Health() {
  const cfg = d1MigrationConfig_();
  const res = UrlFetchApp.fetch(cfg.apiUrl + '/health', { muteHttpExceptions: true });
  Logger.log(res.getContentText());
  return res.getContentText();
}

function migrateOrdersToD1() {
  const sh = ss_().getSheetByName(SHEET_NAME_ORDERS);
  if (!sh) throw new Error('شيت الأوردرات غير موجود.');
  const rows = d1SheetObjects_(sh);
  const imported = d1ImportRows_('orders', rows, 'orders from Google Sheets');
  Logger.log(JSON.stringify({ success: true, entity: 'orders', rows: rows.length, imported: imported }));
}

function migrateCustomerManagerToD1() {
  cmEnsureAll_();
  const ss = ss_();
  const messageSheet = ss.getSheetByName(CM_SHEET_MESSAGES_V1932);
  const conversationSheet = ss.getSheetByName(CM_SHEET_CONVERSATIONS_V1932);
  const messages = d1SheetObjects_(messageSheet);
  const conversations = d1SheetObjects_(conversationSheet);

  const messageImported = d1ImportRows_('messages', messages, 'customer manager messages from Google Sheets');
  const conversationImported = d1ImportRows_('conversations', conversations, 'customer manager conversations from Google Sheets');

  Logger.log(JSON.stringify({
    success: true,
    messages: { rows: messages.length, imported: messageImported },
    conversations: { rows: conversations.length, imported: conversationImported }
  }));
}

function migrateCustomersFromOrdersToD1() {
  const sh = ss_().getSheetByName(SHEET_NAME_ORDERS);
  if (!sh) throw new Error('شيت الأوردرات غير موجود.');
  const rows = d1SheetObjects_(sh);
  const seen = {};
  const customers = [];

  rows.forEach(function (row) {
    const phone = String(
      row['رقم الهاتف'] ||
      row['رقم العميل الأساسي'] ||
      row['هاتف العميل'] ||
      row['موبايل'] ||
      row['رقم الموبايل'] ||
      ''
    ).replace(/[^0-9]/g, '');
    if (!/^01[0125]\d{8}$/.test(phone) || seen[phone]) return;
    seen[phone] = true;
    customers.push({
      phone: phone,
      customerName: row['اسم الشات / المكتب'] || row['اسم العميل'] || row['العميل'] || '',
      customerCode: row['كود العميل'] || ''
    });
  });

  const imported = d1ImportRows_('customers', customers, 'customers derived from orders');
  Logger.log(JSON.stringify({ success: true, entity: 'customers', rows: customers.length, imported: imported }));
}

function migrateTrendOSCoreToD1() {
  migrateCustomersFromOrdersToD1();
  migrateOrdersToD1();
  migrateCustomerManagerToD1();
  Logger.log('D1 CORE MIGRATION FINISHED');
}
