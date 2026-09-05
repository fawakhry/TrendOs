export const TRENDOS_ACCOUNTING_PERSISTENCE_SCHEMA_PREFLIGHT_VERSION = 'TRENDOS_ACCOUNTING_PERSISTENCE_SCHEMA_PREFLIGHT_V1_20260905';

export const ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA = Object.freeze({
  accounting_operation_idempotency: Object.freeze([
    'idempotency_key',
    'transaction_id',
    'command_fingerprint',
    'status',
    'order_id',
    'line_id',
    'source_transaction_id',
    'result_json',
    'created_at'
  ]),
  accounting_stock_movements: Object.freeze([
    'operation_id',
    'stock_movement_id',
    'transaction_id',
    'transaction_idempotency_key',
    'movement_idempotency_key',
    'movement_type',
    'item_id',
    'quantity_in',
    'quantity_out',
    'unit',
    'unit_cost_minor',
    'recognized_cost_minor',
    'order_id',
    'line_id',
    'source_transaction_id',
    'created_at'
  ])
});

function emptyReport(code = 'D1_NOT_INJECTED') {
  return Object.freeze({
    version: TRENDOS_ACCOUNTING_PERSISTENCE_SCHEMA_PREFLIGHT_VERSION,
    compatible: false,
    code,
    readOnly: true,
    authoritativeWrites: false,
    mutationPerformed: false,
    checkedTables: [],
    missingTables: Object.keys(ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA),
    missingColumns: {}
  });
}

function validateReadHandle(db) {
  return !!(db && typeof db.prepare === 'function');
}

function resultRows(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.results)) return result.results;
  return [];
}

async function readColumns(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info("${tableName}")`).all();
  return resultRows(result)
    .map((row) => String(row && row.name || '').trim())
    .filter(Boolean);
}

export async function evaluateAccountingPersistenceSchemaPreflight(db) {
  if (!validateReadHandle(db)) return emptyReport();

  const requiredTables = Object.keys(ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA);
  const tableResult = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?1, ?2)"
  ).bind(requiredTables[0], requiredTables[1]).all();

  const existingTables = new Set(
    resultRows(tableResult)
      .map((row) => String(row && row.name || '').trim())
      .filter(Boolean)
  );

  const missingTables = requiredTables.filter((table) => !existingTables.has(table));
  const missingColumns = {};
  const checkedTables = [];

  for (const table of requiredTables) {
    if (!existingTables.has(table)) continue;
    checkedTables.push(table);
    const actualColumns = new Set(await readColumns(db, table));
    const missing = ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA[table]
      .filter((column) => !actualColumns.has(column));
    if (missing.length) missingColumns[table] = missing;
  }

  const compatible = missingTables.length === 0 && Object.keys(missingColumns).length === 0;

  return Object.freeze({
    version: TRENDOS_ACCOUNTING_PERSISTENCE_SCHEMA_PREFLIGHT_VERSION,
    compatible,
    code: compatible ? 'SCHEMA_COMPATIBLE' : 'SCHEMA_INCOMPATIBLE',
    readOnly: true,
    authoritativeWrites: false,
    mutationPerformed: false,
    checkedTables: Object.freeze(checkedTables.slice()),
    missingTables: Object.freeze(missingTables.slice()),
    missingColumns: Object.freeze(Object.fromEntries(
      Object.entries(missingColumns).map(([table, columns]) => [table, Object.freeze(columns.slice())])
    ))
  });
}
