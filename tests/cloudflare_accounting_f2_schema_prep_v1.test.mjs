import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'cloudflare-d1/schema-prep/accounting-finance-v1.sql');
const migrationsPath = path.join(root, 'cloudflare-d1/migrations');
const sql = fs.readFileSync(schemaPath, 'utf8');

function expectSqlError(fn, expectedText) {
  let thrown = null;
  try { fn(); } catch (err) { thrown = err; }
  assert.ok(thrown, `expected SQLite error containing: ${expectedText}`);
  if (expectedText) {
    assert.match(String(thrown.message || thrown), new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
}

assert.match(sql, /PREPARED SCHEMA ONLY/);
assert.match(sql, /DO NOT APPLY TO D1 OR PRODUCTION/);
assert.doesNotMatch(sql, /profit[_\s-]*share|partner[_\s-]*percentage|investor[_\s-]*percentage/i);
assert.equal(
  fs.readdirSync(migrationsPath).some((name) => /accounting.*finance/i.test(name)),
  false,
  'prepared Accounting finance schema must not live in active migrations'
);

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(sql);

const objects = db.prepare(`
  SELECT type, name
  FROM sqlite_master
  WHERE name LIKE 'accounting_%'
  ORDER BY type, name
`).all();
const names = new Set(objects.map((x) => String(x.name)));

for (const name of [
  'accounting_accounts',
  'accounting_treasuries',
  'accounting_journals',
  'accounting_journal_entries',
  'accounting_idempotency',
  'accounting_audit_events',
  'accounting_journals_no_update',
  'accounting_journals_no_delete',
  'accounting_entries_no_update',
  'accounting_entries_no_delete',
  'accounting_idempotency_no_update',
  'accounting_idempotency_no_delete',
  'accounting_audit_no_update',
  'accounting_audit_no_delete'
]) {
  assert.equal(names.has(name), true, `missing prepared schema object ${name}`);
}

const accountCount = db.prepare('SELECT COUNT(*) AS n FROM accounting_accounts').get().n;
assert.equal(Number(accountCount), 12);
const accountRows = db.prepare("SELECT account_code, role FROM accounting_accounts WHERE account_code IN ('1010','1100','2100','4100') ORDER BY account_code").all();
assert.equal(accountRows.length, 4);
assert.equal(String(accountRows[0].account_code), '1010');
assert.equal(String(accountRows[0].role), 'cash-main');
assert.equal(String(accountRows[1].account_code), '1100');
assert.equal(String(accountRows[1].role), 'accounts-receivable');
assert.equal(String(accountRows[2].account_code), '2100');
assert.equal(String(accountRows[2].role), 'accounts-payable');
assert.equal(String(accountRows[3].account_code), '4100');
assert.equal(String(accountRows[3].role), 'sales-revenue');

// Stable Treasury identity is separate from ledger account code.
db.prepare(`
  INSERT INTO accounting_treasuries(treasury_id, treasury_name, account_code, treasury_type)
  VALUES (?, ?, ?, ?)
`).run('CASHBOX-BENHA-MAIN', 'الخزنة الرئيسية - بنها', '1010', 'cashbox');

db.exec('BEGIN IMMEDIATE;');
try {
  db.prepare(`
    INSERT INTO accounting_journals(
      journal_id, journal_type, source_document_id, idempotency_key,
      command_fingerprint, actor_id, source, occurred_at,
      total_debit_minor, total_credit_minor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'JRN-TEST-1', 'customer.collect', 'PAY-TEST-1', 'IDEMP-TEST-1',
    'fp-test-1', 'ACCOUNTANT-1', 'schema-test', '2026-09-05T01:30:00Z',
    10025, 10025
  );
  db.prepare(`
    INSERT INTO accounting_journal_entries(
      entry_id, journal_id, line_no, account_code, debit_minor, credit_minor,
      party_id, treasury_id, order_id, line_id, department_id, profit_center_id,
      source_document_id, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'JRN-TEST-1:E1', 'JRN-TEST-1', 1, '1010', 10025, 0,
    'CUST-TEST-1', 'CASHBOX-BENHA-MAIN', 'ORDER-TEST-1', 'LINE-TEST-1', 'DEPT-PRINT', 'PC-PRINT',
    'PAY-TEST-1', 'Customer collection'
  );
  db.prepare(`
    INSERT INTO accounting_journal_entries(
      entry_id, journal_id, line_no, account_code, debit_minor, credit_minor,
      party_id, order_id, line_id, department_id, profit_center_id,
      source_document_id, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'JRN-TEST-1:E2', 'JRN-TEST-1', 2, '1100', 0, 10025,
    'CUST-TEST-1', 'ORDER-TEST-1', 'LINE-TEST-1', 'DEPT-PRINT', 'PC-PRINT',
    'PAY-TEST-1', 'Reduce receivable'
  );
  db.prepare(`
    INSERT INTO accounting_idempotency(
      idempotency_key, command_type, command_fingerprint, actor_id, source,
      status, journal_id, result_code, result_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'IDEMP-TEST-1', 'customer.collect', 'fp-test-1', 'ACCOUNTANT-1', 'schema-test',
    'completed', 'JRN-TEST-1', 'posted', '{"success":true}'
  );
  db.prepare(`
    INSERT INTO accounting_audit_events(
      audit_event_id, event_type, entity_type, entity_id, actor_id, source,
      idempotency_key, journal_id, order_id, line_id, party_id, treasury_id,
      department_id, profit_center_id, payload_json, occurred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'AUDIT-TEST-1', 'finance.posted', 'journal', 'JRN-TEST-1', 'ACCOUNTANT-1', 'schema-test',
    'IDEMP-TEST-1', 'JRN-TEST-1', 'ORDER-TEST-1', 'LINE-TEST-1', 'CUST-TEST-1', 'CASHBOX-BENHA-MAIN',
    'DEPT-PRINT', 'PC-PRINT', '{"amountMinor":10025}', '2026-09-05T01:30:00Z'
  );
  db.exec('COMMIT;');
} catch (err) {
  db.exec('ROLLBACK;');
  throw err;
}

const journal = db.prepare('SELECT * FROM accounting_journals WHERE journal_id = ?').get('JRN-TEST-1');
assert.equal(Number(journal.total_debit_minor), 10025);
assert.equal(Number(journal.total_credit_minor), 10025);
assert.equal(String(journal.status), 'posted');

const dimensions = db.prepare(`
  SELECT party_id, treasury_id, order_id, line_id, department_id, profit_center_id
  FROM accounting_journal_entries
  WHERE entry_id = 'JRN-TEST-1:E1'
`).get();
assert.equal(String(dimensions.party_id), 'CUST-TEST-1');
assert.equal(String(dimensions.treasury_id), 'CASHBOX-BENHA-MAIN');
assert.equal(String(dimensions.order_id), 'ORDER-TEST-1');
assert.equal(String(dimensions.line_id), 'LINE-TEST-1');
assert.equal(String(dimensions.department_id), 'DEPT-PRINT');
assert.equal(String(dimensions.profit_center_id), 'PC-PRINT');

// Same idempotency key can never be reused, even with a different fingerprint.
expectSqlError(() => {
  db.prepare(`
    INSERT INTO accounting_idempotency(
      idempotency_key, command_type, command_fingerprint, actor_id, source, status, result_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('IDEMP-TEST-1', 'customer.collect', 'different-fingerprint', 'ACCOUNTANT-2', 'schema-test', 'ambiguous', 'duplicate');
}, 'UNIQUE');

// A completed idempotency decision must reference a journal.
expectSqlError(() => {
  db.prepare(`
    INSERT INTO accounting_idempotency(
      idempotency_key, command_type, command_fingerprint, actor_id, source, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('IDEMP-NO-JOURNAL', 'customer.collect', 'fp-x', 'ACCOUNTANT-1', 'schema-test', 'completed');
}, 'CHECK constraint failed');

// Failed/ambiguous decisions can reserve a key without inventing a journal.
db.prepare(`
  INSERT INTO accounting_idempotency(
    idempotency_key, command_type, command_fingerprint, actor_id, source, status, result_code
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('IDEMP-AMB-1', 'customer.collect', 'fp-amb', 'ACCOUNTANT-1', 'schema-test', 'ambiguous', 'upstream-unknown');
assert.equal(String(db.prepare("SELECT status FROM accounting_idempotency WHERE idempotency_key='IDEMP-AMB-1'").get().status), 'ambiguous');

for (const [sqlText, message] of [
  ["UPDATE accounting_journals SET source='tamper' WHERE journal_id='JRN-TEST-1'", 'accounting_journals is append-only'],
  ["DELETE FROM accounting_journals WHERE journal_id='JRN-TEST-1'", 'accounting_journals is append-only'],
  ["UPDATE accounting_journal_entries SET memo='tamper' WHERE entry_id='JRN-TEST-1:E1'", 'accounting_journal_entries is append-only'],
  ["DELETE FROM accounting_journal_entries WHERE entry_id='JRN-TEST-1:E1'", 'accounting_journal_entries is append-only'],
  ["UPDATE accounting_idempotency SET result_code='tamper' WHERE idempotency_key='IDEMP-TEST-1'", 'accounting_idempotency is append-only'],
  ["DELETE FROM accounting_idempotency WHERE idempotency_key='IDEMP-TEST-1'", 'accounting_idempotency is append-only'],
  ["UPDATE accounting_audit_events SET event_type='tamper' WHERE audit_event_id='AUDIT-TEST-1'", 'accounting_audit_events is append-only'],
  ["DELETE FROM accounting_audit_events WHERE audit_event_id='AUDIT-TEST-1'", 'accounting_audit_events is append-only']
]) {
  expectSqlError(() => db.exec(sqlText), message);
}

// Reversal is a separate posted journal; the original row remains untouched.
db.prepare(`
  INSERT INTO accounting_journals(
    journal_id, journal_type, source_document_id, idempotency_key,
    command_fingerprint, actor_id, source, occurred_at,
    total_debit_minor, total_credit_minor, reversal_of_journal_id, reversal_reason
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'JRN-REV-1', 'journal.reverse', 'REV-TEST-1', 'IDEMP-REV-1',
  'fp-rev-1', 'ACCOUNTANT-1', 'schema-test', '2026-09-05T01:35:00Z',
  10025, 10025, 'JRN-TEST-1', 'اختبار عكس'
);
assert.equal(String(db.prepare("SELECT status FROM accounting_journals WHERE journal_id='JRN-TEST-1'").get().status), 'posted');
assert.equal(String(db.prepare("SELECT reversal_of_journal_id FROM accounting_journals WHERE journal_id='JRN-REV-1'").get().reversal_of_journal_id), 'JRN-TEST-1');

// No table may smuggle profit-sharing percentages into Accounting.
for (const table of [
  'accounting_accounts','accounting_treasuries','accounting_journals',
  'accounting_journal_entries','accounting_idempotency','accounting_audit_events'
]) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((x) => String(x.name).toLowerCase());
  assert.equal(cols.some((name) => /profit.*share|partner.*percent|investor.*percent|share.*percent/.test(name)), false, `${table} contains forbidden profit-share column`);
}

console.log('TrendOS Accounting F2 prepared schema SQLite tests: PASS');
