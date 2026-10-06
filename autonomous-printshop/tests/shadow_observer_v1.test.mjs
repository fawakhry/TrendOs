import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/observer/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/observer/wrangler.toml','utf8');

assert.match(config,/^name = "autonomous-printshop-observer"$/m);
assert.match(config,/^crons = \["5 \* \* \* \*"\]$/m);
assert.match(config,/^database_name = "trendos-main"$/m);
assert.match(worker,/recordAutonomyShadowEventV1/);
assert.match(worker,/EMPLOYEE_TASK_ASSIGNMENT/);
assert.match(worker,/v1-readiness-shadow/);
assert.match(worker,/AUTONOMY_CONTROL_NOT_SHADOW/);
assert.match(worker,/READINESS_CONTROL_NOT_SHADOW/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(worker,/previewObservationV1/);
assert.match(worker,/buildObservationPlan/);
assert.match(worker,/rawLineIdsExposed:false/);
assert.match(worker,/rawOrderIdsExposed:false/);
assert.match(worker,/writePerformed:false/);
assert.ok(worker.includes("path==='/preview'"));
assert.match(worker,/SHADOW_OBSERVER_PREVIEW/);

for(const forbidden of [
  /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+t12_prod_/i,
  /UPDATE\s+t12_prod_/i,
  /DELETE\s+FROM\s+t12_prod_/i,
  /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+employee_/i,
  /UPDATE\s+employee_/i,
  /DELETE\s+FROM\s+employee_/i,
  /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+operator_tasks/i,
  /UPDATE\s+operator_tasks/i
]){
  assert.doesNotMatch(worker,forbidden);
}

const ledger=fs.readFileSync('autonomous-printshop/core/autonomy-event-ledger-v1.mjs','utf8');
assert.match(ledger,/INSERT OR IGNORE INTO autonomy_events/);
assert.doesNotMatch(ledger,/INSERT OR IGNORE INTO t12_prod_/i);
assert.doesNotMatch(ledger,/UPDATE t12_prod_/i);
assert.doesNotMatch(ledger,/INSERT OR IGNORE INTO operator_tasks/i);

console.log('AUTONOMOUS_PRINTSHOP_SHADOW_OBSERVER_V1=PASS');
console.log('WRITE_AUTHORITY=AUTONOMY_EVENTS_ONLY');
console.log('BUSINESS_WRITE=NO');
console.log('OPERATOR_TASK_WRITE=NO');
console.log('CRON=HOURLY_AT_MINUTE_5');
