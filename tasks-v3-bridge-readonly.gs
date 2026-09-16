// TrendOS Tasks V3 — T2 PRODUCTION READ-ONLY WAEL CANARY BRIDGE
// IMPORTANT: Separate Apps Script project/deployment only. Never add to main TrendOS Apps Script.
// T2 scope: one configured Wael operator, signed POST, read-only production canary.
// No claim/complete routes. No sheet/schema writes. No getDataRange/full 92-column scan.

const TASKS_V3_PROTOCOL = 'TRENDOS_TASKS_V3_READONLY_1';
const TASKS_V3_T2_VERSION = 'TASKS_V3_READONLY_T2_WAEL_CANARY_2';
const TASKS_V3_T2_SOURCE_SHEET = 'بنود الأوردرات';
const TASKS_V3_MAX_ASSERTION_AGE_SECONDS = 120;
const TASKS_V3_T2_TERMINAL_STATUSES = Object.freeze(['تم التسليم', 'ملغى', 'مكرر']);

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
    sourceLookupMs: 0,
    totalBridgeMs: 0
  } : null;

  const verifyStartedAt = diagnostic ? Date.now() : 0;
  const verified = tasksV3VerifyAssertion_(payload, diagnostic);
  if (diagnostic) diagnostic.verifyAssertionMs = Date.now() - verifyStartedAt;
  if (!verified.ok) return tasksV3Output_({ success: false, code: verified.code });

  const role = tasksV3Role_(payload.role);
  const operator = tasksV3Text_(payload.operator);

  if (!tasksV3T2CanaryAllowed_(operator, role)) {
    return tasksV3Output_({ success: false, code: 'T2_CANARY_FORBIDDEN' });
  }

  if (op === 'health') {
    const response = tasksV3Health_(diagnostic, verified.properties);
    diagnostic.totalBridgeMs = Date.now() - bridgeStartedAt;
    response.diagnostic = diagnostic;
    return tasksV3Output_(response);
  }

  if (op === 'status') return tasksV3Output_(tasksV3Status_(operator, role));
  if (op === 'flyPrint') return tasksV3Output_(tasksV3LaneResponse_('flyPrint'));
  if (op === 'pressCandidates') return tasksV3Output_(tasksV3LaneResponse_('press'));

  return tasksV3Output_({ success: false, code: 'READONLY_OPERATION_NOT_FOUND' });
}

function tasksV3Output_(body) {
  return ContentService.createTextOutput(JSON.stringify(body || {}))
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
  return !!configured && tasksV3Text_(operator).toLowerCase() === configured.toLowerCase();
}

function tasksV3Spreadsheet_(diagnostic, properties) {
  const id = tasksV3Text_(
    properties && Object.prototype.hasOwnProperty.call(properties, 'TASKS_V3_T2_SPREADSHEET_ID')
      ? properties.TASKS_V3_T2_SPREADSHEET_ID
      : tasksV3ScriptProperty_('TASKS_V3_T2_SPREADSHEET_ID', diagnostic)
  );
  if (!id) throw new Error('TASKS_V3_T2_SPREADSHEET_ID_NOT_CONFIGURED');
  const startedAt = diagnostic ? Date.now() : 0;
  try {
    return SpreadsheetApp.openById(id);
  } finally {
    if (diagnostic) diagnostic.openSpreadsheetMs += Date.now() - startedAt;
  }
}

function tasksV3SourceSheet_(diagnostic, properties) {
  const ss = tasksV3Spreadsheet_(diagnostic, properties);
  const startedAt = diagnostic ? Date.now() : 0;
  try {
    const sheet = ss.getSheetByName(TASKS_V3_T2_SOURCE_SHEET);
    if (!sheet) throw new Error('TASKS_V3_T2_SOURCE_SHEET_NOT_FOUND');
    return sheet;
  } finally {
    if (diagnostic) diagnostic.sourceLookupMs += Date.now() - startedAt;
  }
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

function tasksV3Bool_(value) {
  const v = tasksV3Text_(value).toLowerCase();
  return ['1', 'true', 'yes', 'on', 'نعم'].indexOf(v) !== -1;
}

function tasksV3TerminalStatus_(value) {
  return TASKS_V3_T2_TERMINAL_STATUSES.indexOf(tasksV3Text_(value)) !== -1;
}

function tasksV3Column_(sheet, column, lastRow) {
  if (lastRow < 2) return [];
  return sheet.getRange(column + '2:' + column + lastRow).getDisplayValues().map(function (row) {
    return row[0];
  });
}

function tasksV3ProductionProjection_() {
  const sheet = tasksV3SourceSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Bounded narrow-column reads only. Production source has 92 columns; T2 reads 9 columns.
  const orderIds = tasksV3Column_(sheet, 'A', lastRow);
  const departments = tasksV3Column_(sheet, 'E', lastRow);
  const lineIds = tasksV3Column_(sheet, 'F', lastRow);
  const priorities = tasksV3Column_(sheet, 'J', lastRow);
  const statuses = tasksV3Column_(sheet, 'K', lastRow);
  const updated = tasksV3Column_(sheet, 'M', lastRow);
  const pressFlags = tasksV3Column_(sheet, 'R', lastRow);
  const expectedDelivery = tasksV3Column_(sheet, 'AG', lastRow);
  const flyFlags = tasksV3Column_(sheet, 'AS', lastRow);

  const out = [];
  for (let i = 0; i < lineIds.length; i++) {
    const lineId = tasksV3Text_(lineIds[i]);
    if (!lineId) continue;
    const sourceStatus = tasksV3Text_(statuses[i]);
    const terminal = tasksV3TerminalStatus_(sourceStatus);
    const flyPrint = tasksV3Bool_(flyFlags[i]);
    const press = tasksV3Bool_(pressFlags[i]);
    if (!flyPrint && !press) continue;

    out.push({
      lineId: lineId,
      orderId: tasksV3Text_(orderIds[i]),
      department: tasksV3Text_(departments[i]),
      priority: tasksV3Text_(priorities[i]),
      expectedDelivery: expectedDelivery[i] || '',
      sourceStatus: sourceStatus,
      eligibility: terminal ? 'BLOCKED' : 'ELIGIBLE',
      updatedAt: updated[i] || '',
      flyPrint: flyPrint,
      press: press
    });
  }
  return out;
}

function tasksV3LaneFromProjection_(projection, kind) {
  return (projection || []).filter(function (row) {
    if (row.eligibility !== 'ELIGIBLE') return false;
    return kind === 'flyPrint' ? row.flyPrint : row.press;
  }).map(function (row) {
    return {
      lineId: row.lineId,
      orderId: row.orderId,
      department: row.department,
      priority: row.priority,
      expectedDelivery: row.expectedDelivery,
      sourceStatus: row.sourceStatus,
      eligibility: row.eligibility,
      updatedAt: row.updatedAt
    };
  });
}

function tasksV3LaneResponse_(kind) {
  try {
    const projection = tasksV3ProductionProjection_();
    const rows = tasksV3LaneFromProjection_(projection, kind);
    return { success: true, lane: kind, rows: rows, count: rows.length };
  } catch (err) {
    return { success: false, code: tasksV3Text_(err && err.message) || 'TASKS_V3_T2_READ_ERROR' };
  }
}

function tasksV3Status_(operator, role) {
  try {
    const projection = tasksV3ProductionProjection_();
    const flyPrint = tasksV3LaneFromProjection_(projection, 'flyPrint');
    const pressCandidates = tasksV3LaneFromProjection_(projection, 'press');
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      operator: tasksV3Text_(operator),
      role: role,
      activeTask: null,
      flyPrint: { success: true, lane: 'flyPrint', rows: flyPrint, count: flyPrint.length },
      pressCandidates: { success: true, lane: 'press', rows: pressCandidates, count: pressCandidates.length },
      readOnly: true
    };
  } catch (err) {
    return { success: false, code: tasksV3Text_(err && err.message) || 'TASKS_V3_T2_READ_ERROR' };
  }
}

function tasksV3Health_(diagnostic, properties) {
  try {
    const sheet = tasksV3SourceSheet_(diagnostic, properties);
    return {
      success: true,
      version: TASKS_V3_T2_VERSION,
      spreadsheetConfigured: true,
      sourceReady: !!sheet,
      canaryConfigured: !!tasksV3Text_(tasksV3ScriptProperty_('TASKS_V3_T2_CANARY_OPERATOR', diagnostic)),
      readOnly: true
    };
  } catch (err) {
    return {
      success: false,
      code: tasksV3Text_(err && err.message) || 'TASKS_V3_T2_HEALTH_ERROR',
      readOnly: true
    };
  }
}
