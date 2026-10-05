import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/production-shadow/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/production-shadow/wrangler.toml','utf8');

assert.match(config,/^name = "autonomous-printshop-shadow"$/m);
assert.match(config,/^database_name = "trendos-main"$/m);
assert.match(config,/^database_id = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"$/m);
assert.match(worker,/PRODUCTION_SHADOW_READ_ONLY/);
assert.match(worker,/rawOrderIdsExposed:false/);
assert.match(worker,/rawLineIdsExposed:false/);
assert.match(worker,/piiExposed:false/);
assert.match(worker,/writesAccepted:false/);
assert.match(worker,/d1Mutation:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(worker,/SELECT 1 AS ok/);
assert.match(worker,/FROM sheet_catalog/);
assert.match(worker,/FROM sheet_rows/);

for(const forbidden of [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[A-Za-z_"'\[]/i,
  /\bDELETE\s+FROM\b/i,
  /\bREPLACE\s+INTO\b/i,
  /\bCREATE\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\.run\s*\(/,
  /\.batch\s*\(/
]){
  assert.doesNotMatch(worker,forbidden);
}

console.log('AUTONOMOUS_PRINTSHOP_PRODUCTION_SHADOW_WORKER=PASS');
console.log('AUTHORITY=READ_ONLY_D1');
console.log('PII_EXPOSED=NO');
console.log('RAW_ORDER_IDS_EXPOSED=NO');
console.log('D1_MUTATION_CODE=NO');
