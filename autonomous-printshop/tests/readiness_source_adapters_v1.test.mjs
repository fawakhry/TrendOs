import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  legacyDesignEvidenceCandidatesV1,
  materialBlockerEvidenceCandidatesV1
} from '../core/readiness-source-adapters-v1.mjs';

let out=legacyDesignEvidenceCandidatesV1([
  {lineId:'1-1',ready:'نعم',updatedAt:'2026-10-05 10:00:00'},
  {lineId:'1-2',ready:'لا',updatedAt:'2026-10-05 10:01:00'},
  {lineId:'1-3',ready:'',updatedAt:'2026-10-05 10:02:00'}
]);
assert.equal(out.length,2);
assert.equal(out[0].kind,'DESIGN');
assert.equal(out[0].state,'READY');
assert.match(out[0].sourceVersion,/legacy-ready@/);
assert.equal(out[1].state,'BLOCKED');

const now=1800000000000;
out=materialBlockerEvidenceCandidatesV1([
  {lineId:'2-1',department:'ليزر',materialName:'MDF',materialConsumption:3,materialId:'m1',stockQty:2,materialVersion:4},
  {lineId:'2-2',department:'ليزر',materialName:'MDF',materialConsumption:3,materialId:'m1',stockQty:10,materialVersion:4},
  {lineId:'2-3',department:'طباعة',materialName:'ورق',materialConsumption:0,materialId:'m2',stockQty:0,materialVersion:1}
],{nowMs:now});
assert.equal(out.length,1);
assert.equal(out[0].lineId,'2-1');
assert.equal(out[0].state,'BLOCKED');
assert.equal(out[0].sourceKind,'MATERIAL_LEDGER');
assert.equal(out[0].evidence.reason,'INSUFFICIENT_STOCK');
assert.ok(out[0].expiresAtMs>out[0].observedAtMs);

const source=fs.readFileSync('autonomous-printshop/core/readiness-source-adapters-v1.mjs','utf8');
assert.match(source,/FROM autonomous_machine_control/);
assert.match(source,/machineControl&&machineControl\.mode/);
assert.match(source,/==='SHADOW'/);

console.log('AUTONOMOUS_PRINTSHOP_READINESS_SOURCE_ADAPTERS_V1=PASS');
console.log('LEGACY_DESIGN=EXPLICIT_READY_FIELD_ONLY');
console.log('MATERIAL_READY_FROM_CATALOG_ONLY=NO');
console.log('MATERIAL_BLOCKED_WHEN_EXPLICITLY_INSUFFICIENT=YES');
console.log('MACHINE_EVIDENCE_REQUIRES_MACHINE_CONTROL_SHADOW=YES');
console.log('MACHINE_EVIDENCE_SYNTHESIS=NO');

const adapterSource=fs.readFileSync('autonomous-printshop/core/readiness-source-adapters-v1.mjs','utf8');
assert.match(adapterSource,/FROM employee_accounting_control_v1/);
assert.match(adapterSource,/accountingControl&&accountingControl\.mode\)==='READONLY'/);
assert.match(adapterSource,/materialAuthorityReadOnly/);
console.log('MATERIAL_AUTHORITY_GATE=ACCOUNTING_READONLY_REQUIRED');
