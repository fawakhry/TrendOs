'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const app = fs.readFileSync('app.js', 'utf8');

test('persisted delivery date stays fixed across calendar changes', () => {
  const fn = app.match(/function displayExpectedDelivery\(row\) \{[\s\S]*?\n  \}/);
  assert.ok(fn, 'displayExpectedDelivery was not found');
  for (const today of ['2026-11-04', '2026-11-05', '2026-11-20']) {
    const sandbox = { formatDisplayDate: v => v || '', Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [today + 'T12:00:00+02:00'])); }
    }};
    const display = vm.runInNewContext('(' + fn[0] + ')', sandbox);
    assert.equal(display({ expectedDeliveryText:'2026/11/06' }), '2026/11/06');
    assert.equal(display({ expectedDeliveryAt:'2026/11/06' }), '2026/11/06');
    assert.equal(display({ receivedAt:'2026/11/04' }), 'غير محدد');
    assert.equal(display({}), 'غير محدد');
  }
  assert.doesNotMatch(app, /expectedDeliveryTextFromNow/);
});

test('order-creation confirmation does not invent today + 2 on missing server response', () => {
  assert.match(app, /const expectedText = formatDisplayDate\(res\.expectedDeliveryText\) \|\| formatDisplayDate\(res\.expectedDeliveryAt\) \|\| "غير محدد";/);
});
