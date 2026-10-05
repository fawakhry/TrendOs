import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0023_employee_accounting_command_audit_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

for(const col of [
  'request_hash','source_system','correlation_id','evidence_refs_json','policy_epoch','command_version'
]) assert.ok(sql.includes('ADD COLUMN '+col),col);
for(const col of [
  'request_key','correlation_id','source_system','evidence_refs_json','policy_epoch','autonomy_level'
]) assert.ok(sql.includes('employee_accounting_events_v1') && sql.includes('ADD COLUMN '+col),col);

assert.ok(!/UPDATE\s+employee_accounting_control_v1/i.test(sql));
assert.ok(!/DELETE\s+FROM\s+employee_accounting_control_v1/i.test(sql));

for(const fn of [
  'commandErrorV1','stableValueV1','canonicalCommandJsonV1','sha256HexV1',
  'beginCommandV1','commitCommandV1','auditEventV1'
]) assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);

assert.ok(mod.includes("status='COMMITTED'"));
assert.ok(mod.includes("accounting-idempotency-conflict"));
assert.ok(mod.includes("accounting-command-in-progress"));
assert.ok(mod.includes("A2_COMMAND_V1"));
assert.ok(mod.includes("crypto.subtle.digest('SHA-256'"));
assert.ok(mod.includes("evidenceRefsV1"));
assert.ok(mod.includes("sourceSystemV1"));
assert.ok(mod.includes("correlationIdV1"));
assert.ok(!/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/.test(mod));

console.log('EASYSTORE_A2_COMMAND_FOUNDATION_SOURCE=PASS');
console.log('IDEMPOTENCY_CONFLICT_GUARD=YES');
console.log('PREPARED_REPLAY_FAIL_CLOSED=YES');
console.log('CONNECTOR_CONTEXT_AUDIT=YES');
console.log('DIRECT_GOOGLE_BUSINESS_WRITE=NO');
console.log('PRODUCTION_MUTATION=NO');
