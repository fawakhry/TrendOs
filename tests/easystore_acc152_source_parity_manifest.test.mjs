import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const m = JSON.parse(read('docs/trendos/staging/ACC152_ACCOUNTING_SOURCE_D1_PARITY_MANIFEST_20261010.json'));
const schema = read('cloudflare-d1/migrations/0015_employee_accounting_zero_google_v1.sql') +
  '\n' + read('cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql');
assert.equal(m.schemaVersion, 'ACC152-20261010-v1');
assert.equal(m.classification, 'REPO_ONLY_SCHEMA_MAPPING_NOT_MIGRATION');
assert.equal(m.source.accountingTabCount, 21);
assert.equal(m.source.boundedNonemptyAfterHeaderForAll21, 0);
assert.equal(m.source.authority, 'UNVERIFIED_FOR_FINANCIAL_OPENING_BALANCES');
assert.equal(m.target.mode, 'READONLY');
assert.equal(m.target.authoritativeWrites, false);
assert.equal(m.target.isDirectlyComparableToLegacyOperationalRows, false);
assert.equal(m.mappings.length, 5);
const names = new Set();
for(const item of m.mappings) {
  assert.ok(!names.has(item.targetTable), 'reused target table');
  names.add(item.targetTable);
  assert.ok(schema.includes('CREATE TABLE IF NOT EXISTS ' + item.targetTable + ' ('), 'missing target table '+item.targetTable);
  assert.ok(schema.includes(item.targetPrimaryKey + ' TEXT PRIMARY KEY'), 'missing target primary key '+item.targetPrimaryKey);
  for (const targetField of Object.values(item.candidateJoinHeaders)) {
    assert.ok(schema.includes(targetField+' TEXT NOT NULL'), 'missing candidate join field '+targetField);
  }
  assert.equal(item.idMappingVerified, false, 'never assert migrated unique key from header alone');
  assert.ok(!/VERIFIED_PARITY|MIGRATED/.test(item.status), 'source/target parity not established');
}
assert.equal(m.mappings.find(x=>x.sourceSheet==='حسابات - الخزنة').sourceKeyResolution,'UNKNOWN_DUPLICATE_ID_HEADERS');
for (const gate of ['opening_balance_and_debt_reconciliation','stable_order_line_id_cross_source_parity','owner_approved_financial_write_canary']) assert.ok(m.blockingGates.includes(gate));
assert.ok(m.prohibitedActions.includes('no_live_accounting_writes'));
console.log('ACC152_SCHEMA_PRIMARY_KEYS_VERIFIED=PASS');
console.log('ACC152_SOURCE_AUTHORITY_UNKNOWN_NOT_PARITY=PASS');
console.log('ACC152_FINANCIAL_MUTATION=NO');
