import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY636_GLOBAL_NATIVE_COMPLETENESS_AUDIT.json','utf8'));
const config=fs.readFileSync('config.js','utf8');
const dispatcher=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');

assert.equal(manifest.entry,'Entry636');
assert.equal(manifest.decision,'BLOCK_GLOBAL_NATIVE_FRONTEND_CUTOVER');
assert.deepEqual(manifest.unresolvedActiveNativeGap,['شريف']);
assert.equal(manifest.liveRuntime.frontendGlobalNativeAuth,false);
assert.equal(manifest.liveRuntime.nativeReadyCount,5);
assert.equal(manifest.authoritativeSpreadsheet.sensitiveColumnsRead,false);

assert.match(config,/window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1\s*=\s*false;/);
assert.match(config,/window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1\s*=\s*false;/);
assert.match(config,/window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS\s*=\s*\[\];/);
assert.match(dispatcher,/T12_ENTRY635_NATIVE_ONLY_BRIDGE_FREE_PREFLIGHT_V1_20261006/);

console.log('ENTRY636_GLOBAL_NATIVE_GUARD=PASS');
console.log('ENTRY636_UNRESOLVED_ACTIVE_NATIVE_GAP=شريف');
console.log('ENTRY636_GLOBAL_NATIVE_FRONTEND=OFF');
console.log('ENTRY636_PRODUCTION_MUTATION=NO');
