// TrendOS Tasks V3 T2 — PRODUCTION READ-ONLY WAEL CANARY
// SEPARATE Apps Script project/deployment only. Do not copy into main TrendOS Apps Script.
// No business writes. No claimNext. No completeTask. No schema creation.

const TASKS_V3_T2_PROTOCOL = 'TRENDOS_TASKS_V3_READONLY_1';
const TASKS_V3_T2_VERSION = 'TASKS_V3_READONLY_T2_CANARY_1';
const TASKS_V3_T2_PRINT_SHEET = 'واجهة الطباعة';
const TASKS_V3_T2_PRESS_SHEET = 'واجهة المكبس';
const TASKS_V3_T2_SOURCE_SHEET = 'بنود الأوردرات';
const TASKS_V3_T2_MAX_ASSERTION_AGE_SECONDS = 120;
const TASKS_V3_T2_ROLE = 'WAEL';

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return tasksV3T2Output_({ success: false, code: 'INVALID_JSON' });
  }

  const verified = tasksV3T2VerifyAssertion_(payload);
  if (!verified.ok) return tasksV3T2Output_({ success: false, code: verified.code });

  const role = tasksV3T2Text_(payload.role).toUpperCase();
  const operator = tasksV3T2Text_(payload.operator);
  if (role !== TASKS_V3_T2_ROLE || !operator) {
    return tasksV3T2Output_({ success: false, code: 'CAPABILITY_FORBIDDEN' });
  }

  const enabled = tasksV3T2Text_(verified.properties.TASKS_V3_T2_CANARY_ENABLED).toLowerCase();
  if (enabled !== 'true') {
    return tasksV3T2Output_({ success: false, code: 'T2_CANARY_DISABLED', readOnly: true });
  }

  const op = tasksV3T2Text_(payload.op);
  if (op === 'health') return tasksV3T2Output_(tasksV3T2Health_(verified.properties));
  if (op === 'status') return tasksV3T2Output_(tasksV3T2Status_(operator, verified.properties));
  if (op === 'flyPrint') return tasksV3T2Output_(tasksV3T2FlyPrint_(verified.properties));
  if (op === 'pressCandidates') return tasksV3T2Output_(tasksV3T2PressCandidates_(verified.properties));

  return tasksV3T2Output_({ success: false, code: 'READONLY_OPERATION_NOT_FOUND' });
}

function tasksV3T2Output_(body) {
  return ContentService.createTextOutput(JSON.stringify(body || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function tasksV3T2Text_(value) {
  return String(value == null ? '' : value).trim();
}

function tasksV3T2Properties_() {
  return PropertiesService.getScriptProperties().getProperties();
}

function tasksV3T2Spreadsheet_(properties) {
  const id = tasksV3T2Text_(properties && properties.TASKS_V3_SPREADSHEET_ID);
  if (!id) throw new Error('TASKS_V3_SPREADSHEET_ID_NOT_CONFIGURED');
  return SpreadsheetApp.openById(id);
}

function tasksV3T2RequiredSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('TASKS_V3_T2_REQUIRED_SHEET_MISSING');
  return sheet;
}

function tasksV3T2Canonical_(payload) {
  return [
    TASKS_V3_T2_PROTOCOL,
    tasksV3T2Text_(payload.op),
    tasksV3T2Text_(payload.operator),
    tasksV3T2Text_(payload.role).toUpperCase(),
    tasksV3T2Text_(payload.assertedAt),
    tasksV3T2Text_(payload.nonce),
    tasksV3T2Text_(payload.payloadJson || '{}')
  ].join('\n');
}

function tasksV3T2Hex_(bytes) {
  return (bytes || []).map(function (b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function tasksV3T2HmacHex_(value, secret) {
  return tasksV3T2Hex_(Utilities.computeHmacSha256Signature(value, secret));
}

function tasksV3T2ConstantTimeEquals_(a, b) {
  a = tasksV3T2Text_(a);
  b = tasksV3T2Text_(b);
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function tasksV3T2VerifyAssertion_(payload) {
  if (tasksV3T2Text_(payload.protocol) !== TASKS_V3_T2_PROTOCOL) {
    return { ok: false, code: 'PROTOCOL_INVALID' };
  }
  const assertedAt = Number(payload.assertedAt || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!assertedAt || Math.abs(now - assertedAt) > TASKS_V3_T2_MAX_ASSERTION_AGE_SECONDS) {
    return { ok: false, code: 'ASSERTION_EXPIRED' };
  }
  if (!tasksV3T2Text_(payload.operator) || !tasksV3T2Text_(payload.nonce)) {
    return { ok: false, code: 'ASSERTION_IDENTITY_INCOMPLETE' };
  }
  const properties = tasksV3T2Properties_();
  const secret = tasksV3T2Text_(properties.TASKS_V3_SHARED_SECRET);
  if (!secret) return { ok: false, code: 'BRIDGE_SECRET_NOT_CONFIGURED' };
  const expected = tasksV3T2HmacHex_(tasksV3T2Canonical_(payload), secret);
  if (!tasksV3T2ConstantTimeEquals_(expected, payload.signature)) {
    return { ok: false, code: 'SIGNATURE_INVALID' };
  }
  return { ok: true, properties: properties };
}

function tasksV3T2Bool_(value) {
  const v = tasksV3T2Text_(value).toLowerCase();
  return ['1', 'true', 'yes', 'on', 'نعم'].indexOf(v) !== -1;
}

function tasksV3T2IsInactiveStatus_(value) {
  const v = tasksV3T2Text_(value).toLowerCase();
  return ['ملغى', 'ملغي', 'تم التسليم', 'مكتمل', 'مكتملة', 'cancelled', 'canceled', 'completed', 'delivered'].indexOf(v) !== -1;
}

function tasksV3T2PublicRow_(row) {
  return {
    orderId: tasksV3T2Text_(row[0]),
    orderCode: tasksV3T2Text_(row[1]),
    lineId: tasksV3T2Text_(row[5]),
    itemName: tasksV3T2Text_(row[6]),
    department: tasksV3T2Text_(row[4]),
    assignee: tasksV3T2Text_(row[8]),
    priority: tasksV3T2Text_(row[9]),
    sourceStatus: tasksV3T2Text_(row[10]),
    ready: tasksV3T2Text_(row[11]),
    updatedAt: row[12] || ''
  };
}

function tasksV3T2ReadPrintProjection_(properties) {
  const ss = tasksV3T2Spreadsheet_(properties);
  const sheet = tasksV3T2RequiredSheet_(ss, TASKS_V3_T2_PRINT_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 18).getValues();
}

function tasksV3T2PressCandidates_(properties) {
  try {
    const rows = tasksV3T2ReadPrintProjection_(properties);
    const out = [];
    rows.forEach(function (row) {
      if (!tasksV3T2Bool_(row[17])) return;
      if (tasksV3T2IsInactiveStatus_(row[10])) return;
      out.push(tasksV3T2PublicRow_(row));
    });
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      lane: 'press',
      rows: out,
      count: out.length,
      readOnly: true,
      canary: true
    };
  } catch (err) {
    return { success: false, code: tasksV3T2Text_(err && err.message) || 'TASKS_V3_T2_READ_ERROR', readOnly: true };
  }
}

function tasksV3T2FlyPrint_(properties) {
  try {
    const ss = tasksV3T2Spreadsheet_(properties);
    const sheet = tasksV3T2RequiredSheet_(ss, TASKS_V3_T2_SOURCE_SHEET);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, version: TASKS_V3_T2_VERSION, lane: 'flyPrint', rows: [], count: 0, readOnly: true, canary: true };
    }

    // Narrow bounded projection only: A:M plus AS ("طباعة على الطاير").
    // Never read the full 92-column source range in T2 ordinary requests.
    const core = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
    const fly = sheet.getRange(2, 45, lastRow - 1, 1).getValues();
    const out = [];
    for (let i = 0; i < core.length; i++) {
      const row = core[i];
      if (!tasksV3T2Bool_(fly[i] && fly[i][0])) continue;
      if (tasksV3T2Text_(row[4]).toLowerCase() !== 'طباعة') continue;
      if (tasksV3T2IsInactiveStatus_(row[10])) continue;
      out.push(tasksV3T2PublicRow_(row));
    }
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      lane: 'flyPrint',
      rows: out,
      count: out.length,
      readOnly: true,
      canary: true
    };
  } catch (err) {
    return { success: false, code: tasksV3T2Text_(err && err.message) || 'TASKS_V3_T2_READ_ERROR', readOnly: true };
  }
}

function tasksV3T2Status_(operator, properties) {
  const flyPrint = tasksV3T2FlyPrint_(properties);
  const pressCandidates = tasksV3T2PressCandidates_(properties);
  return {
    success: flyPrint.success === true && pressCandidates.success === true,
    version: TASKS_V3_T2_VERSION,
    operator: tasksV3T2Text_(operator),
    role: TASKS_V3_T2_ROLE,
    activeTask: null,
    flyPrint: flyPrint,
    pressCandidates: pressCandidates,
    readOnly: true,
    canary: true
  };
}

function tasksV3T2Health_(properties) {
  try {
    const ss = tasksV3T2Spreadsheet_(properties);
    const printSheet = ss.getSheetByName(TASKS_V3_T2_PRINT_SHEET);
    const pressSheet = ss.getSheetByName(TASKS_V3_T2_PRESS_SHEET);
    const sourceSheet = ss.getSheetByName(TASKS_V3_T2_SOURCE_SHEET);
    return {
      success: !!printSheet && !!pressSheet && !!sourceSheet,
      version: TASKS_V3_T2_VERSION,
      spreadsheetConfigured: true,
      printViewReady: !!printSheet,
      pressViewReady: !!pressSheet,
      sourceProjectionReady: !!sourceSheet,
      roleScope: TASKS_V3_T2_ROLE,
      readOnly: true,
      canary: true
    };
  } catch (err) {
    return {
      success: false,
      code: tasksV3T2Text_(err && err.message) || 'TASKS_V3_T2_HEALTH_ERROR',
      readOnly: true,
      canary: true
    };
  }
}
