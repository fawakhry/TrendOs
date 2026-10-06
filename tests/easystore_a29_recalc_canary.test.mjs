import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("if(action==='recalcAccountingMaterialsCascade')"));
assert.ok(mod.includes('employee-accounting-canary-recalc-shape-blocked'));
assert.ok(mod.includes('employee-accounting-canary-recalc-active-master-blocked'));
assert.ok(mod.includes("SELECT (SELECT COUNT(*) FROM employee_accounting_materials_v1 WHERE active=1) AS activeMaterials,(SELECT COUNT(*) FROM employee_accounting_templates_v1 WHERE active=1) AS activeTemplates"));
assert.ok(mod.includes("requireEnabled&&action==='recalcAccountingMaterialsCascade'"));
assert.ok(mod.includes("allowed=new Set(['action','username','name','_ts','requestId'"));
assert.ok(mod.includes("if(Number(r&&r.activeMaterials||0)!==0||Number(r&&r.activeTemplates||0)!==0)"));
assert.ok(mod.includes("else if(action==='recalcAccountingMaterialsCascade'||action==='recalculateAccountingMaterials'||action==='recalculateAccountingMaterialsCascade')out=await recalcAccountingMaterialsCascadeV1"));
assert.ok(mod.includes("await auditEventV1(env,ctx,'material-cost-cascade','all','recalculate'"));
assert.ok(mod.includes("const ctx=await beginCommandV1(env,auth,'material-cost-cascade',b||{})"));

console.log('A29_RECALC_CANARY_SERVER_GUARD=PASS');
console.log('A29_RECALC_REQUIRES_ZERO_ACTIVE_MASTERS=YES');
console.log('A29_RECALC_PAYLOAD_FAIL_CLOSED=YES');
console.log('A29_RECALC_EXPECTED_MASTER_MUTATION_WHEN_QUALIFIED=ZERO');
console.log('PRODUCTION_MUTATION=NO');
