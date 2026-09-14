// TrendOS Tasks V3 — T1 ISOLATED PREVIEW BRIDGE
// SEPARATE Apps Script project only. Never add this file to the main TrendOS Apps Script project.
// T1 scope: non-production preview spreadsheet + signed read-only operations only.

const TASKS_V3_PROTOCOL = 'TRENDOS_TASKS_V3_PREVIEW_READONLY_1';
const TASKS_V3_ENV = 'PREVIEW';
const TASKS_V3_INDEX_SHEET = 'تشغيل - فهرس المهام V3';
const TASKS_V3_LEDGER_SHEET = 'تشغيل - سجل المهام V3';
const TASKS_V3_MAX_ASSERTION_AGE_SECONDS = 120;
const TASKS_V3_FORBIDDEN_PRODUCTION_SPREADSHEET_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return tasksV3Output_({ success: false, code: 'INVALID_JSON', environment: TASKS_V3_ENV });
  }

  const verified = tasksV3VerifyAssertion_(payload);
  if (!verified.ok) return tasksV3Output_({ success: false, code: verified.code, environment: TASKS_V3_ENV });

  const op = tasksV3Text_(payload.op);
  const role = tasksV3Role_(payload.role);
  const operator = tasksV3Text_(payload.operator);

  if (op === 'health') return tasksV3Output_(tasksV3Health_());

  if (op === 'status') {
    if (!tasksV3RoleAllowed_(role, ['WAEL', 'MANAGER'])) {
      return tasksV3Output_({ success: false, code: 'CAPABILITY_FORBIDDEN', environment: TASKS_V3_ENV });
    }
    return tasksV3Output_(tasksV3Status_(operator, role));
  }

  if (op === 'flyPrint') {
    if (!tasksV3RoleAllowed_(role, ['WAEL', 'MANAGER'])) {
      return tasksV3Output_({ success: false, code: 'CAPABILITY_FORBIDDEN', environment: TASKS_V3_ENV });
    }
    return tasksV3Output_(tasksV3Lane_('flyPrint'));
  }

  if (op === 'pressCandidates') {
    if (!tasksV3RoleAllowed_(role, ['WAEL', 'MANAGER'])) {
      return tasksV3Output_({ success: false, code: 'CAPABILITY_FORBIDDEN', environment: TASKS_V3_ENV });
    }
    return tasksV3Output_(tasksV3Lane_('press'));
  }

  return tasksV3Output_({ success: false, code: 'READONLY_OPERATION_NOT_FOUND', environment: TASKS_V3_ENV });
}

function tasksV3Output_(body) {
  return ContentService.createTextOutput(JSON.stringify(body || {})).setMimeType(ContentService.MimeType.JSON);
}

function tasksV3Text_(value) {
  return String(value == null ? '' : value).trim();
}

function tasksV3Role_(value) {
  const role = tasksV3Text_(value).toUpperCase();
  return ['WAEL', 'MANAGER'].indexOf(role) !== -1 ? role : 'OTHER';
}

function tasksV3RoleAllowed_(role, allowed) {
  return (allowed || []).indexOf(role) !== -1;
}

function tasksV3Properties_() {
  return PropertiesService.getScriptProperties();
}

function tasksV3PreviewSpreadsheetId_() {
  const id = tasksV3Text_(tasksV3Properties_().getProperty('TASKS_V3_PREVIEW_SPREADSHEET_ID'));
  if (!id) throw new Error('TASKS_V3_PREVIEW_SPREADSHEET_ID_NOT_CONFIGURED');
  if (id === TASKS_V3_FORBIDDEN_PRODUCTION_SPREADSHEET_ID) {
    throw new Error('TASKS_V3_PREVIEW_PRODUCTION_SPREADSHEET_FORBIDDEN');
  }
  return id;
}

function tasksV3Spreadsheet_() {
  return SpreadsheetApp.openById(tasksV3PreviewSpreadsheetId_());
}

function tasksV3RequiredSheet_(name) {
  const sheet = tasksV3Spreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('TASKS_V3_PREVIEW_NOT_INITIALIZED');
  return sheet;
}

function tasksV3Canonical_(payload) {
  return [
    TASKS_V3_PROTOCOL,
    TASKS_V3_ENV,
    tasksV3Text_(payload.op),
    tasksV3Text_(payload.operator),
    tasksV3Role_(payload.role),
    tasksV3Text_(payload.assertedAt),
    tasksV3Text_(payload.nonce),
    tasksV3Text_(payload.payloadJson || '{}')
  ].join('\n');
}

function tasksV3Hex_(bytes) {
  return (bytes || []).map(function (b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function tasksV3HmacHex_(value, secret) {
  return tasksV3Hex_(Utilities.computeHmacSha256Signature(value, secret));
}

function tasksV3ConstantTimeEquals_(a, b) {
  a = tasksV3Text_(a);
  b = tasksV3Text_(b);
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function tasksV3VerifyAssertion_(payload) {
  if (tasksV3Text_(payload.protocol) !== TASKS_V3_PROTOCOL) {
    return { ok: false, code: 'PROTOCOL_INVALID' };
  }

  if (tasksV3Text_(payload.environment) !== TASKS_V3_ENV) {
    return { ok: false, code: 'ENVIRONMENT_INVALID' };
  }

  const assertedAt = Number(payload.assertedAt || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!assertedAt || Math.abs(now - assertedAt) > TASKS_V3_MAX_ASSERTION_AGE_SECONDS) {
    return { ok: false, code: 'ASSERTION_EXPIRED' };
  }

  if (!tasksV3Text_(payload.operator) || !tasksV3Text_(payload.nonce)) {
    return { ok: false, code: 'ASSERTION_IDENTITY_INCOMPLETE' };
  }

  const secret = tasksV3Text_(tasksV3Properties_().getProperty('TASKS_V3_PREVIEW_SHARED_SECRET'));
  if (!secret) return { ok: false, code: 'BRIDGE_SECRET_NOT_CONFIGURED' };

  const expected = tasksV3HmacHex_(tasksV3Canonical_(payload), secret);
  if (!tasksV3ConstantTimeEquals_(expected, payload.signature)) {
    return { ok: false, code: 'SIGNATURE_INVALID' };
  }

  return { ok: true };
}

function tasksV3Rows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function (row, offset) {
    const out = { __rowNumber: offset + 2 };
    headers.forEach(function (header, i) {
      const key = tasksV3Text_(header);
      if (key) out[key] = row[i];
    });
    return out;
  });
}

function tasksV3Bool_(value) {
  const v = tasksV3Text_(value).toLowerCase();
  return ['1', 'true', 'yes', 'on', 'نعم'].indexOf(v) !== -1;
}

function tasksV3PublicIndexRow_(row) {
  return {
    lineId: tasksV3Text_(row['Line ID'] || row['رقم البند']),
    orderId: tasksV3Text_(row['Order ID'] || row['رقم الأوردر']),
    department: tasksV3Text_(row['Department'] || row['القسم']),
    priority: tasksV3Text_(row['Priority'] || row['الأولوية']),
    expectedDelivery: row['Expected Delivery'] || row['تاريخ التسليم المتوقع'] || '',
    sourceStatus: tasksV3Text_(row['Source Status'] || row['حالة المصدر']),
    eligibility: tasksV3Text_(row['Eligibility'] || row['الأهلية']),
    updatedAt: row['Updated At'] || row['آخر تحديث'] || ''
  };
}

function tasksV3ActiveTask_(operator) {
  const rows = tasksV3Rows_(tasksV3RequiredSheet_(TASKS_V3_LEDGER_SHEET));
  const wanted = tasksV3Text_(operator).toLowerCase();
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const rowOperator = tasksV3Text_(row['Operator'] || row['الموظف']).toLowerCase();
    const state = tasksV3Text_(row['State'] || row['الحالة']).toUpperCase();
    if (rowOperator === wanted && ['STARTED', 'PAUSED'].indexOf(state) !== -1) {
      return {
        taskId: tasksV3Text_(row['Task ID'] || row['رقم التاسك']),
        lineId: tasksV3Text_(row['Line ID'] || row['رقم البند']),
        orderId: tasksV3Text_(row['Order ID'] || row['رقم الأوردر']),
        state: state,
        claimedAt: row['Claimed At'] || row['وقت الاستلام'] || '',
        startedAt: row['Started At'] || row['وقت البدء'] || ''
      };
    }
  }
  return null;
}

function tasksV3Lane_(kind) {
  try {
    const rows = tasksV3Rows_(tasksV3RequiredSheet_(TASKS_V3_INDEX_SHEET));
    const out = [];
    rows.forEach(function (row) {
      const eligible = tasksV3Text_(row['Eligibility'] || row['الأهلية']).toUpperCase();
      if (eligible && eligible !== 'ELIGIBLE' && eligible !== 'READY') return;
      const matches = kind === 'flyPrint'
        ? tasksV3Bool_(row['Fly Print'] || row['طباعة على الطاير'])
        : tasksV3Bool_(row['Press'] || row['مكبس']);
      if (matches) out.push(tasksV3PublicIndexRow_(row));
    });
    return { success: true, environment: TASKS_V3_ENV, lane: kind, rows: out, count: out.length };
  } catch (err) {
    return { success: false, environment: TASKS_V3_ENV, code: tasksV3Text_(err && err.message) || 'TASKS_V3_READ_ERROR' };
  }
}

function tasksV3Status_(operator, role) {
  try {
    const response = {
      success: true,
      environment: TASKS_V3_ENV,
      version: 'TASKS_V3_T1_PREVIEW_READONLY_1',
      operator: tasksV3Text_(operator),
      role: role,
      activeTask: tasksV3ActiveTask_(operator)
    };
    if (role === 'WAEL' || role === 'MANAGER') {
      response.flyPrint = tasksV3Lane_('flyPrint');
      response.pressCandidates = tasksV3Lane_('press');
    }
    return response;
  } catch (err) {
    return { success: false, environment: TASKS_V3_ENV, code: tasksV3Text_(err && err.message) || 'TASKS_V3_READ_ERROR' };
  }
}

function tasksV3Health_() {
  try {
    const ss = tasksV3Spreadsheet_();
    const index = ss.getSheetByName(TASKS_V3_INDEX_SHEET);
    const ledger = ss.getSheetByName(TASKS_V3_LEDGER_SHEET);
    return {
      success: true,
      environment: TASKS_V3_ENV,
      version: 'TASKS_V3_T1_PREVIEW_READONLY_1',
      spreadsheetConfigured: true,
      productionSpreadsheetBlocked: true,
      indexReady: !!index,
      ledgerReady: !!ledger,
      readOnly: true
    };
  } catch (err) {
    return {
      success: false,
      environment: TASKS_V3_ENV,
      code: tasksV3Text_(err && err.message) || 'TASKS_V3_HEALTH_ERROR',
      readOnly: true
    };
  }
}
