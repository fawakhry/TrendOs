// TrendOS Tasks V3 — T2 PRODUCTION READ-ONLY WAEL CANARY BRIDGE
// IMPORTANT: This file is for a SEPARATE Google Apps Script project/deployment.
// DO NOT copy it into the main TrendOS Apps Script project.
// T2 scope: signed read-only status/lane queries for one configured Wael operator only.
// No claim/complete routes and no business mutation code exist here.

const TASKS_V3_PROTOCOL = 'TRENDOS_TASKS_V3_READONLY_1';
const TASKS_V3_INDEX_SHEET = 'تشغيل - فهرس المهام V3';
const TASKS_V3_LEDGER_SHEET = 'تشغيل - سجل المهام V3';
const TASKS_V3_MAX_ASSERTION_AGE_SECONDS = 120;
const TASKS_V3_T2_VERSION = 'TASKS_V3_READONLY_T2_WAEL_CANARY_1';

function doPost(e) {
  const bridgeStartedAt = Date.now();
  let payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return tasksV3Output_({ success: false, code: 'INVALID_JSON' });
  }

  const op = tasksV3Text_(payload.op);
  const diagnostic = op === 'health' ? {
    verifyAssertionMs: 0,
    propertiesMs: 0,
    openSpreadsheetMs: 0,
    sheetLookupMs: 0,
    totalBridgeMs: 0
  } : null;
  const verifyStartedAt = diagnostic ? Date.now() : 0;
  const verified = tasksV3VerifyAssertion_(payload, diagnostic);
  if (diagnostic) diagnostic.verifyAssertionMs = Date.now() - verifyStartedAt;
  if (!verified.ok) return tasksV3Output_({ success: false, code: verified.code });

  const role = tasksV3Role_(payload.role);
  const operator = tasksV3Text_(payload.operator);

  if (op === 'health') {
    const response = tasksV3Health_(diagnostic, verified.properties);
    diagnostic.totalBridgeMs = Date.now() - bridgeStartedAt;
    response.diagnostic = diagnostic;
    return tasksV3Output_(response);
  }

  if (!tasksV3T2CanaryAllowed_(operator, role)) {
    return tasksV3Output_({ success: false, code: 'T2_CANARY_FORBIDDEN' });
  }

  if (op === 'status') {
    return tasksV3Output_(tasksV3Status_(operator, role));
  }
  if (op === 'flyPrint') {
    return tasksV3Output_(tasksV3Lane_('flyPrint'));
  }
  if (op === 'pressCandidates') {
    return tasksV3Output_(tasksV3Lane_('press'));
  }

  return tasksV3Output_({ success: false, code: 'READONLY_OPERATION_NOT_FOUND' });
}

function tasksV3Output_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function tasksV3Text_(value) {
  return String(value == null ? '' : value).trim();
}

function tasksV3Role_(value) {
  return tasksV3Text_(value).toUpperCase() === 'WAEL' ? 'WAEL' : 'OTHER';
}

function tasksV3Properties_() {
  return PropertiesService.getScriptProperties();
}

function tasksV3ScriptProperty_(name, diagnostic) {
  const startedAt = diagnostic ? Date.now() : 0;
  try {
    return tasksV3Properties_().getProperty(name);
  } finally {
    if (diagnostic) diagnostic.propertiesMs += Date.now() - startedAt;
  }
}

function tasksV3ScriptPropertiesSnapshot_(diagnostic) {
  const startedAt = diagnostic ? Date.now() : 0;
  try {
    return tasksV3Properties_().getProperties();
  } finally {
    if (diagnostic) diagnostic.propertiesMs += Date.now() - startedAt;
  }
}

function tasksV3T2CanaryAllowed_(operator, role) {
  if (role !== 'WAEL') return false;
  const configured = tasksV3Text_(tasksV3ScriptProperty_('TASKS_V3_T2_CANARY_OPERATOR'));
  if (!configured) return false;
  return tasksV3Text_(operator).toLowerCase() === configured.toLowerCase();
}

function tasksV3Spreadsheet_(diagnostic, properties) {
  const id = tasksV3Text_(
    properties && Object.prototype.hasOwnProperty.call(properties, 'TASKS_V3_SPREADSHEET_ID')
      ? properties.TASKS_V3_SPREADSHEET_ID
      : tasksV3ScriptProperty_('TASKS_V3_SPREADSHEET_ID', diagnostic)
  );
  if (!id) throw new Error('TASKS_V3_SPREADSHEET_ID_NOT_CONFIGURED');
  const startedAt = diagnostic ? Date.now() : 0;
  try {
    return SpreadsheetApp.openById(id);
  } finally {
    if (diagnostic) diagnostic.openSpreadsheetMs += Date.now() - startedAt;
  }
}

function tasksV3RequiredSheet_(name) {
  const sheet = tasksV3Spreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('TASKS_V3_NOT_INITIALIZED');
  return sheet;
}

function tasksV3Canonical_(payload) {
  return [
    TASKS_V3_PROTOCOL,
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

function tasksV3VerifyAssertion_(payload, diagnostic) {
  if (tasksV3Text_(payload.protocol) !== TASKS_V3_PROTOCOL) {
    return { ok: false, code: 'PROTOCOL_INVALID' };
  }

  const assertedAt = Number(payload.assertedAt || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!assertedAt || Math.abs(now - assertedAt) > TASKS_V3_MAX_ASSERTION_AGE_SECONDS) {
    return { ok: false, code: 'ASSERTION_EXPIRED' };
  }
  if (!tasksV3Text_(payload.operator) || !tasksV3Text_(payload.nonce)) {
    return { ok: false, code: 'ASSERTION_IDENTITY_INCOMPLETE' };
  }

  let properties = null;
  let secret;
  if (diagnostic) {
    properties = tasksV3ScriptPropertiesSnapshot_(diagnostic);
    secret = tasksV3Text_(properties.TASKS_V3_SHARED_SECRET);
  } else {
    secret = tasksV3Text_(tasksV3ScriptProperty_('TASKS_V3_SHARED_SECRET', diagnostic));
  }
  if (!secret) return { ok: false, code: 'BRIDGE_SECRET_NOT_CONFIGURED' };

  const expected = tasksV3HmacHex_(tasksV3Canonical_(payload), secret);
  if (!tasksV3ConstantTimeEquals_(expected, payload.signature)) {
    return { ok: false, code: 'SIGNATURE_INVALID' };
  }
  return { ok: true, properties: properties };
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
    return { success: true, lane: kind, rows: out, count: out.length };
  } catch (err) {
    return { success: false, code: tasksV3Text_(err && err.message) || 'TASKS_V3_READ_ERROR' };
  }
}

function tasksV3Status_(operator, role) {
  try {
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      operator: tasksV3Text_(operator),
      role: role,
      activeTask: tasksV3ActiveTask_(operator),
      flyPrint: tasksV3Lane_('flyPrint'),
      pressCandidates: tasksV3Lane_('press')
    };
  } catch (err) {
    return { success: false, code: tasksV3Text_(err && err.message) || 'TASKS_V3_READ_ERROR' };
  }
}

function tasksV3Health_(diagnostic, properties) {
  try {
    const ss = tasksV3Spreadsheet_(diagnostic, properties);
    const lookupStartedAt = diagnostic ? Date.now() : 0;
    let index;
    let ledger;
    try {
      index = ss.getSheetByName(TASKS_V3_INDEX_SHEET);
      ledger = ss.getSheetByName(TASKS_V3_LEDGER_SHEET);
    } finally {
      if (diagnostic) diagnostic.sheetLookupMs += Date.now() - lookupStartedAt;
    }
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      spreadsheetConfigured: true,
      indexReady: !!index,
      ledgerReady: !!ledger,
      canaryConfigured: !!tasksV3Text_(tasksV3ScriptProperty_('TASKS_V3_T2_CANARY_OPERATOR', diagnostic)),
      readOnly: true
    };
  } catch (err) {
    return {
      success: false,
      code: tasksV3Text_(err && err.message) || 'TASKS_V3_HEALTH_ERROR',
      readOnly: true
    };
  }
}
