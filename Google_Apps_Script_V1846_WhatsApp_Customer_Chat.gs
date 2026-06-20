/************************************************************
 * TrendOS Operations - Google Apps Script Backend
 * نسخة كاملة موحدة V1846: أرقام أوردرات صغيرة بدون حروف + TrendOS + Matbagy Bridge + Pricing Fix:
 * 1) تسجيل الدخول
 * 2) عرض البنود في البرنامج
 * 3) إضافة الأوردر في شيت الأوردرات + بنود الأوردرات
 * 4) حفظ الحالة والملاحظات في الشيتين
 * 5) تربيط الحالة العامة وعدد البنود الجاهزة وغير الجاهزة
 * 6) مساعد واتساب لكل المستخدمين: رد حالة + رسالة انتهاء + تسجيل الإرسال
 * 7) رسالة تسجيل أوردر تلقائية بعد الإضافة + تاريخ تسليم متوقع
 * 8) إصلاح أرقام العملاء وحفظ الصفر في بداية الرقم
 * 9) قراءة معرفة واتس AI من عمود المفتاح + قوالب واتساب من الشيت
 * 10) متابعة كل قسم: شغل اليوم، المتأخر، تم التسليم اليوم، الجاهز، العاجل والعادي
 * 11) أرقام الأوردرات الجديدة أرقام قصيرة فقط بدون حروف لتسهيل كتابتها للعميل
 ************************************************************/

const SHEET_NAME_USERS = "المستخدمين";
const SHEET_NAME_LINES = "بنود الأوردرات";
const SHEET_NAME_ORDERS = "الأوردرات";
const SHEET_NAME_CUSTOMERS = "العملاء";
const SHEET_NAME_ACTIVITY = "سجل حركة الأوردرات";
const SHEET_NAME_AI_KNOWLEDGE = "معرفة واتس AI";
const SHEET_NAME_AI_SETTINGS = "إعدادات واتس AI";
const SHEET_NAME_AI_LOG = "سجل واتس AI";
const SHEET_NAME_INVOICE_PRICING = "بنود تسعير الفاتورة";
const DEFAULT_PASSWORD = "0000";

// اتركه فاضي لو السكريبت مربوط بنفس الشيت.
// لو السكريبت Standalone حط ID الشيت بين علامتي التنصيص.
const SPREADSHEET_ID = "";

function doGet(e) {
  e = e || { parameter: {} };
  const action = normalize_(e.parameter.action);
  const callback = normalize_(e.parameter.callback);

  let result;

  try {
    if (!action && cleanPhone_(e.parameter.phone || e.parameter.customerPhone || e.parameter.code)) {
      result = mbActivate_(e);
    } else if (!action) {
      result = {
        success: false,
        message: "Action غير معروف. افتح رابط البرنامج من GitHub Pages، ورابط Apps Script يستخدم كـ API فقط."
      };
    } else if (action === "activate" || action === "checkActivation" || action === "activation" || action === "activateClient" || action === "clientActivate" || action === "loginClient") result = mbActivate_(e);
    else if (action === "checkSession" || action === "clientSession") result = mbCheckSession_(e);
    else if (action === "createOrder" || action === "createMatbagyOrder" || action === "clientCreateOrder") result = mbCreateOrder_(e);
    else if (action === "getOrderStatus" || action === "orderStatus" || action === "clientOrderStatus") result = mbGetOrderStatus_(e);
    else if (action === "ping") result = healthCheck_();
    else if (action === "health") result = healthCheck_();
    else if (action === "login") result = login_(e);
    else if (action === "customerLogin") result = customerLogin_(e);
    else if (action === "getCustomerOrders") result = getCustomerOrders_(e);
    else if (action === "createCustomerDraft") result = createCustomerDraft_(e);
    else if (action === "addCustomerDraftItem") result = addCustomerDraftItem_(e);
    else if (action === "submitCustomerDraft") result = submitCustomerDraft_(e);
    else if (action === "getOrderConversation") result = getOrderConversation_(e);
    else if (action === "sendOrderConversationMessage") result = sendOrderConversationMessage_(e);
    else if (action === "initOrderConversations") result = initOrderConversationsNow();
    else if (action === "initCustomerDrafts") result = initCustomerDraftsNow();
    else if (action === "createCustomerPortalOrder") result = createCustomerPortalOrder_(e);
    else if (action === "changeCustomerPassword") result = changeCustomerPassword_(e);
    else if (action === "initCustomerPortal") result = initCustomerPortalNow();
    else if (action === "getRows") result = getRows_(e);
    else if (action === "getUrgentNotifications") result = getUrgentNotifications_(e);
    else if (action === "getDashboard") result = getDashboard_(e);
    else if (action === "getActivityLog") result = getActivityLog_(e);
    else if (action === "initKnowledge" || action === "initAiKnowledge") result = initAiKnowledgeNow();
    else if (action === "getKnowledge") result = getKnowledge_(e);
    else if (action === "getAiKnowledge" || action === "getKnowledgePublic") result = getAiKnowledge_(e);
    else if (action === "getAiSettings") result = getAiSettings_(e);
    else if (action === "renderAiTemplate") result = renderAiTemplate_(e);
    else if (action === "saveKnowledge") result = saveKnowledge_(e);
    else if (action === "getKnowledgeContext") result = getKnowledgeContext_(e);
    else if (action === "updateLine") result = updateLine_(e);
    else if (action === "createInvoiceLine") result = createInvoiceLine_(e);
    else if (action === "markCustomerNotified") result = markCustomerNotified_(e);
    else if (action === "changePassword") result = changePassword_(e);
    else if (action === "createManualOrder") result = createManualOrder_(e);
    else if (action === "searchCustomers") result = searchCustomers_(e);
    else if (action === "createCustomer") result = createCustomer_(e);
    else if (action === "syncAll") result = syncTrendOSNow();
    else if (action === "cleanStart") result = cleanStartKeepCustomersNow();
    else if (action === "fixPhones") result = fixPhoneColumnsNow();
    else if (action === "fillMissingPhones") result = fillMissingOrderPhonesNow();
    else if (action === "fixDebtColumns") result = fixDebtColumnsNow();
    else if (action === "debugCustomerDebt") result = debugCustomerDebt_(e);
    else result = { success: false, message: "Action غير معروف." };
  } catch (err) {
    result = {
      success: false,
      message: "خطأ في السيرفر: " + (err && err.message ? err.message : err)
    };
  }

  return output_(result, callback);
}

function doPost(e) {
  e = e || { parameter: {}, postData: null };
  let payload = {};
  try {
    if (e.postData && e.postData.contents) payload = JSON.parse(e.postData.contents);
  } catch (err) {
    payload = {};
  }
  const action = normalize_(payload.action || (e.parameter && e.parameter.action));
  let result;
  try {
    if (action === "uploadCustomerDraftFile") result = uploadCustomerDraftFile_(payload);
    else if (action === "uploadOrderConversationFile") result = uploadOrderConversationFile_(payload);
    else result = { success: false, message: "Action POST غير معروف." };
  } catch (err) {
    result = { success: false, message: "خطأ في رفع الملفات: " + (err && err.message ? err.message : err) };
  }
  return output_(result, "");
}

function ss_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("لا يمكن فتح الشيت. اربط السكريبت بالشيت أو ضع SPREADSHEET_ID.");
  return ss;
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function normalize_(v) {
  return String(v === null || v === undefined ? "" : v).trim();
}

function normalizeKey_(v) {
  return normalize_(v).replace(/\s+/g, " ");
}

function searchKey_(v) {
  return normalize_(v)
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ةه]/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function headersMap_(sheet) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach(function (h, i) {
    const key = normalizeKey_(h);
    if (key) map[key] = i + 1;
  });
  return map;
}

function firstCol_(h, names, fallback) {
  for (let i = 0; i < names.length; i++) {
    const name = normalizeKey_(names[i]);
    if (h[name]) return h[name];
  }
  return fallback || 0;
}

function ensureHeader_(sheet, headerName) {
  let h = headersMap_(sheet);
  if (!h[headerName]) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(headerName);
    SpreadsheetApp.flush();
    h = headersMap_(sheet);
  }
  return h[headerName];
}

function safeSet_(sheet, row, col, value) {
  if (sheet && row > 0 && col > 0) sheet.getRange(row, col).setValue(value);
}

function valueAt_(row, col) {
  if (!col) return "";
  return row[col - 1];
}

function isSheetErrorValue_(value) {
  const s = String(value == null ? "" : value).trim().toUpperCase();
  return s.indexOf("#ERROR") !== -1 ||
    s.indexOf("#VALUE") !== -1 ||
    s.indexOf("#REF") !== -1 ||
    s.indexOf("#N/A") !== -1 ||
    s.indexOf("#DIV/0") !== -1 ||
    s.indexOf("#NAME") !== -1 ||
    s.indexOf("#NUM") !== -1;
}

function cleanText_(value) {
  if (value instanceof Date) return value;
  if (isSheetErrorValue_(value)) return "";
  return normalize_(value);
}

function arabicDigitsToEnglish_(value) {
  const map = { "٠":"0", "١":"1", "٢":"2", "٣":"3", "٤":"4", "٥":"5", "٦":"6", "٧":"7", "٨":"8", "٩":"9" };
  return normalize_(value).replace(/[٠-٩]/g, function (d) { return map[d] || d; });
}

function isPhoneHeader_(key) {
  const k = normalizeKey_(key).toLowerCase();
  return k.indexOf("رقم العميل") !== -1 ||
    k.indexOf("رقم الهاتف") !== -1 ||
    k.indexOf("رقم إضاف") !== -1 ||
    k.indexOf("phone") !== -1;
}

function cleanPhone_(value) {
  let s = arabicDigitsToEnglish_(value);
  if (!s || isSheetErrorValue_(s)) return "";

  // نحفظ أرقام العملاء كأرقام فقط، ونرجع صفر الموبايل المصري لو Google Sheet شاله.
  let digits = s.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // 00201xxxxxxxxx -> 01xxxxxxxxx
  if (digits.indexOf("0020") === 0 && digits.length >= 14) digits = "0" + digits.slice(4);
  // 201xxxxxxxxx -> 01xxxxxxxxx
  else if (digits.indexOf("20") === 0 && digits.length === 12) digits = "0" + digits.slice(2);
  // 1xxxxxxxxx -> 01xxxxxxxxx
  else if (digits.length === 10 && digits.charAt(0) === "1") digits = "0" + digits;

  return digits;
}

function phoneColumns_(sheet) {
  const h = headersMap_(sheet);
  const cols = [];
  Object.keys(h).forEach(function (key) {
    if (isPhoneHeader_(key)) cols.push(h[key]);
  });
  return cols.filter(function (c, i, arr) { return c && arr.indexOf(c) === i; });
}

function setPhoneColumnsAsText_(sheet, rowNumber) {
  if (!sheet) return;
  const cols = phoneColumns_(sheet);
  cols.forEach(function (col) {
    const row = rowNumber || 2;
    const numRows = rowNumber ? 1 : Math.max(1, sheet.getMaxRows() - 1);
    sheet.getRange(row, col, numRows, 1).setNumberFormat("@");
  });
}

function dateText_(value) {
  if (!value || isSheetErrorValue_(value)) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return formatDateAr_(value);
  }
  const s = normalize_(value);
  if (!s) return "";
  const d = new Date(s);
  if (!isNaN(d.getTime())) return formatDateAr_(d);
  return s;
}

function isReadyStatus_(status) {
  const s = normalize_(status);
  return s === "تم التنفيذ" || s === "جاهز للاستلام" || s === "تم التسليم";
}

function isHiddenFromUserScreens_(status) {
  const s = normalize_(status);
  return s === "جاهز للاستلام" || s === "تم التسليم" || s === "مكرر" || s === "تم التنفيذ" || s === "جاهز للطباعة";
}

function isHeatPressFlag_(value) {
  const s = normalize_(value).toLowerCase();
  return s === "نعم" || s === "true" || s === "1" || s === "on" || s === "مكبس" || s === "yes";
}

function priorityRank_(priority) {
  const p = normalize_(priority) || "عادي";
  if (p === "عاجل" || p === "VIP") return 0;
  if (p === "عادي") return 1;
  if (p === "مؤجل") return 2;
  return 9;
}

function isStoppedStatus_(status) {
  const s = normalize_(status);
  return s === "مشكلة" || s === "متوقف";
}

function parseDateValue_(value) {
  if (!value || isSheetErrorValue_(value)) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) return new Date(value.getTime());
  const s0 = normalize_(value);
  if (!s0) return null;
  const m = s0.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s0);
  return isNaN(d.getTime()) ? null : d;
}

function startOfToday_() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOverdueStatus_(status) {
  const s = normalize_(status);
  return !isHiddenFromUserScreens_(s) && !isReadyStatus_(s) && !isStoppedStatus_(s);
}

function isOverdueByExpected_(status, expectedDate) {
  if (!isOverdueStatus_(status)) return false;
  const d = parseDateValue_(expectedDate);
  if (!d) return false;
  d.setHours(0, 0, 0, 0);
  return d < startOfToday_();
}


function addDays_(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateAr_(date) {
  if (!date) return "";
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(date), tz, "yyyy/MM/dd");
}

function expectedDeliveryDate_(createdAt) {
  // سياسة ترند مول: نستلم يوم، نشتغل اليوم التالي، والعميل يستلم اليوم الثالث.
  return addDays_(new Date(createdAt), 2);
}

function expectedDeliveryText_(createdAt) {
  return formatDateAr_(expectedDeliveryDate_(createdAt));
}

function healthCheck_() {
  const ss = ss_();
  const users = ss.getSheetByName(SHEET_NAME_USERS);
  const orders = ss.getSheetByName(SHEET_NAME_ORDERS);
  const lines = ss.getSheetByName(SHEET_NAME_LINES);

  return {
    success: true,
    spreadsheet: ss.getName(),
    hasUsers: !!users,
    hasOrders: !!orders,
    hasLines: !!lines,
    ordersRows: orders ? orders.getLastRow() : 0,
    linesRows: lines ? lines.getLastRow() : 0,
    sheets: ss.getSheets().map(function (s) { return s.getName(); })
  };
}

/*********************** المستخدمين والدخول ***********************/

function ensureUsersSetup_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
  if (!sheet) throw new Error("شيت المستخدمين غير موجود.");
  ensureHeader_(sheet, "Token");
  ensureHeader_(sheet, "آخر دخول");
}

function findUser_(username) {
  ensureUsersSetup_();

  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);

  const colName = firstCol_(h, ["اسم المستخدم", "Username"], 1);
  const colDept = firstCol_(h, ["القسم", "Department"], 0);
  const colRole = firstCol_(h, ["الصلاحية", "Role"], 0);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0);
  const colPassword = firstCol_(h, ["كلمة المرور", "Password"], 0);
  const colMustChange = firstCol_(h, ["يجب تغيير كلمة المرور؟", "Must Change Password"], 0);
  const colToken = firstCol_(h, ["Token"], 0);
  const colLastLogin = firstCol_(h, ["آخر دخول", "Last Login"], 0);

  if (!colName) throw new Error('عمود "اسم المستخدم" غير موجود في شيت المستخدمين.');
  if (!colPassword) throw new Error('عمود "كلمة المرور" غير موجود في شيت المستخدمين.');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = normalize_(row[colName - 1]);
    if (name === normalize_(username)) {
      return {
        sheet: sheet,
        rowNumber: i + 1,
        username: name,
        department: colDept ? normalize_(row[colDept - 1]) : "",
        role: colRole ? normalize_(row[colRole - 1]) : "",
        active: colActive ? normalize_(row[colActive - 1]) : "نعم",
        password: normalize_(row[colPassword - 1]) || DEFAULT_PASSWORD,
        mustChange: colMustChange ? normalize_(row[colMustChange - 1]) : "",
        token: colToken ? normalize_(row[colToken - 1]) : "",
        colPassword: colPassword,
        colToken: colToken,
        colLastLogin: colLastLogin
      };
    }
  }
  return null;
}

function roleFromArabic_(role, department) {
  const r = normalize_(role).toLowerCase();
  const d = normalize_(department).toLowerCase();

  if (r.indexOf("مدير") !== -1 || r === "admin") return "admin";
  if (d.indexOf("طباعة") !== -1 || r.indexOf("طباعة") !== -1 || r === "print") return "print";
  if (d.indexOf("ليزر") !== -1 || r.indexOf("ليزر") !== -1 || r === "laser") return "laser";
  if (d.indexOf("مكبس") !== -1 || r.indexOf("مكبس") !== -1 || r === "press") return "press";
  if (r.indexOf("خدمة") !== -1 || d.indexOf("خدمة") !== -1 || r === "service") return "service";
  return "service";
}

function login_(e) {
  const username = normalize_(e.parameter.username);
  const password = normalize_(e.parameter.password);

  if (!username || !password) return { success: false, message: "اكتب اسم المستخدم وكلمة المرور." };

  const user = findUser_(username);
  if (!user) return { success: false, message: "المستخدم غير موجود." };
  if (user.active && user.active !== "نعم") return { success: false, message: "هذا المستخدم غير مفعل." };
  if (user.password !== password) return { success: false, message: "كلمة المرور غير صحيحة." };

  const token = Utilities.getUuid();
  safeSet_(user.sheet, user.rowNumber, user.colToken, token);
  safeSet_(user.sheet, user.rowNumber, user.colLastLogin, new Date());
  SpreadsheetApp.flush();

  return {
    success: true,
    user: {
      username: user.username,
      name: user.username,
      department: user.department,
      role: roleFromArabic_(user.role, user.department),
      mustChange: user.mustChange === "نعم" || user.password === DEFAULT_PASSWORD,
      token: token
    }
  };
}

function authorize_(username, token) {
  const user = findUser_(normalize_(username));
  if (!user) return { ok: false, message: "المستخدم غير موجود." };
  if (user.active && user.active !== "نعم") return { ok: false, message: "المستخدم غير مفعل." };
  if (!token || user.token !== normalize_(token)) return { ok: false, message: "انتهت الجلسة. سجل الدخول مرة أخرى." };
  return { ok: true, user: user };
}

function changePassword_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const oldPassword = normalize_(e.parameter.oldPassword);
  const newPassword = normalize_(e.parameter.newPassword);

  if (!oldPassword || !newPassword) return { success: false, message: "اكتب كلمة المرور القديمة والجديدة." };
  if (newPassword.length < 4) return { success: false, message: "كلمة المرور الجديدة لا تقل عن 4 أرقام/حروف." };
  if (auth.user.password !== oldPassword) return { success: false, message: "كلمة المرور القديمة غير صحيحة." };

  safeSet_(auth.user.sheet, auth.user.rowNumber, auth.user.colPassword, newPassword);
  const h = headersMap_(auth.user.sheet);
  if (h["يجب تغيير كلمة المرور؟"]) safeSet_(auth.user.sheet, auth.user.rowNumber, h["يجب تغيير كلمة المرور؟"], "لا");
  SpreadsheetApp.flush();

  return { success: true, message: "تم تغيير كلمة المرور." };
}

/*********************** العملاء ***********************/

function searchCustomers_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const q = searchKey_(e.parameter.q);
  if (!q) return { success: true, customers: [] };

  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet) return { success: false, message: "شيت العملاء غير موجود." };

  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);

  const colName = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1);
  const colManager = firstCol_(h, ["اسم المسؤول", "المسؤول", "Manager"], 2);
  const colPhone = firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3);
  const colExtra = firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4);
  const colType = firstCol_(h, ["نوع العميل", "Customer Type"], 5);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0);

  const out = [];
  const seen = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (colActive && normalize_(row[colActive - 1]) && normalize_(row[colActive - 1]) !== "نعم") continue;

    const name = normalize_(row[colName - 1]);
    const manager = colManager ? normalize_(row[colManager - 1]) : "";
    const phone = colPhone ? cleanPhone_(row[colPhone - 1]) : "";
    const extra = colExtra ? cleanPhone_(row[colExtra - 1]) : "";
    const type = colType ? normalize_(row[colType - 1]) : "";

    const blob = searchKey_([name, manager, phone, extra, type].join(" "));
    if (blob.indexOf(q) !== -1) {
      const key = name + "|" + phone;
      if (!seen[key]) {
        seen[key] = true;
        out.push({ name: name, manager: manager, phone: phone || extra, extraPhone: extra, type: type });
      }
    }
    if (out.length >= 12) break;
  }

  return { success: true, customers: out };
}


function customerCols_(sheet) {
  const h = headersMap_(sheet);
  return {
    name: firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1),
    manager: firstCol_(h, ["اسم المسؤول", "المسؤول", "Manager"], 2),
    phone: firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3),
    extra: firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4),
    type: firstCol_(h, ["نوع العميل", "Customer Type"], 5),
    active: firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0)
  };
}

function buildCustomerPhoneMap_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;

  setPhoneColumnsAsText_(sheet);

  const data = sheet.getDataRange().getValues();
  const c = customerCols_(sheet);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const active = c.active ? normalize_(row[c.active - 1]) : "نعم";
    if (active && active !== "نعم") continue;

    const name = normalize_(row[c.name - 1]);
    if (!name) continue;

    const phone = c.phone ? cleanPhone_(row[c.phone - 1]) : "";
    const extraPhone = c.extra ? cleanPhone_(row[c.extra - 1]) : "";
    const manager = c.manager ? normalize_(row[c.manager - 1]) : "";
    const type = c.type ? normalize_(row[c.type - 1]) : "";
    const key = searchKey_(name);

    if (!map[key] || (!map[key].phone && (phone || extraPhone))) {
      map[key] = {
        name: name,
        phone: phone || extraPhone,
        extraPhone: extraPhone,
        manager: manager,
        type: type
      };
    }
  }

  return map;
}

function findCustomerInfoByName_(customerName) {
  const nameKey = searchKey_(customerName);
  if (!nameKey) return { name: "", phone: "", extraPhone: "", manager: "", type: "" };

  const map = buildCustomerPhoneMap_();
  if (map[nameKey]) return map[nameKey];

  // لو الاسم في الأوردر مختلف بسيط عن الاسم في العملاء، نعمل بحث احتياطي يحتوي الاسم.
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(nameKey) !== -1 || nameKey.indexOf(keys[i]) !== -1) {
      return map[keys[i]];
    }
  }

  return { name: normalize_(customerName), phone: "", extraPhone: "", manager: "", type: "" };
}


function canCreateCustomer_(user) {
  const role = roleFromArabic_(user.role, user.department);
  const username = searchKey_(user.username || "");
  return role === "admin" || role === "service" || username === "ضياء" || username === "رحمه";
}

function createCustomer_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canCreateCustomer_(auth.user)) return { success: false, message: "ليس لديك صلاحية إضافة عميل." };

  const customerName = normalize_(e.parameter.customerName || e.parameter.name);
  const manager = normalize_(e.parameter.manager) || auth.user.username;
  const phone = cleanPhone_(e.parameter.phone || e.parameter.customerPhone);
  const extraPhone = cleanPhone_(e.parameter.extraPhone || e.parameter.customerExtraPhone);
  const customerType = normalize_(e.parameter.customerType || e.parameter.type);
  const active = normalize_(e.parameter.active) || "نعم";
  const notes = normalize_(e.parameter.notes);

  if (!customerName) return { success: false, message: "اسم الشات / العميل مطلوب." };

  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet) return { success: false, message: "شيت العملاء غير موجود." };

  // تأكد من وجود الأعمدة الاختيارية بدون المساس بالعملاء الحاليين
  ensureHeaderIfAnyMissing_(sheet, ["اسم الشات / المكتب", "اسم المسؤول", "رقم العميل الأساسي", "رقم إضافي", "نوع العميل", "مفعل؟", "ملاحظات", "تاريخ الإضافة", "آخر تحديث"]);

  const h = headersMap_(sheet);
  const colName = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1);
  const colPhone = firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3);
  const colExtra = firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0);

  const data = sheet.getDataRange().getValues();
  const nameKey = searchKey_(customerName);
  const phoneKey = searchKey_(phone);
  const extraKey = searchKey_(extraPhone);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingName = searchKey_(valueAt_(row, colName));
    const existingPhone = searchKey_(valueAt_(row, colPhone));
    const existingExtra = searchKey_(valueAt_(row, colExtra));
    const existingActive = colActive ? normalize_(valueAt_(row, colActive)) : "نعم";

    if (existingName && existingName === nameKey) {
      return { success: false, message: "العميل موجود بالفعل بنفس الاسم في شيت العملاء." };
    }
    if (phoneKey && (phoneKey === existingPhone || phoneKey === existingExtra)) {
      return { success: false, message: "رقم العميل موجود بالفعل في شيت العملاء." };
    }
    if (extraKey && (extraKey === existingPhone || extraKey === existingExtra)) {
      return { success: false, message: "الرقم الإضافي موجود بالفعل في شيت العملاء." };
    }
  }

  const now = new Date();
  appendByHeaders_(sheet, {
    "اسم الشات / المكتب": customerName,
    "اسم العميل": customerName,
    "اسم المسؤول": manager,
    "رقم العميل الأساسي": phone,
    "رقم العميل": phone,
    "رقم الهاتف": phone,
    "رقم إضافي": extraPhone,
    "رقم إضافى": extraPhone,
    "نوع العميل": customerType,
    "مفعل؟": active,
    "مفعل": active,
    "ملاحظات": notes,
    "تاريخ الإضافة": now,
    "آخر تحديث": now
  });

  SpreadsheetApp.flush();

  return {
    success: true,
    message: "تم إضافة العميل في شيت العملاء.",
    customer: {
      name: customerName,
      manager: manager,
      phone: phone,
      extraPhone: extraPhone,
      type: customerType,
      active: active
    }
  };
}

function ensureHeaderIfAnyMissing_(sheet, headers) {
  headers.forEach(function(headerName) {
    ensureHeader_(sheet, headerName);
  });
}


/*********************** متابعة اليوم وسجل الحركة ***********************/

function ensureActivityLogSheet_() {
  const sheet = mbEnsureSheet_(SHEET_NAME_ACTIVITY, [
    "الوقت",
    "رقم الأوردر",
    "رقم البند",
    "اسم العميل",
    "القسم",
    "الإجراء",
    "من حالة",
    "إلى حالة",
    "ملاحظات قديمة",
    "ملاحظات جديدة",
    "بواسطة",
    "تفاصيل"
  ]);
  return sheet;
}

function appendActivityLog_(info) {
  try {
    const sheet = ensureActivityLogSheet_();
    appendByHeaders_(sheet, {
      "الوقت": info.time || new Date(),
      "رقم الأوردر": info.orderId || "",
      "رقم البند": info.lineId || "",
      "اسم العميل": info.customer || "",
      "القسم": info.department || "",
      "الإجراء": info.action || "تعديل",
      "من حالة": info.oldStatus || "",
      "إلى حالة": info.newStatus || "",
      "ملاحظات قديمة": info.oldNotes || "",
      "ملاحظات جديدة": info.newNotes || "",
      "بواسطة": info.by || "",
      "تفاصيل": info.details || ""
    });
  } catch (err) {
    Logger.log("appendActivityLog_ Error: " + (err && err.message ? err.message : err));
  }
}

function getActivityLog_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const sheet = ss_().getSheetByName(SHEET_NAME_ACTIVITY);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, rows: [] };

  const limit = Math.min(Number(e.parameter.limit || 50) || 50, 200);
  const lastRow = sheet.getLastRow();
  const start = Math.max(2, lastRow - limit + 1);
  const data = sheet.getRange(start, 1, lastRow - start + 1, sheet.getLastColumn()).getValues();
  const h = headersMap_(sheet);

  const rows = data.map(function(row) {
    return {
      time: dateText_(valueAt_(row, firstCol_(h, ["الوقت"], 1))) || valueAt_(row, firstCol_(h, ["الوقت"], 1)),
      orderId: normalize_(valueAt_(row, firstCol_(h, ["رقم الأوردر"], 2))),
      lineId: normalize_(valueAt_(row, firstCol_(h, ["رقم البند"], 3))),
      customer: normalize_(valueAt_(row, firstCol_(h, ["اسم العميل"], 4))),
      department: normalize_(valueAt_(row, firstCol_(h, ["القسم"], 5))),
      action: normalize_(valueAt_(row, firstCol_(h, ["الإجراء"], 6))),
      oldStatus: normalize_(valueAt_(row, firstCol_(h, ["من حالة"], 7))),
      newStatus: normalize_(valueAt_(row, firstCol_(h, ["إلى حالة"], 8))),
      by: normalize_(valueAt_(row, firstCol_(h, ["بواسطة"], 11))),
      details: normalize_(valueAt_(row, firstCol_(h, ["تفاصيل"], 12)))
    };
  }).reverse();

  return { success: true, rows: rows };
}

function getDashboard_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen || "service");
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  if (lines.getLastRow() < 2) return { success: true, dashboard: emptyDashboard_(screen) };

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);

  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colReceivedAt = firstCol_(h, ["تاريخ الاستلام", "تاريخ الإنشاء", "Received At"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colPress = firstCol_(h, ["مكبس", "مكبس حراري", "مكبس؟", "Press", "Heat Press"], 0);

  const dashboard = emptyDashboard_(screen);
  const today = startOfToday_();
  const yesterday = addDays_(today, -1);
  const tomorrow = addDays_(today, 1);
  const todayWorkOrderSet = {};
  const activeOrderSet = {};
  const deliveredTodayOrderSet = {};
  const readyOrderSet = {};
  const overdueOrderSet = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    const status = normalize_(valueAt_(row, colStatus)) || "طلب جديد";
    const priority = normalize_(valueAt_(row, colPriority)) || "عادي";
    const dept = normalize_(valueAt_(row, colDept)) || "غير محدد";
    const press = isHeatPressFlag_(valueAt_(row, colPress));
    const qty = Number(valueAt_(row, colQty)) || 1;
    const expectedRaw = valueAt_(row, colExpectedAt) || valueAt_(row, colExpectedText);
    const receivedRaw = valueAt_(row, colReceivedAt);
    const updatedRaw = valueAt_(row, colUpdated);

    if (!orderId && !dept) continue;
    if (!dashboardMatchesScreen_(screen, dept, press)) continue;

    const received = parseDateValue_(receivedRaw);
    let expected = parseDateValue_(expectedRaw);
    if (!expected && received) expected = addDays_(received, 2);
    const updated = parseDateValue_(updatedRaw);

    if (status === "تم التسليم") {
      dashboard.delivered++;
      if (isSameDay_(updated, today)) {
        dashboard.deliveredToday++;
        if (orderId) deliveredTodayOrderSet[orderId] = true;
      }
    }
    if (status === "جاهز للاستلام") {
      dashboard.readyForPickup++;
      if (orderId) readyOrderSet[orderId] = true;
    }
    if (status === "مكرر") dashboard.duplicate++;

    if (!isHiddenFromUserScreens_(status)) {
      dashboard.activeLines++;
      dashboard.activeSheets += qty;
      if (orderId) activeOrderSet[orderId] = true;

      if (priority === "عاجل" || priority === "VIP") dashboard.urgent++;
      else if (!priority || priority === "عادي") dashboard.normal++;
      else if (priority === "مؤجل") dashboard.delayedPriority++;

      dashboard.byDepartment[dept] = (dashboard.byDepartment[dept] || 0) + 1;
      if (press || dept === "مكبس") dashboard.heatPress++;
      if (status === "مشكلة" || status === "متوقف") dashboard.problems++;

      if (isOverdueByExpected_(status, expected || expectedRaw)) {
        dashboard.overdue++;
        if (orderId) overdueOrderSet[orderId] = true;
      }

      // شغل اليوم = مستلم امبارح + تسليمه بكرة، حسب قاعدة ترند مول:
      // يوم استلام، اليوم التالي تنفيذ، اليوم الثالث تسليم.
      if (isSameDay_(received, yesterday) && isSameDay_(expected, tomorrow)) {
        dashboard.todayWorkLines++;
        dashboard.todayWorkSheets += qty;
        if (orderId) todayWorkOrderSet[orderId] = true;
      }
    }
  }

  dashboard.todayWorkOrders = Object.keys(todayWorkOrderSet).length;
  dashboard.todayOrders = dashboard.todayWorkOrders;
  dashboard.activeOrders = Object.keys(activeOrderSet).length;
  dashboard.deliveredTodayOrders = Object.keys(deliveredTodayOrderSet).length;
  dashboard.readyOrders = Object.keys(readyOrderSet).length;
  dashboard.overdueOrders = Object.keys(overdueOrderSet).length;
  dashboard.updatedAt = formatDateAr_(new Date());
  return { success: true, dashboard: dashboard };
}

function emptyDashboard_(screen) {
  const nameMap = { service: "خدمة العملاء", print: "الطباعة", laser: "الليزر", press: "المكبس" };
  return {
    screen: screen || "service",
    departmentName: nameMap[screen] || "خدمة العملاء",
    todayOrders: 0,
    todayWorkOrders: 0,
    todayWorkLines: 0,
    todayWorkSheets: 0,
    activeOrders: 0,
    activeLines: 0,
    activeSheets: 0,
    urgent: 0,
    normal: 0,
    delayedPriority: 0,
    overdue: 0,
    overdueOrders: 0,
    problems: 0,
    readyForPickup: 0,
    readyOrders: 0,
    delivered: 0,
    deliveredToday: 0,
    deliveredTodayOrders: 0,
    duplicate: 0,
    heatPress: 0,
    byDepartment: { "طباعة": 0, "ليزر": 0, "مكبس": 0 }
  };
}

function dashboardMatchesScreen_(screen, department, heatPress) {
  screen = normalize_(screen || "service");
  department = normalize_(department);
  // V1846: الأقسام في بوابة العميل تُفصل كبنود طباعة/ليزر.
  // لو ظهر سطر قديم فيه "طباعة + ليزر" نعرضه في الشاشتين بدل ما يختفي من الليزر.
  if (screen === "print") return department === "طباعة" || department.indexOf("طباعة") !== -1;
  if (screen === "laser") return department === "ليزر" || department.indexOf("ليزر") !== -1;
  if (screen === "press") return !!heatPress;
  return true;
}

function isSameDay_(date, target) {
  if (!date || !target) return false;
  const a = new Date(date.getTime ? date.getTime() : date);
  const b = new Date(target.getTime ? target.getTime() : target);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a.getTime() === b.getTime();
}

/*********************** عرض البنود ***********************/

function getRows_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen);
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const rows = [];

  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 7);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colAssigned = firstCol_(h, ["مسؤول القسم", "Assigned To"], 9);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colReady = firstCol_(h, ["جاهز؟", "جاهز", "Ready"], 12);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"], 17);
  const colPress = firstCol_(h, ["مكبس", "مكبس حراري", "مكبس؟", "Press", "Heat Press"], 0);
  const colCustomerNotified = firstCol_(h, ["تم إبلاغ العميل؟"], 0);
  const colNotifyAt = firstCol_(h, ["وقت الإبلاغ"], 0);
  const colNotifyBy = firstCol_(h, ["تم الإبلاغ بواسطة"], 0);
  const colLastWaMessage = firstCol_(h, ["آخر رسالة واتساب"], 0);
  const colLastWaAt = firstCol_(h, ["آخر وقت واتساب"], 0);
  const colLastWaBy = firstCol_(h, ["آخر واتساب بواسطة"], 0);
  const colReceivedAt = firstCol_(h, ["تاريخ الاستلام", "تاريخ الإنشاء", "Received At"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colRegistrationSent = firstCol_(h, ["تم إرسال رسالة التسجيل؟"], 0);
  const customerPhoneMap = buildCustomerPhoneMap_();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const orderId = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    const lineId = normalize_(valueAt_(row, colLineId));
    const department = normalize_(valueAt_(row, colDept));
    const status = normalize_(valueAt_(row, colStatus));

    if (!orderId && !lineId) continue;

    if (screen === "print" && department !== "طباعة") continue;
    if (screen === "laser" && department !== "ليزر") continue;
    if (screen === "press" && department !== "مكبس" && normalize_(valueAt_(row, colPress)) !== "نعم") continue;

    // لا نخفي الصفوف هنا؛ الواجهة هي التي تخفيها افتراضيًا.
    // هذا يسمح بفلاتر محسوبة مثل "تسليمات اليوم" أن تظهر عند الطلب.

    const customerName = normalize_(valueAt_(row, colCustomer));
    let customerPhone = cleanPhone_(valueAt_(row, colPhone));
    const customerLookup = customerPhoneMap[searchKey_(customerName)] || {};
    if (!customerPhone && customerLookup.phone) {
      customerPhone = customerLookup.phone;
      if (colPhone) {
        try {
          lines.getRange(i + 1, colPhone).setNumberFormat("@").setValue(customerPhone);
        } catch (phoneWriteErr) {}
      }
    }

    rows.push({
      rowNumber: i + 1,
      orderId: orderId,
      orderCode: normalize_(valueAt_(row, colOrderCode)) || orderId,
      lineId: lineId,
      customer: customerName,
      customerPhone: customerPhone,
      department: department,
      itemName: normalize_(valueAt_(row, colItem)),
      qty: valueAt_(row, colQty) || 1,
      assignedTo: normalize_(valueAt_(row, colAssigned)),
      priority: normalize_(valueAt_(row, colPriority)) || "عادي",
      status: status || "طلب جديد",
      ready: normalize_(valueAt_(row, colReady)),
      heatPress: normalize_(valueAt_(row, colPress)),
      updatedAt: dateText_(valueAt_(row, colUpdated)) || valueAt_(row, colUpdated),
      notes: normalize_(valueAt_(row, colNotes)),
      customerNotified: normalize_(valueAt_(row, colCustomerNotified)),
      notifiedAt: dateText_(valueAt_(row, colNotifyAt)) || valueAt_(row, colNotifyAt),
      notifiedBy: normalize_(valueAt_(row, colNotifyBy)),
      lastWhatsAppMessage: normalize_(valueAt_(row, colLastWaMessage)),
      lastWhatsAppAt: dateText_(valueAt_(row, colLastWaAt)) || valueAt_(row, colLastWaAt),
      lastWhatsAppBy: normalize_(valueAt_(row, colLastWaBy)),
      receivedAt: dateText_(valueAt_(row, colReceivedAt)) || valueAt_(row, colReceivedAt),
      expectedDeliveryAt: dateText_(valueAt_(row, colExpectedAt)) || valueAt_(row, colExpectedAt),
      expectedDeliveryText: dateText_(valueAt_(row, colExpectedText)) || dateText_(valueAt_(row, colExpectedAt)),
      overdue: isOverdueByExpected_(status || "طلب جديد", valueAt_(row, colExpectedAt) || valueAt_(row, colExpectedText)) ? "نعم" : "لا",
      registrationSent: normalize_(valueAt_(row, colRegistrationSent))
    });
  }

  rows.sort(function (a, b) {
    const pa = priorityRank_(a.priority);
    const pb = priorityRank_(b.priority);
    if (pa !== pb) return pa - pb;
    return String(a.orderId).localeCompare(String(b.orderId));
  });

  return { success: true, rows: rows };
}


function ensureWhatsAppHeaders_(sheet) {
  ensureHeaderIfAnyMissing_(sheet, [
    "تم إبلاغ العميل؟",
    "وقت الإبلاغ",
    "تم الإبلاغ بواسطة",
    "آخر رسالة واتساب",
    "آخر وقت واتساب",
    "آخر واتساب بواسطة",
    "نوع رسالة واتساب",
    "تم إرسال رسالة التسجيل؟",
    "وقت رسالة التسجيل",
    "رسالة التسجيل بواسطة",
    "تاريخ الاستلام",
    "تاريخ التسليم المتوقع",
    "الوقت المتوقع",
    "مكبس حراري"
  ]);
}

function findLineTarget_(sheet, rowNumber, lineId, orderIdParam) {
  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);

  let targetRow = 0;
  let orderId = normalize_(orderIdParam);

  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) {
    targetRow = rowNumber;
    orderId = orderId || normalize_(sheet.getRange(targetRow, colOrderId).getValue()) || normalize_(sheet.getRange(targetRow, colOrderCode).getValue());
  }

  if (!targetRow && lineId) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalize_(valueAt_(data[i], colLineId)) === lineId) {
        targetRow = i + 1;
        orderId = orderId || normalize_(valueAt_(data[i], colOrderId)) || normalize_(valueAt_(data[i], colOrderCode));
        break;
      }
    }
  }

  if (!targetRow && orderId) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const oid = normalize_(valueAt_(data[i], colOrderId)) || normalize_(valueAt_(data[i], colOrderCode));
      if (oid === orderId) {
        targetRow = i + 1;
        break;
      }
    }
  }

  return { rowNumber: targetRow, orderId: orderId };
}

function markCustomerNotified_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const rowNumber = Number(e.parameter.rowNumber || 0);
  const lineId = normalize_(e.parameter.lineId);
  const orderIdParam = normalize_(e.parameter.orderId);
  const whatsappType = normalize_(e.parameter.whatsappType) || "status_reply";
  const message = normalize_(e.parameter.message);

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  const target = findLineTarget_(lines, rowNumber, lineId, orderIdParam);
  if (!target.rowNumber) return { success: false, message: "لم يتم العثور على البند لتسجيل الواتساب." };

  const h = headersMap_(lines);
  const now = new Date();
  const by = auth.user.username || normalize_(e.parameter.username);

  safeSet_(lines, target.rowNumber, h["آخر رسالة واتساب"], message);
  safeSet_(lines, target.rowNumber, h["آخر وقت واتساب"], now);
  safeSet_(lines, target.rowNumber, h["آخر واتساب بواسطة"], by);
  safeSet_(lines, target.rowNumber, h["نوع رسالة واتساب"], whatsappType);

  if (whatsappType === "ready_notify") {
    safeSet_(lines, target.rowNumber, h["تم إبلاغ العميل؟"], "نعم");
    safeSet_(lines, target.rowNumber, h["وقت الإبلاغ"], now);
    safeSet_(lines, target.rowNumber, h["تم الإبلاغ بواسطة"], by);
  }

  if (whatsappType === "order_registered") {
    safeSet_(lines, target.rowNumber, h["تم إرسال رسالة التسجيل؟"], "نعم");
    safeSet_(lines, target.rowNumber, h["وقت رسالة التسجيل"], now);
    safeSet_(lines, target.rowNumber, h["رسالة التسجيل بواسطة"], by);
  }

  if (target.orderId) syncWhatsAppToOrder_(target.orderId, whatsappType, message, now, by);

  try {
    const rowValues = lines.getRange(target.rowNumber, 1, 1, lines.getLastColumn()).getValues()[0];
    const h2 = headersMap_(lines);
    appendActivityLog_({
      time: now,
      orderId: target.orderId,
      lineId: normalize_(valueAt_(rowValues, firstCol_(h2, ["رقم البند", "Line ID"], 6))),
      customer: normalize_(valueAt_(rowValues, firstCol_(h2, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3))),
      department: normalize_(valueAt_(rowValues, firstCol_(h2, ["القسم", "Department"], 5))),
      action: "رسالة واتساب",
      oldStatus: "",
      newStatus: normalize_(valueAt_(rowValues, firstCol_(h2, ["الحالة", "Status"], 11))),
      by: by,
      details: whatsappType + " | " + message
    });
  } catch (logErr) {}

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم تسجيل رسالة الواتساب في الشيت.",
    orderId: target.orderId,
    rowNumber: target.rowNumber,
    whatsappType: whatsappType
  };
}

function syncWhatsAppToOrder_(orderId, whatsappType, message, now, by) {
  orderId = normalize_(orderId);
  if (!orderId) return;

  const ss = ss_();
  const orders = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!orders) return;

  ensureWhatsAppHeaders_(orders);

  const h = headersMap_(orders);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  let rowNumber = 0;

  const lastRow = orders.getLastRow();
  if (lastRow > 1) {
    const data = orders.getRange(2, 1, lastRow - 1, orders.getLastColumn()).getValues();
    for (let i = 0; i < data.length; i++) {
      const oid = normalize_(valueAt_(data[i], colOrderId)) || normalize_(valueAt_(data[i], colOrderCode));
      if (oid === orderId) {
        rowNumber = i + 2;
        break;
      }
    }
  }

  if (!rowNumber) {
    syncOrderFromLines_(orderId);
    return syncWhatsAppToOrder_(orderId, whatsappType, message, now, by);
  }

  const h2 = headersMap_(orders);
  safeSet_(orders, rowNumber, h2["آخر رسالة واتساب"], message);
  safeSet_(orders, rowNumber, h2["آخر وقت واتساب"], now);
  safeSet_(orders, rowNumber, h2["آخر واتساب بواسطة"], by);
  safeSet_(orders, rowNumber, h2["نوع رسالة واتساب"], whatsappType);

  if (whatsappType === "ready_notify") {
    safeSet_(orders, rowNumber, h2["تم إبلاغ العميل؟"], "نعم");
    safeSet_(orders, rowNumber, h2["وقت الإبلاغ"], now);
    safeSet_(orders, rowNumber, h2["تم الإبلاغ بواسطة"], by);
  }

  if (whatsappType === "order_registered") {
    safeSet_(orders, rowNumber, h2["تم إرسال رسالة التسجيل؟"], "نعم");
    safeSet_(orders, rowNumber, h2["وقت رسالة التسجيل"], now);
    safeSet_(orders, rowNumber, h2["رسالة التسجيل بواسطة"], by);
  }
}

/*********************** حفظ الحالة والتربيط ***********************/

function updateLine_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const rowNumber = Number(e.parameter.rowNumber || 0);
  const lineId = normalize_(e.parameter.lineId);
  const orderIdParam = normalize_(e.parameter.orderId);
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const notes = normalize_(e.parameter.notes);

  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!sheet) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colReady = firstCol_(h, ["جاهز؟", "جاهز", "Ready"], 12);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);

  if (!colStatus) return { success: false, message: 'عمود "الحالة" غير موجود في شيت بنود الأوردرات.' };
  if (!lineId && !rowNumber && !orderIdParam) return { success: false, message: "رقم البند أو رقم الصف ناقص." };

  let targetRow = 0;
  let orderId = orderIdParam;

  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) {
    targetRow = rowNumber;
    orderId = orderId || normalize_(sheet.getRange(targetRow, colOrderId).getValue());
  }

  if (!targetRow && lineId) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalize_(data[i][colLineId - 1]) === lineId) {
        targetRow = i + 1;
        orderId = orderId || normalize_(data[i][colOrderId - 1]);
        break;
      }
    }
  }

  if (!targetRow) return { success: false, message: "البند غير موجود في الشيت." };

  const oldStatus = colStatus ? normalize_(sheet.getRange(targetRow, colStatus).getValue()) : "";
  const oldNotes = colNotes ? normalize_(sheet.getRange(targetRow, colNotes).getValue()) : "";
  const rowValues = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);

  const now = new Date();
  safeSet_(sheet, targetRow, colStatus, status);
  if (colNotes) safeSet_(sheet, targetRow, colNotes, notes);
  if (colUpdated) safeSet_(sheet, targetRow, colUpdated, now);
  if (colReady) safeSet_(sheet, targetRow, colReady, isReadyStatus_(status) ? "نعم" : "لا");

  if (orderId) syncOrderFromLines_(orderId);

  if (oldStatus !== status || oldNotes !== notes) {
    appendActivityLog_({
      time: now,
      orderId: orderId,
      lineId: lineId || normalize_(sheet.getRange(targetRow, colLineId).getValue()),
      customer: normalize_(valueAt_(rowValues, colCustomer)),
      department: normalize_(valueAt_(rowValues, colDept)),
      action: "تعديل حالة / ملاحظات",
      oldStatus: oldStatus,
      newStatus: status,
      oldNotes: oldNotes,
      newNotes: notes,
      by: auth.user.username,
      details: "تم الحفظ من شاشة TrendOS"
    });
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم حفظ الحالة في الشيت.",
    rowNumber: targetRow,
    orderId: orderId,
    lineId: lineId,
    status: status
  };
}

function syncOrderFromLines_(orderId) {
  orderId = normalize_(orderId);
  if (!orderId) return;

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return;

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);

  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 7);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"], 17);
  const colReceivedAt = firstCol_(h, ["تاريخ الاستلام", "تاريخ الإنشاء", "Received At"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);

  const matched = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const oid = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    if (oid === orderId) matched.push(row);
  }
  if (!matched.length) return;

  let readyCount = 0;
  let stoppedCount = 0;
  let deliveredCount = 0;
  let duplicateCount = 0;
  let hasInProgress = false;
  let hasNew = false;

  matched.forEach(function (row) {
    const st = normalize_(valueAt_(row, colStatus));
    if (isReadyStatus_(st)) readyCount++;
    if (isStoppedStatus_(st)) stoppedCount++;
    if (st === "تم التسليم") deliveredCount++;
    if (st === "مكرر") duplicateCount++;
    if (st === "بدأ التنفيذ" || st === "تحت التنفيذ") hasInProgress = true;
    if (!st || st === "طلب جديد" || st === "جاهز للطباعة") hasNew = true;
  });

  const total = matched.length;
  const notReady = total - readyCount;
  let generalStatus = "طلب جديد";

  if (duplicateCount === total) generalStatus = "مكرر";
  else if (stoppedCount > 0) generalStatus = "مشكلة/متوقف";
  else if (deliveredCount === total) generalStatus = "تم التسليم";
  else if (readyCount === total) generalStatus = "جاهز للاستلام";
  else if (readyCount > 0) generalStatus = "تسليم جزئي";
  else if (hasInProgress) generalStatus = "تحت التنفيذ";
  else if (hasNew) generalStatus = "طلب جديد";

  const first = matched[0];
  const baseNow = new Date();
  const receivedAt = valueAt_(first, colReceivedAt) || baseNow;
  const expectedAt = valueAt_(first, colExpectedAt) || expectedDeliveryDate_(receivedAt);
  const expectedText = normalize_(valueAt_(first, colExpectedText)) || formatDateAr_(expectedAt);
  const summary = {
    orderId: orderId,
    now: receivedAt,
    customerName: normalize_(valueAt_(first, colCustomer)),
    customerPhone: cleanPhone_(valueAt_(first, colPhone)),
    customerType: "",
    department: normalize_(valueAt_(first, colDept)),
    itemName: normalize_(valueAt_(first, colItem)),
    qty: valueAt_(first, colQty) || 1,
    priority: normalize_(valueAt_(first, colPriority)) || "عادي",
    status: generalStatus,
    lineCount: total,
    readyCount: readyCount,
    notReadyCount: notReady,
    partial: readyCount > 0 && readyCount < total ? "نعم" : "لا",
    updatedAt: baseNow,
    receivedAt: receivedAt,
    expectedDeliveryAt: expectedAt,
    expectedDeliveryText: expectedText
  };

  upsertOrderSummary_(summary);
}

function upsertOrderSummary_(o) {
  const ss = ss_();
  const sheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!sheet) return;
  ensureWhatsAppHeaders_(sheet);
  ensurePressColumn_(sheet);
  ensureFlyPrintColumn_(sheet);

  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);

  let rowNumber = 0;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, Math.max(colOrderId, colOrderCode, 1)).getValues();
    for (let i = 0; i < ids.length; i++) {
      const row = ids[i];
      const oid = normalize_(colOrderId ? row[colOrderId - 1] : "") || normalize_(colOrderCode ? row[colOrderCode - 1] : "");
      if (oid === o.orderId) {
        rowNumber = i + 2;
        break;
      }
    }
  }

  const values = {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "تاريخ الإنشاء": o.now,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "اسم المسؤول": o.manager || "",
    "رقم العميل": cleanPhone_(o.customerPhone),
    "رقم العميل الخارجي": cleanPhone_(o.customerPhone),
    "نوع العميل": o.customerType,
    "القسم الرئيسي": o.department,
    "القسم": o.department,
    "وصف مختصر": o.itemName,
    "وصف الأوردر": o.itemName,
    "الأولوية": o.priority,
    "الحالة العامة": o.status,
    "الحالة": o.status,
    "آخر تحديث": o.updatedAt || o.now,
    "عدد البنود": o.lineCount || 1,
    "بنود جاهزة": o.readyCount || 0,
    "بنود غير جاهزة": o.notReadyCount === undefined ? 0 : o.notReadyCount,
    "تسليم جزئي؟": o.partial || "لا",
    "ملاحظات": o.notes || "",
    "تاريخ الاستلام": o.receivedAt || o.now,
    "تاريخ التسليم المتوقع": o.expectedDeliveryAt || expectedDeliveryDate_(o.now),
    "الوقت المتوقع": o.expectedDeliveryText || expectedDeliveryText_(o.now),
    "مكبس حراري": o.heatPress ? "نعم" : "لا",
    "تم إبلاغ العميل؟": o.customerNotified || "لا",
    "تم إرسال رسالة التسجيل؟": o.registrationSent || "لا",
    "كود الشات": o.customerCode || "",
    "مصدر الطلب": o.source || "داخلي",
    "أنشئ بواسطة": o.createdBy || "الموظف",
    "ملاحظات العميل": o.customerNotes || "",
    "فاصل واتساب": o.whatsappSeparator || "",
    "تأكيد فاصل واتساب": o.whatsappSeparatorStatus || "غير مطلوب"
  };

  if (rowNumber) updateByHeaders_(sheet, rowNumber, values, true);
  else appendByHeaders_(sheet, values);
}

/*********************** إضافة أوردر ***********************/

function canCreateOrder_(user) {
  const role = roleFromArabic_(user.role, user.department);
  return role === "admin" || role === "service";
}

function createManualOrder_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canCreateOrder_(auth.user)) return { success: false, message: "ليس لديك صلاحية إضافة أوردر." };

  const customerName = normalize_(e.parameter.customerName);
  const customerInfo = findCustomerInfoByName_(customerName);
  const customerPhone = cleanPhone_(e.parameter.customerPhone) || customerInfo.phone || customerInfo.extraPhone || "";
  const customerType = normalize_(e.parameter.customerType) || customerInfo.type || "";
  const department = normalize_(e.parameter.department);
  const heatPress = isHeatPressFlag_(e.parameter.heatPress || e.parameter.press || e.parameter.isPress);
  const flyPrint = department === "طباعة" && isFlyPrintFlag_(e.parameter.flyPrint || e.parameter.quickPrint || e.parameter.fastPrint || e.parameter["طباعة على الطاير"]);
  let itemName = normalize_(e.parameter.itemName);
  const qty = Number(e.parameter.qty || 1) || 1;
  const priority = flyPrint ? "عاجل" : (normalize_(e.parameter.priority) || "عادي");
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const assignedToParam = normalize_(e.parameter.assignedTo);
  const notes = normalize_(e.parameter.notes);

  if (!customerName || !department) return { success: false, message: "اسم الشات والقسم مطلوبين." };
  if (!itemName) itemName = "أوردر جديد - " + department;

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const now = new Date();
  const expectedDeliveryAt = flyPrint ? new Date(now) : expectedDeliveryDate_(now);
  const expectedDeliveryText = flyPrint ? (formatDateAr_(expectedDeliveryAt) + " - نفس اليوم") : formatDateAr_(expectedDeliveryAt);
  const orderId = makeOrderId_(lines, now);

  let departments = [];
  if (department === "متعدد الأقسام") {
    departments = [
      { department: "طباعة", assignedTo: "وائل", suffix: "طباعة" },
      { department: "ليزر", assignedTo: "جابر", suffix: "ليزر" }
    ];
  } else {
    departments = [
      { department: department, assignedTo: assignedToParam || defaultAssigned_(department), suffix: department }
    ];
  }

  const readyCount = isReadyStatus_(status) ? departments.length : 0;

  upsertOrderSummary_({
    orderId: orderId,
    now: now,
    customerName: customerName,
    customerPhone: customerPhone,
    customerType: customerType,
    department: department,
    itemName: itemName,
    qty: qty,
    priority: priority,
    status: status,
    lineCount: departments.length,
    readyCount: readyCount,
    notReadyCount: departments.length - readyCount,
    partial: readyCount > 0 && readyCount < departments.length ? "نعم" : "لا",
    notes: notes,
    receivedAt: now,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    heatPress: heatPress
  });

  departments.forEach(function (d, idx) {
    const lineNo = String(idx + 1).padStart(2, "0");
    const lineId = orderId + "-" + lineNo;
    appendLine_(ss, {
      orderId: orderId,
      lineId: lineId,
      now: now,
      customerName: customerName,
      customerPhone: customerPhone,
      customerType: customerType,
      department: d.department,
      itemName: departments.length > 1 ? (itemName + " - " + d.suffix) : itemName,
      qty: qty,
      priority: priority,
      status: status,
      assignedTo: d.assignedTo,
      notes: notes,
      receivedAt: now,
      expectedDeliveryAt: expectedDeliveryAt,
      expectedDeliveryText: expectedDeliveryText,
      heatPress: (d.department === "مكبس") || (heatPress && d.department === "طباعة")
    });
  });

  appendActivityLog_({
    time: now,
    orderId: orderId,
    lineId: orderId + "-01",
    customer: customerName,
    department: department,
    action: "تسجيل أوردر جديد",
    oldStatus: "",
    newStatus: status,
    oldNotes: "",
    newNotes: notes,
    by: auth.user.username,
    details: "عدد البنود: " + departments.length + " | الأولوية: " + priority + (heatPress ? " | مكبس حراري" : "")
  });

  SpreadsheetApp.flush();

  return {
    success: true,
    orderId: orderId,
    lineId: orderId + "-01",
    linesCreated: departments.length,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    message: "تم إضافة الأوردر في الشيتين."
  };
}

function defaultAssigned_(department) {
  if (department === "طباعة") return "وائل";
  if (department === "ليزر") return "جابر";
  if (department === "مكبس") return "المكبس";
  if (department === "متعدد الأقسام") return "وائل + جابر";
  return "";
}

/************************************************************
 * SIMPLE NUMERIC ORDER ID - V1838
 * من الآن رقم الأوردر الجديد يكون رقمًا صغيرًا بدون حروف.
 * مثال: 1001 ثم 1002.
 * لا يغير أرقام الأوردرات القديمة مثل TM2606...، ويمنع التكرار بالقفل.
 ************************************************************/
function makeOrderId_(sheet, now) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const props = PropertiesService.getScriptProperties();
    const key = "TRENDOS_NEXT_SIMPLE_ORDER_NO";

    let next = Number(props.getProperty(key) || 0);
    if (!next || next < 1) {
      next = getNextSimpleOrderNumber_(sheet);
    }

    const orderId = String(next);
    props.setProperty(key, String(next + 1));
    return orderId;
  } finally {
    lock.releaseLock();
  }
}

function getNextSimpleOrderNumber_(fallbackSheet) {
  const ss = ss_();
  let maxNo = 1000; // أول رقم جديد سيكون 1001، رقم صغير وسهل للعميل

  [SHEET_NAME_LINES, SHEET_NAME_ORDERS].forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName) || fallbackSheet;
    if (!sheet || sheet.getLastRow() < 2) return;

    const h = headersMap_(sheet);
    const orderCols = [
      h["رقم الأوردر"],
      h["كود الأوردر"],
      h["Order ID"],
      h["orderId"]
    ].filter(Boolean);

    if (!orderCols.length) return;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
    data.forEach(function(row) {
      orderCols.forEach(function(col) {
        const raw = String(row[col - 1] || "").trim();
        // نحسب الأرقام البسيطة فقط، ولا نحسب أكواد TM القديمة
        if (/^\d{1,7}$/.test(raw)) {
          const n = Number(raw);
          if (n > maxNo) maxNo = n;
        }
      });
    });
  });

  return maxNo + 1;
}

function resetSimpleOrderCounterNow(startFrom) {
  const n = Number(startFrom || 1001);
  PropertiesService.getScriptProperties().setProperty("TRENDOS_NEXT_SIMPLE_ORDER_NO", String(n));
  return { success: true, nextOrderNumber: n, message: "تم ضبط أول رقم أوردر جديد على: " + n };
}

function appendLine_(ss, o) {
  const sheet = ss.getSheetByName(SHEET_NAME_LINES);
  if (!sheet) return;

  const ready = isReadyStatus_(o.status) ? "نعم" : "لا";

  appendByHeaders_(sheet, {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "رقم العميل": cleanPhone_(o.customerPhone),
    "رقم العميل الخارجي": cleanPhone_(o.customerPhone),
    "نوع العميل": o.customerType,
    "القسم الرئيسي": o.department,
    "القسم الرئيسي": o.department,
    "القسم": o.department,
    "رقم البند": o.lineId,
    "Line ID": o.lineId,
    "اسم البند / نوع الشغل": o.itemName,
    "اسم البند": o.itemName,
    "الكمية": o.qty,
    "مسؤول القسم": o.assignedTo,
    "الأولوية": o.priority,
    "الحالة": o.status,
    "جاهز؟": ready,
    "آخر تحديث": o.now,
    "ملاحظات": o.notes,
    "مكبس حراري": (o.department === "مكبس" || o.heatPress) ? "نعم" : "لا",
    "تاريخ الاستلام": o.receivedAt || o.now,
    "تاريخ التسليم المتوقع": o.expectedDeliveryAt || expectedDeliveryDate_(o.now),
    "الوقت المتوقع": o.expectedDeliveryText || expectedDeliveryText_(o.now),
    "تم إبلاغ العميل؟": "لا",
    "تم إرسال رسالة التسجيل؟": "لا",
    "آخر رسالة واتساب": "",
    "آخر وقت واتساب": "",
    "آخر واتساب بواسطة": "",
    "نوع رسالة واتساب": "",
    "كود الشات": o.customerCode || "",
    "مصدر الطلب": o.source || "داخلي",
    "أنشئ بواسطة": o.createdBy || "الموظف",
    "ملاحظات العميل": o.customerNotes || "",
    "فاصل واتساب": o.whatsappSeparator || "",
    "تأكيد فاصل واتساب": o.whatsappSeparatorStatus || "غير مطلوب"
  });
}

/*********************** أدوات كتابة حسب الهيدر ***********************/

function appendByHeaders_(sheet, values) {
  const h = headersMap_(sheet);
  const lastCol = Math.max(1, sheet.getLastColumn());
  const row = new Array(lastCol).fill("");

  Object.keys(values).forEach(function (key) {
    const col = h[normalizeKey_(key)];
    if (col) row[col - 1] = isPhoneHeader_(key) ? cleanPhone_(values[key]) : values[key];
  });

  const nextRow = sheet.getLastRow() + 1;
  setPhoneColumnsAsText_(sheet, nextRow);
  sheet.getRange(nextRow, 1, 1, lastCol).setValues([row]);
}

function updateByHeaders_(sheet, rowNumber, values, skipCreateDate) {
  const h = headersMap_(sheet);
  Object.keys(values).forEach(function (key) {
    if (skipCreateDate && key === "تاريخ الإنشاء") return;
    const col = h[normalizeKey_(key)];
    if (col) {
      const range = sheet.getRange(rowNumber, col);
      if (isPhoneHeader_(key)) {
        range.setNumberFormat("@");
        range.setValue(cleanPhone_(values[key]));
      } else {
        range.setValue(values[key]);
      }
    }
  });
}

/*********************** مزامنة آمنة اختيارية ***********************/

function syncTrendOSNow() {
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  const h = headersMap_(lines);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const data = lines.getDataRange().getValues();
  const ids = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const oid = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    if (oid) ids[oid] = true;
  }

  const keys = Object.keys(ids);
  const limit = Math.min(keys.length, 120);
  for (let i = 0; i < limit; i++) {
    syncOrderFromLines_(keys[i]);
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تمت مزامنة دفعة آمنة من الأوردرات.",
    totalOrdersFound: keys.length,
    syncedNow: limit
  };
}

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAME_LINES) return;
    if (e.range.getRow() <= 1) return;

    const h = headersMap_(sheet);
    const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
    const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);
    if (e.range.getColumn() !== colStatus && e.range.getColumn() !== colNotes) return;

    const rowNumber = e.range.getRow();
    const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
    const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
    const colReady = firstCol_(h, ["جاهز؟", "جاهز", "Ready"], 12);

    const status = normalize_(sheet.getRange(rowNumber, colStatus).getValue());
    const orderId = normalize_(sheet.getRange(rowNumber, colOrderId).getValue());

    if (colUpdated) sheet.getRange(rowNumber, colUpdated).setValue(new Date());
    if (colReady) sheet.getRange(rowNumber, colReady).setValue(isReadyStatus_(status) ? "نعم" : "لا");
    if (orderId) syncOrderFromLines_(orderId);

    SpreadsheetApp.flush();
  } catch (err) {
    Logger.log("onEdit TrendOS Error: " + (err && err.message ? err.message : err));
  }
}


/************************************************************
 * CLEAN START - يحذف كل الأوردرات والبنود ويترك العملاء والمستخدمين
 * شغّل الدالة cleanStartKeepCustomersNow من قائمة Run مرة واحدة فقط
 ************************************************************/
function fixPhoneColumnsNow() {
  const ss = ss_();
  const targetSheets = [SHEET_NAME_CUSTOMERS, SHEET_NAME_ORDERS, SHEET_NAME_LINES];
  let sheetsFixed = 0;
  let cellsFixed = 0;

  targetSheets.forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return;
    const cols = phoneColumns_(sheet);
    if (!cols.length) return;

    cols.forEach(function (col) {
      const range = sheet.getRange(2, col, sheet.getLastRow() - 1, 1);
      range.setNumberFormat("@");
      const values = range.getValues();
      const out = values.map(function (r) { return [cleanPhone_(r[0])]; });
      range.setValues(out);
      cellsFixed += out.length;
    });
    sheetsFixed++;
  });

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم ضبط أعمدة أرقام العملاء كنص وإرجاع الصفر في بداية أرقام الموبايل.",
    sheetsFixed: sheetsFixed,
    cellsFixed: cellsFixed
  };
}


function fillMissingOrderPhonesNow() {
  const ss = ss_();
  const customerMap = buildCustomerPhoneMap_();
  const now = new Date();
  let linesUpdated = 0;
  let ordersUpdated = 0;

  function fillSheet_(sheetName, customerHeaders, phoneHeaders) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return 0;

    setPhoneColumnsAsText_(sheet);

    const data = sheet.getDataRange().getValues();
    const h = headersMap_(sheet);
    const colCustomer = firstCol_(h, customerHeaders, 0);
    const colPhone = firstCol_(h, phoneHeaders, 0);
    const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 0);
    if (!colCustomer || !colPhone) return 0;

    let updated = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const customerName = normalize_(row[colCustomer - 1]);
      if (!customerName) continue;
      const currentPhone = cleanPhone_(row[colPhone - 1]);
      if (currentPhone) continue;

      const customerInfo = customerMap[searchKey_(customerName)] || findCustomerInfoByName_(customerName);
      const phone = customerInfo.phone || customerInfo.extraPhone || "";
      if (!phone) continue;

      sheet.getRange(i + 1, colPhone).setNumberFormat("@").setValue(phone);
      if (colUpdated) sheet.getRange(i + 1, colUpdated).setValue(now);
      updated++;
    }
    return updated;
  }

  linesUpdated = fillSheet_(SHEET_NAME_LINES,
    ["اسم الشات / المكتب", "اسم العميل", "Customer Name"],
    ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"]
  );

  ordersUpdated = fillSheet_(SHEET_NAME_ORDERS,
    ["اسم الشات / المكتب", "اسم العميل", "Customer Name"],
    ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone", "رقم العميل الأساسي"]
  );

  SpreadsheetApp.flush();

  return {
    success: true,
    message: "تم استكمال أرقام العملاء الناقصة من شيت العملاء.",
    linesUpdated: linesUpdated,
    ordersUpdated: ordersUpdated
  };
}

function cleanStartKeepCustomersNow() {
  const ss = ss_();
  const result = {
    success: true,
    spreadsheet: ss.getName(),
    url: ss.getUrl(),
    cleared: [],
    kept: [SHEET_NAME_CUSTOMERS, SHEET_NAME_USERS],
    message: "تم تصفير التشغيل: حذف الأوردرات والبنود فقط مع ترك العملاء والمستخدمين."
  };

  const mainSheetsToClear = [
    SHEET_NAME_ORDERS,
    SHEET_NAME_LINES,
    "لوحة التحكم",
    "واجهة الإدارة",
    "واجهة الطباعة",
    "واجهة الليزر",
    "واجهة خدمة العملاء",
    "واجهة المكبس",
    "طلبات V2",
    "طلبات التطبيق",
    "طلبات واتساب",
    "التنبيهات",
    "واجهة الطلبات",
    "واجهة خدمة العملاء",
    SHEET_NAME_ACTIVITY
  ];

  mainSheetsToClear.forEach(function(name){
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    cleanSheetBodyOnly_(sheet);
    result.cleared.push(name);
  });

  // إزالة الفلاتر من كل الشيتات حتى شيت العملاء، بدون حذف داتا العملاء
  ss.getSheets().forEach(function(sheet){
    try {
      const filter = sheet.getFilter();
      if (filter) filter.remove();
    } catch(e) {}
  });

  // إزالة مشاكل التحقق من البيانات في شيتات التشغيل ثم إعادة القوائم الصحيحة فقط
  resetTrendOSValidations_();

  SpreadsheetApp.flush();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function cleanSheetBodyOnly_(sheet) {
  try {
    const filter = sheet.getFilter();
    if (filter) filter.remove();
  } catch(e) {}

  const lastRow = sheet.getLastRow();
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();

  if (maxRows > 1) {
    const body = sheet.getRange(2, 1, maxRows - 1, maxCols);
    body.clearContent();
    body.clearNote();
    body.clearDataValidations();
  }
}

function resetTrendOSValidations_() {
  const ss = ss_();

  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (lines) {
    const h = headersMap_(lines);
    clearAllBodyValidations_(lines);
    setDropdownByHeader_(lines, h, ["القسم", "Department"], ["طباعة", "ليزر", "مكبس", "متعدد الأقسام"]);
    setDropdownByHeader_(lines, h, ["الأولوية", "Priority"], ["عاجل", "عادي", "مؤجل"]);
    setDropdownByHeader_(lines, h, ["الحالة", "Status"], ["طلب جديد", "بدأ التنفيذ", "تحت التنفيذ", "جاهز للاستلام", "تم التسليم", "مشكلة", "متوقف"]);
    setDropdownByHeader_(lines, h, ["جاهز؟", "جاهز", "Ready"], ["نعم", "لا"]);
    setDropdownByHeader_(lines, h, ["مكبس حراري", "مكبس؟"], ["نعم", "لا"]);
  }

  const orders = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (orders) {
    const h = headersMap_(orders);
    clearAllBodyValidations_(orders);
    setDropdownByHeader_(orders, h, ["القسم الرئيسي", "القسم", "Department"], ["طباعة", "ليزر", "مكبس", "متعدد الأقسام"]);
    setDropdownByHeader_(orders, h, ["الأولوية", "Priority"], ["عاجل", "عادي", "مؤجل"]);
    setDropdownByHeader_(orders, h, ["الحالة العامة", "الحالة", "Status"], ["طلب جديد", "بدأ التنفيذ", "تحت التنفيذ", "جاهز للاستلام", "تم التسليم", "مشكلة", "متوقف"]);
    setDropdownByHeader_(orders, h, ["تسليم جزئي؟"], ["نعم", "لا"]);
  }
}

function clearAllBodyValidations_(sheet) {
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();
  if (maxRows > 1) sheet.getRange(2, 1, maxRows - 1, maxCols).clearDataValidations();
}

function setDropdownByHeader_(sheet, headerMap, names, values) {
  const col = firstCol_(headerMap, names, 0);
  if (!col) return;
  const maxRows = sheet.getMaxRows();
  if (maxRows <= 1) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, col, maxRows - 1, 1).setDataValidation(rule);
}


/*********************** معرفة واتس AI - V1823 ***********************/

function canManageKnowledge_(user) {
  const role = roleFromArabic_(user.role, user.department);
  const username = searchKey_(user.username || "");
  return role === "admin" || role === "service" || username === "ضياء" || username === "رحمه" || username === "رحمة";
}

function aiKnowledgeHeaders_() {
  return [
    "ID",
    "القسم",
    "العنوان",
    "المفتاح",
    "الكلمات المفتاحية",
    "النص",
    "الأولوية",
    "مفعل؟",
    "آخر تحديث",
    "بواسطة",
    "ملاحظات"
  ];
}

function ensureAiKnowledgeSheet_() {
  const ss = ss_();
  let sheet = ss.getSheetByName(SHEET_NAME_AI_KNOWLEDGE);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME_AI_KNOWLEDGE);

  const headers = aiKnowledgeHeaders_();
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    ensureHeaderIfAnyMissing_(sheet, headers);
  }

  sheet.setFrozenRows(1);
  try {
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff");
    sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), headers.length));
  } catch (e) {}

  return sheet;
}

function ensureAiSettingsSheet_() {
  const ss = ss_();
  let sheet = ss.getSheetByName(SHEET_NAME_AI_SETTINGS);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME_AI_SETTINGS);
  const headers = ["المفتاح", "القيمة", "ملاحظات"];
  if (sheet.getLastRow() < 1) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else ensureHeaderIfAnyMissing_(sheet, headers);

  const defaults = [
    ["brand_name", "Trend Mall", "اسم التوقيع في رسائل الواتساب"],
    ["default_delivery_days", "2", "يوم التسجيل + يومين = التسليم المتوقع"],
    ["handoff_users", "رحمه,ضياء", "التحويل للدعم عند عدم وضوح الطلب"],
    ["tone", "مصري بسيط ومحترم ومختصر", "نبرة رد واتس AI"],
    ["do_not_give_final_price", "نعم", "لا يعطي سعر نهائي إلا من الأسعار المعتمدة"],
    ["new_work_new_order", "نعم", "أي شغل جديد بعد رقم أوردر سابق يسجل أوردر جديد"]
  ];
  seedSheetIfEmpty_(sheet, defaults, 1);
  return sheet;
}

function ensureAiLogSheet_() {
  const ss = ss_();
  let sheet = ss.getSheetByName(SHEET_NAME_AI_LOG);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME_AI_LOG);
  const headers = ["التاريخ", "رقم العميل", "اسم العميل", "رسالة العميل", "رد AI", "نوع النية", "رقم الأوردر", "ملاحظات"];
  if (sheet.getLastRow() < 1) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else ensureHeaderIfAnyMissing_(sheet, headers);
  return sheet;
}

function seedSheetIfEmpty_(sheet, rows, keyCol) {
  if (sheet.getLastRow() > 1) return;
  if (!rows || !rows.length) return;
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function defaultAiKnowledgeRows_() {
  const now = new Date();
  return [
    ["KB-0001", "قواعد التشغيل", "مصدر الحقيقة", "source_of_truth", "شيت, حالة, أوردر, معرفة", "Google Sheet هو مصدر الحقيقة في TrendOS. لا يتم تأكيد حالة أوردر أو رقم أو ميعاد إلا من الشيت أو من بيانات الأوردر الظاهرة في النظام.", "عالية", "نعم", now, "System", ""],
    ["KB-0002", "سياسة التسليم", "التسليم المتوقع", "delivery_policy", "تسليم, استلام, ميعاد, وقت", "سياسة التشغيل: يوم تسجيل الأوردر هو يوم استلام الشغل، اليوم التالي للتنفيذ، واليوم الثالث لتسليم العميل. لذلك التسليم المتوقع = تاريخ التسجيل + يومين.", "عالية", "نعم", now, "System", ""],
    ["KB-0003", "قواعد التشغيل", "الشغل الجديد يسجل أوردر جديد", "new_work_new_order", "شغل جديد, رقم جديد, اوردر جديد", "لو العميل بعت شغل جديد بعد تسجيل أوردر سابق، يتم تسجيل الشغل كأوردر جديد برقم جديد حتى لو لنفس العميل، لأن كل رقم أوردر له متابعة وحالة مستقلة.", "عالية", "نعم", now, "System", ""],
    ["KB-0004", "ردود واتساب", "رسالة تسجيل اوردر", "order_registered", "تسجيل, تم التسجيل, رقم الأوردر", "أهلاً يا {customer_name} 🌟\nتم تسجيل أوردر جديد لحضرتك بنجاح.\nرقم الأوردر: {order_id}\nالقسم: {department}\nنوع الشغل: {item_name}\nالتسليم المتوقع: {expected_delivery}\n\nمهم: أي شغل جديد يتم إرساله بعد كده هيتسجل كأوردر جديد برقم جديد.\n{business_name}", "عالية", "نعم", now, "System", ""],
    ["KB-0005", "ردود واتساب", "رد حالة الأوردر", "status_reply", "الحالة, خلص, جاهز, متابعة", "أهلاً يا {customer_name} 🌟\nالأوردر رقم {order_id} حالته حالياً: {status}\nالقسم: {department}\nنوع الشغل: {item_name}\nالتسليم المتوقع: {expected_delivery}\n{business_name}", "عالية", "نعم", now, "System", ""],
    ["KB-0006", "ردود واتساب", "رسالة جاهز للاستلام", "ready_notify", "جاهز, استلام, خلص", "أهلاً يا {customer_name} 🌟\nالأوردر رقم {order_id} جاهز للاستلام.\nالقسم: {department}\nنوع الشغل: {item_name}\nبرجاء الحضور للاستلام في أقرب وقت مناسب.\n{business_name}", "عالية", "نعم", now, "System", ""],
    ["KB-0007", "قواعد التشغيل", "الحالات المخفية", "hidden_statuses", "مكرر, تم التسليم, جاهز للاستلام, تم التنفيذ, جاهز للطباعة", "الحالات جاهز للاستلام وتم التسليم ومكرر لا تظهر في شاشة المستخدمين اليومية بعد حفظها، لكنها تظل محفوظة في الشيت للمتابعة والسجل.", "عادية", "نعم", now, "System", ""],
    ["KB-0008", "قواعد التشغيل", "الأولوية الافتراضية", "default_priority", "عاجل, عادي, أولوية", "الأولوية الافتراضية عند تسجيل الأوردر هي عادي، وليس عاجل، حتى لا يتم تسجيل كل الأوردرات كعاجلة بالخطأ. شاشة التشغيل تعرض العاجل أولًا ثم العادي.", "عادية", "نعم", now, "System", ""],
    ["KB-0009", "قواعد التشغيل", "المكبس الحراري", "heat_press", "مكبس, حراري, طباعة", "لو الأوردر طباعة أو متعدد الأقسام وتم تعليم مكبس حراري، يظهر بعلامة حمراء مكبس في شاشة الأوردرات وشاشة المكبس حتى يتم تجميع شغل المكبس مرة واحدة يوميًا.", "عالية", "نعم", now, "System", ""],
    ["KB-0010", "الخدمات والأقسام", "الأقسام الأساسية", "departments", "طباعة, ليزر, مكبس, فنيل", "أقسام التشغيل الأساسية في TrendOS: خدمة العملاء، طباعة، ليزر، مكبس. الأوردر قد يكون قسم واحد أو متعدد الأقسام، وكل قسم له متابعة مستقلة.", "عادية", "نعم", now, "System", ""],
    ["KB-0011", "الممنوعات", "عدم الوعد بدون بيانات", "no_fake_promises", "سعر, وعد, خلص, تأكيد", "لا يعطي AI سعر نهائي أو وعد تسليم مؤكد خارج بيانات الشيت. إذا البيانات ناقصة أو غير واضحة، يحول العميل لرحمه أو ضياء.", "عالية", "نعم", now, "System", ""],
    ["KB-0012", "تحويل للدعم", "متى يتم التحويل", "human_escalation", "دعم, موظف, غير واضح, مشكلة", "يتم تحويل العميل للدعم إذا طلب سعر غير موجود في المعرفة، أو أرسل شكوى، أو سأل عن تعديل تصميم، أو كانت حالة الأوردر غير موجودة، أو لم يتم التعرف على رقم الهاتف/الأوردر.", "عالية", "نعم", now, "System", ""],
    ["KB-0013", "الأسعار والخدمات", "الخدمات الحالية", "services", "تابلوهات, براويز, مجات, سلوبتات, تيشرتات, دروع, ليزر", "الخدمات التي يقدمها مطبعجي/ترند مول تشمل: تابلوهات وبراويز، مجات، سلوبتات، تيشرتات، دروع، فنيل، ليزر، طباعة بانر، لامنيشن، فوتوبلوك، ومستلزمات حفلات التخرج. الأسعار النهائية تكون من القوائم المعتمدة فقط.", "عادية", "نعم", now, "System", ""],
    ["KB-0014", "ردود واتساب", "نبرة الرد", "tone", "أسلوب, رد, لهجة", "نبرة الرد تكون مصرية بسيطة ومحترمة ومختصرة. يبدأ الرد بتحية لطيفة، ويذكر البيانات المهمة فقط بدون إطالة.", "عادية", "نعم", now, "System", ""]
  ];
}

function initAiKnowledgeNow() {
  const knowledge = ensureAiKnowledgeSheet_();
  ensureAiSettingsSheet_();
  ensureAiLogSheet_();

  if (knowledge.getLastRow() < 2) {
    const rows = defaultAiKnowledgeRows_();
    knowledge.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم تجهيز شيت معرفة واتس AI والقوالب والإعدادات.",
    knowledgeRows: Math.max(0, knowledge.getLastRow() - 1),
    sheetName: SHEET_NAME_AI_KNOWLEDGE
  };
}

function getKnowledge_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canManageKnowledge_(auth.user)) return { success: false, message: "ليس لديك صلاحية إدارة معرفة واتس AI." };

  const sheet = ensureAiKnowledgeSheet_();
  if (sheet.getLastRow() < 2) initAiKnowledgeNow();

  const data = sheet.getDataRange().getDisplayValues();
  const h = headersMap_(sheet);
  const rows = [];

  const colId = firstCol_(h, ["ID"], 1);
  const colCategory = firstCol_(h, ["القسم"], 2);
  const colTitle = firstCol_(h, ["العنوان"], 3);
  const colKey = firstCol_(h, ["المفتاح", "key"], 4);
  const colKeywords = firstCol_(h, ["الكلمات المفتاحية"], 5);
  const colContent = firstCol_(h, ["النص", "المحتوى"], 6);
  const colPriority = firstCol_(h, ["الأولوية"], 7);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل"], 8);
  const colUpdated = firstCol_(h, ["آخر تحديث"], 9);
  const colBy = firstCol_(h, ["بواسطة"], 10);
  const colNotes = firstCol_(h, ["ملاحظات"], 11);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = normalize_(valueAt_(row, colId));
    const title = normalize_(valueAt_(row, colTitle));
    if (!id && !title) continue;
    rows.push({
      rowNumber: i + 1,
      id: id,
      category: normalize_(valueAt_(row, colCategory)),
      title: title,
      key: normalize_(valueAt_(row, colKey)),
      keywords: normalize_(valueAt_(row, colKeywords)),
      content: normalize_(valueAt_(row, colContent)),
      priority: normalize_(valueAt_(row, colPriority)) || "عادية",
      active: normalize_(valueAt_(row, colActive)) || "نعم",
      updatedAt: dateText_(valueAt_(row, colUpdated)),
      by: normalize_(valueAt_(row, colBy)),
      notes: normalize_(valueAt_(row, colNotes))
    });
  }

  rows.sort(function(a, b) {
    const rank = { "عالية": 0, "عادية": 1, "منخفضة": 2 };
    const ra = rank[a.priority] === undefined ? 9 : rank[a.priority];
    const rb = rank[b.priority] === undefined ? 9 : rank[b.priority];
    if (ra !== rb) return ra - rb;
    return String(a.id).localeCompare(String(b.id));
  });

  return { success: true, rows: rows, count: rows.length, sheetName: SHEET_NAME_AI_KNOWLEDGE };
}

function makeKnowledgeId_() {
  const tz = Session.getScriptTimeZone();
  return "KB-" + Utilities.formatDate(new Date(), tz, "yyMMddHHmmss");
}

function saveKnowledge_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canManageKnowledge_(auth.user)) return { success: false, message: "ليس لديك صلاحية حفظ معرفة واتس AI." };

  const sheet = ensureAiKnowledgeSheet_();
  const h = headersMap_(sheet);
  const id = normalize_(e.parameter.id) || makeKnowledgeId_();
  const title = normalize_(e.parameter.title);
  const content = normalize_(e.parameter.content);

  if (!title || !content) return { success: false, message: "العنوان والمحتوى مطلوبين." };

  let rowNumber = 0;
  if (sheet.getLastRow() > 1) {
    const colId = firstCol_(h, ["ID"], 1);
    const ids = sheet.getRange(2, colId, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (normalize_(ids[i][0]) === id) {
        rowNumber = i + 2;
        break;
      }
    }
  }

  const values = {
    "ID": id,
    "القسم": normalize_(e.parameter.category) || "قواعد التشغيل",
    "العنوان": title,
    "المفتاح": normalize_(e.parameter.key),
    "الكلمات المفتاحية": normalize_(e.parameter.keywords),
    "النص": content,
    "المحتوى": content,
    "الأولوية": normalize_(e.parameter.priority) || "عادية",
    "مفعل؟": normalize_(e.parameter.active) || "نعم",
    "آخر تحديث": new Date(),
    "بواسطة": auth.user.username,
    "ملاحظات": normalize_(e.parameter.notes)
  };

  if (rowNumber) updateByHeaders_(sheet, rowNumber, values, false);
  else appendByHeaders_(sheet, values);

  SpreadsheetApp.flush();
  return { success: true, message: "تم حفظ قاعدة المعرفة.", id: id };
}

function getKnowledgeContext_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canManageKnowledge_(auth.user)) return { success: false, message: "ليس لديك صلاحية عرض سياق المعرفة." };
  return { success: true, context: buildAiKnowledgeContext_() };
}

function buildAiKnowledgeContext_() {
  const sheet = ensureAiKnowledgeSheet_();
  if (sheet.getLastRow() < 2) initAiKnowledgeNow();
  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);
  const activeRows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const active = normalize_(valueAt_(row, firstCol_(h, ["مفعل؟"], 7))) || "نعم";
    if (active !== "نعم") continue;
    const category = normalize_(valueAt_(row, firstCol_(h, ["القسم"], 2)));
    const title = normalize_(valueAt_(row, firstCol_(h, ["العنوان"], 3)));
    const content = normalize_(valueAt_(row, firstCol_(h, ["النص", "المحتوى"], 6)));
    if (!title || !content) continue;
    activeRows.push("[" + category + "] " + title + ": " + content);
  }

  return activeRows.join("\n");
}


/*********************** قراءة عامة لقوالب معرفة واتس AI ***********************/

function getAiKnowledge_(e) {
  e = e || { parameter: {} };
  const sheet = ensureAiKnowledgeSheet_();
  if (sheet.getLastRow() < 2) initAiKnowledgeNow();

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { success: true, count: 0, knowledge: [] };

  const h = headersMap_(sheet);
  const rows = [];

  const colId = firstCol_(h, ["ID"], 1);
  const colCategory = firstCol_(h, ["القسم"], 2);
  const colTitle = firstCol_(h, ["العنوان"], 3);
  const colKey = firstCol_(h, ["المفتاح", "key"], 4);
  const colKeywords = firstCol_(h, ["الكلمات المفتاحية"], 5);
  const colText = firstCol_(h, ["النص", "المحتوى"], 6);
  const colPriority = firstCol_(h, ["الأولوية"], 7);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل"], 8);
  const colUpdated = firstCol_(h, ["آخر تحديث"], 9);
  const colBy = firstCol_(h, ["بواسطة"], 10);
  const colNotes = firstCol_(h, ["ملاحظات"], 11);

  const keyFilter = normalize_(e.parameter.key || e.parameter.title || e.parameter.keyword || "");
  const qFilter = searchKey_(e.parameter.q || e.parameter.query || "");
  const sectionFilter = normalize_(e.parameter.section || e.parameter.category || "");

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = normalize_(valueAt_(row, colId));
    const section = normalize_(valueAt_(row, colCategory));
    const title = normalize_(valueAt_(row, colTitle));
    const key = normalize_(valueAt_(row, colKey));
    const keywords = normalize_(valueAt_(row, colKeywords));
    let text = normalize_(valueAt_(row, colText));
    const active = normalize_(valueAt_(row, colActive)) || "نعم";

    if (!text) text = findLongestKnowledgeTextInRow_(row);
    if (!id && !title && !key && !text) continue;
    if (active !== "نعم") continue;
    if (sectionFilter && section !== sectionFilter) continue;

    const blob = searchKey_([id, section, title, key, keywords, text].join(" "));
    if (keyFilter) {
      const wanted = searchKey_(keyFilter);
      const directKey = searchKey_(key);
      if (directKey !== wanted && blob.indexOf(wanted) === -1) continue;
    }
    if (qFilter && blob.indexOf(qFilter) === -1) continue;

    rows.push({
      id: id,
      section: section,
      title: title,
      key: key,
      keywords: keywords,
      text: text,
      priority: normalize_(valueAt_(row, colPriority)),
      active: active,
      updatedAt: valueAt_(row, colUpdated),
      by: normalize_(valueAt_(row, colBy)),
      notes: normalize_(valueAt_(row, colNotes))
    });
  }

  return { success: true, count: rows.length, knowledge: rows };
}

function renderAiTemplate_(e) {
  e = e || { parameter: {} };
  const p = e.parameter || {};
  const key = normalize_(p.key || p.title || p.template || "");
  if (!key) return { success: false, message: "اكتب key للقالب المطلوب." };

  const templateItem = findAiTemplateByKey_(key);
  if (!templateItem) return { success: false, message: "لم أجد قالب معرفة بالمفتاح: " + key };

  let text = templateItem.text || "";
  const settings = getAiSettingsMap_();

  const vars = {
    customer_name: normalize_(p.customer_name || p.customerName || p.customer || "العميل"),
    order_id: normalize_(p.order_id || p.orderId || p.order || ""),
    line_id: normalize_(p.line_id || p.lineId || ""),
    department: normalize_(p.department || p.dept || ""),
    item_name: normalize_(p.item_name || p.itemName || p.item || ""),
    status: normalize_(p.status || ""),
    expected_delivery: normalize_(p.expected_delivery || p.expectedDelivery || p.expectedDeliveryText || ""),
    business_name: normalize_(settings.brand_name || settings.business_name || "Trend Mall"),
    phone: cleanPhone_(p.phone || p.customerPhone || "")
  };

  Object.keys(vars).forEach(function(name) {
    text = text.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
  });

  text = text
    .replace(/\{اسم_العميل\}/g, vars.customer_name)
    .replace(/\{رقم_الأوردر\}/g, vars.order_id)
    .replace(/\{القسم\}/g, vars.department)
    .replace(/\{نوع_الشغل\}/g, vars.item_name)
    .replace(/\{الحالة\}/g, vars.status)
    .replace(/\{التسليم_المتوقع\}/g, vars.expected_delivery)
    .replace(/\{اسم_البيزنس\}/g, vars.business_name);

  return {
    success: true,
    key: key,
    matchedKey: templateItem.key,
    title: templateItem.title,
    message: text,
    variables: vars
  };
}

function findAiTemplateByKey_(key) {
  const wanted = searchKey_(key);
  const res = getAiKnowledge_({ parameter: {} });
  if (!res.success || !res.knowledge) return null;

  for (let i = 0; i < res.knowledge.length; i++) {
    const item = res.knowledge[i];
    const directKey = searchKey_(item.key || "");
    if (directKey && directKey === wanted) return item;

    const blob = searchKey_([item.id, item.title, item.keywords].join(" "));
    if (blob === wanted || blob.indexOf(wanted) !== -1) return item;
  }
  return null;
}

function getAiSettings_(e) {
  const settings = getAiSettingsMap_();
  const rows = [];
  Object.keys(settings).forEach(function(k) {
    rows.push({ key: k, value: settings[k] });
  });
  return { success: true, count: rows.length, settings: settings, rows: rows };
}

function getAiSettingsMap_() {
  const sheet = ensureAiSettingsSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const settings = {};
  for (let i = 1; i < values.length; i++) {
    const key = normalize_(values[i][0]);
    const value = normalize_(values[i][1]);
    if (key) settings[key] = value;
  }
  return settings;
}

function findLongestKnowledgeTextInRow_(row) {
  let best = "";
  row.forEach(function(cell) {
    const s = normalize_(cell);
    if (!s) return;
    if (s.length <= best.length) return;
    if (s.indexOf("KB-") === 0) return;
    if (s === "نعم" || s === "لا" || s === "عالية" || s === "عادية" || s === "System") return;
    best = s;
  });
  return best;
}

function logAiWhatsApp_(phone, customerName, incoming, reply, intent, orderId, notes) {
  const sheet = ensureAiLogSheet_();
  appendByHeaders_(sheet, {
    "التاريخ": new Date(),
    "رقم العميل": cleanPhone_(phone),
    "اسم العميل": customerName || "",
    "رسالة العميل": incoming || "",
    "رد AI": reply || "",
    "نوع النية": intent || "",
    "رقم الأوردر": orderId || "",
    "ملاحظات": notes || ""
  });
}

/*********************** نهاية معرفة واتس AI - V1823 ***********************/

/************************************************************
 * V1828 - بنود تسعير الفاتورة بعد انتهاء القسم
 ************************************************************/
function ensureInvoicePricingSheet_() {
  const headers = [
    "وقت التسجيل",
    "رقم الأوردر",
    "رقم البند",
    "اسم العميل",
    "رقم العميل",
    "القسم",
    "نوع الشغل الأصلي",
    "اللي اتعمل فعليًا",
    "الكمية",
    "ملاحظات القسم",
    "حالة التسعير",
    "سعر ضياء",
    "الإجمالي",
    "مسعر بواسطة",
    "آخر تحديث",
    "تم إنشاء فاتورة؟",
    "رقم الفاتورة",
    "تم الإرسال بواسطة"
  ];
  return mbEnsureSheet_(SHEET_NAME_INVOICE_PRICING, headers);
}

function findLineSnapshotForInvoice_(rowNumber, lineId, orderId) {
  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 7);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"], 17);

  let targetRow = 0;
  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) targetRow = rowNumber;

  const data = sheet.getDataRange().getValues();
  if (!targetRow && lineId) {
    for (let i = 1; i < data.length; i++) {
      if (normalize_(valueAt_(data[i], colLineId)) === lineId) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow && orderId) {
    for (let i = 1; i < data.length; i++) {
      const oid = normalize_(valueAt_(data[i], colOrderId));
      if (oid === orderId) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return {};

  const row = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  return {
    rowNumber: targetRow,
    orderId: normalize_(valueAt_(row, colOrderId)),
    lineId: normalize_(valueAt_(row, colLineId)),
    customerName: normalize_(valueAt_(row, colCustomer)),
    customerPhone: cleanPhone_(valueAt_(row, colPhone)),
    department: normalize_(valueAt_(row, colDept)),
    itemName: normalize_(valueAt_(row, colItem)),
    qty: valueAt_(row, colQty) || 1,
    status: normalize_(valueAt_(row, colStatus)),
    notes: normalize_(valueAt_(row, colNotes))
  };
}

function createInvoiceLine_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const rowNumber = Number(e.parameter.rowNumber || 0);
  const lineIdParam = normalize_(e.parameter.lineId);
  const orderIdParam = normalize_(e.parameter.orderId);
  const snap = findLineSnapshotForInvoice_(rowNumber, lineIdParam, orderIdParam);

  const orderId = normalize_(e.parameter.orderId) || snap.orderId;
  const lineId = normalize_(e.parameter.lineId) || snap.lineId;
  const customerName = normalize_(e.parameter.customerName) || snap.customerName;
  const customerPhone = cleanPhone_(e.parameter.customerPhone) || snap.customerPhone;
  const department = normalize_(e.parameter.department) || snap.department;
  const itemName = normalize_(e.parameter.itemName) || snap.itemName;
  const workDone = normalize_(e.parameter.workDone || e.parameter.description);
  const qty = Number(e.parameter.qty || snap.qty || 1) || 1;
  const notes = normalize_(e.parameter.notes) || snap.notes;

  if (!orderId && !lineId) return { success: false, message: "رقم الأوردر أو رقم البند مطلوب." };
  if (!workDone) return { success: false, message: "اكتب ما تم تنفيذه فعليًا قبل إرسال البند للتسعير." };

  const sheet = ensureInvoicePricingSheet_();
  const now = new Date();

  appendByHeaders_(sheet, {
    "وقت التسجيل": now,
    "رقم الأوردر": orderId,
    "رقم البند": lineId,
    "اسم العميل": customerName,
    "رقم العميل": customerPhone,
    "القسم": department,
    "نوع الشغل الأصلي": itemName,
    "اللي اتعمل فعليًا": workDone,
    "الكمية": qty,
    "ملاحظات القسم": notes,
    "حالة التسعير": "في انتظار تسعير ضياء",
    "سعر ضياء": "",
    "الإجمالي": "",
    "مسعر بواسطة": "",
    "آخر تحديث": now,
    "تم إنشاء فاتورة؟": "لا",
    "رقم الفاتورة": "",
    "تم الإرسال بواسطة": auth.user.username
  });

  appendActivityLog_({
    time: now,
    orderId: orderId,
    lineId: lineId,
    customer: customerName,
    department: department,
    action: "إرسال بند للتسعير",
    oldStatus: "",
    newStatus: "في انتظار تسعير ضياء",
    oldNotes: "",
    newNotes: workDone,
    by: auth.user.username,
    details: "تم فتح بند فاتورة من شاشة القسم بعد الانتهاء"
  });

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم إرسال بند الفاتورة لضياء للتسعير.",
    orderId: orderId,
    lineId: lineId,
    pricingStatus: "في انتظار تسعير ضياء"
  };
}

/************************************************************
 * V1829 OVERRIDES - Pricing fix + Debt hold + Dept score
 ************************************************************/

function parseMoney_(value) {
  let s = arabicDigitsToEnglish_(value);
  if (!s || isSheetErrorValue_(s)) return 0;
  s = String(s).replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

// قراءة المديونية تكون صارمة حتى لا يتم اعتبار رقم تليفون/كود طويل كمديونية.
function parseDebtAmount_(value) {
  let s = arabicDigitsToEnglish_(value);
  if (!s || isSheetErrorValue_(s)) return 0;
  s = String(s).trim();
  const digitsOnly = s.replace(/[^0-9]/g, '');
  // تجاهل أرقام التليفون والأكواد الطويلة، مثل 010... أو 201... أو 16 رقم.
  if (digitsOnly.length >= 8) return 0;
  s = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  if (isNaN(n) || n <= 0) return 0;
  if (n > 500000) return 0;
  return n;
}

function ensureCustomerDebtHeaders_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet) return null;
  ensureHeaderIfAnyMissing_(sheet, ["مديونية", "ملاحظات المديونية", "آخر تحديث مديونية"]);
  return sheet;
}

function customerCols_(sheet) {
  const h = headersMap_(sheet);
  return {
    name: firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1),
    manager: firstCol_(h, ["اسم المسؤول", "المسؤول", "Manager"], 2),
    phone: firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3),
    extra: firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4),
    type: firstCol_(h, ["نوع العميل", "Customer Type"], 5),
    active: firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0),
    // مصدر المديونية الوحيد داخل شيت العملاء هو العمود الصريح: مديونية
    debt: firstCol_(h, ["مديونية"], 0),
    debtNotes: firstCol_(h, ["ملاحظات المديونية", "ملاحظات الدين", "Debt Notes"], 0)
  };
}

function buildCustomerPhoneMap_() {
  const sheet = ensureCustomerDebtHeaders_() || ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;

  setPhoneColumnsAsText_(sheet);

  const data = sheet.getDataRange().getValues();
  const c = customerCols_(sheet);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const active = c.active ? normalize_(row[c.active - 1]) : "نعم";
    if (active && active !== "نعم") continue;

    const name = normalize_(row[c.name - 1]);
    if (!name) continue;

    const phone = c.phone ? cleanPhone_(row[c.phone - 1]) : "";
    const extraPhone = c.extra ? cleanPhone_(row[c.extra - 1]) : "";
    const manager = c.manager ? normalize_(row[c.manager - 1]) : "";
    const type = c.type ? normalize_(row[c.type - 1]) : "";
    const debtAmount = c.debt ? parseDebtAmount_(row[c.debt - 1]) : 0;
    const debtNotes = c.debtNotes ? normalize_(row[c.debtNotes - 1]) : "";
    const key = searchKey_(name);

    if (!map[key] || (!map[key].phone && (phone || extraPhone))) {
      map[key] = {
        name: name,
        phone: phone || extraPhone,
        extraPhone: extraPhone,
        manager: manager,
        type: type,
        debtAmount: debtAmount,
        debtHold: debtAmount > 0 ? "نعم" : "لا",
        debtNotes: debtNotes
      };
    }
  }

  return map;
}

function findCustomerInfoByName_(customerName) {
  const nameKey = searchKey_(customerName);
  if (!nameKey) return { name: "", phone: "", extraPhone: "", manager: "", type: "", debtAmount: 0, debtHold: "لا", debtNotes: "" };

  const map = buildCustomerPhoneMap_();
  if (map[nameKey]) return map[nameKey];

  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(nameKey) !== -1 || nameKey.indexOf(keys[i]) !== -1) {
      return map[keys[i]];
    }
  }

  return { name: normalize_(customerName), phone: "", extraPhone: "", manager: "", type: "", debtAmount: 0, debtHold: "لا", debtNotes: "" };
}

function isCustomerDebtBlocked_(customerName) {
  const info = findCustomerInfoByName_(customerName);
  const amount = parseDebtAmount_(info.debtAmount);
  return { hasDebt: amount > 0, amount: amount, notes: info.debtNotes || "" };
}

function ensureWhatsAppHeaders_(sheet) {
  ensureHeaderIfAnyMissing_(sheet, [
    "تم إبلاغ العميل؟",
    "وقت الإبلاغ",
    "تم الإبلاغ بواسطة",
    "آخر رسالة واتساب",
    "آخر وقت واتساب",
    "آخر واتساب بواسطة",
    "نوع رسالة واتساب",
    "تم إرسال رسالة التسجيل؟",
    "وقت رسالة التسجيل",
    "رسالة التسجيل بواسطة",
    "تاريخ الاستلام",
    "تاريخ التسليم المتوقع",
    "الوقت المتوقع",
    "مكبس حراري",
    "مديونية العميل",
    "إيقاف بسبب مديونية؟",
    "ملاحظات المديونية",
    "كود الشات",
    "مصدر الطلب",
    "أنشئ بواسطة",
    "ملاحظات العميل",
    "فاصل واتساب",
    "تأكيد فاصل واتساب"
  ]);
}

function createCustomer_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canCreateCustomer_(auth.user)) return { success: false, message: "ليس لديك صلاحية إضافة عميل." };

  const customerName = normalize_(e.parameter.customerName || e.parameter.name);
  const manager = normalize_(e.parameter.manager) || auth.user.username;
  const phone = cleanPhone_(e.parameter.phone || e.parameter.customerPhone);
  const extraPhone = cleanPhone_(e.parameter.extraPhone || e.parameter.customerExtraPhone);
  const customerType = normalize_(e.parameter.customerType || e.parameter.type);
  const debtAmount = parseDebtAmount_(e.parameter.debtAmount || e.parameter.debt || 0);
  const active = normalize_(e.parameter.active) || "نعم";
  const notes = normalize_(e.parameter.notes);

  if (!customerName) return { success: false, message: "اسم الشات / العميل مطلوب." };

  const sheet = ensureCustomerDebtHeaders_();
  if (!sheet) return { success: false, message: "شيت العملاء غير موجود." };

  ensureHeaderIfAnyMissing_(sheet, ["اسم الشات / المكتب", "اسم المسؤول", "رقم العميل الأساسي", "رقم إضافي", "نوع العميل", "مفعل؟", "ملاحظات", "تاريخ الإضافة", "آخر تحديث", "مديونية", "ملاحظات المديونية", "آخر تحديث مديونية"]);

  const h = headersMap_(sheet);
  const colName = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1);
  const colPhone = firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3);
  const colExtra = firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4);
  const data = sheet.getDataRange().getValues();
  const nameKey = searchKey_(customerName);
  const phoneKey = searchKey_(phone);
  const extraKey = searchKey_(extraPhone);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingName = searchKey_(valueAt_(row, colName));
    const existingPhone = searchKey_(valueAt_(row, colPhone));
    const existingExtra = searchKey_(valueAt_(row, colExtra));
    if (existingName && existingName === nameKey) return { success: false, message: "العميل موجود بالفعل بنفس الاسم في شيت العملاء." };
    if (phoneKey && (phoneKey === existingPhone || phoneKey === existingExtra)) return { success: false, message: "رقم العميل موجود بالفعل في شيت العملاء." };
    if (extraKey && (extraKey === existingPhone || extraKey === existingExtra)) return { success: false, message: "الرقم الإضافي موجود بالفعل في شيت العملاء." };
  }

  const now = new Date();
  appendByHeaders_(sheet, {
    "اسم الشات / المكتب": customerName,
    "اسم العميل": customerName,
    "اسم المسؤول": manager,
    "رقم العميل الأساسي": phone,
    "رقم العميل": phone,
    "رقم الهاتف": phone,
    "رقم إضافي": extraPhone,
    "رقم إضافى": extraPhone,
    "نوع العميل": customerType,
    "مفعل؟": active,
    "مفعل": active,
    "ملاحظات": notes,
    "مديونية": debtAmount,
    "ملاحظات المديونية": debtAmount > 0 ? "مديونية حالية" : "",
    "آخر تحديث مديونية": debtAmount > 0 ? now : "",
    "تاريخ الإضافة": now,
    "آخر تحديث": now
  });

  SpreadsheetApp.flush();
  // V1843: بعد إضافة العميل يتم تجهيز كود الشات وكلمة مرور افتراضية تلقائيًا.
  let portalCode = "";
  try {
    const initRes = initCustomerPortalNow();
    const foundPortal = findCustomerInfoByName_(customerName);
    const portalSheet = ensureCustomerPortalHeaders_();
    const portalCols = customerCols_(portalSheet);
    const portalData = portalSheet.getDataRange().getValues();
    const key = searchKey_(customerName);
    for (let pi = 1; pi < portalData.length; pi++) {
      if (searchKey_(valueAt_(portalData[pi], portalCols.name)) === key) {
        portalCode = normalize_(valueAt_(portalData[pi], portalCols.code));
        break;
      }
    }
  } catch (portalErr) {}
  return { success: true, message: "تم إضافة العميل في شيت العملاء." + (portalCode ? " كود الشات: " + portalCode + " | كلمة المرور المؤقتة: " + CUSTOMER_DEFAULT_PASSWORD : ""), customer: { name: customerName, manager: manager, phone: phone, extraPhone: extraPhone, type: customerType, active: active, debtAmount: debtAmount, customerCode: portalCode, defaultPassword: CUSTOMER_DEFAULT_PASSWORD } };
}

function upsertOrderSummary_(o) {
  const ss = ss_();
  const sheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!sheet) return;
  ensureWhatsAppHeaders_(sheet);

  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);

  let rowNumber = 0;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, Math.max(colOrderId, colOrderCode, 1)).getValues();
    for (let i = 0; i < ids.length; i++) {
      const row = ids[i];
      const oid = normalize_(colOrderId ? row[colOrderId - 1] : "") || normalize_(colOrderCode ? row[colOrderCode - 1] : "");
      if (oid === o.orderId) { rowNumber = i + 2; break; }
    }
  }

  const values = {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "تاريخ الإنشاء": o.now,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "اسم المسؤول": o.manager || "",
    "رقم العميل": cleanPhone_(o.customerPhone),
    "رقم العميل الخارجي": cleanPhone_(o.customerPhone),
    "نوع العميل": o.customerType,
    "القسم الرئيسي": o.department,
    "القسم": o.department,
    "وصف مختصر": o.itemName,
    "وصف الأوردر": o.itemName,
    "الأولوية": o.priority,
    "الحالة العامة": o.status,
    "الحالة": o.status,
    "آخر تحديث": o.updatedAt || o.now,
    "عدد البنود": o.lineCount || 1,
    "بنود جاهزة": o.readyCount || 0,
    "بنود غير جاهزة": o.notReadyCount === undefined ? 0 : o.notReadyCount,
    "تسليم جزئي؟": o.partial || "لا",
    "ملاحظات": o.notes || "",
    "تاريخ الاستلام": o.receivedAt || o.now,
    "تاريخ التسليم المتوقع": o.expectedDeliveryAt || expectedDeliveryDate_(o.now),
    "الوقت المتوقع": o.expectedDeliveryText || expectedDeliveryText_(o.now),
    "مكبس حراري": o.heatPress ? "نعم" : "لا",
    "طباعة على الطاير": o.flyPrint ? "نعم" : "لا",
    "مديونية العميل": parseMoney_(o.debtAmount || 0),
    "إيقاف بسبب مديونية؟": parseMoney_(o.debtAmount || 0) > 0 ? "نعم" : "لا",
    "ملاحظات المديونية": o.debtNotes || "",
    "تم إبلاغ العميل؟": o.customerNotified || "لا",
    "تم إرسال رسالة التسجيل؟": o.registrationSent || "لا",
    "كود الشات": o.customerCode || "",
    "كود العميل": o.customerCode || "",
    "مصدر الطلب": o.source || "",
    "أنشئ بواسطة": o.createdBy || "",
    "ملاحظات العميل": o.customerNotes || "",
    "رابط فولدر الطلب": o.orderFolderUrl || o.draftFolderUrl || "",
    "رقم المسودة": o.draftId || ""
  };

  if (rowNumber) updateByHeaders_(sheet, rowNumber, values, true);
  else appendByHeaders_(sheet, values);
}

function appendLine_(ss, o) {
  const sheet = ss.getSheetByName(SHEET_NAME_LINES);
  if (!sheet) return;
  ensureWhatsAppHeaders_(sheet);
  ensurePressColumn_(sheet);
  ensureFlyPrintColumn_(sheet);

  const ready = isReadyStatus_(o.status) ? "نعم" : "لا";
  appendByHeaders_(sheet, {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "رقم العميل": cleanPhone_(o.customerPhone),
    "رقم العميل الخارجي": cleanPhone_(o.customerPhone),
    "نوع العميل": o.customerType,
    "القسم": o.department,
    "رقم البند": o.lineId,
    "Line ID": o.lineId,
    "اسم البند / نوع الشغل": o.itemName,
    "اسم البند": o.itemName,
    "الكمية": o.qty,
    "مسؤول القسم": o.assignedTo,
    "الأولوية": o.priority,
    "الحالة": o.status,
    "جاهز؟": ready,
    "آخر تحديث": o.now,
    "ملاحظات": o.notes,
    "مكبس حراري": (o.department === "مكبس" || o.heatPress) ? "نعم" : "لا",
    "طباعة على الطاير": o.flyPrint ? "نعم" : "لا",
    "مديونية العميل": parseMoney_(o.debtAmount || 0),
    "إيقاف بسبب مديونية؟": parseMoney_(o.debtAmount || 0) > 0 ? "نعم" : "لا",
    "ملاحظات المديونية": o.debtNotes || "",
    "تاريخ الاستلام": o.receivedAt || o.now,
    "تاريخ التسليم المتوقع": o.expectedDeliveryAt || expectedDeliveryDate_(o.now),
    "الوقت المتوقع": o.expectedDeliveryText || expectedDeliveryText_(o.now),
    "تم إبلاغ العميل؟": "لا",
    "تم إرسال رسالة التسجيل؟": "لا",
    "آخر رسالة واتساب": "",
    "آخر وقت واتساب": "",
    "آخر واتساب بواسطة": "",
    "نوع رسالة واتساب": "",
    "كود الشات": o.customerCode || "",
    "كود العميل": o.customerCode || "",
    "مصدر الطلب": o.source || "",
    "أنشئ بواسطة": o.createdBy || "",
    "ملاحظات العميل": o.customerNotes || "",
    "فاصل واتساب": o.whatsappSeparator || "",
    "تأكيد فاصل واتساب": o.whatsappSeparatorStatus || "",
    "رابط فولدر البند": o.itemFolderUrl || "",
    "رابط ملفات البند": o.filesText || "",
    "رقم المسودة": o.draftId || ""
  });
}

function createManualOrder_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  if (!canCreateOrder_(auth.user)) return { success: false, message: "ليس لديك صلاحية إضافة أوردر." };

  const customerName = normalize_(e.parameter.customerName);
  const customerInfo = findCustomerInfoByName_(customerName);
  const debtAmount = parseDebtAmount_(customerInfo.debtAmount || 0);
  const debtNotes = customerInfo.debtNotes || "";
  const customerPhone = cleanPhone_(e.parameter.customerPhone) || customerInfo.phone || customerInfo.extraPhone || "";
  const customerType = normalize_(e.parameter.customerType) || customerInfo.type || "";
  const department = normalize_(e.parameter.department);
  const heatPress = isHeatPressFlag_(e.parameter.heatPress || e.parameter.press || e.parameter.isPress);
  const flyPrint = department === "طباعة" && isFlyPrintFlag_(e.parameter.flyPrint || e.parameter.quickPrint || e.parameter.fastPrint || e.parameter["طباعة على الطاير"]);
  let itemName = normalize_(e.parameter.itemName);
  const qty = Number(e.parameter.qty || 1) || 1;
  const priority = flyPrint ? "عاجل" : (normalize_(e.parameter.priority) || "عادي");
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const assignedToParam = normalize_(e.parameter.assignedTo);
  let notes = normalize_(e.parameter.notes);

  if (!customerName || !department) return { success: false, message: "اسم الشات والقسم مطلوبين." };
  if (!itemName) itemName = "أوردر جديد - " + department;
  if (debtAmount > 0) notes = (notes ? notes + " | " : "") + "تنبيه مديونية: " + debtAmount + " ج. لا يتم التسليم قبل السداد.";

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const now = new Date();
  const expectedDeliveryAt = flyPrint ? new Date(now) : expectedDeliveryDate_(now);
  const expectedDeliveryText = flyPrint ? (formatDateAr_(expectedDeliveryAt) + " - نفس اليوم") : formatDateAr_(expectedDeliveryAt);
  const orderId = makeOrderId_(lines, now);

  let departments = [];
  if (department === "متعدد الأقسام") {
    departments = [
      { department: "طباعة", assignedTo: "وائل", suffix: "طباعة" },
      { department: "ليزر", assignedTo: "جابر", suffix: "ليزر" }
    ];
  } else {
    departments = [{ department: department, assignedTo: assignedToParam || defaultAssigned_(department), suffix: department }];
  }

  const readyCount = isReadyStatus_(status) ? departments.length : 0;
  upsertOrderSummary_({
    orderId: orderId,
    now: now,
    customerName: customerName,
    customerPhone: customerPhone,
    customerType: customerType,
    department: department,
    itemName: itemName,
    qty: qty,
    priority: priority,
    status: status,
    lineCount: departments.length,
    readyCount: readyCount,
    notReadyCount: departments.length - readyCount,
    partial: readyCount > 0 && readyCount < departments.length ? "نعم" : "لا",
    notes: notes,
    receivedAt: now,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    heatPress: heatPress,
    flyPrint: flyPrint,
    debtAmount: debtAmount,
    debtNotes: debtNotes
  });

  departments.forEach(function(d, idx) {
    const lineNo = String(idx + 1).padStart(2, "0");
    const lineId = orderId + "-" + lineNo;
    appendLine_(ss, {
      orderId: orderId,
      lineId: lineId,
      now: now,
      customerName: customerName,
      customerPhone: customerPhone,
      customerType: customerType,
      department: d.department,
      itemName: departments.length > 1 ? (itemName + " - " + d.suffix) : itemName,
      qty: qty,
      priority: priority,
      status: status,
      assignedTo: d.assignedTo,
      notes: notes,
      receivedAt: now,
      expectedDeliveryAt: expectedDeliveryAt,
      expectedDeliveryText: expectedDeliveryText,
      heatPress: heatPress,
      flyPrint: flyPrint,
      debtAmount: debtAmount,
      debtNotes: debtNotes
    });
  });

  appendActivityLog_({ time: now, orderId: orderId, lineId: orderId + "-01", customer: customerName, department: department, action: "إنشاء أوردر", newStatus: status, by: auth.user.username, details: debtAmount > 0 ? "تم تسجيل الأوردر مع تنبيه مديونية" : "تم تسجيل أوردر جديد" });

  SpreadsheetApp.flush();
  return {
    success: true,
    orderId: orderId,
    lineId: orderId + "-01",
    linesCreated: departments.length,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    debtAmount: debtAmount,
    debtHold: debtAmount > 0 ? "نعم" : "لا",
    debtInfo: { hasDebt: debtAmount > 0, amount: debtAmount, notes: debtNotes },
    message: debtAmount > 0 ? "تم إضافة الأوردر مع تنبيه مديونية العميل." : "تم إضافة الأوردر في الشيتين."
  };
}

function getRows_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen);
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const rows = [];

  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 7);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colAssigned = firstCol_(h, ["مسؤول القسم", "Assigned To"], 9);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colReady = firstCol_(h, ["جاهز؟", "جاهز", "Ready"], 12);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"], 17);
  const colPress = firstCol_(h, ["مكبس", "مكبس حراري", "مكبس؟", "Press", "Heat Press"], 0);
  const colFlyPrint = firstCol_(h, ["طباعة على الطاير", "طباعة ع الطاير", "طباعة فورية", "Ready Print", "Fly Print", "Quick Print"], 0);
  const colDebt = firstCol_(h, ["مديونية العميل"], 0);
  const colDebtHold = firstCol_(h, ["إيقاف بسبب مديونية؟", "مديونية؟"], 0);
  const colDebtNotes = firstCol_(h, ["ملاحظات المديونية"], 0);
  const colCustomerNotified = firstCol_(h, ["تم إبلاغ العميل؟"], 0);
  const colNotifyAt = firstCol_(h, ["وقت الإبلاغ"], 0);
  const colNotifyBy = firstCol_(h, ["تم الإبلاغ بواسطة"], 0);
  const colLastWaMessage = firstCol_(h, ["آخر رسالة واتساب"], 0);
  const colLastWaAt = firstCol_(h, ["آخر وقت واتساب"], 0);
  const colLastWaBy = firstCol_(h, ["آخر واتساب بواسطة"], 0);
  const colReceivedAt = firstCol_(h, ["تاريخ الاستلام", "تاريخ الإنشاء", "Received At"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colRegistrationSent = firstCol_(h, ["تم إرسال رسالة التسجيل؟"], 0);
  const customerMap = buildCustomerPhoneMap_();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    const lineId = normalize_(valueAt_(row, colLineId));
    const department = normalize_(valueAt_(row, colDept));
    const status = normalize_(valueAt_(row, colStatus));
    if (!orderId && !lineId) continue;
    const press = isHeatPressFlag_(valueAt_(row, colPress));
    if (!dashboardMatchesScreen_(screen, department, press)) continue;

    const customerName = normalize_(valueAt_(row, colCustomer));
    const customerLookup = customerMap[searchKey_(customerName)] || {};
    let customerPhone = cleanPhone_(valueAt_(row, colPhone));
    if (!customerPhone && customerLookup.phone) {
      customerPhone = customerLookup.phone;
      if (colPhone) { try { lines.getRange(i + 1, colPhone).setNumberFormat("@").setValue(customerPhone); } catch (phoneWriteErr) {} }
    }
    // يتم تحديث عرض المديونية من شيت العملاء فقط.
    let debtAmount = customerLookup.debtAmount ? parseDebtAmount_(customerLookup.debtAmount) : 0;
    const debtHold = debtAmount > 0 ? "نعم" : "لا";

    rows.push({
      rowNumber: i + 1,
      orderId: orderId,
      orderCode: normalize_(valueAt_(row, colOrderCode)) || orderId,
      lineId: lineId,
      customer: customerName,
      customerPhone: customerPhone,
      department: department,
      itemName: normalize_(valueAt_(row, colItem)),
      qty: valueAt_(row, colQty) || 1,
      assignedTo: normalize_(valueAt_(row, colAssigned)),
      priority: normalize_(valueAt_(row, colPriority)) || "عادي",
      status: status || "طلب جديد",
      ready: normalize_(valueAt_(row, colReady)),
      heatPress: normalize_(valueAt_(row, colPress)),
      flyPrint: normalize_(valueAt_(row, colFlyPrint)),
      quickPrint: normalize_(valueAt_(row, colFlyPrint)),
      debtAmount: debtAmount,
      debtHold: debtHold,
      debtNotes: normalize_(valueAt_(row, colDebtNotes)) || customerLookup.debtNotes || "",
      updatedAt: dateText_(valueAt_(row, colUpdated)) || valueAt_(row, colUpdated),
      notes: normalize_(valueAt_(row, colNotes)),
      customerNotified: normalize_(valueAt_(row, colCustomerNotified)),
      notifiedAt: dateText_(valueAt_(row, colNotifyAt)) || valueAt_(row, colNotifyAt),
      notifiedBy: normalize_(valueAt_(row, colNotifyBy)),
      lastWhatsAppMessage: normalize_(valueAt_(row, colLastWaMessage)),
      lastWhatsAppAt: dateText_(valueAt_(row, colLastWaAt)) || valueAt_(row, colLastWaAt),
      lastWhatsAppBy: normalize_(valueAt_(row, colLastWaBy)),
      receivedAt: dateText_(valueAt_(row, colReceivedAt)) || valueAt_(row, colReceivedAt),
      expectedDeliveryAt: dateText_(valueAt_(row, colExpectedAt)) || valueAt_(row, colExpectedAt),
      expectedDeliveryText: dateText_(valueAt_(row, colExpectedText)) || dateText_(valueAt_(row, colExpectedAt)),
      overdue: isOverdueByExpected_(status || "طلب جديد", valueAt_(row, colExpectedAt) || valueAt_(row, colExpectedText)) ? "نعم" : "لا",
      registrationSent: normalize_(valueAt_(row, colRegistrationSent))
    });
  }

  rows.sort(function(a, b) {
    const pa = priorityRank_(a.priority);
    const pb = priorityRank_(b.priority);
    if (pa !== pb) return pa - pb;
    return String(a.orderId).localeCompare(String(b.orderId));
  });
  return { success: true, rows: rows };
}

function updateLine_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const rowNumber = Number(e.parameter.rowNumber || 0);
  const lineId = normalize_(e.parameter.lineId);
  const orderIdParam = normalize_(e.parameter.orderId);
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const notes = normalize_(e.parameter.notes);

  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!sheet) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(sheet);

  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colReady = firstCol_(h, ["جاهز؟", "جاهز", "Ready"], 12);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 14);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colDebt = firstCol_(h, ["مديونية العميل"], 0);
  const colDebtHold = firstCol_(h, ["إيقاف بسبب مديونية؟", "مديونية؟"], 0);

  if (!colStatus) return { success: false, message: 'عمود "الحالة" غير موجود في شيت بنود الأوردرات.' };
  if (!lineId && !rowNumber && !orderIdParam) return { success: false, message: "رقم البند أو رقم الصف ناقص." };

  let targetRow = 0;
  let orderId = orderIdParam;
  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) {
    targetRow = rowNumber;
    orderId = orderId || normalize_(sheet.getRange(targetRow, colOrderId).getValue());
  }
  if (!targetRow && lineId) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalize_(data[i][colLineId - 1]) === lineId) {
        targetRow = i + 1;
        orderId = orderId || normalize_(data[i][colOrderId - 1]);
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "البند غير موجود في الشيت." };

  const rowValues = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  const customerName = normalize_(valueAt_(rowValues, colCustomer));
  // قرار إيقاف التسليم يعتمد على شيت العملاء فقط، وليس على رقم قديم داخل الأوردر.
  const debtInfo = isCustomerDebtBlocked_(customerName);
  const debtAmount = parseDebtAmount_(debtInfo.amount || 0);
  const debtHold = debtAmount > 0;
  if (debtHold && (status === "جاهز للاستلام" || status === "تم التسليم")) {
    return { success: false, message: "لا يمكن تحويل الأوردر إلى " + status + " لأن العميل عليه مديونية " + debtAmount + " ج. برجاء تقفيل المديونية أولاً." };
  }

  const oldStatus = colStatus ? normalize_(sheet.getRange(targetRow, colStatus).getValue()) : "";
  const oldNotes = colNotes ? normalize_(sheet.getRange(targetRow, colNotes).getValue()) : "";
  const now = new Date();
  safeSet_(sheet, targetRow, colStatus, status);
  if (colNotes) safeSet_(sheet, targetRow, colNotes, notes);
  if (colUpdated) safeSet_(sheet, targetRow, colUpdated, now);
  if (colReady) safeSet_(sheet, targetRow, colReady, isReadyStatus_(status) ? "نعم" : "لا");
  if (colDebt) safeSet_(sheet, targetRow, colDebt, debtAmount);
  if (colDebtHold) safeSet_(sheet, targetRow, colDebtHold, debtAmount > 0 ? "نعم" : "لا");

  if (orderId) syncOrderFromLines_(orderId);
  if (oldStatus !== status || oldNotes !== notes) {
    appendActivityLog_({ time: now, orderId: orderId, lineId: lineId || normalize_(sheet.getRange(targetRow, colLineId).getValue()), customer: customerName, department: normalize_(valueAt_(rowValues, colDept)), action: "تعديل حالة / ملاحظات", oldStatus: oldStatus, newStatus: status, oldNotes: oldNotes, newNotes: notes, by: auth.user.username, details: debtAmount > 0 ? "تم الحفظ مع تنبيه مديونية" : "تم الحفظ من شاشة TrendOS" });
  }

  SpreadsheetApp.flush();
  return { success: true, message: "تم حفظ الحالة في الشيت.", rowNumber: targetRow, orderId: orderId, lineId: lineId, status: status, debtAmount: debtAmount, debtHold: debtAmount > 0 ? "نعم" : "لا" };
}

function getDashboard_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen || "service");
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  if (lines.getLastRow() < 2) return { success: true, dashboard: emptyDashboard_(screen) };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colDept = firstCol_(h, ["القسم", "Department"], 5);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 8);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 11);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 13);
  const colReceivedAt = firstCol_(h, ["تاريخ الاستلام", "تاريخ الإنشاء", "Received At"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colPress = firstCol_(h, ["مكبس", "مكبس حراري", "مكبس؟", "Press", "Heat Press"], 0);
  const colFlyPrint = firstCol_(h, ["طباعة على الطاير", "طباعة ع الطاير", "طباعة فورية", "Ready Print", "Fly Print", "Quick Print"], 0);
  const colDebt = firstCol_(h, ["مديونية العميل"], 0);

  const dashboard = emptyDashboard_(screen);
  const today = startOfToday_();
  const yesterday = addDays_(today, -1);
  const tomorrow = addDays_(today, 1);
  const todayWorkOrderSet = {}, activeOrderSet = {}, deliveredTodayOrderSet = {}, readyOrderSet = {}, overdueOrderSet = {};
  let todayWorkDoneLines = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    const status = normalize_(valueAt_(row, colStatus)) || "طلب جديد";
    const priority = normalize_(valueAt_(row, colPriority)) || "عادي";
    const dept = normalize_(valueAt_(row, colDept)) || "غير محدد";
    const press = isHeatPressFlag_(valueAt_(row, colPress));
    const qty = Number(valueAt_(row, colQty)) || 1;
    const expectedRaw = valueAt_(row, colExpectedAt) || valueAt_(row, colExpectedText);
    const receivedRaw = valueAt_(row, colReceivedAt);
    const updatedRaw = valueAt_(row, colUpdated);
    if (!orderId && !dept) continue;
    if (!dashboardMatchesScreen_(screen, dept, press)) continue;

    const received = parseDateValue_(receivedRaw);
    let expected = parseDateValue_(expectedRaw);
    if (!expected && received) expected = addDays_(received, 2);
    const updated = parseDateValue_(updatedRaw);
    const debtAmount = colDebt ? parseDebtAmount_(valueAt_(row, colDebt)) : 0;
    if (debtAmount > 0) dashboard.debtOrders = (dashboard.debtOrders || 0) + 1;

    if (status === "تم التسليم") {
      dashboard.delivered++;
      if (isSameDay_(updated, today)) { dashboard.deliveredToday++; if (orderId) deliveredTodayOrderSet[orderId] = true; }
    }
    if (status === "جاهز للاستلام") { dashboard.readyForPickup++; if (orderId) readyOrderSet[orderId] = true; }
    if (status === "مكرر") dashboard.duplicate++;

    const isTodayWork = isSameDay_(received, yesterday) && isSameDay_(expected, tomorrow);
    if (isTodayWork) {
      dashboard.todayWorkLines++;
      dashboard.todayWorkSheets += qty;
      if (orderId) todayWorkOrderSet[orderId] = true;
      if (isReadyStatus_(status) || status === "تم التسليم") todayWorkDoneLines++;
    }

    if (!isHiddenFromUserScreens_(status)) {
      dashboard.activeLines++;
      dashboard.activeSheets += qty;
      if (orderId) activeOrderSet[orderId] = true;
      if (priority === "عاجل" || priority === "VIP") dashboard.urgent++;
      else if (!priority || priority === "عادي") dashboard.normal++;
      else if (priority === "مؤجل") dashboard.delayedPriority++;
      dashboard.byDepartment[dept] = (dashboard.byDepartment[dept] || 0) + 1;
      if (press || dept === "مكبس") dashboard.heatPress++;
      if (status === "مشكلة" || status === "متوقف") dashboard.problems++;
      if (isOverdueByExpected_(status, expected || expectedRaw)) { dashboard.overdue++; if (orderId) overdueOrderSet[orderId] = true; }
    }
  }

  dashboard.todayWorkOrders = Object.keys(todayWorkOrderSet).length;
  dashboard.todayOrders = dashboard.todayWorkOrders;
  dashboard.activeOrders = Object.keys(activeOrderSet).length;
  dashboard.deliveredTodayOrders = Object.keys(deliveredTodayOrderSet).length;
  dashboard.readyOrders = Object.keys(readyOrderSet).length;
  dashboard.overdueOrders = Object.keys(overdueOrderSet).length;
  dashboard.todayWorkDoneLines = todayWorkDoneLines;
  const target = Math.max(1, dashboard.todayWorkLines + dashboard.overdue);
  dashboard.completionPercent = Math.min(100, Math.round((todayWorkDoneLines / Math.max(1, dashboard.todayWorkLines)) * 100));
  dashboard.timeScore = Math.max(0, Math.round(100 - ((dashboard.overdue / target) * 100)));
  dashboard.performanceScore = Math.round((dashboard.completionPercent * 0.6) + (dashboard.timeScore * 0.4));
  dashboard.updatedAt = formatDateAr_(new Date());
  return { success: true, dashboard: dashboard };
}

function emptyDashboard_(screen) {
  const nameMap = { service: "خدمة العملاء", print: "الطباعة", laser: "الليزر", press: "المكبس" };
  return {
    screen: screen || "service", departmentName: nameMap[screen] || "خدمة العملاء", todayOrders: 0, todayWorkOrders: 0, todayWorkLines: 0, todayWorkSheets: 0, todayWorkDoneLines: 0, activeOrders: 0, activeLines: 0, activeSheets: 0, urgent: 0, normal: 0, delayedPriority: 0, overdue: 0, overdueOrders: 0, problems: 0, readyForPickup: 0, readyOrders: 0, delivered: 0, deliveredToday: 0, deliveredTodayOrders: 0, duplicate: 0, heatPress: 0, debtOrders: 0, completionPercent: 0, timeScore: 100, performanceScore: 0, byDepartment: { "طباعة": 0, "ليزر": 0, "مكبس": 0 }
  };
}

/************************************************************
 * V1830 - FIX PRICING SHEET HELPER
 * يحل خطأ: mbEnsureSheet_ is not defined
 * يستخدمه شيت: بنود تسعير الفاتورة
 ************************************************************/
function mbEnsureSheet_(name, headers) {
  const ss = ss_();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  headers = headers || [];
  if (!headers.length) return sheet;

  let currentHeaders = [];

  if (sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 1) {
    currentHeaders = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getDisplayValues()[0]
      .map(function (h) {
        return String(h || "").trim();
      });
  }

  const isEmptyHeader = !currentHeaders.length || currentHeaders.every(function (h) {
    return !h;
  });

  if (isEmptyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    headers.forEach(function (header) {
      header = String(header || "").trim();
      if (!header) return;

      if (currentHeaders.indexOf(header) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
        currentHeaders.push(header);
      }
    });
  }

  try {
    sheet.setFrozenRows(1);
  } catch (err) {}

  return sheet;
}


/************************************************************
 * Matbagy Client Bridge V1831
 * يعيد تفعيل تطبيق مطبعجي شيتات مع نفس سيرفر TrendOS
 * actions:
 * activate / checkActivation / checkSession / createOrder / getOrderStatus
 ************************************************************/

const MB_SHEET_SESSIONS = "جلسات العملاء";
const MB_SOURCE_NAME = "تطبيق مطبعجي شيتات";
const MB_DEFAULT_DEPARTMENT = "طباعة";
const MB_DEFAULT_PRIORITY = "عادي";

function mbParamPhone_(e) {
  return cleanPhone_(
    e.parameter.phone ||
    e.parameter.customerPhone ||
    e.parameter.mobile ||
    e.parameter.whatsapp ||
    e.parameter.code ||
    ""
  );
}

function mbActivate_(e) {
  const phone = mbParamPhone_(e);
  const deviceId = normalize_(e.parameter.deviceId || e.parameter.device || "");

  if (!phone) {
    return { success: false, found: false, message: "برجاء إدخال رقم الهاتف." };
  }

  const customer = mbFindCustomerByPhone_(phone);
  if (!customer) {
    return {
      success: false,
      found: false,
      active: false,
      message: "الرقم غير مسجل أو غير مفعل في شيت العملاء."
    };
  }

  mbUpsertSession_(customer, deviceId);

  return {
    success: true,
    found: true,
    active: true,
    customer: {
      name: customer.name || "عميل مطبعجي بنها",
      manager: customer.manager || "",
      phone: customer.phone || phone,
      extraPhone: customer.extraPhone || "",
      type: customer.type || ""
    },
    message: "تم تفعيل تطبيق مطبعجي بنجاح."
  };
}

function mbCheckSession_(e) {
  const phone = mbParamPhone_(e);
  const deviceId = normalize_(e.parameter.deviceId || e.parameter.device || "");

  if (!phone) return { success: false, message: "رقم الهاتف مطلوب." };

  const customer = mbFindCustomerByPhone_(phone);
  if (!customer) {
    return { success: false, found: false, active: false, message: "الجلسة غير صالحة. الرقم غير مفعل." };
  }

  mbUpsertSession_(customer, deviceId);

  return {
    success: true,
    found: true,
    active: true,
    customer: {
      name: customer.name || "عميل مطبعجي بنها",
      manager: customer.manager || "",
      phone: customer.phone || phone,
      type: customer.type || ""
    },
    message: "الجلسة صالحة."
  };
}

function mbCreateOrder_(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const phone = mbParamPhone_(e);
    if (!phone) return { success: false, message: "رقم العميل مطلوب لإنشاء الأوردر." };

    const customer = mbFindCustomerByPhone_(phone);
    if (!customer) return { success: false, message: "لا يمكن إنشاء أوردر. الرقم غير مفعل في العملاء." };

    const ss = ss_();
    const lines = ss.getSheetByName(SHEET_NAME_LINES);
    const orders = ss.getSheetByName(SHEET_NAME_ORDERS);
    if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
    if (!orders) return { success: false, message: "شيت الأوردرات غير موجود." };

    ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
    ensureWhatsAppHeaders_(orders);
    ensureHeaderIfAnyMissing_(lines, ["المصدر", "القالب", "عدد الصور", "عدد الشيتات"]);
    ensureHeaderIfAnyMissing_(orders, ["المصدر", "القالب", "عدد الصور", "عدد الشيتات"]);

    const now = new Date();
    const template = normalize_(e.parameter.template || e.parameter.layout || "شيت صور");
    const photoCount = Number(e.parameter.photoCount || e.parameter.photos || 0) || 0;
    const sheetCount = Number(e.parameter.sheetCount || e.parameter.sheets || e.parameter.qty || 1) || 1;
    const customerName = normalize_(e.parameter.customerName) || customer.name || "عميل مطبعجي بنها";
    const customerType = normalize_(e.parameter.customerType) || customer.type || "";
    const priority = normalize_(e.parameter.priority) || MB_DEFAULT_PRIORITY;
    const status = "طلب جديد";
    const expectedDeliveryAt = expectedDeliveryDate_(now);
    const expectedDeliveryText = formatDateAr_(expectedDeliveryAt);
    const orderId = makeOrderId_(lines, now);
    const lineId = orderId + "-01";
    const itemName = normalize_(e.parameter.itemName) || ("شيت صور - " + template);
    const notes = normalize_(e.parameter.notes) || ("تم إنشاؤه من تطبيق مطبعجي | عدد الصور: " + photoCount + " | عدد الشيتات: " + sheetCount);

    upsertOrderSummary_({
      orderId: orderId,
      now: now,
      customerName: customerName,
      customerPhone: phone,
      customerType: customerType,
      department: MB_DEFAULT_DEPARTMENT,
      itemName: itemName,
      qty: sheetCount,
      priority: priority,
      status: status,
      lineCount: 1,
      readyCount: 0,
      notReadyCount: 1,
      partial: "لا",
      notes: notes,
      receivedAt: now,
      expectedDeliveryAt: expectedDeliveryAt,
      expectedDeliveryText: expectedDeliveryText
    });

    appendLine_(ss, {
      orderId: orderId,
      lineId: lineId,
      now: now,
      customerName: customerName,
      customerPhone: phone,
      customerType: customerType,
      department: MB_DEFAULT_DEPARTMENT,
      itemName: itemName,
      qty: sheetCount,
      priority: priority,
      status: status,
      assignedTo: defaultAssigned_(MB_DEFAULT_DEPARTMENT),
      notes: notes,
      receivedAt: now,
      expectedDeliveryAt: expectedDeliveryAt,
      expectedDeliveryText: expectedDeliveryText
    });

    updateByHeaders_(lines, lines.getLastRow(), {
      "المصدر": MB_SOURCE_NAME,
      "القالب": template,
      "عدد الصور": photoCount,
      "عدد الشيتات": sheetCount
    }, false);

    const orderRow = mbFindOrderRow_(orders, orderId);
    if (orderRow) {
      updateByHeaders_(orders, orderRow, {
        "المصدر": MB_SOURCE_NAME,
        "القالب": template,
        "عدد الصور": photoCount,
        "عدد الشيتات": sheetCount
      }, true);
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      orderId: orderId,
      lineId: lineId,
      linesCreated: 1,
      department: MB_DEFAULT_DEPARTMENT,
      status: status,
      expectedDeliveryText: expectedDeliveryText,
      message: "تم تسجيل أوردر Matbagy داخل TrendOS."
    };
  } catch (err) {
    return { success: false, message: "خطأ أثناء إنشاء أوردر Matbagy: " + (err && err.message ? err.message : err) };
  } finally {
    try { lock.releaseLock(); } catch (releaseErr) {}
  }
}

function mbGetOrderStatus_(e) {
  const orderId = normalize_(e.parameter.orderId || e.parameter.orderCode || e.parameter.code);
  const phone = mbParamPhone_(e);
  const orders = ss_().getSheetByName(SHEET_NAME_ORDERS);
  if (!orders) return { success: false, message: "شيت الأوردرات غير موجود." };

  const data = orders.getDataRange().getValues();
  const h = headersMap_(orders);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 3);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي", "رقم العميل", "رقم الهاتف", "Phone"], 0);
  const colStatus = firstCol_(h, ["الحالة العامة", "الحالة", "General Status", "Status"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);

  let found = null;
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const oid = normalize_(valueAt_(row, colOrderId)) || normalize_(valueAt_(row, colOrderCode));
    const rowPhone = cleanPhone_(valueAt_(row, colPhone));
    if (orderId && oid === orderId) { found = row; break; }
    if (!orderId && phone && rowPhone === phone) { found = row; break; }
  }

  if (!found) return { success: false, message: "لم يتم العثور على الأوردر." };

  const outOrderId = normalize_(valueAt_(found, colOrderId)) || normalize_(valueAt_(found, colOrderCode));
  return {
    success: true,
    order: {
      orderId: outOrderId,
      customerName: normalize_(valueAt_(found, colCustomer)),
      customerPhone: cleanPhone_(valueAt_(found, colPhone)),
      status: normalize_(valueAt_(found, colStatus)),
      expectedDeliveryText: dateText_(valueAt_(found, colExpectedText)) || normalize_(valueAt_(found, colExpectedText)),
      expectedDeliveryAt: dateText_(valueAt_(found, colExpectedAt)) || valueAt_(found, colExpectedAt)
    }
  };
}

function mbFindCustomerByPhone_(phone) {
  const target = cleanPhone_(phone);
  if (!target) return null;

  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet || sheet.getLastRow() < 2) return null;

  setPhoneColumnsAsText_(sheet);
  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);
  const colName = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name", "Name", "Cust Chat"], 1);
  const colManager = firstCol_(h, ["اسم المسؤول", "المسؤول", "Manager"], 2);
  const colPhone = firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 3);
  const colExtra = firstCol_(h, ["رقم إضافي", "رقم إضافى", "Extra Phone"], 4);
  const colType = firstCol_(h, ["نوع العميل", "Customer Type", "Type"], 5);
  const colActive = firstCol_(h, ["مفعل؟", "مفعل", "Active", "Status"], 0);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const activeValue = colActive ? normalize_(valueAt_(row, colActive)) : "نعم";
    if (!mbIsActiveCustomer_(activeValue)) continue;

    const p1 = colPhone ? cleanPhone_(valueAt_(row, colPhone)) : "";
    const p2 = colExtra ? cleanPhone_(valueAt_(row, colExtra)) : "";
    if (target === p1 || target === p2) {
      return {
        rowNumber: i + 1,
        name: normalize_(valueAt_(row, colName)),
        manager: colManager ? normalize_(valueAt_(row, colManager)) : "",
        phone: p1 || target,
        extraPhone: p2,
        type: colType ? normalize_(valueAt_(row, colType)) : "",
        active: activeValue || "نعم"
      };
    }
  }
  return null;
}

function mbIsActiveCustomer_(value) {
  const s = searchKey_(value);
  if (!s) return true;
  const activeValues = ["نعم", "مفعل", "فعال", "active", "yes", "true", "1"];
  const inactiveValues = ["لا", "غير مفعل", "موقوف", "inactive", "no", "false", "0"];
  if (inactiveValues.indexOf(s) !== -1) return false;
  if (activeValues.indexOf(s) !== -1) return true;
  return false;
}

function mbUpsertSession_(customer, deviceId) {
  const sheet = mbEnsureSheet_(MB_SHEET_SESSIONS, [
    "رقم العميل",
    "Device ID",
    "اسم العميل",
    "الحالة",
    "تاريخ التفعيل",
    "آخر ظهور"
  ]);

  const h = headersMap_(sheet);
  const colPhone = firstCol_(h, ["رقم العميل", "Phone"], 1);
  const colDevice = firstCol_(h, ["Device ID"], 2);
  const phone = cleanPhone_(customer.phone);
  const lastRow = sheet.getLastRow();
  let rowNumber = 0;

  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, Math.max(colPhone, colDevice, 1)).getValues();
    for (let i = 0; i < data.length; i++) {
      const rowPhone = cleanPhone_(data[i][colPhone - 1]);
      const rowDevice = colDevice ? normalize_(data[i][colDevice - 1]) : "";
      if (rowPhone === phone && (!deviceId || !rowDevice || rowDevice === deviceId)) {
        rowNumber = i + 2;
        break;
      }
    }
  }

  const now = new Date();
  const values = {
    "رقم العميل": phone,
    "Device ID": deviceId,
    "اسم العميل": customer.name || "",
    "الحالة": "نشط",
    "تاريخ التفعيل": now,
    "آخر ظهور": now
  };

  if (rowNumber) updateByHeaders_(sheet, rowNumber, values, true);
  else appendByHeaders_(sheet, values);
}

function mbFindOrderRow_(sheet, orderId) {
  const h = headersMap_(sheet);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colOrderCode = firstCol_(h, ["كود الأوردر"], 2);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const width = Math.max(colOrderId, colOrderCode, 1);
  const data = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const oid = normalize_(colOrderId ? row[colOrderId - 1] : "") || normalize_(colOrderCode ? row[colOrderCode - 1] : "");
    if (oid === orderId) return i + 2;
  }
  return 0;
}

/*********************** نهاية Matbagy Client Bridge V1831 ***********************/


/************************************************************
 * V1832 DEBT STRICT FIX
 * تنظيف أعمدة المديونية ومنع قراءة أي رقم تليفون/كود كمديونية
 ************************************************************/
function fixDebtColumnsNow() {
  const ss = ss_();
  const customers = ss.getSheetByName(SHEET_NAME_CUSTOMERS);
  let customersFixed = 0;
  let linesFixed = 0;
  let ordersFixed = 0;

  if (customers) {
    ensureHeaderIfAnyMissing_(customers, ["مديونية", "ملاحظات المديونية", "آخر تحديث مديونية"]);
    const h = headersMap_(customers);
    const debtCol = h["مديونية"];
    if (debtCol && customers.getLastRow() > 1) {
      const range = customers.getRange(2, debtCol, customers.getLastRow() - 1, 1);
      const values = range.getDisplayValues();
      const out = values.map(function(r) {
        const n = parseDebtAmount_(r[0]);
        customersFixed++;
        return [n > 0 ? n : ""];
      });
      range.setValues(out);
    }
  }

  function clearOrderDebtSheet_(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return 0;
    ensureHeaderIfAnyMissing_(sheet, ["مديونية العميل", "إيقاف بسبب مديونية؟", "ملاحظات المديونية"]);
    const h = headersMap_(sheet);
    const dc = h["مديونية العميل"];
    const hc = h["إيقاف بسبب مديونية؟"];
    const nc = h["ملاحظات المديونية"];
    const last = sheet.getLastRow();
    if (last <= 1) return 0;
    let count = last - 1;
    if (dc) sheet.getRange(2, dc, count, 1).clearContent();
    if (hc) sheet.getRange(2, hc, count, 1).clearContent();
    if (nc) sheet.getRange(2, nc, count, 1).clearContent();
    return count;
  }

  linesFixed = clearOrderDebtSheet_(SHEET_NAME_LINES);
  ordersFixed = clearOrderDebtSheet_(SHEET_NAME_ORDERS);
  SpreadsheetApp.flush();
  return {
    success: true,
    message: "تم تنظيف المديونيات القديمة. مصدر المديونية الآن هو عمود مديونية في شيت العملاء فقط.",
    customersFixed: customersFixed,
    linesFixed: linesFixed,
    ordersFixed: ordersFixed
  };
}

function debugCustomerDebt_(e) {
  const qPhone = cleanPhone_(e.parameter.phone || e.parameter.customerPhone || "");
  const qName = searchKey_(e.parameter.name || e.parameter.customerName || "");
  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet) return { success: false, message: "شيت العملاء غير موجود." };
  const h = headersMap_(sheet);
  const c = customerCols_(sheet);
  const data = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = normalize_(valueAt_(row, c.name));
    const phone = c.phone ? cleanPhone_(valueAt_(row, c.phone)) : "";
    const extra = c.extra ? cleanPhone_(valueAt_(row, c.extra)) : "";
    if ((qPhone && (qPhone === phone || qPhone === extra)) || (qName && searchKey_(name) === qName)) {
      const rawDebt = c.debt ? valueAt_(row, c.debt) : "";
      return {
        success: true,
        rowNumber: i + 1,
        name: name,
        phone: phone,
        extraPhone: extra,
        debtColumn: c.debt,
        debtHeader: c.debt ? sheet.getRange(1, c.debt).getDisplayValue() : "",
        rawDebt: rawDebt,
        parsedDebt: parseDebtAmount_(rawDebt),
        message: parseDebtAmount_(rawDebt) > 0 ? "العميل عليه مديونية." : "لا توجد مديونية مسجلة لهذا العميل."
      };
    }
  }
  return { success: false, message: "لم يتم العثور على العميل في شيت العملاء." };
}


/************************************************************
 * V1835 PATCH - طباعة على الطاير للطباعة فقط + فلتر مكبس مستقل
 * Patch إضافي فقط بدون حذف أي دوال موجودة.
 ************************************************************/

function ensurePressColumn_(sheet) {
  if (!sheet) return 0;
  const h = headersMap_(sheet);
  const existing = firstCol_(h, ["مكبس", "مكبس حراري", "مكبس؟", "Press", "Heat Press"], 0);
  if (existing) return existing;
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue("مكبس");
  SpreadsheetApp.flush();
  return sheet.getLastColumn();
}

function ensureFlyPrintColumn_(sheet) {
  if (!sheet) return 0;
  const h = headersMap_(sheet);
  const existing = firstCol_(h, ["طباعة على الطاير", "طباعة ع الطاير", "طباعة فورية", "Ready Print", "Fly Print", "Quick Print"], 0);
  if (existing) return existing;
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue("طباعة على الطاير");
  SpreadsheetApp.flush();
  return sheet.getLastColumn();
}

function isFlyPrintFlag_(value) {
  const v = normalize_(value).toLowerCase();
  return v === "نعم" || v === "true" || v === "1" || v === "on" || v === "طباعة على الطاير" || v === "طباعة ع الطاير" || v === "على الطاير" || v === "ع الطاير";
}

function isUrgentNotificationStatusVisible_(status) {
  const s = normalize_(status);
  return ["تم التسليم", "جاهز للاستلام", "ملغى", "مكرر"].indexOf(s) === -1;
}

function getUrgentNotifications_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen || "");
  const res = getRows_({ parameter: Object.assign({}, e.parameter, { screen: screen }) });
  if (!res.success) return res;

  const rows = (res.rows || []).filter(function(row) {
    const status = normalize_(row.status);
    const fly = isFlyPrintFlag_(row.flyPrint || row.quickPrint || row.fastPrint || row["طباعة على الطاير"] || row["طباعة ع الطاير"]);
    if (!fly) return false;
    if (normalize_(row.department) !== "طباعة") return false;
    if (!isUrgentNotificationStatusVisible_(status)) return false;
    return true;
  }).map(function(row) {
    return {
      orderId: row.orderId || "",
      lineId: row.lineId || "",
      customer: row.customer || "",
      department: row.department || "",
      status: row.status || "طلب جديد",
      expectedDelivery: row.expectedDeliveryText || row.expectedDeliveryAt || row.expectedDelivery || "",
      priority: row.priority || "عادي",
      heatPress: row.heatPress || "",
      flyPrint: row.flyPrint || "نعم"
    };
  });

  return {
    success: true,
    count: rows.length,
    rows: rows
  };
}

/************************************************************
 * V1843 PATCH - منصة مطبعجي بنها: بوابة العميل بالكود والباسورد
 * V1844 PATCH - شات طلب العميل + مسودات + رفع ملفات على Drive
 * Patch إضافي فقط بدون حذف دوال موجودة.
 ************************************************************/

const CUSTOMER_DEFAULT_PASSWORD = "1234";
const CUSTOMER_FILES_ROOT_FOLDER_ID = "1hPfI07anokjzD8RBUkv6tMSEH8vJE2OZ";
const SHEET_NAME_CUSTOMER_DRAFTS = "مسودات طلبات العملاء";
const SHEET_NAME_CUSTOMER_FILES = "ملفات وبنود بوابة العملاء";
const CUSTOMER_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

function customerPortalHeaderNames_() {
  return [
    "كود الشات",
    "كود العميل",
    "كلمة مرور العميل",
    "يجب تغيير كلمة المرور",
    "توكن العميل",
    "آخر دخول عميل",
    "آخر تغيير كلمة مرور عميل"
  ];
}

function ensureCustomerPortalHeaders_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if (!sheet) throw new Error("شيت العملاء غير موجود.");
  ensureHeaderIfAnyMissing_(sheet, customerPortalHeaderNames_());
  return sheet;
}

function customerCols_(sheet) {
  const h = headersMap_(sheet);
  return {
    name: firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 1),
    phone: firstCol_(h, ["رقم العميل الأساسي", "رقم العميل", "رقم الهاتف", "Phone"], 0),
    type: firstCol_(h, ["نوع العميل", "Customer Type", "Type"], 0),
    active: firstCol_(h, ["مفعل؟", "مفعل", "Active"], 0),
    code: firstCol_(h, ["كود الشات", "كود العميل", "Customer Code", "Chat Code"], 0),
    pass: firstCol_(h, ["كلمة مرور العميل", "باسورد العميل", "Customer Password", "Password"], 0),
    mustChange: firstCol_(h, ["يجب تغيير كلمة المرور", "Must Change Password"], 0),
    token: firstCol_(h, ["توكن العميل", "Customer Token"], 0),
    lastLogin: firstCol_(h, ["آخر دخول عميل", "Customer Last Login"], 0),
    passChanged: firstCol_(h, ["آخر تغيير كلمة مرور عميل"], 0)
  };
}

function hashCustomerPassword_(password) {
  const raw = normalize_(password);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  const b64 = Utilities.base64Encode(bytes);
  return "sha256:" + b64;
}

function customerPasswordMatches_(stored, input) {
  const s = normalize_(stored);
  const v = normalize_(input);
  if (!s) return v === CUSTOMER_DEFAULT_PASSWORD;
  if (s.indexOf("sha256:") === 0) return s === hashCustomerPassword_(v);
  return s === v;
}

function makeNextCustomerCode_(sheet, cols) {
  const lastRow = sheet.getLastRow();
  let maxCode = 1000;
  if (lastRow > 1 && cols.code) {
    const values = sheet.getRange(2, cols.code, lastRow - 1, 1).getValues();
    values.forEach(function (r) {
      const n = Number(cleanPhone_(r[0]));
      if (n && n > maxCode) maxCode = n;
    });
  }
  return String(maxCode + 1);
}

function findCustomerByPortalCode_(customerCode) {
  const sheet = ensureCustomerPortalHeaders_();
  const cols = customerCols_(sheet);
  const code = normalize_(customerCode);
  if (!code) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowCode = normalize_(valueAt_(row, cols.code));
    if (rowCode && rowCode === code) {
      return { sheet: sheet, rowNumber: i + 1, row: row, cols: cols };
    }
  }
  return null;
}

function customerPublicObject_(found, token) {
  const row = found.row;
  const cols = found.cols;
  return {
    customerCode: normalize_(valueAt_(row, cols.code)),
    name: normalize_(valueAt_(row, cols.name)),
    phone: cleanPhone_(valueAt_(row, cols.phone)),
    type: normalize_(valueAt_(row, cols.type)),
    token: token || normalize_(valueAt_(row, cols.token)),
    mustChange: normalize_(valueAt_(row, cols.mustChange)) === "نعم"
  };
}

function customerAuthorize_(customerCode, token) {
  const found = findCustomerByPortalCode_(customerCode);
  if (!found) return { ok: false, message: "كود الشات غير صحيح." };
  const storedToken = normalize_(valueAt_(found.row, found.cols.token));
  if (!storedToken || storedToken !== normalize_(token)) return { ok: false, message: "انتهت جلسة العميل. سجل الدخول مرة أخرى." };
  const active = normalize_(valueAt_(found.row, found.cols.active));
  if (active && active === "لا") return { ok: false, message: "حساب العميل غير مفعل." };
  return { ok: true, found: found, customer: customerPublicObject_(found, storedToken) };
}

function customerLogin_(e) {
  const code = normalize_(e.parameter.customerCode || e.parameter.code || e.parameter.chatCode);
  const password = normalize_(e.parameter.password || e.parameter.customerPassword);
  if (!code || !password) return { success: false, message: "كود الشات وكلمة المرور مطلوبين." };

  const found = findCustomerByPortalCode_(code);
  if (!found) return { success: false, message: "كود الشات غير موجود." };

  const active = normalize_(valueAt_(found.row, found.cols.active));
  if (active && active === "لا") return { success: false, message: "حساب العميل غير مفعل." };

  let stored = normalize_(valueAt_(found.row, found.cols.pass));
  if (!stored) {
    stored = hashCustomerPassword_(CUSTOMER_DEFAULT_PASSWORD);
    safeSet_(found.sheet, found.rowNumber, found.cols.pass, stored);
    safeSet_(found.sheet, found.rowNumber, found.cols.mustChange, "نعم");
  }

  if (!customerPasswordMatches_(stored, password)) return { success: false, message: "كلمة المرور غير صحيحة." };

  const token = Utilities.getUuid();
  safeSet_(found.sheet, found.rowNumber, found.cols.token, token);
  safeSet_(found.sheet, found.rowNumber, found.cols.lastLogin, new Date());
  SpreadsheetApp.flush();

  const refreshed = findCustomerByPortalCode_(code) || found;
  return { success: true, customer: customerPublicObject_(refreshed, token), message: "تم دخول العميل بنجاح." };
}

function changeCustomerPassword_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const oldPassword = normalize_(e.parameter.oldPassword);
  const newPassword = normalize_(e.parameter.newPassword);
  if (!oldPassword || !newPassword) return { success: false, message: "كلمة المرور الحالية والجديدة مطلوبين." };
  if (newPassword.length < 4) return { success: false, message: "كلمة المرور الجديدة يجب ألا تقل عن 4 أرقام/حروف." };

  const found = auth.found;
  const stored = normalize_(valueAt_(found.row, found.cols.pass));
  if (!customerPasswordMatches_(stored, oldPassword)) return { success: false, message: "كلمة المرور الحالية غير صحيحة." };

  safeSet_(found.sheet, found.rowNumber, found.cols.pass, hashCustomerPassword_(newPassword));
  safeSet_(found.sheet, found.rowNumber, found.cols.mustChange, "لا");
  safeSet_(found.sheet, found.rowNumber, found.cols.passChanged, new Date());
  SpreadsheetApp.flush();
  return { success: true, message: "تم تغيير كلمة مرور العميل." };
}

function getCustomerOrders_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const customer = auth.customer;
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const colOrderId = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colLineId = firstCol_(h, ["رقم البند", "Line ID"], 0);
  const colCode = firstCol_(h, ["كود الشات", "كود العميل", "Customer Code"], 0);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 0);
  const colDept = firstCol_(h, ["القسم", "Department"], 0);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 0);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 0);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 0);
  const colPriority = firstCol_(h, ["الأولوية", "Priority"], 0);
  const colNotes = firstCol_(h, ["ملاحظات العميل", "ملاحظات", "Notes"], 0);
  const colExpectedAt = firstCol_(h, ["تاريخ التسليم المتوقع", "Expected Delivery"], 0);
  const colExpectedText = firstCol_(h, ["الوقت المتوقع"], 0);
  const colUpdated = firstCol_(h, ["آخر تحديث", "Updated At"], 0);

  const orders = {};
  const nameKey = searchKey_(customer.name);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = normalize_(valueAt_(row, colOrderId));
    if (!orderId) continue;
    const rowCode = normalize_(valueAt_(row, colCode));
    const rowNameKey = searchKey_(valueAt_(row, colCustomer));
    if (rowCode !== customer.customerCode && (!nameKey || rowNameKey !== nameKey)) continue;
    if (!orders[orderId]) {
      orders[orderId] = {
        orderId: orderId,
        lineId: normalize_(valueAt_(row, colLineId)),
        department: normalize_(valueAt_(row, colDept)),
        itemName: normalize_(valueAt_(row, colItem)),
        qty: valueAt_(row, colQty) || "",
        status: normalize_(valueAt_(row, colStatus)) || "طلب جديد",
        priority: normalize_(valueAt_(row, colPriority)) || "عادي",
        notes: normalize_(valueAt_(row, colNotes)),
        expectedDeliveryAt: valueAt_(row, colExpectedAt) || "",
        expectedDeliveryText: valueAt_(row, colExpectedText) || "",
        updatedAt: valueAt_(row, colUpdated) || ""
      };
    }
  }

  const out = Object.keys(orders).map(function (k) { return orders[k]; }).sort(function (a, b) {
    return String(b.orderId).localeCompare(String(a.orderId));
  });

  return { success: true, orders: out, count: out.length };
}

function makeCustomerOrderSeparator_(customer, orderId, department, itemName) {
  return [
    "✅ فاصل أوردر منصة مطبعجي بنها",
    "كود الشات: " + (customer.customerCode || "-"),
    "اسم الشات: " + (customer.name || "-"),
    "رقم الأوردر: " + (orderId || "-"),
    "القسم: " + (department || "-"),
    itemName ? "المطلوب: " + itemName : "",
    "",
    "كل الملفات والصور والرسائل الموجودة فوق هذا الفاصل، وبعد آخر فاصل أوردر سابق، تخص رقم الأوردر المكتوب هنا فقط.",
    "أي شغل جديد بعد هذا الفاصل يحتاج رقم أوردر جديد."
  ].filter(Boolean).join("\n");
}

function createCustomerPortalOrder_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const customer = auth.customer;
  let department = normalize_(e.parameter.department) || "طباعة";
  let heatPress = isHeatPressFlag_(e.parameter.heatPress || e.parameter.press);
  if (department === "مكبس") { department = "طباعة"; heatPress = true; }
  const flyPrint = department === "طباعة" && isFlyPrintFlag_(e.parameter.flyPrint || e.parameter.quickPrint || e.parameter.fastPrint);
  let itemName = normalize_(e.parameter.itemName);
  const qty = Number(e.parameter.qty || 1) || 1;
  const customerNotes = normalize_(e.parameter.notes || e.parameter.customerNotes);
  const status = "طلب جديد";
  const priority = flyPrint ? "عاجل" : "عادي";

  if (!itemName) itemName = customerNotes || "أوردر جديد - " + department;
  if (!department) return { success: false, message: "القسم مطلوب." };

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);

  const now = new Date();
  const expectedDeliveryAt = flyPrint ? new Date(now) : expectedDeliveryDate_(now);
  const expectedDeliveryText = flyPrint ? (formatDateAr_(expectedDeliveryAt) + " - نفس اليوم") : formatDateAr_(expectedDeliveryAt);
  const orderId = makeOrderId_(lines, now);

  let departments = [];
  if (department === "متعدد الأقسام") {
    departments = [
      { department: "طباعة", assignedTo: "وائل", suffix: "طباعة" },
      { department: "ليزر", assignedTo: "جابر", suffix: "ليزر" }
    ];
  } else {
    departments = [{ department: department, assignedTo: defaultAssigned_(department), suffix: department }];
  }

  const separator = makeCustomerOrderSeparator_(customer, orderId, department, itemName);
  const common = {
    orderId: orderId,
    now: now,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerType: customer.type,
    department: department,
    itemName: itemName,
    qty: qty,
    priority: priority,
    status: status,
    lineCount: departments.length,
    readyCount: 0,
    notReadyCount: departments.length,
    partial: "لا",
    notes: customerNotes,
    receivedAt: now,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    heatPress: heatPress,
    flyPrint: flyPrint,
    debtAmount: 0,
    debtNotes: "",
    customerCode: customer.customerCode,
    source: "بوابة العميل",
    createdBy: "العميل",
    customerNotes: customerNotes,
    whatsappSeparator: separator,
    whatsappSeparatorStatus: "غير مؤكد"
  };

  upsertOrderSummary_(common);
  departments.forEach(function(d, idx) {
    const lineNo = String(idx + 1).padStart(2, "0");
    appendLine_(ss, Object.assign({}, common, {
      lineId: orderId + "-" + lineNo,
      department: d.department,
      itemName: departments.length > 1 ? (itemName + " - " + d.suffix) : itemName,
      assignedTo: d.assignedTo
    }));
  });

  appendActivityLog_({ time: now, orderId: orderId, lineId: orderId + "-01", customer: customer.name, department: department, action: "إنشاء أوردر من بوابة العميل", newStatus: status, by: "العميل " + customer.customerCode, details: "تم تسجيل الأوردر من منصة مطبعجي بنها" });

  SpreadsheetApp.flush();
  return {
    success: true,
    orderId: orderId,
    lineId: orderId + "-01",
    linesCreated: departments.length,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    separator: separator,
    message: "تم تسجيل الأوردر من بوابة العميل."
  };
}



/************************************************************
 * V1844 PATCH - شات طلب العميل + مسودات + رفع ملفات على Drive
 ************************************************************/

function customerDraftHeaders_() {
  return ["رقم المسودة", "كود الشات", "اسم العميل", "حالة المسودة", "تاريخ البداية", "تاريخ الإرسال للتنفيذ", "رقم الأوردر الناتج", "رابط فولدر المسودة", "معرف فولدر المسودة", "عدد البنود", "ملاحظات"];
}

function customerFileHeaders_() {
  return ["نوع السجل", "رقم المسودة", "رقم الأوردر", "رقم البند", "رقم بند المسودة", "كود الشات", "اسم العميل", "نوع الشغل", "القسم", "الكمية", "ملاحظات العميل", "مكبس", "طباعة على الطاير", "اسم الملف", "نوع الملف", "حجم الملف", "رابط الملف", "معرف الملف", "رابط فولدر البند", "معرف فولدر البند", "تاريخ الرفع", "مرفوع بواسطة", "حالة المسودة"];
}

function ensureCustomerDraftSheets_() {
  const ss = ss_();
  let drafts = ss.getSheetByName(SHEET_NAME_CUSTOMER_DRAFTS);
  if (!drafts) drafts = ss.insertSheet(SHEET_NAME_CUSTOMER_DRAFTS);
  ensureHeaderIfAnyMissing_(drafts, customerDraftHeaders_());

  let files = ss.getSheetByName(SHEET_NAME_CUSTOMER_FILES);
  if (!files) files = ss.insertSheet(SHEET_NAME_CUSTOMER_FILES);
  ensureHeaderIfAnyMissing_(files, customerFileHeaders_());
  return { drafts: drafts, files: files };
}

function initCustomerDraftsNow() {
  ensureCustomerDraftSheets_();
  const root = getCustomerFilesRootFolder_();
  return { success: true, message: "تم تجهيز شيتات مسودات العملاء وملفات Drive.", folderId: root.getId(), folderUrl: root.getUrl() };
}

function getCustomerFilesRootFolder_() {
  if (!CUSTOMER_FILES_ROOT_FOLDER_ID) throw new Error("لم يتم ضبط فولدر ملفات العملاء.");
  return DriveApp.getFolderById(CUSTOMER_FILES_ROOT_FOLDER_ID);
}

function safeDriveName_(value) {
  return normalize_(value).replace(/[\\/:*?"<>|#%{}~&]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "بدون اسم";
}

function getOrCreateChildFolder_(parent, name) {
  name = safeDriveName_(name);
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

function makeCustomerDraftId_(customerCode) {
  return "DRAFT-" + normalize_(customerCode || "C") + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100);
}

function findDraftRow_(draftId, customerCode) {
  const sh = ensureCustomerDraftSheets_().drafts;
  const h = headersMap_(sh);
  const colDraft = firstCol_(h, ["رقم المسودة"], 1);
  const colCode = firstCol_(h, ["كود الشات", "كود العميل"], 0);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalize_(valueAt_(row, colDraft)) === normalize_(draftId) && (!customerCode || normalize_(valueAt_(row, colCode)) === normalize_(customerCode))) {
      return { sheet: sh, rowNumber: i + 1, row: row, h: h };
    }
  }
  return null;
}

function createCustomerDraft_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const customer = auth.customer;
  const sheets = ensureCustomerDraftSheets_();
  const root = getCustomerFilesRootFolder_();
  const draftsRoot = getOrCreateChildFolder_(root, "مسودات العملاء");
  const customerFolder = getOrCreateChildFolder_(draftsRoot, "كود " + customer.customerCode + " - " + safeDriveName_(customer.name));
  const draftId = makeCustomerDraftId_(customer.customerCode);
  const draftFolder = getOrCreateChildFolder_(customerFolder, draftId);
  const now = new Date();

  appendByHeaders_(sheets.drafts, {
    "رقم المسودة": draftId,
    "كود الشات": customer.customerCode,
    "اسم العميل": customer.name,
    "حالة المسودة": "مسودة",
    "تاريخ البداية": now,
    "رابط فولدر المسودة": draftFolder.getUrl(),
    "معرف فولدر المسودة": draftFolder.getId(),
    "عدد البنود": 0
  });
  SpreadsheetApp.flush();
  return { success: true, draftId: draftId, folderUrl: draftFolder.getUrl(), message: "تم فتح مسودة طلب." };
}

function addCustomerDraftItem_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const customer = auth.customer;
  const draftId = normalize_(e.parameter.draftId);
  if (!draftId) return { success: false, message: "رقم المسودة مطلوب." };
  const foundDraft = findDraftRow_(draftId, customer.customerCode);
  if (!foundDraft) return { success: false, message: "المسودة غير موجودة." };
  const draftStatus = normalize_(valueAt_(foundDraft.row, firstCol_(foundDraft.h, ["حالة المسودة"], 0)));
  if (draftStatus && draftStatus !== "مسودة") return { success: false, message: "لا يمكن إضافة بنود بعد بدء التنفيذ." };

  let department = normalize_(e.parameter.department) || "طباعة";
  if (department !== "طباعة" && department !== "ليزر") department = "طباعة";
  const itemName = normalize_(e.parameter.itemName) || "بند جديد";
  const qty = Number(e.parameter.qty || 1) || 1;
  const notes = normalize_(e.parameter.notes || e.parameter.customerNotes);
  const heatPress = department === "طباعة" && isHeatPressFlag_(e.parameter.heatPress || e.parameter.press);
  const flyPrint = department === "طباعة" && isFlyPrintFlag_(e.parameter.flyPrint || e.parameter.quickPrint || e.parameter.fastPrint);

  const sheets = ensureCustomerDraftSheets_();
  const files = sheets.files;
  const h = headersMap_(files);
  const colDraft = firstCol_(h, ["رقم المسودة"], 0);
  const colRecord = firstCol_(h, ["نوع السجل"], 0);
  const data = files.getDataRange().getValues();
  let itemCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (normalize_(valueAt_(data[i], colDraft)) === draftId && normalize_(valueAt_(data[i], colRecord)) === "بند") itemCount++;
  }
  const itemId = draftId + "-I" + String(itemCount + 1).padStart(2, "0");
  const draftFolderId = normalize_(valueAt_(foundDraft.row, firstCol_(foundDraft.h, ["معرف فولدر المسودة"], 0)));
  const draftFolder = DriveApp.getFolderById(draftFolderId);
  const itemFolder = getOrCreateChildFolder_(draftFolder, "بند " + String(itemCount + 1).padStart(2, "0") + " - " + department + " - " + safeDriveName_(itemName));
  const now = new Date();

  appendByHeaders_(files, {
    "نوع السجل": "بند",
    "رقم المسودة": draftId,
    "رقم بند المسودة": itemId,
    "كود الشات": customer.customerCode,
    "اسم العميل": customer.name,
    "نوع الشغل": itemName,
    "القسم": department,
    "الكمية": qty,
    "ملاحظات العميل": notes,
    "مكبس": heatPress ? "نعم" : "لا",
    "طباعة على الطاير": flyPrint ? "نعم" : "لا",
    "رابط فولدر البند": itemFolder.getUrl(),
    "معرف فولدر البند": itemFolder.getId(),
    "تاريخ الرفع": now,
    "مرفوع بواسطة": "العميل",
    "حالة المسودة": "مسودة"
  });

  safeSet_(foundDraft.sheet, foundDraft.rowNumber, firstCol_(foundDraft.h, ["عدد البنود"], 0), itemCount + 1);
  SpreadsheetApp.flush();
  return { success: true, itemId: itemId, folderUrl: itemFolder.getUrl(), message: "تم إضافة البند للمسودة." };
}

function uploadCustomerDraftFile_(payload) {
  payload = payload || {};
  const auth = customerAuthorize_(payload.customerCode || payload.code, payload.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const customer = auth.customer;
  const draftId = normalize_(payload.draftId);
  const itemId = normalize_(payload.itemId);
  const fileName = safeDriveName_(payload.fileName || "upload.bin");
  const mimeType = normalize_(payload.mimeType) || "application/octet-stream";
  const base64 = normalize_(payload.base64);
  const size = Number(payload.size || 0) || 0;
  if (!draftId || !itemId || !base64) return { success: false, message: "بيانات رفع الملف ناقصة." };
  if (size > CUSTOMER_UPLOAD_MAX_BYTES) return { success: false, message: "حجم الملف أكبر من الحد المسموح 25MB." };

  const foundDraft = findDraftRow_(draftId, customer.customerCode);
  if (!foundDraft) return { success: false, message: "المسودة غير موجودة." };

  const sheets = ensureCustomerDraftSheets_();
  const files = sheets.files;
  const h = headersMap_(files);
  const colDraft = firstCol_(h, ["رقم المسودة"], 0);
  const colItem = firstCol_(h, ["رقم بند المسودة"], 0);
  const colRecord = firstCol_(h, ["نوع السجل"], 0);
  const colFolder = firstCol_(h, ["معرف فولدر البند"], 0);
  const data = files.getDataRange().getValues();
  let itemFolderId = "";
  let itemName = "";
  let department = "";
  let qty = "";
  let notes = "";
  let heatPress = "";
  let flyPrint = "";
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalize_(valueAt_(row, colDraft)) === draftId && normalize_(valueAt_(row, colItem)) === itemId && normalize_(valueAt_(row, colRecord)) === "بند") {
      itemFolderId = normalize_(valueAt_(row, colFolder));
      itemName = normalize_(valueAt_(row, firstCol_(h, ["نوع الشغل"], 0)));
      department = normalize_(valueAt_(row, firstCol_(h, ["القسم"], 0)));
      qty = valueAt_(row, firstCol_(h, ["الكمية"], 0));
      notes = normalize_(valueAt_(row, firstCol_(h, ["ملاحظات العميل"], 0)));
      heatPress = normalize_(valueAt_(row, firstCol_(h, ["مكبس"], 0)));
      flyPrint = normalize_(valueAt_(row, firstCol_(h, ["طباعة على الطاير"], 0)));
      break;
    }
  }
  if (!itemFolderId) return { success: false, message: "لم يتم العثور على فولدر البند." };

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const folder = DriveApp.getFolderById(itemFolderId);
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  const now = new Date();

  appendByHeaders_(files, {
    "نوع السجل": "ملف",
    "رقم المسودة": draftId,
    "رقم بند المسودة": itemId,
    "كود الشات": customer.customerCode,
    "اسم العميل": customer.name,
    "نوع الشغل": itemName,
    "القسم": department,
    "الكمية": qty,
    "ملاحظات العميل": notes,
    "مكبس": heatPress,
    "طباعة على الطاير": flyPrint,
    "اسم الملف": fileName,
    "نوع الملف": mimeType,
    "حجم الملف": size,
    "رابط الملف": file.getUrl(),
    "معرف الملف": file.getId(),
    "رابط فولدر البند": folder.getUrl(),
    "معرف فولدر البند": itemFolderId,
    "تاريخ الرفع": now,
    "مرفوع بواسطة": "العميل",
    "حالة المسودة": "مسودة"
  });
  SpreadsheetApp.flush();
  return { success: true, fileId: file.getId(), fileUrl: file.getUrl(), fileName: fileName, message: "تم رفع الملف." };
}

function collectDraftItems_(draftId, customerCode) {
  const sh = ensureCustomerDraftSheets_().files;
  const h = headersMap_(sh);
  const data = sh.getDataRange().getValues();
  const colRecord = firstCol_(h, ["نوع السجل"], 0);
  const colDraft = firstCol_(h, ["رقم المسودة"], 0);
  const colCode = firstCol_(h, ["كود الشات"], 0);
  const colItem = firstCol_(h, ["رقم بند المسودة"], 0);
  const items = {};
  const order = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalize_(valueAt_(row, colDraft)) !== draftId) continue;
    if (customerCode && normalize_(valueAt_(row, colCode)) !== normalize_(customerCode)) continue;
    const record = normalize_(valueAt_(row, colRecord));
    const itemId = normalize_(valueAt_(row, colItem));
    if (!itemId) continue;
    if (record === "بند") {
      if (!items[itemId]) order.push(itemId);
      items[itemId] = {
        itemId: itemId,
        rowNumber: i + 1,
        itemName: normalize_(valueAt_(row, firstCol_(h, ["نوع الشغل"], 0))),
        department: normalize_(valueAt_(row, firstCol_(h, ["القسم"], 0))),
        qty: valueAt_(row, firstCol_(h, ["الكمية"], 0)) || 1,
        notes: normalize_(valueAt_(row, firstCol_(h, ["ملاحظات العميل"], 0))),
        heatPress: normalize_(valueAt_(row, firstCol_(h, ["مكبس"], 0))) === "نعم",
        flyPrint: normalize_(valueAt_(row, firstCol_(h, ["طباعة على الطاير"], 0))) === "نعم",
        itemFolderUrl: normalize_(valueAt_(row, firstCol_(h, ["رابط فولدر البند"], 0))),
        itemFolderId: normalize_(valueAt_(row, firstCol_(h, ["معرف فولدر البند"], 0))),
        files: []
      };
    } else if (record === "ملف") {
      if (!items[itemId]) items[itemId] = { itemId: itemId, files: [] };
      items[itemId].files.push({
        name: normalize_(valueAt_(row, firstCol_(h, ["اسم الملف"], 0))),
        url: normalize_(valueAt_(row, firstCol_(h, ["رابط الملف"], 0))),
        fileId: normalize_(valueAt_(row, firstCol_(h, ["معرف الملف"], 0))),
        rowNumber: i + 1
      });
    }
  }
  return order.map(function (id) { return items[id]; }).filter(function (x) { return x && x.itemName; });
}

function submitCustomerDraft_(e) {
  const auth = customerAuthorize_(e.parameter.customerCode || e.parameter.code, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const customer = auth.customer;
  const draftId = normalize_(e.parameter.draftId);
  if (!draftId) return { success: false, message: "رقم المسودة مطلوب." };
  const foundDraft = findDraftRow_(draftId, customer.customerCode);
  if (!foundDraft) return { success: false, message: "المسودة غير موجودة." };
  const statusCol = firstCol_(foundDraft.h, ["حالة المسودة"], 0);
  const currentStatus = normalize_(valueAt_(foundDraft.row, statusCol));
  if (currentStatus && currentStatus !== "مسودة") {
    const existingOrder = normalize_(valueAt_(foundDraft.row, firstCol_(foundDraft.h, ["رقم الأوردر الناتج"], 0)));
    return { success: true, orderId: existingOrder, message: "تم بدء التنفيذ لهذه المسودة من قبل." };
  }

  const items = collectDraftItems_(draftId, customer.customerCode);
  if (!items.length) return { success: false, message: "لا توجد بنود داخل المسودة." };

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };
  ensureWhatsAppHeaders_(lines);
  ensurePressColumn_(lines);
  ensureFlyPrintColumn_(lines);
  ensureHeaderIfAnyMissing_(lines, ["كود الشات", "كود العميل", "مصدر الطلب", "أنشئ بواسطة", "ملاحظات العميل", "رابط فولدر البند", "رابط ملفات البند", "رقم المسودة", "القسم الرئيسي"]);
  const ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (ordersSheet) ensureHeaderIfAnyMissing_(ordersSheet, ["كود الشات", "كود العميل", "مصدر الطلب", "أنشئ بواسطة", "ملاحظات العميل", "رابط فولدر الطلب", "رقم المسودة"]);

  const now = new Date();
  const orderId = makeOrderId_(lines, now);
  const anyFly = items.some(function (x) { return x.flyPrint; });
  const allDepartments = items.map(function (x) { return x.department; }).filter(Boolean);
  const summaryDepartment = allDepartments.every(function (d) { return d === allDepartments[0]; }) ? (allDepartments[0] || "طباعة") : "طباعة + ليزر";
  const summaryName = items.map(function (x) { return x.itemName; }).join(" + ").slice(0, 180) || "طلب من بوابة العميل";
  const expectedDeliveryAt = anyFly ? new Date(now) : expectedDeliveryDate_(now);
  const expectedDeliveryText = anyFly ? (formatDateAr_(expectedDeliveryAt) + " - نفس اليوم") : formatDateAr_(expectedDeliveryAt);
  const draftFolderUrl = normalize_(valueAt_(foundDraft.row, firstCol_(foundDraft.h, ["رابط فولدر المسودة"], 0)));

  const common = {
    orderId: orderId,
    now: now,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerType: customer.type,
    department: summaryDepartment,
    itemName: summaryName,
    qty: 1,
    priority: anyFly ? "عاجل" : "عادي",
    status: "طلب جديد",
    lineCount: items.length,
    readyCount: 0,
    notReadyCount: items.length,
    partial: "لا",
    notes: "طلب من بوابة العميل - " + items.length + " بند",
    receivedAt: now,
    expectedDeliveryAt: expectedDeliveryAt,
    expectedDeliveryText: expectedDeliveryText,
    heatPress: items.some(function (x) { return x.heatPress; }),
    flyPrint: anyFly,
    debtAmount: 0,
    debtNotes: "",
    customerCode: customer.customerCode,
    source: "بوابة العميل - شات الطلب",
    createdBy: "العميل",
    customerNotes: "مسودة: " + draftId,
    draftId: draftId,
    draftFolderUrl: draftFolderUrl
  };

  upsertOrderSummary_(common);
  const lineResults = [];
  const itemLineMap = {}; // V1846: ربط رقم بند المسودة برقم بند الأوردر النهائي حتى تظهر ملفات الليزر والطباعة في محادثة الموظف.
  items.forEach(function (item, idx) {
    const lineNo = String(idx + 1).padStart(2, "0");
    const lineId = orderId + "-" + lineNo;
    const filesText = (item.files || []).map(function (f) { return f.name + ": " + f.url; }).join("\n");
    const notes = [item.notes || "", filesText ? "ملفات البند:\n" + filesText : "", item.itemFolderUrl ? "فولدر البند: " + item.itemFolderUrl : ""].filter(Boolean).join("\n");
    itemLineMap[item.itemId] = lineId;
    appendLine_(ss, Object.assign({}, common, {
      lineId: lineId,
      department: item.department || "طباعة",
      itemName: item.itemName || "بند جديد",
      qty: item.qty || 1,
      assignedTo: defaultAssigned_(item.department || "طباعة"),
      priority: item.flyPrint ? "عاجل" : "عادي",
      heatPress: item.heatPress,
      flyPrint: item.flyPrint,
      notes: notes,
      customerNotes: item.notes || "",
      itemFolderUrl: item.itemFolderUrl || "",
      filesText: filesText
    }));
    lineResults.push({ lineId: lineId, department: item.department, itemName: item.itemName });
  });

  // تحديث شيت المسودات وشيت الملفات برقم الأوردر النهائي
  safeSet_(foundDraft.sheet, foundDraft.rowNumber, statusCol, "تم بدء التنفيذ");
  safeSet_(foundDraft.sheet, foundDraft.rowNumber, firstCol_(foundDraft.h, ["تاريخ الإرسال للتنفيذ"], 0), now);
  safeSet_(foundDraft.sheet, foundDraft.rowNumber, firstCol_(foundDraft.h, ["رقم الأوردر الناتج"], 0), orderId);

  const filesSheet = ensureCustomerDraftSheets_().files;
  const fh = headersMap_(filesSheet);
  const fData = filesSheet.getDataRange().getValues();
  const colDraft = firstCol_(fh, ["رقم المسودة"], 0);
  const colOrder = firstCol_(fh, ["رقم الأوردر"], 0);
  const colLineFinal = firstCol_(fh, ["رقم البند"], 0);
  const colItemDraft = firstCol_(fh, ["رقم بند المسودة"], 0);
  const colStatus = firstCol_(fh, ["حالة المسودة"], 0);
  for (let i = 1; i < fData.length; i++) {
    if (normalize_(valueAt_(fData[i], colDraft)) === draftId) {
      const draftItemId = normalize_(valueAt_(fData[i], colItemDraft));
      safeSet_(filesSheet, i + 1, colOrder, orderId);
      if (colLineFinal && draftItemId && itemLineMap[draftItemId]) safeSet_(filesSheet, i + 1, colLineFinal, itemLineMap[draftItemId]);
      safeSet_(filesSheet, i + 1, colStatus, "تم بدء التنفيذ");
    }
  }

  appendActivityLog_({ time: now, orderId: orderId, lineId: orderId + "-01", customer: customer.name, department: summaryDepartment, action: "بدء تنفيذ طلب من بوابة العميل", newStatus: "طلب جديد", by: "العميل " + customer.customerCode, details: "تم تحويل المسودة " + draftId + " إلى أوردر رسمي بعدد بنود " + items.length });

  SpreadsheetApp.flush();
  return { success: true, orderId: orderId, lines: lineResults, count: lineResults.length, message: "تم بدء التنفيذ واستلام رقم الأوردر." };
}

function initCustomerPortalNow() {
  const sheet = ensureCustomerPortalHeaders_();
  const cols = customerCols_(sheet);
  const data = sheet.getDataRange().getValues();
  let changed = 0;
  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    const row = data[i];
    const name = normalize_(valueAt_(row, cols.name));
    if (!name) continue;
    let code = normalize_(valueAt_(row, cols.code));
    if (!code) {
      code = makeNextCustomerCode_(sheet, cols);
      safeSet_(sheet, rowNumber, cols.code, code);
      safeSet_(sheet, rowNumber, firstCol_(headersMap_(sheet), ["كود العميل"], 0), code);
      changed++;
    }
    if (!normalize_(valueAt_(row, cols.pass))) {
      safeSet_(sheet, rowNumber, cols.pass, hashCustomerPassword_(CUSTOMER_DEFAULT_PASSWORD));
      safeSet_(sheet, rowNumber, cols.mustChange, "نعم");
      changed++;
    }
  }
  ensureCustomerDraftSheets_();
  SpreadsheetApp.flush();
  return { success: true, message: "تم تجهيز بوابة العملاء.", changed: changed, defaultPassword: CUSTOMER_DEFAULT_PASSWORD };
}

/************************************************************
 * Drive Authorization Test - V1844
 * شغّل هذه الدالة مرة واحدة من محرر Apps Script لمنح صلاحية الكتابة على Google Drive.
 ************************************************************/
function testDriveWriteAuth() {
  const root = DriveApp.getFolderById(CUSTOMER_FILES_ROOT_FOLDER_ID || "1hPfI07anokjzD8RBUkv6tMSEH8vJE2OZ");
  const testFolderName = "TEST_AUTH_" + new Date().getTime();
  const folder = root.createFolder(testFolderName);
  folder.createFile("test.txt", "Drive write permission OK");
  Logger.log(folder.getUrl());
  return {
    success: true,
    message: "تم اختبار صلاحية الكتابة على Google Drive بنجاح.",
    folderUrl: folder.getUrl()
  };
}


/*********************** V1846 - محادثة الأوردر للموظف والملفات ***********************/
const SHEET_NAME_ORDER_CONVERSATIONS = "محادثات الأوردرات";

function orderConversationHeaders_() {
  return ["رقم الرسالة", "رقم الأوردر", "رقم البند", "كود الشات", "اسم العميل", "القسم", "نوع المرسل", "اسم المرسل", "نص الرسالة", "اسم الملف", "نوع الملف", "حجم الملف", "رابط الملف", "معرف الملف", "تاريخ الرسالة", "مرئي للعميل"];
}

function ensureOrderConversationSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME_ORDER_CONVERSATIONS);
  if (!sh) sh = ss.insertSheet(SHEET_NAME_ORDER_CONVERSATIONS);
  ensureHeaderIfAnyMissing_(sh, orderConversationHeaders_());
  return sh;
}

function initOrderConversationsNow() {
  const sh = ensureOrderConversationSheet_();
  return { success: true, message: "تم تجهيز شيت محادثات الأوردرات.", sheet: sh.getName() };
}

function makeConversationMessageId_() {
  return "MSG-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 9000 + 1000);
}

function collectOrderLinesForConversation_(orderId, lineId) {
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return [];
  const h = headersMap_(lines);
  const data = lines.getDataRange().getValues();
  const colOrder = firstCol_(h, ["رقم الأوردر", "Order ID"], 1);
  const colLine = firstCol_(h, ["رقم البند", "Line ID"], 0);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 0);
  const colCode = firstCol_(h, ["كود الشات", "كود العميل"], 0);
  const colDept = firstCol_(h, ["القسم", "Department"], 0);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل", "اسم البند", "Item Name"], 0);
  const colQty = firstCol_(h, ["الكمية", "Qty"], 0);
  const colStatus = firstCol_(h, ["الحالة", "Status"], 0);
  const colNotes = firstCol_(h, ["ملاحظات", "Notes"], 0);
  const colFolder = firstCol_(h, ["رابط فولدر البند"], 0);
  const colFiles = firstCol_(h, ["رابط ملفات البند"], 0);
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const oid = normalize_(valueAt_(row, colOrder));
    const lid = normalize_(valueAt_(row, colLine));
    if (oid !== normalize_(orderId)) continue;
    if (lineId && lid !== normalize_(lineId)) continue;
    out.push({
      rowNumber: i + 1,
      orderId: oid,
      lineId: lid,
      customer: normalize_(valueAt_(row, colCustomer)),
      customerCode: normalize_(valueAt_(row, colCode)),
      department: normalize_(valueAt_(row, colDept)),
      itemName: normalize_(valueAt_(row, colItem)),
      qty: valueAt_(row, colQty) || 1,
      status: normalize_(valueAt_(row, colStatus)),
      notes: normalize_(valueAt_(row, colNotes)),
      itemFolderUrl: normalize_(valueAt_(row, colFolder)),
      filesText: normalize_(valueAt_(row, colFiles))
    });
  }
  return out;
}

function collectOrderPortalFiles_(orderId, lineId) {
  const sh = ss_().getSheetByName(SHEET_NAME_CUSTOMER_FILES);
  if (!sh) return [];
  const h = headersMap_(sh);
  const data = sh.getDataRange().getValues();
  const colRecord = firstCol_(h, ["نوع السجل"], 0);
  const colOrder = firstCol_(h, ["رقم الأوردر"], 0);
  const colLine = firstCol_(h, ["رقم البند"], 0);
  const colItemDraft = firstCol_(h, ["رقم بند المسودة"], 0);
  const colName = firstCol_(h, ["اسم الملف"], 0);
  const colType = firstCol_(h, ["نوع الملف"], 0);
  const colUrl = firstCol_(h, ["رابط الملف"], 0);
  const colFileId = firstCol_(h, ["معرف الملف"], 0);
  const colItemName = firstCol_(h, ["نوع الشغل"], 0);
  const colDept = firstCol_(h, ["القسم"], 0);
  const colNotes = firstCol_(h, ["ملاحظات العميل"], 0);
  const colFolder = firstCol_(h, ["رابط فولدر البند"], 0);
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalize_(valueAt_(row, colOrder)) !== normalize_(orderId)) continue;
    const lid = normalize_(valueAt_(row, colLine));
    if (lineId && lid && lid !== normalize_(lineId)) continue;
    if (lineId && !lid) continue; // الملفات القديمة قبل V1846 تظهر على مستوى الأوردر كله فقط.
    const record = normalize_(valueAt_(row, colRecord));
    if (record !== "ملف" && record !== "بند") continue;
    out.push({
      recordType: record,
      orderId: orderId,
      lineId: lid,
      draftItemId: normalize_(valueAt_(row, colItemDraft)),
      itemName: normalize_(valueAt_(row, colItemName)),
      department: normalize_(valueAt_(row, colDept)),
      notes: normalize_(valueAt_(row, colNotes)),
      name: normalize_(valueAt_(row, colName)) || (record === "بند" ? "فولدر البند" : "ملف"),
      mimeType: normalize_(valueAt_(row, colType)),
      url: normalize_(valueAt_(row, colUrl)) || normalize_(valueAt_(row, colFolder)),
      fileId: normalize_(valueAt_(row, colFileId)),
      rowNumber: i + 1
    });
  }
  return out;
}

function collectOrderConversationMessages_(orderId, lineId) {
  const sh = ensureOrderConversationSheet_();
  const h = headersMap_(sh);
  const data = sh.getDataRange().getValues();
  const colOrder = firstCol_(h, ["رقم الأوردر"], 0);
  const colLine = firstCol_(h, ["رقم البند"], 0);
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalize_(valueAt_(row, colOrder)) !== normalize_(orderId)) continue;
    const lid = normalize_(valueAt_(row, colLine));
    if (lineId && lid && lid !== normalize_(lineId)) continue;
    out.push({
      messageId: normalize_(valueAt_(row, firstCol_(h, ["رقم الرسالة"], 0))),
      orderId: normalize_(valueAt_(row, colOrder)),
      lineId: lid,
      customerCode: normalize_(valueAt_(row, firstCol_(h, ["كود الشات"], 0))),
      customer: normalize_(valueAt_(row, firstCol_(h, ["اسم العميل"], 0))),
      department: normalize_(valueAt_(row, firstCol_(h, ["القسم"], 0))),
      senderType: normalize_(valueAt_(row, firstCol_(h, ["نوع المرسل"], 0))),
      senderName: normalize_(valueAt_(row, firstCol_(h, ["اسم المرسل"], 0))),
      text: normalize_(valueAt_(row, firstCol_(h, ["نص الرسالة"], 0))),
      fileName: normalize_(valueAt_(row, firstCol_(h, ["اسم الملف"], 0))),
      fileUrl: normalize_(valueAt_(row, firstCol_(h, ["رابط الملف"], 0))),
      mimeType: normalize_(valueAt_(row, firstCol_(h, ["نوع الملف"], 0))),
      createdAt: dateText_(valueAt_(row, firstCol_(h, ["تاريخ الرسالة"], 0))) || valueAt_(row, firstCol_(h, ["تاريخ الرسالة"], 0)),
      visibleToCustomer: normalize_(valueAt_(row, firstCol_(h, ["مرئي للعميل"], 0))) || "نعم"
    });
  }
  return out;
}

function getOrderConversation_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const orderId = normalize_(e.parameter.orderId);
  const lineId = normalize_(e.parameter.lineId);
  if (!orderId) return { success: false, message: "رقم الأوردر مطلوب." };
  const lines = collectOrderLinesForConversation_(orderId, lineId);
  if (!lines.length) return { success: false, message: "لم يتم العثور على بنود هذا الأوردر." };
  return {
    success: true,
    orderId: orderId,
    lineId: lineId,
    lines: lines,
    files: collectOrderPortalFiles_(orderId, lineId),
    messages: collectOrderConversationMessages_(orderId, lineId)
  };
}

function appendOrderConversationMessage_(o) {
  const sh = ensureOrderConversationSheet_();
  appendByHeaders_(sh, {
    "رقم الرسالة": o.messageId || makeConversationMessageId_(),
    "رقم الأوردر": o.orderId,
    "رقم البند": o.lineId || "",
    "كود الشات": o.customerCode || "",
    "اسم العميل": o.customerName || "",
    "القسم": o.department || "",
    "نوع المرسل": o.senderType || "موظف",
    "اسم المرسل": o.senderName || "",
    "نص الرسالة": o.text || "",
    "اسم الملف": o.fileName || "",
    "نوع الملف": o.mimeType || "",
    "حجم الملف": o.size || "",
    "رابط الملف": o.fileUrl || "",
    "معرف الملف": o.fileId || "",
    "تاريخ الرسالة": o.createdAt || new Date(),
    "مرئي للعميل": o.visibleToCustomer || "نعم"
  });
}

function sendOrderConversationMessage_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const orderId = normalize_(e.parameter.orderId);
  const lineId = normalize_(e.parameter.lineId);
  const text = normalize_(e.parameter.message || e.parameter.text);
  if (!orderId || !text) return { success: false, message: "رقم الأوردر ونص الرسالة مطلوبين." };
  const lines = collectOrderLinesForConversation_(orderId, lineId);
  if (!lines.length) return { success: false, message: "الأوردر غير موجود." };
  const line = lines[0];
  appendOrderConversationMessage_({
    orderId: orderId,
    lineId: lineId || line.lineId,
    customerCode: line.customerCode,
    customerName: line.customer,
    department: line.department,
    senderType: "موظف",
    senderName: auth.user.name || auth.user.username,
    text: text,
    visibleToCustomer: normalize_(e.parameter.visibleToCustomer) || "نعم"
  });
  SpreadsheetApp.flush();
  return { success: true, message: "تم حفظ رسالة المتابعة في محادثة الأوردر." };
}

function uploadOrderConversationFile_(payload) {
  payload = payload || {};
  const auth = authorize_(payload.username, payload.token);
  if (!auth.ok) return { success: false, message: auth.message };
  const orderId = normalize_(payload.orderId);
  const lineId = normalize_(payload.lineId);
  const text = normalize_(payload.message || payload.text);
  const fileName = safeDriveName_(payload.fileName || "proof.bin");
  const mimeType = normalize_(payload.mimeType) || "application/octet-stream";
  const base64 = normalize_(payload.base64);
  const size = Number(payload.size || 0) || 0;
  if (!orderId || !base64) return { success: false, message: "بيانات رفع البروفة ناقصة." };
  if (size > CUSTOMER_UPLOAD_MAX_BYTES) return { success: false, message: "حجم الملف أكبر من الحد المسموح 25MB." };
  const lines = collectOrderLinesForConversation_(orderId, lineId);
  if (!lines.length) return { success: false, message: "الأوردر غير موجود." };
  const line = lines[0];
  const root = getCustomerFilesRootFolder_();
  const convRoot = getOrCreateChildFolder_(root, "محادثات الأوردرات");
  const orderFolder = getOrCreateChildFolder_(convRoot, safeDriveName_(orderId + " - " + line.customer));
  const targetFolder = getOrCreateChildFolder_(orderFolder, safeDriveName_((lineId || line.lineId || "عام") + " - " + (line.itemName || "بند")));
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = targetFolder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  appendOrderConversationMessage_({
    orderId: orderId,
    lineId: lineId || line.lineId,
    customerCode: line.customerCode,
    customerName: line.customer,
    department: line.department,
    senderType: "موظف",
    senderName: auth.user.name || auth.user.username,
    text: text || "تم رفع ملف/بروفة من الموظف.",
    fileName: fileName,
    mimeType: mimeType,
    size: size,
    fileUrl: file.getUrl(),
    fileId: file.getId(),
    visibleToCustomer: normalize_(payload.visibleToCustomer) || "نعم"
  });
  SpreadsheetApp.flush();
  return { success: true, message: "تم رفع الملف وحفظه في محادثة الأوردر.", fileUrl: file.getUrl(), fileId: file.getId(), fileName: fileName };
}
