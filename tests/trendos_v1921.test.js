const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(app, /V1922_UNIFIED_SAFE_BUILD/);
assert.match(app, /openMatbagyAccountingDayCloseV1921/);
assert.match(app, /screen:screen/);
assert.match(app, /dayClose\?'dailyClose'/);
assert.match(app, /roleMode\(\)!=='admin'/);
assert.match(app, /safeRefresh/);
assert.match(app, /Date\.now\(\)-lastSafeRefresh<180000/);
assert.match(app, /modalOpen\(\)/);
assert.match(app, /accountingDayCloseBtn/);
assert.match(app, /es47-v1922-unified-safe-build-20260811a/);

assert.match(config, /TrendOS V1922 Unified Safe Build/);
assert.match(config, /V1922_UNIFIED_SAFE_BUILD/);
assert.match(config, /es47-v1922-unified-safe-build-20260811a/);
assert.match(index, /trendos-v1922-unified-safe-build-20260811a/);
assert.match(index, /تحديث آمن تلقائي كل 3 دقائق/);

console.log('TrendOS V1922 unified safe build tests passed');
