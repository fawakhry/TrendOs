import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflow = fs.readFileSync('.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml', 'utf8');

assert.match(workflow, /CORE-P0-11 E2E Readonly Gate/);
assert.match(workflow, /PROD_MAIN_EXPECTED: 2eee80b87a3aeccb5569055bc0544a43b22adcb7/);
assert.match(workflow, /\/v1\/edge\/orders\/session/);
assert.match(workflow, /\/v1\/edge\/orders\/02cr\/page\?screen=print/);
assert.match(workflow, /statusFilter=__DEBT__/);
assert.match(workflow, /activeSummaryCounts/);
assert.match(workflow, /heatPressOrders/);
assert.match(workflow, /sheetsAuthoritative/);
assert.match(workflow, /reconcile\.body\.enabled,false/);
assert.match(workflow, /genericDrainEnabled,false/);
assert.match(workflow, /WORK_PROBLEM_STATUS/); // only the negative live-file assertion is expected.
assert.match(workflow, /! grep -Fq 'WORK_PROBLEM_STATUS' \/tmp\/app\.js/);

const forbidden = [
  /wrangler[^\n]*\bdeploy\b/i,
  /wrangler[^\n]*\bsecret\s+put\b/i,
  /wrangler[^\n]*\bd1\s+execute\b/i,
  /clasp\s+push/i,
  /git\s+push\s+origin\s+HEAD:main/i,
  /versions\s+deploy/i,
  /migrations\s+apply/i,
  /updateLine/i,
  /addOrder/i,
  /pressControlV1[^\n]*(start|stop)/i,
  /trendosCoreP0RegistryWriteV1/,
  /trendosCoreP0RegistryRollbackV1/
];
for (const pattern of forbidden) {
  assert.doesNotMatch(workflow, pattern, `read-only boundary violated by ${pattern}`);
}

const postMethods = [...workflow.matchAll(/method:\s*'POST'/g)].length;
assert.equal(postMethods, 1, 'only the Edge session exchange may use POST');
assert.match(workflow, /body:JSON\.stringify\(\{username,token\}\)/);

console.log('CORE_P0_11_READONLY_GATE_CONTRACT_PASS');
