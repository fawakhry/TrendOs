/**
 * TrendOS R4 isolated recovery planner — NO IO, no D1 POST, no Script Properties,
 * no Sheet write, no deploy. All row payloads remain in process memory.
 * A valid plan is NOT write authorization: deployed D1 delta lacks in-transaction CAS.
 */
const NAMES = ['الأوردرات', 'بنود الأوردرات'];
const NOTE = 'TrendOS orders live sync V2 quota-aware';
const MAX_ROWS_PER_TAB = 5000;
const MAX_CANDIDATES = 64; // local safety ceiling; not a D1 quota guarantee
const MAX_PAYLOAD_BYTES = 262144; // local safety ceiling; not a Worker limit claim

function abort(code) {
  throw new Error('R4_PLAN_ABORT_' + code);
}
function assert(condition, code) {
  if (!condition) abort(code);
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function rowShape(row, index, width) {
  return row && Number.isInteger(row.rowNumber) && row.rowNumber === index + 1 &&
    ['values', 'display', 'formulas'].every(key =>
      Array.isArray(row[key]) && row[key].length === width);
}
function canonicalRow(row) {
  return { rowNumber: row.rowNumber, values: row.values,
    display: row.display, formulas: row.formulas };
}
function byExactlyTwo(tabs, kind) {
  assert(Array.isArray(tabs) && tabs.length === 2, kind + '_TAB_COUNT');
  assert(NAMES.every(n => tabs.filter(s => s && s.sheetName === n).length === 1),
    kind + '_TAB_IDENTITY');
  return NAMES.map(n => tabs.find(s => s.sheetName === n));
}
function safeRowCount(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_ROWS_PER_TAB;
}
function validateSource(src) {
  assert(safeRowCount(src.sourceLastRow) &&
    Number.isInteger(src.sourceLastCol) && src.sourceLastCol > 0 &&
    src.sourceLastCol <= 10000, 'SOURCE_DIMENSIONS');
  assert(typeof src.sheetId === 'number' || typeof src.sheetId === 'string',
    'SOURCE_SHEET_ID');
  assert(Array.isArray(src.headers) && src.headers.length === src.sourceLastCol,
    'SOURCE_HEADERS');
  assert(Array.isArray(src.rows) && src.rows.length === src.sourceLastRow &&
    src.rows.every((row, i) => rowShape(row, i, src.sourceLastCol)),
    'SOURCE_ROWS');
}
function validateMirror(src, mirror) {
  const cat = mirror.catalog;
  assert(cat && cat.sheetName === src.sheetName && cat.status === 'ready' &&
    cat.note === NOTE, 'MIRROR_CATALOG');
  assert(String(cat.sheetId) === String(src.sheetId) &&
    cat.sourceLastCol === src.sourceLastCol &&
    same(cat.headers, src.headers), 'MIRROR_SCHEMA_DRIFT');
  assert(safeRowCount(cat.rowCount) && cat.sourceLastRow === cat.rowCount &&
    cat.rowCount <= src.sourceLastRow, 'MIRROR_DIMENSIONS');
  assert(Array.isArray(mirror.rows) && mirror.rows.length === cat.rowCount &&
    mirror.rows.every((row, i) => rowShape(row, i, src.sourceLastCol)),
    'MIRROR_ROWS');
  // Only tail growth is permitted. A source deletion/reorder must not silently
  // generate worker's implicit DELETE row_number > sourceLastRow.
  return cat;
}

/**
 * sourceTabs: captured authoritative snapshots; mirrorTabs: paginated GET rows
 * and matching D1 catalogs, both captured using the same workbook identity.
 * stable flags are produced by a separate read-only capture procedure and
 * must NEVER be inferred from catalog row counts alone.
 */
export function buildTargetedRecoveryPlan({ sourceTabs, mirrorTabs,
  sourceStable, mirrorStable, workbookVerified,
  maxCandidates = MAX_CANDIDATES, maxPayloadBytes = MAX_PAYLOAD_BYTES }) {
  assert(sourceStable === true && mirrorStable === true &&
    workbookVerified === true, 'UNSTABLE_OR_UNVERIFIED_SNAPSHOT');
  assert(Number.isInteger(maxCandidates) && maxCandidates >= 1 &&
    maxCandidates <= MAX_CANDIDATES, 'CANDIDATE_LIMIT');
  assert(Number.isInteger(maxPayloadBytes) && maxPayloadBytes >= 1 &&
    maxPayloadBytes <= MAX_PAYLOAD_BYTES, 'PAYLOAD_LIMIT');
  const sources = byExactlyTwo(sourceTabs, 'SOURCE');
  const mirrors = byExactlyTwo(mirrorTabs, 'MIRROR');
  let total = 0;
  const sheets = sources.map((src, index) => {
    validateSource(src);
    const mirror = mirrors[index];
    const cat = validateMirror(src, mirror);
    const upserts = [];
    let changedExistingRows = 0;
    let appendedRows = 0;
    for (let i = 0; i < src.rows.length; i++) {
      const after = canonicalRow(src.rows[i]);
      const before = i < mirror.rows.length ? canonicalRow(mirror.rows[i]) : null;
      if (!before || !same(before, after)) {
        upserts.push({ rowNumber: i + 1, expectedBefore: before, replacement: after });
        if (!before) appendedRows++; else changedExistingRows++;
      }
    }
    total += upserts.length;
    assert(total <= maxCandidates, 'CANDIDATE_BUDGET');
    return {
      sheetName: src.sheetName,
      sheetId: String(src.sheetId),
      sourceLastRow: src.sourceLastRow, sourceLastCol: src.sourceLastCol,
      baseRowCount: cat.rowCount, expectedNote: NOTE,
      headers: src.headers, upserts,
      changedExistingRows, appendedRows
    };
  });
  // The estimate measures the actual in-memory proposal; no order fields,
  // row contents, identifiers, or row hashes are returned in publicSummary.
  const rawBytes = Buffer.byteLength(JSON.stringify({ sheets }), 'utf8');
  assert(rawBytes <= maxPayloadBytes, 'PAYLOAD_BUDGET');
  const publicSummary = {
    tabCounts: sheets.map((s, i) => ({
      tabIndex: i, d1BaseRows: s.baseRowCount,
      sourceRows: s.sourceLastRow,
      changedExistingRows: s.changedExistingRows,
      appendedRows: s.appendedRows,
      candidateUpserts: s.upserts.length
    })),
    totalCandidateUpserts: total,
    estimatedPrivateProposalBytes: rawBytes,
    requiresTransactionalD1CompareAndSwap: true,
    productionWriteAuthorized: false,
    triggerRestartAuthorized: false
  };
  return { sheets, publicSummary, productionWriteAuthorized: false };
}

export function publicTargetedRecoverySummary(plan) {
  assert(plan && plan.productionWriteAuthorized === false &&
    plan.publicSummary && plan.publicSummary.productionWriteAuthorized === false,
    'SUMMARY_UNSAFE');
  return JSON.parse(JSON.stringify(plan.publicSummary));
}
