import assert from 'node:assert/strict';
import {
  cloudAuthShadowEnabled,
  cloudAuthTokenFingerprint,
  lookupCloudAuthShadow,
  rememberCloudAuthShadow
} from '../src/cloud-auth-shadow-v1.mjs';

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    this.db.calls.push({ sql: this.sql, args });
    return this;
  }
  async first() {
    return this.db.firstRow;
  }
  async run() {
    this.db.runCount += 1;
    return { success: true };
  }
}

class FakeDb {
  constructor(firstRow = null) {
    this.firstRow = firstRow;
    this.calls = [];
    this.runCount = 0;
  }
  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

function env(db, enabled = true) {
  return {
    DB: db,
    EDGE_SESSION_SECRET: 'test-only-edge-secret-that-is-not-production',
    TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: enabled ? 'true' : 'false',
    CLOUD_AUTH_SHADOW_TTL_SECONDS: '300'
  };
}

async function testFlagIsDefaultOff() {
  assert.equal(cloudAuthShadowEnabled({}), false);
  assert.equal(cloudAuthShadowEnabled({ TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: 'true' }), true);
}

async function testFingerprintIsKeyedAndNonRaw() {
  const db = new FakeDb();
  const e = env(db);
  const a = await cloudAuthTokenFingerprint('Wael', 'employee-secret-token', e);
  const b = await cloudAuthTokenFingerprint('Wael', 'employee-secret-token', e);
  const c = await cloudAuthTokenFingerprint('Wael', 'different-token', e);
  assert.equal(a.length, 64);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a.includes('employee-secret-token'), false);
}

async function testDisabledShadowDoesNotTouchDb() {
  const db = new FakeDb();
  const e = env(db, false);
  const lookup = await lookupCloudAuthShadow('wael', 'employee-secret-token', e, 1000);
  const stored = await rememberCloudAuthShadow('wael', 'employee-secret-token', { success: true, username: 'wael' }, e, 1000);
  assert.equal(lookup.hit, false);
  assert.equal(lookup.reason, 'disabled');
  assert.equal(stored.stored, false);
  assert.equal(stored.reason, 'disabled');
  assert.equal(db.calls.length, 0);
}

async function testRememberStoresFingerprintNotRawToken() {
  const db = new FakeDb();
  const e = env(db);
  const now = 1_700_000_000_000;
  const result = await rememberCloudAuthShadow('wael', 'employee-secret-token', {
    success: true,
    user: { username: 'wael', role: 'print', department: 'طباعة', screens: ['print', 'press', ''] }
  }, e, now);

  assert.equal(result.stored, true);
  assert.equal(result.expiresAtMs, now + 300_000);
  assert.equal(db.runCount, 1);
  assert.equal(db.calls.length, 1);
  const args = db.calls[0].args;
  assert.equal(args.includes('employee-secret-token'), false);
  assert.equal(args[0], 'wael');
  assert.match(args[1], /^[0-9a-f]{64}$/);
  assert.equal(args[2], 'wael');
  assert.equal(args[3], 'print');
  assert.equal(args[4], 'طباعة');
}

async function testLookupRehydratesVerifiedClaims() {
  const db = new FakeDb({
    canonicalUsername: 'wael',
    role: 'print',
    department: 'طباعة',
    screensJson: '["print","press",""]',
    verifiedAtMs: 1000,
    expiresAtMs: 999999,
    source: 'apps-script-post'
  });
  const e = env(db);
  const result = await lookupCloudAuthShadow('wael', 'employee-secret-token', e, 2000);
  assert.equal(result.hit, true);
  assert.equal(result.body.success, true);
  assert.equal(result.body.user.username, 'wael');
  assert.equal(result.body.user.role, 'print');
  assert.equal(result.body.user.department, 'طباعة');
  assert.deepEqual(result.body.user.screens, ['print', 'press', '']);
  assert.equal(result.body.authSource, 'd1-auth-shadow-v1');
  assert.equal(db.calls[0].args.includes('employee-secret-token'), false);
}

await testFlagIsDefaultOff();
await testFingerprintIsKeyedAndNonRaw();
await testDisabledShadowDoesNotTouchDb();
await testRememberStoresFingerprintNotRawToken();
await testLookupRehydratesVerifiedClaims();

console.log('CLOUD_AUTH_SHADOW_V1_T2=PASS');
console.log('RAW_EMPLOYEE_TOKEN_STORED=NO');
console.log('AUTH_SHADOW_DEFAULT_ENABLED=NO');
console.log('PRODUCTION_D1_MIGRATION=NO');
