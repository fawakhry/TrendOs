const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(app, /V1921_SEMI_AUTOMATIC_ACCOUNTING/);
assert.match(app, /openMatbagyAccountingDayCloseV1921/);
assert.match(app, /screen:screen/);
assert.match(app, /dayClose\?'dailyClose'/);
assert.match(app, /roleMode\(\)!=='admin'/);
assert.match(app, /safeRefresh/);
assert.match(app, /Date\.now\(\)-lastSafeRefresh<180000/);
assert.match(app, /modalOpen\(\)/);
assert.match(app, /accountingDayCloseBtn/);
assert.match(app, /es46-v1921-semi-automatic-accounting-20260811a/);

assert.match(config, /TrendOS V1921 Semi-Automatic Accounting/);
assert.match(config, /V1921_SEMI_AUTOMATIC_ACCOUNTING/);
assert.match(config, /es46-v1921-semi-automatic-accounting-20260811a/);
assert.match(index, /trendos-v1921-semi-automatic-accounting-20260811a/);
assert.match(index, /تحديث آمن تلقائي كل 3 دقائق/);

console.log('TrendOS V1921 semi-automatic accounting tests passed');
