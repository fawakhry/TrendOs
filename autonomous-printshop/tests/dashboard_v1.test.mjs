import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/dashboard/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/dashboard/wrangler.toml','utf8');

assert.match(config,/^name = "autonomous-printshop-dashboard"$/m);
assert.match(worker,/مركز المطبعة الذاتية/);
assert.match(worker,/\/control-tower/);
assert.match(worker,/path==='\/state'/);
assert.match(worker,/READ_ONLY_CONTROL_TOWER_UI/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(worker,/METHOD_NOT_ALLOWED/);
assert.match(worker,/Raw IDs\/PII/);

for(const forbidden of [
  /INSERT\s/i,
  /UPDATE\s/i,
  /DELETE\s/i,
  /PATCH\s/i,
  /POST['"]/i,
  /PUT['"]/i
]){
  assert.doesNotMatch(worker,forbidden);
}

console.log('AUTONOMOUS_PRINTSHOP_DASHBOARD_V1=PASS');
console.log('DATA_SOURCE=CONTROL_TOWER_SHADOW_ONLY');
console.log('BUSINESS_WRITE=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');
