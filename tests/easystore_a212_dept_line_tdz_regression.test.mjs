import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("async function saveDeptLineA2V1"));
assert.ok(mod.includes("const materialCostValue=num(b.materialCost)||materialConsumption*await materialCost(env,materialName);"));
assert.ok(mod.includes("total=num(b.totalCost,materialCostValue+operating+other)"));
assert.ok(mod.includes("materialConsumption,materialCostValue,operating,other,total"));
assert.ok(!mod.includes("const materialCost=num(b.materialCost)||materialConsumption*await materialCost(env,materialName);"));

console.log('A212_DEPT_LINE_TDZ_REGRESSION=PASS');
console.log('A212_DEPT_LINE_MATERIAL_COST_FUNCTION_NOT_SHADOWED=YES');
console.log('PRODUCTION_MUTATION=NO');
