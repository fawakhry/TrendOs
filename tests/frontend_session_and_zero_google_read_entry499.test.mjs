import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge = fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const press = fs.readFileSync(new URL('../press-control-v1.js', import.meta.url), 'utf8');

assert.match(edge, /function zeroGoogleSnapshotStalenessAccepted\(body, name, mirror\)/);
assert.match(edge, /base\.googleHeartbeatRequired === false/);
assert.match(edge, /text\(base\.authority\) === 'd1-qualified-snapshot\+t12-native-overlay'/);
assert.match(edge, /enrichment\.degraded === true/);
assert.match(edge, /zeroGoogleSnapshotStalenessAccepted\(body, name, mirror\)/);

const loadRowsStart = app.indexOf('async function loadRows(force)');
const loadRowsEnd = app.indexOf('function bulkStatusScreenAllowed()', loadRowsStart);
assert.ok(loadRowsStart >= 0 && loadRowsEnd > loadRowsStart);
const loadRows = app.slice(loadRowsStart, loadRowsEnd);
assert.doesNotMatch(loadRows, /indexOf\("انتهت الجلسة"\).*logout\(\)/s);
assert.doesNotMatch(loadRows, /logout\(\)/);
assert.match(loadRows, /Data\/read failures must never destroy the employee browser session/);

assert.match(press, /employee-session-unavailable/);
assert.match(press, /if\(!txt\(u\.token\)\)/);
assert.match(press, /root=null;last=null/);

console.log('ENTRY499_FRONTEND_SESSION_AND_ZERO_GOOGLE_READ=PASS');
