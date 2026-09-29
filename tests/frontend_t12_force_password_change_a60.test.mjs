import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.match(app,/var forced = !!\(state\.user && state\.user\.mustChange\)/);
assert.match(app,/cancelBtn\.classList\.toggle\("hidden", forced\)/);
assert.match(app,/cancelBtn\.disabled = forced/);
assert.match(app,/if \(state\.user && state\.user\.mustChange\) \{/);
assert.match(app,/لازم تغيّر كلمة المرور المؤقتة قبل متابعة استخدام المنصة/);
assert.match(app,/if \(state\.user\.mustChange\) \{\s*openPasswordModal\(\);\s*\}/);
assert.match(html,/app\.js\?v=20260929-t12-a60-force-password-change/);

console.log('T12 A60 mandatory employee password change contract: PASS');
