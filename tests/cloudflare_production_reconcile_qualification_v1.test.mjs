import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { issueEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';
import { handleCloudWriteRequest } from '../cloudflare-d1/src/cloud-write-gate.mjs';
import {
  handleProductionReconcileQualificationRequest,
  isProductionReconcileQualificationPath,
  productionReconcileQualificationContract
} from '../cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const EDGE_SECRET = 'prod-reconcile-qualification-edge-test-secret';
const RECONCILE_SECRET = 'prod-reconcile-qualification-apps-script-test-secret';
const TARGET = 'CW-PROD-QUAL-33975124471';
const CONFIRM = 'QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471';

class SQLiteStatementAdapter {
  constructor(owner, sql) { this.owner = owner; this.sql = sql; this.params = []; }
  bind(...params) { this.params = params; return this; }
  async first() { return this.owner.db.prepare(this.sql).get(...this.params) || null; }
  async all() { return { results: this.owner.db.prepare(this.sql).all(...this.params) }; }
  async run() { return this.owner.db.prepare(this.sql).run(...this.params); }
}

class SQLiteD1Adapter {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  prepare(sql) { return new SQLiteStatementAdapter(this, sql); }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.db.exec('COMMIT;');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
  row(sql, ...params) { return this.db.prepare(sql).get(...params) || null; }
}

function makeEnv() {
  const DB = new SQLiteD1Adapter();
  DB.db.exec(fs.readFileSync(path.join(root, 'cloudflare-d1/migrations/0001_init.sql'), 'utf8'));
  return {
    DB,
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: EDGE_SECRET,
    TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true',
    TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED: 'true',
    TRENDOS_PROD_RECONCILE_QUALIFY_SECRET: RECONCILE_SECRET,
    APPS_SCRIPT_API_URL: 'https://script.google.test/exec'
  };
}

async function edgeHeaders() {
  const token = await issueEdgeSessionToken({ sub: 'ci-02cl-qualifier' }, EDGE_SECRET, Math.floor(Date.now() / 1000), 300);
  return {
    Origin: 'https://fawakhry.github.io',
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

async function createCloudOrder(env, body) {
  const response = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: await edgeHeaders(),
    body: JSON.stringify(body)
  }), env);
  assert.equal(response.status, 201);
}

const productionIndex = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
assert.equal(productionIndex.includes('cloud-write-production-reconcile-qualification'), false, 'candidate must not be wired into Production before live authorization');
assert.equal(productionReconcileQualificationContract.targetOrderId, TARGET);
assert.equal(productionReconcileQualificationContract.confirmation, CONFIRM);
assert.equal(isProductionReconcileQualificationPath('/v1/qualification/cloud-write/reconcile/order'), true);
assert.equal(isProductionReconcileQualificationPath('/v1/cloud/write/outbox'), false);

const env = makeEnv();
await createCloudOrder(env, {
  clientRequestId: 'older-decoy',
  orderId: 'CW-PROD-DECOY-MUST-STAY-PENDING',
  customerName: 'Decoy must remain untouched',
  status: 'cloud-draft',
  total: 1,
  remaining: 1
});
await createCloudOrder(env, {
  clientRequestId: 'prod-qual-33975124471',
  orderId: TARGET,
  customerName: 'TrendOS Production Cloud Write Qualification',
  status: 'cloud-qualification',
  department: 'SYSTEM-QUALIFICATION',
  priority: 'qualification',
  total: 0,
  remaining: 0
});

const disabledEnv = { ...env, TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED: 'false' };
const disabled = await handleProductionReconcileQualificationRequest(new Request('https://worker.test/v1/qualification/cloud-write/reconcile/order', {
  method: 'POST',
  headers: await edgeHeaders(),
  body: JSON.stringify({ confirmation: CONFIRM, orderId: TARGET })
}), disabledEnv);
assert.equal(disabled.status, 423);
assert.equal(env.DB.row(`SELECT status FROM cloud_write_outbox WHERE entity_id=?`, TARGET).status, 'pending');

const badConfirm = await handleProductionReconcileQualificationRequest(new Request('https://worker.test/v1/qualification/cloud-write/reconcile/order', {
  method: 'POST',
  headers: await edgeHeaders(),
  body: JSON.stringify({ confirmation: 'WRONG', orderId: TARGET })
}), env);
assert.equal(badConfirm.status, 400);
assert.equal(env.DB.row(`SELECT status FROM cloud_write_outbox WHERE entity_id=?`, TARGET).status, 'pending');

const originalFetch = globalThis.fetch;
let appsScriptCalls = 0;
globalThis.fetch = async (url, options) => {
  appsScriptCalls += 1;
  assert.equal(String(url), env.APPS_SCRIPT_API_URL);
  assert.equal(options.method, 'POST');
  const form = new URLSearchParams(String(options.body || ''));
  assert.equal(form.get('action'), 'cloudWriteReconcileProductionQualificationV1');
  assert.equal(form.get('confirmation'), CONFIRM);
  assert.equal(form.get('entityId'), TARGET);
  assert.equal(form.get('operation'), 'upsert_order_to_sheets');
  assert.equal(form.get('reconcileSecret'), RECONCILE_SECRET);
  const payload = JSON.parse(form.get('payloadJson'));
  assert.equal(payload.orderId, TARGET);
  assert.equal(payload.clientRequestId, 'prod-qual-33975124471');
  assert.equal(payload._cloudWriteV1, true);
  const replay = appsScriptCalls > 1;
  return new Response(JSON.stringify({
    success: true,
    qualification: true,
    productionQualificationOnly: true,
    persisted: true,
    idempotent: replay,
    decision: replay ? 'existing_identical_noop' : 'inserted_and_verified',
    entityId: TARGET,
    orderId: TARGET,
    payloadSha256: form.get('payloadSha256'),
    existingMatchesAfter: 1,
    sheetsWritten: !replay,
    mutationCount: replay ? 0 : 1,
    productionCutover: false,
    sheetsAuthoritative: true
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

try {
  const execute = await handleProductionReconcileQualificationRequest(new Request('https://worker.test/v1/qualification/cloud-write/reconcile/order', {
    method: 'POST',
    headers: await edgeHeaders(),
    body: JSON.stringify({ confirmation: CONFIRM, orderId: TARGET })
  }), env);
  assert.equal(execute.status, 200);
  const executeBody = await execute.json();
  assert.equal(executeBody.success, true);
  assert.equal(executeBody.state, 'synced');
  assert.equal(executeBody.entityId, TARGET);
  assert.equal(executeBody.productionCutover, false);
  assert.equal(executeBody.sheetsAuthoritative, true);
  assert.equal(appsScriptCalls, 1);

  assert.equal(env.DB.row(`SELECT status FROM cloud_write_outbox WHERE entity_id=?`, TARGET).status, 'synced');
  assert.equal(env.DB.row(`SELECT status FROM cloud_write_outbox WHERE entity_id='CW-PROD-DECOY-MUST-STAY-PENDING'`).status, 'pending');
  const event = env.DB.row(`SELECT status,sheets_status AS sheetsStatus FROM cloud_write_events WHERE entity_id=?`, TARGET);
  assert.equal(event.status, 'reconciled');
  assert.equal(event.sheetsStatus, 'synced');

  const replay = await handleProductionReconcileQualificationRequest(new Request('https://worker.test/v1/qualification/cloud-write/reconcile/order/replay-proof', {
    method: 'POST',
    headers: await edgeHeaders(),
    body: JSON.stringify({ confirmation: CONFIRM, orderId: TARGET })
  }), env);
  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.success, true);
  assert.equal(replayBody.replayProof, true);
  assert.equal(replayBody.idempotent, true);
  assert.equal(replayBody.d1Written, false);
  assert.equal(replayBody.sheetsWritten, false);
  assert.equal(replayBody.mutationCount, 0);
  assert.equal(appsScriptCalls, 2);
  assert.equal(env.DB.row(`SELECT status FROM cloud_write_outbox WHERE entity_id='CW-PROD-DECOY-MUST-STAY-PENDING'`).status, 'pending');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Production Reconcile Qualification V1: DEFAULT-OFF + EXACT 02CK TARGET + APPS SCRIPT ACK + REPLAY-NOOP + DECOY UNTOUCHED PASS');
