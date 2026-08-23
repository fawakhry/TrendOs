// TrendOS Attendance V1 backend module.
// IMPORTANT: Apps Script must route action === "attendanceV1" to attendanceV1_(e).
// This module reuses the existing TrendOS helpers: ss_(), authorize_(), headersMap_(), firstCol_(), normalize_().

const ATTENDANCE_SHEET_V1 = "سجل الدوام";
const ATTENDANCE_PULSE_SHEET_V1 = "نبض الحضور";
const ATTENDANCE_SETTINGS_SHEET_V1 = "إعدادات الدوام";
const ATTENDANCE_ACTIVITY_SHEET_V1 = "سجل حركة الأوردرات";
const ATTENDANCE_TZ_V1 = "Africa/Cairo";

const ATTENDANCE_HEADERS_V1 = [
  "معرف الجلسة","التاريخ","الموظف","القسم","بداية اليوم","نهاية اليوم",
  "إجمالي وقت التواجد","وقت العمل الفعلي","وقت التوقف","راحة اليوم المستخدمة",
  "حالة اليوم","آخر نبضة حضور","أوردرات مكتملة","بنود مكتملة","ملاحظات","مراجعة المدير"
];
const ATTENDANCE_PULSE_HEADERS_V1 = [
  "وقت الحدث","معرف الجلسة","الموظف","القسم","نوع الحدث","حالة الموظف",
  "وقت الاستجابة بالثواني","مصدر الحدث","ملاحظة الموظف","يحتاج مراجعة؟","سبب المراجعة","سجل تلقائيا؟"
];
const ATTENDANCE_SETTINGS_HEADERS_V1 = ["الإعداد","القيمة","الوصف","مفعل؟"];

function attendanceNowV1_() { return new Date(); }
function attendanceDateKeyV1_(d) { return Utilities.formatDate(d || attendanceNowV1_(), ATTENDANCE_TZ_V1, "yyyy-MM-dd"); }
function attendanceDateDisplayV1_(d) { return Utilities.formatDate(d || attendanceNowV1_(), ATTENDANCE_TZ_V1, "yyyy/MM/dd"); }
function attendanceIsoV1_(d) { return Utilities.formatDate(d || attendanceNowV1_(), ATTENDANCE_TZ_V1, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function attendanceBoolV1_(v, fallback) {
  const s = String(v == null ? "" : v).trim().toLowerCase();
  if (!s) return !!fallback;
  return ["نعم","yes","true","1","on"].indexOf(s) !== -1;
}
function attendanceNumberV1_(v, fallback) {
  const n = Number(v);
  return isFinite(n) ? n : Number(fallback || 0);
}
function attendanceDurationV1_(minutes) {
  minutes = Math.max(0, Math.floor(Number(minutes || 0)));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

function attendanceEnsureSheetV1_(name, headers) {
  const ss = ss_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  let changed = false;
  headers.forEach(function (h, i) { if (String(current[i] || "").trim() !== h) changed = true; });
  if (changed) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function attendanceEnsureAllV1_() {
  attendanceEnsureSheetV1_(ATTENDANCE_SHEET_V1, ATTENDANCE_HEADERS_V1);
  attendanceEnsureSheetV1_(ATTENDANCE_PULSE_SHEET_V1, ATTENDANCE_PULSE_HEADERS_V1);
  attendanceEnsureSheetV1_(ATTENDANCE_SETTINGS_SHEET_V1, ATTENDANCE_SETTINGS_HEADERS_V1);
}

function attendanceSettingsV1_() {
  attendanceEnsureAllV1_();
  const sheet = ss_().getSheetByName(ATTENDANCE_SETTINGS_SHEET_V1);
  const map = {};
  if (sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(4, sheet.getLastColumn())).getValues();
    rows.forEach(function (r) {
      const k = String(r[0] || "").trim();
      if (k && attendanceBoolV1_(r[3], true)) map[k] = r[1];
    });
  }
  return {
    requireStart: attendanceBoolV1_(map.WORKDAY_REQUIRE_START, true),
    presenceCheckMinutes: Math.max(5, attendanceNumberV1_(map.PRESENCE_CHECK_MINUTES, 30)),
    presenceResponseMinutes: Math.max(1, attendanceNumberV1_(map.PRESENCE_RESPONSE_MINUTES, 10)),
    dailyRestMinutes: Math.max(0, attendanceNumberV1_(map.DAILY_REST_MINUTES, 30)),
    prayerReminders: attendanceBoolV1_(map.PRAYER_REMINDERS, true),
    prayerLocation: String(map.PRAYER_LOCATION || "Benha, Egypt"),
    prayerGraceMinutes: Math.max(5, attendanceNumberV1_(map.PRAYER_GRACE_MINUTES, 15)),
    desktopNotifications: attendanceBoolV1_(map.DESKTOP_NOTIFICATIONS, true),
    exemptAdmins: attendanceBoolV1_(map.EXEMPT_ADMINS, true),
    printWalkinPriority: String(map.PRINT_WALKIN_PRIORITY || "أعلى أولوية"),
    managerAlertPolicy: String(map.MANAGER_ALERT_POLICY || "استثناءات فقط")
  };
}

function attendanceFindOpenSessionV1_(username) {
  attendanceEnsureAllV1_();
  const sheet = ss_().getSheetByName(ATTENDANCE_SHEET_V1);
  if (sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, ATTENDANCE_HEADERS_V1.length).getValues();
  const today = attendanceDateDisplayV1_();
  for (let i = values.length - 1; i >= 0; i--) {
    const r = values[i];
    if (String(r[2] || "").trim() !== username) continue;
    const dateText = r[1] instanceof Date ? attendanceDateDisplayV1_(r[1]) : String(r[1] || "").trim();
    if (dateText !== today && dateText !== attendanceDateKeyV1_()) continue;
    const status = String(r[10] || "").trim();
    if (status !== "انتهى اليوم") return { rowNumber: i + 2, sessionId: String(r[0] || "").trim(), row: r };
  }
  return null;
}

function attendanceFindSessionRowV1_(sessionId) {
  const sheet = ss_().getSheetByName(ATTENDANCE_SHEET_V1);
  if (!sheet || sheet.getLastRow() < 2 || !sessionId) return null;
  const finder = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(sessionId).matchEntireCell(true).findNext();
  if (!finder) return null;
  return { sheet: sheet, rowNumber: finder.getRow(), row: sheet.getRange(finder.getRow(), 1, 1, ATTENDANCE_HEADERS_V1.length).getValues()[0] };
}

function attendanceAppendPulseV1_(session, auth, type, opts) {
  opts = opts || {};
  const sheet = attendanceEnsureSheetV1_(ATTENDANCE_PULSE_SHEET_V1, ATTENDANCE_PULSE_HEADERS_V1);
  const stateMap = {
    start_day:"يعمل", heartbeat:"يعمل", presence_confirmed:"يعمل", pause:"Pause", resume:"يعمل",
    rest_start:"Rest", prayer_break_start:"صلاة", end_day:"انتهى اليوم", missed_check:"يحتاج مراجعة"
  };
  sheet.appendRow([
    attendanceNowV1_(), session.sessionId, auth.user.username, auth.user.department || "",
    type, opts.state || stateMap[type] || "", Number(opts.responseSeconds || 0), opts.source || "TrendOS",
    opts.note || "", opts.review ? "نعم" : "لا", opts.reviewReason || "", opts.auto ? "نعم" : "لا"
  ]);
}

function attendanceEventsV1_(sessionId) {
  const sheet = ss_().getSheetByName(ATTENDANCE_PULSE_SHEET_V1);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const found = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(sessionId).matchEntireCell(true).findAll();
  const out = found.map(function (cell) {
    const r = sheet.getRange(cell.getRow(), 1, 1, ATTENDANCE_PULSE_HEADERS_V1.length).getValues()[0];
    return { time: r[0] instanceof Date ? r[0] : new Date(r[0]), type: String(r[4] || "").trim(), state: String(r[5] || "").trim(), review: String(r[9] || "").trim() === "نعم" };
  }).filter(function (e) { return e.time && !isNaN(e.time.getTime()); });
  out.sort(function (a, b) { return a.time.getTime() - b.time.getTime(); });
  return out;
}

function attendanceComputeV1_(sessionId) {
  const events = attendanceEventsV1_(sessionId);
  if (!events.length) return { status:"not_started", workMinutes:0, pauseMinutes:0, restMinutes:0, totalMinutes:0, lastPulse:null };
  let start = null, end = null, workStart = null, restStart = null;
  let workMs = 0, restMs = 0, status = "not_started", lastPulse = null, needsReview = false;
  function closeWork(t) { if (workStart) { workMs += Math.max(0, t.getTime() - workStart.getTime()); workStart = null; } }
  function closeRest(t) { if (restStart) { restMs += Math.max(0, t.getTime() - restStart.getTime()); restStart = null; } }
  events.forEach(function (e) {
    const t = e.time;
    if (!start && e.type === "start_day") start = t;
    if (["heartbeat","presence_confirmed","missed_check"].indexOf(e.type) !== -1) lastPulse = t;
    if (e.type === "start_day") {
      if (!workStart) workStart = t;
      status = "working";
    } else if (e.type === "resume" || e.type === "presence_confirmed") {
      closeRest(t);
      if (!workStart) workStart = t;
      status = "working";
      if (e.type === "presence_confirmed") needsReview = false;
    } else if (e.type === "pause") {
      closeWork(t); closeRest(t); status = "paused";
    } else if (e.type === "rest_start") {
      closeWork(t); if (!restStart) restStart = t; status = "rest";
    } else if (e.type === "prayer_break_start") {
      closeWork(t); closeRest(t); status = "prayer";
    } else if (e.type === "missed_check") {
      // Do not deduct time or make an employment decision automatically.
      needsReview = true; status = "review";
    } else if (e.type === "end_day") {
      closeWork(t); closeRest(t); end = t; status = "ended";
    }
  });
  const now = end || attendanceNowV1_();
  if (!end && workStart) workMs += Math.max(0, now.getTime() - workStart.getTime());
  if (!end && restStart) restMs += Math.max(0, now.getTime() - restStart.getTime());
  const totalMs = start ? Math.max(0, now.getTime() - start.getTime()) : 0;
  const workMinutes = workMs / 60000;
  const restMinutes = restMs / 60000;
  const pauseMinutes = Math.max(0, totalMs / 60000 - workMinutes);
  return {
    status: status,
    needsReview: needsReview,
    start: start,
    end: end,
    workMinutes: workMinutes,
    restMinutes: restMinutes,
    pauseMinutes: pauseMinutes,
    totalMinutes: totalMs / 60000,
    lastPulse: lastPulse || (events.length ? events[events.length - 1].time : null)
  };
}

function attendanceProductivityV1_(username) {
  const sheet = ss_().getSheetByName(ATTENDANCE_ACTIVITY_SHEET_V1);
  if (!sheet || sheet.getLastRow() < 2) return { orders:0, lines:0 };
  const h = headersMap_(sheet);
  const cTime = firstCol_(h, ["الوقت"], 1), cOrder = firstCol_(h, ["رقم الأوردر"], 2), cLine = firstCol_(h, ["رقم البند"], 3), cNew = firstCol_(h, ["إلى حالة"], 8), cBy = firstCol_(h, ["بواسطة"], 11);
  const last = sheet.getLastRow();
  const scan = Math.min(Math.max(1, last - 1), 2000);
  const startRow = last - scan + 1;
  const cols = Math.max(cTime,cOrder,cLine,cNew,cBy);
  const rows = sheet.getRange(startRow, 1, scan, cols).getValues();
  const today = attendanceDateKeyV1_();
  const orderSet = {}, lineSet = {};
  rows.forEach(function (r) {
    if (String(r[cBy - 1] || "").trim() !== username) return;
    const t = r[cTime - 1] instanceof Date ? r[cTime - 1] : new Date(r[cTime - 1]);
    if (!t || isNaN(t.getTime()) || attendanceDateKeyV1_(t) !== today) return;
    const st = String(r[cNew - 1] || "").trim();
    if (["جاهز للاستلام","تم التسليم","تم التنفيذ"].indexOf(st) === -1) return;
    const oid = String(r[cOrder - 1] || "").trim(), lid = String(r[cLine - 1] || "").trim();
    if (oid) orderSet[oid] = true;
    if (lid) lineSet[lid] = true;
  });
  return { orders:Object.keys(orderSet).length, lines:Object.keys(lineSet).length };
}

function attendancePrayerTimesV1_(config) {
  if (!config.prayerReminders) return {};
  const cache = CacheService.getScriptCache();
  const cacheKey = "ATT_PRAYER_V1_" + attendanceDateKeyV1_() + "_" + String(config.prayerLocation || "Benha").replace(/[^A-Za-z0-9]/g,"_");
  try {
    const saved = cache.get(cacheKey);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  let city = "Benha", country = "Egypt";
  const parts = String(config.prayerLocation || "Benha, Egypt").split(",");
  if (parts[0]) city = parts[0].trim() || city;
  if (parts[1]) country = parts[1].trim() || country;
  try {
    const datePath = Utilities.formatDate(attendanceNowV1_(), ATTENDANCE_TZ_V1, "dd-MM-yyyy");
    const url = "https://api.aladhan.com/v1/timingsByCity/" + encodeURIComponent(datePath) + "?city=" + encodeURIComponent(city) + "&country=" + encodeURIComponent(country) + "&method=5";
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions:true, followRedirects:true });
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const obj = JSON.parse(response.getContentText() || "{}");
      const t = obj && obj.data && obj.data.timings ? obj.data.timings : {};
      const clean = {};
      ["Fajr","Dhuhr","Asr","Maghrib","Isha"].forEach(function (k) { if (t[k]) clean[k] = String(t[k]).replace(/\s*\(.+\)\s*$/,"").slice(0,5); });
      try { cache.put(cacheKey, JSON.stringify(clean), 21600); } catch (e2) {}
      return clean;
    }
  } catch (err) {}
  return {};
}

function attendanceUpdateSessionV1_(session, auth) {
  const found = attendanceFindSessionRowV1_(session.sessionId);
  if (!found) return null;
  const summary = attendanceComputeV1_(session.sessionId);
  const prod = attendanceProductivityV1_(auth.user.username);
  const stateText = { working:"يعمل", paused:"Pause", rest:"Rest", prayer:"صلاة", ended:"انتهى اليوم", review:"يحتاج مراجعة", not_started:"لم يبدأ" }[summary.status] || summary.status;
  const row = found.rowNumber;
  const sheet = found.sheet;
  sheet.getRange(row, 6).setValue(summary.end || "");
  sheet.getRange(row, 7).setValue(attendanceDurationV1_(summary.totalMinutes));
  sheet.getRange(row, 8).setValue(attendanceDurationV1_(summary.workMinutes));
  sheet.getRange(row, 9).setValue(attendanceDurationV1_(summary.pauseMinutes));
  sheet.getRange(row, 10).setValue(Math.floor(summary.restMinutes) + " دقيقة");
  sheet.getRange(row, 11).setValue(stateText);
  sheet.getRange(row, 12).setValue(summary.lastPulse || "");
  sheet.getRange(row, 13).setValue(prod.orders);
  sheet.getRange(row, 14).setValue(prod.lines);
  sheet.getRange(row, 16).setValue(summary.needsReview ? "يحتاج مراجعة" : "");
  return {
    sessionId: session.sessionId,
    status: summary.status,
    startAt: summary.start ? attendanceIsoV1_(summary.start) : "",
    endAt: summary.end ? attendanceIsoV1_(summary.end) : "",
    totalMinutes: Math.floor(summary.totalMinutes),
    workMinutes: Math.floor(summary.workMinutes),
    pauseMinutes: Math.floor(summary.pauseMinutes),
    restMinutes: Math.floor(summary.restMinutes),
    lastPulseAt: summary.lastPulse ? attendanceIsoV1_(summary.lastPulse) : "",
    needsReview: summary.needsReview,
    ordersCompleted: prod.orders,
    linesCompleted: prod.lines
  };
}

function attendanceStartV1_(auth) {
  let session = attendanceFindOpenSessionV1_(auth.user.username);
  if (!session) {
    const sheet = attendanceEnsureSheetV1_(ATTENDANCE_SHEET_V1, ATTENDANCE_HEADERS_V1);
    const now = attendanceNowV1_();
    const sessionId = "AT-" + attendanceDateKeyV1_(now).replace(/-/g,"") + "-" + auth.user.username + "-" + Utilities.getUuid().slice(0,8);
    sheet.appendRow([sessionId, attendanceDateDisplayV1_(now), auth.user.username, auth.user.department || "", now, "", "00:00", "00:00", "00:00", "0 دقيقة", "يعمل", now, 0, 0, "", ""]);
    session = { sessionId:sessionId, rowNumber:sheet.getLastRow() };
    attendanceAppendPulseV1_(session, auth, "start_day", { source:"TrendOS" });
  }
  return session;
}

function attendanceEventV1_(auth, op, p) {
  let session = attendanceFindOpenSessionV1_(auth.user.username);
  if (!session) return { success:false, message:"ابدأ يوم العمل أولاً." };
  const cfg = attendanceSettingsV1_();
  const summary = attendanceComputeV1_(session.sessionId);
  const map = {
    pause:"pause", resume:"resume", restStart:"rest_start", prayerStart:"prayer_break_start",
    confirm:"presence_confirmed", heartbeat:"heartbeat", missedCheck:"missed_check", end:"end_day"
  };
  const type = map[op];
  if (!type) return { success:false, message:"أمر دوام غير معروف." };
  if (op === "restStart" && summary.restMinutes >= cfg.dailyRestMinutes) return { success:false, message:"تم استخدام Rest اليومي بالكامل." };
  if (op === "end" && summary.status === "ended") return { success:true, message:"اليوم منتهٍ بالفعل." };
  attendanceAppendPulseV1_(session, auth, type, {
    source: String(p.source || "TrendOS"),
    note: String(p.note || ""),
    responseSeconds: Number(p.responseSeconds || 0),
    review: op === "missedCheck",
    reviewReason: op === "missedCheck" ? "لم يتم تأكيد التواجد خلال المهلة" : "",
    auto: op === "heartbeat" || op === "missedCheck"
  });
  return { success:true, session:session };
}

function attendanceStateResponseV1_(auth) {
  const cfg = attendanceSettingsV1_();
  const session = attendanceFindOpenSessionV1_(auth.user.username);
  if (!session) return { success:true, state:{ status:"not_started", workMinutes:0, pauseMinutes:0, restMinutes:0, totalMinutes:0, ordersCompleted:0, linesCompleted:0, prayerTimes:attendancePrayerTimesV1_(cfg) }, config:cfg };
  const state = attendanceUpdateSessionV1_(session, auth) || { status:"not_started" };
  state.prayerTimes = attendancePrayerTimesV1_(cfg);
  return { success:true, state:state, config:cfg };
}

function attendanceV1_(e) {
  e = e || { parameter:{} };
  const p = e.parameter || {};
  const auth = authorize_(p.username, p.token);
  if (!auth.ok) return { success:false, message:auth.message };
  attendanceEnsureAllV1_();
  const op = String(p.op || "state").trim();
  if (op === "state" || op === "config") return attendanceStateResponseV1_(auth);
  if (op === "start") {
    const session = attendanceStartV1_(auth);
    return attendanceStateResponseV1_(auth);
  }
  const changed = attendanceEventV1_(auth, op, p);
  if (!changed.success) return changed;
  return attendanceStateResponseV1_(auth);
}
