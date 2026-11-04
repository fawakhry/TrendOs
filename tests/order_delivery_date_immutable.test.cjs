'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const frontend = fs.readFileSync('app.js', 'utf8');
const backend = fs.readFileSync('Code.gs', 'utf8');

function sourceFunction(source, name) {
  const re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}', 'm');
  const m = source.match(re);
  assert.ok(m, 'missing function: ' + name);
  return m[0];
}

test('existing persisted delivery promise remains identical across calendar days', () => {
  const func = sourceFunction(frontend, 'displayExpectedDelivery');
  for (const simulatedToday of ['2026-11-04', '2026-11-05', '2026-11-15']) {
    const sandbox = { formatDisplayDate: (value) => value || '', Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [simulatedToday + 'T12:00:00+02:00'])); }
    }};
    const show = vm.runInNewContext('(' + func + ')', sandbox);
    assert.equal(show({ expectedDeliveryText: '2026/11/06', receivedAt: '2026/11/04' }), '2026/11/06');
    assert.equal(show({ expectedDeliveryAt: '2026/11/06' }), '2026/11/06');
    assert.equal(show({ receivedAt: '2026/11/04' }), 'غير محدد');
    assert.equal(show({}), 'غير محدد');
  }
  assert.doesNotMatch(frontend, /expectedDeliveryTextFromNow/);
});

test('creating an order does not invent a delivery date if the server omits it', () => {
  assert.match(frontend, /const expectedText = formatDisplayDate\(res\.expectedDeliveryText\) \|\| formatDisplayDate\(res\.expectedDeliveryAt\) \|\| "غير محدد";/);
});

test('reusing an old order cannot change its received or expected delivery date', () => {
  const fn = backend.match(/function trendosV1922TouchOpenOrder_\([\s\S]*?\n\}/);
  assert.ok(fn, 'legacy touch helper is missing');
  let writes = 0;
  const sheet = { getLastRow() {return 2;}, getRange() {writes++; throw Error('unexpected write/read');} };
  const noop = vm.runInNewContext('(' + fn[0] + ')');
  const result = noop(sheet, sheet, 'ORDER-123', new Date('2026-11-05'));
  assert.equal(result.changed, false);
  assert.equal(writes, 0);
  assert.match(backend, /const dateMoved = false;/);
  assert.doesNotMatch(backend, /if \(dateMoved\) trendosV1922TouchOpenOrder_/);
});

test('new-order and fly-print delivery policies are still present', () => {
  assert.match(backend, /function expectedDeliveryDate_\(createdAt\) \{[\s\S]*?return addDays_\(new Date\(createdAt\), 2\);/);
  assert.match(backend, /const expectedDeliveryAt = flyPrint \? new Date\(now\) : expectedDeliveryDate_\(now\);/);
});
