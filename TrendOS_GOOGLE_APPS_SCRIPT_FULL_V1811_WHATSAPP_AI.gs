/************************************************************
 * TrendOS Operations - Google Apps Script Backend
 * نسخة كاملة موحدة لإصلاح:
 * 1) تسجيل الدخول
 * 2) عرض البنود في البرنامج
 * 3) إضافة الأوردر في شيت الأوردرات + بنود الأوردرات
 * 4) حفظ الحالة والملاحظات في الشيتين
 * 5) تربيط الحالة العامة وعدد البنود الجاهزة وغير الجاهزة
 * 6) مساعد واتساب يدوي: رد حالة + إبلاغ العميل + تسجيل الإرسال
 ************************************************************/

const SHEET_NAME_USERS = "المستخدمين";
const SHEET_NAME_LINES = "بنود الأوردرات";
const SHEET_NAME_ORDERS = "الأوردرات";
const SHEET_NAME_CUSTOMERS = "العملاء";
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
    if (!action) {
      result = {
        success: false,
        message: "Action غير معروف. افتح رابط البرنامج من GitHub Pages، ورابط Apps Script يستخدم كـ API فقط."
      };
    } else if (action === "health") result = healthCheck_();
    else if (action === "login") result = login_(e);
    else if (action === "getRows") result = getRows_(e);
    else if (action === "updateLine") result = updateLine_(e);
    else if (action === "markCustomerNotified") result = markCustomerNotified_(e);
    else if (action === "changePassword") result = changePassword_(e);
    else if (action === "createManualOrder") result = createManualOrder_(e);
    else if (action === "searchCustomers") result = searchCustomers_(e);
    else if (action === "createCustomer") result = createCustomer_(e);
    else if (action === "syncAll") result = syncTrendOSNow();
    else if (action === "cleanStart") result = cleanStartKeepCustomersNow();
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
  return doGet(e);
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

function isReadyStatus_(status) {
  const s = normalize_(status);
  return s === "تم التنفيذ" || s === "جاهز للاستلام" || s === "تم التسليم";
}

function isStoppedStatus_(status) {
  const s = normalize_(status);
  return s === "مشكلة" || s === "متوقف";
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
    const phone = colPhone ? normalize_(row[colPhone - 1]) : "";
    const extra = colExtra ? normalize_(row[colExtra - 1]) : "";
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
  const phone = normalize_(e.parameter.phone || e.parameter.customerPhone);
  const extraPhone = normalize_(e.parameter.extraPhone || e.parameter.customerExtraPhone);
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

/*********************** عرض البنود ***********************/

function getRows_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = normalize_(e.parameter.screen);
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  ensureWhatsAppHeaders_(lines);

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
  const colPress = firstCol_(h, ["مكبس حراري", "مكبس؟"], 18);
  const colCustomerNotified = firstCol_(h, ["تم إبلاغ العميل؟"], 0);
  const colNotifyAt = firstCol_(h, ["وقت الإبلاغ"], 0);
  const colNotifyBy = firstCol_(h, ["تم الإبلاغ بواسطة"], 0);
  const colLastWaMessage = firstCol_(h, ["آخر رسالة واتساب"], 0);
  const colLastWaAt = firstCol_(h, ["آخر وقت واتساب"], 0);
  const colLastWaBy = firstCol_(h, ["آخر واتساب بواسطة"], 0);

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
    if (screen === "service" && status === "تم التسليم") continue;

    rows.push({
      rowNumber: i + 1,
      orderId: orderId,
      orderCode: normalize_(valueAt_(row, colOrderCode)) || orderId,
      lineId: lineId,
      customer: normalize_(valueAt_(row, colCustomer)),
      customerPhone: normalize_(valueAt_(row, colPhone)),
      department: department,
      itemName: normalize_(valueAt_(row, colItem)),
      qty: valueAt_(row, colQty) || 1,
      assignedTo: normalize_(valueAt_(row, colAssigned)),
      priority: normalize_(valueAt_(row, colPriority)) || "عادي",
      status: status || "طلب جديد",
      ready: normalize_(valueAt_(row, colReady)),
      updatedAt: valueAt_(row, colUpdated),
      notes: normalize_(valueAt_(row, colNotes)),
      customerNotified: normalize_(valueAt_(row, colCustomerNotified)),
      notifiedAt: valueAt_(row, colNotifyAt),
      notifiedBy: normalize_(valueAt_(row, colNotifyBy)),
      lastWhatsAppMessage: normalize_(valueAt_(row, colLastWaMessage)),
      lastWhatsAppAt: valueAt_(row, colLastWaAt),
      lastWhatsAppBy: normalize_(valueAt_(row, colLastWaBy))
    });
  }

  rows.sort(function (a, b) {
    const pa = a.priority === "عاجل" ? 0 : (a.priority === "عادي" ? 1 : 2);
    const pb = b.priority === "عاجل" ? 0 : (b.priority === "عادي" ? 1 : 2);
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
    "نوع رسالة واتساب"
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

  if (target.orderId) syncWhatsAppToOrder_(target.orderId, whatsappType, message, now, by);

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

  const now = new Date();
  safeSet_(sheet, targetRow, colStatus, status);
  if (colNotes) safeSet_(sheet, targetRow, colNotes, notes);
  if (colUpdated) safeSet_(sheet, targetRow, colUpdated, now);
  if (colReady) safeSet_(sheet, targetRow, colReady, isReadyStatus_(status) ? "نعم" : "لا");

  if (orderId) syncOrderFromLines_(orderId);

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
  let hasInProgress = false;
  let hasNew = false;

  matched.forEach(function (row) {
    const st = normalize_(valueAt_(row, colStatus));
    if (isReadyStatus_(st)) readyCount++;
    if (isStoppedStatus_(st)) stoppedCount++;
    if (st === "تم التسليم") deliveredCount++;
    if (st === "بدأ التنفيذ" || st === "تحت التنفيذ") hasInProgress = true;
    if (!st || st === "طلب جديد" || st === "جاهز للطباعة") hasNew = true;
  });

  const total = matched.length;
  const notReady = total - readyCount;
  let generalStatus = "طلب جديد";

  if (stoppedCount > 0) generalStatus = "مشكلة/متوقف";
  else if (deliveredCount === total) generalStatus = "تم التسليم";
  else if (readyCount === total) generalStatus = "جاهز للاستلام";
  else if (readyCount > 0) generalStatus = "تسليم جزئي";
  else if (hasInProgress) generalStatus = "تحت التنفيذ";
  else if (hasNew) generalStatus = "طلب جديد";

  const first = matched[0];
  const summary = {
    orderId: orderId,
    now: new Date(),
    customerName: normalize_(valueAt_(first, colCustomer)),
    customerPhone: normalize_(valueAt_(first, colPhone)),
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
    updatedAt: new Date()
  };

  upsertOrderSummary_(summary);
}

function upsertOrderSummary_(o) {
  const ss = ss_();
  const sheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!sheet) return;

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
    "رقم العميل": o.customerPhone,
    "رقم العميل الخارجي": o.customerPhone,
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
    "تم إبلاغ العميل؟": o.customerNotified || "لا"
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
  const customerPhone = normalize_(e.parameter.customerPhone);
  const customerType = normalize_(e.parameter.customerType);
  const department = normalize_(e.parameter.department);
  let itemName = normalize_(e.parameter.itemName);
  const qty = Number(e.parameter.qty || 1) || 1;
  const priority = normalize_(e.parameter.priority) || "عاجل";
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const assignedToParam = normalize_(e.parameter.assignedTo);
  const notes = normalize_(e.parameter.notes);

  if (!customerName || !department) return { success: false, message: "اسم الشات والقسم مطلوبين." };
  if (!itemName) itemName = "أوردر جديد - " + department;

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if (!lines) return { success: false, message: "شيت بنود الأوردرات غير موجود." };

  const now = new Date();
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
    notes: notes
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
      notes: notes
    });
  });

  SpreadsheetApp.flush();

  return {
    success: true,
    orderId: orderId,
    lineId: orderId + "-01",
    linesCreated: departments.length,
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

function makeOrderId_(sheet, now) {
  const tz = Session.getScriptTimeZone();
  const datePart = Utilities.formatDate(now, tz, "yyMMdd");
  const seq = Math.max(1, sheet.getLastRow());
  return "TM" + datePart + String(seq).padStart(4, "0");
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
    "رقم العميل": o.customerPhone,
    "رقم العميل الخارجي": o.customerPhone,
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
    "مكبس حراري": o.department === "مكبس" ? "نعم" : "لا",
    "تم إبلاغ العميل؟": "لا",
    "آخر رسالة واتساب": "",
    "آخر وقت واتساب": "",
    "آخر واتساب بواسطة": "",
    "نوع رسالة واتساب": ""
  });
}

/*********************** أدوات كتابة حسب الهيدر ***********************/

function appendByHeaders_(sheet, values) {
  const h = headersMap_(sheet);
  const lastCol = Math.max(1, sheet.getLastColumn());
  const row = new Array(lastCol).fill("");

  Object.keys(values).forEach(function (key) {
    const col = h[normalizeKey_(key)];
    if (col) row[col - 1] = values[key];
  });

  sheet.appendRow(row);
}

function updateByHeaders_(sheet, rowNumber, values, skipCreateDate) {
  const h = headersMap_(sheet);
  Object.keys(values).forEach(function (key) {
    if (skipCreateDate && key === "تاريخ الإنشاء") return;
    const col = h[normalizeKey_(key)];
    if (col) sheet.getRange(rowNumber, col).setValue(values[key]);
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
    "واجهة خدمة العملاء"
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
    setDropdownByHeader_(lines, h, ["الحالة", "Status"], ["طلب جديد", "جاهز للطباعة", "بدأ التنفيذ", "تحت التنفيذ", "تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مشكلة", "متوقف"]);
    setDropdownByHeader_(lines, h, ["جاهز؟", "جاهز", "Ready"], ["نعم", "لا"]);
    setDropdownByHeader_(lines, h, ["مكبس حراري", "مكبس؟"], ["نعم", "لا"]);
  }

  const orders = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (orders) {
    const h = headersMap_(orders);
    clearAllBodyValidations_(orders);
    setDropdownByHeader_(orders, h, ["القسم الرئيسي", "القسم", "Department"], ["طباعة", "ليزر", "مكبس", "متعدد الأقسام"]);
    setDropdownByHeader_(orders, h, ["الأولوية", "Priority"], ["عاجل", "عادي", "مؤجل"]);
    setDropdownByHeader_(orders, h, ["الحالة العامة", "الحالة", "Status"], ["طلب جديد", "جاهز للطباعة", "بدأ التنفيذ", "تحت التنفيذ", "تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مشكلة", "متوقف"]);
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
