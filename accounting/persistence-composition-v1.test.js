'use strict';
var assert = require('assert');
var composition = require('./persistence-composition-v1');

function fakeDb() {
  return {
    prepare: function () { return { bind: function () { return this; }, first: async function () { return null; } }; },
    batch: async function () { return []; }
  };
}

async function expectZeroWrite(options, label) {
  var p = composition.createPersistence(options);
  assert.strictEqual(p.mode, 'ZERO_WRITE', label);
  var threw = false;
  try { await p.commit({}); } catch (err) {
    threw = true;
    assert.strictEqual(err.code, 'ACCOUNTING_PERSISTENCE_ZERO_WRITE');
  }
  assert.ok(threw, label + ' must reject commit');
}

(async function () {
  await expectZeroWrite({}, 'default');
  await expectZeroWrite({ stage: 'production', capabilities: [composition.WRITE_CAPABILITY], allowWrite: true, db: fakeDb() }, 'production hard deny');
  await expectZeroWrite({ stage: 'preview', capabilities: [], allowWrite: true, db: fakeDb() }, 'missing capability');
  await expectZeroWrite({ stage: 'preview', capabilities: [composition.WRITE_CAPABILITY], allowWrite: false, db: fakeDb() }, 'missing explicit opt-in');
  await expectZeroWrite({ stage: 'preview', capabilities: [composition.WRITE_CAPABILITY], allowWrite: true }, 'missing injected db');

  var preview = composition.createPersistence({
    stage: 'preview',
    capabilities: [composition.WRITE_CAPABILITY],
    allowWrite: true,
    db: fakeDb()
  });
  assert.strictEqual(preview.mode, 'D1_PREVIEW_WRITE');
  assert.strictEqual(preview.gate.enabled, true);

  var test = composition.createPersistence({
    stage: 'test',
    capabilities: [composition.WRITE_CAPABILITY],
    allowWrite: true,
    db: fakeDb()
  });
  assert.strictEqual(test.mode, 'D1_PREVIEW_WRITE');

  console.log('Accounting persistence composition v1 tests passed');
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
