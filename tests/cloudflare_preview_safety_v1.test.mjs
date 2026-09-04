import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleCloudWriteRequest } from '../cloudflare-d1/src/cloud-write-gate.mjs';
import {
  handleAccountingPreviewRequest,
  isAccountingPreviewPath
} from '../cloudflare-d1/src/accounting-preview.mjs';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath
} from '../cloudflare-d1/src/accounting-native-module.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

class MockStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  bind() {
    return this;
  }

  async first() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('SELECT 1 AS ok')) return { ok: 1 };
    if (compact.includes('COUNT(*) AS count FROM cloud_write_outbox')) return { count: 0 };
    return null;
  }

  async all() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('FROM sqlite_master')) return { results: [] };
    return { results: [] };
  }

  async run() {
    this.db.writeOps += 1;
    return { success: true };
  }
}

class MockDB {
  constructor() {
    this.writeOps = 0;
  }

  prepare(sql) {
    return new MockStatement(this, sql);
  }

  async batch() {
    this.writeOps += 1;
    return [];
  }
}

function makeEnv(overrides = {}) {
  return {
    DB: new MockDB(),
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: 'preview-test-secret',
    TRENDOS_CLOUD_WRITE_V1_ENABLED: 'false',
    ...overrides
  };
}

async function testHealthIsReadOnlyWhenDisabled() {
  const env = makeEnv();
  const response = await handleCloudWriteRequest(
    new Request('https://preview.test/v1/cloud/write/health', {
      headers: { Origin: 'https://fawakhry.github.io' }
    }),
    env
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.enabled, false);
  assert.equal(body.writesAccepted, false);
  assert.equal(body.schemaMutationFree, true);
  assert.equal(body.cutover, false);
  assert.equal(body.sheetsAuthoritative, true);
  assert.equal(env.DB.writeOps, 0);
}

async function testDisabledRouteCannotInitializeSchema() {
  const env = makeEnv();
  const response = await handleCloudWriteRequest(
    new Request('https://preview.test/v1/cloud/orders', {
      method: 'POST',
      headers: {
        Origin: 'https://fawakhry.github.io',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ clientRequestId: 'must-not-write', orderId: 'NO-WRITE' })
    }),
    env
  );
  assert.equal(response.status, 423);
  assert.equal(env.DB.writeOps, 0);
}

async function testEnabledAnonymousRequestCannotInitializeSchema() {
  const env = makeEnv({ TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true' });
  const response = await handleCloudWriteRequest(
    new Request('https://preview.test/v1/cloud/orders', {
      method: 'POST',
      headers: {
        Origin: 'https://fawakhry.github.io',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ clientRequestId: 'anonymous-no-write', orderId: 'NO-WRITE-AUTH' })
    }),
    env
  );
  assert.equal(response.status, 401);
  assert.equal(env.DB.writeOps, 0);
}

async function testAccountingPreviewSafety() {
  const env = makeEnv();
  assert.equal(isAccountingPreviewPath('/accounting'), true);
  assert.equal(isAccountingPreviewPath('/accounting/'), true);
  assert.equal(isAccountingPreviewPath('/v1/accounting/health'), true);
  assert.equal(isAccountingPreviewPath('/v1/cloud/orders'), false);

  const health = await handleAccountingPreviewRequest(
    new Request('https://preview.test/v1/accounting/health'),
    env
  );
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.equal(body.success, true);
  assert.equal(body.mode, 'preview-sandbox');
  assert.equal(body.cutover, false);
  assert.equal(body.authoritativeWrites, false);
  assert.equal(body.previewBrowserWrites, 'localStorage-only');
  assert.equal(body.writeAuthority, 'google-sheets-apps-script');
  assert.equal(body.sheetsAuthoritative, true);
  assert.equal(body.d1SchemaMutation, false);
  assert.equal(body.d1FinancialWrites, false);
  assert.equal(body.cloudWriteEnabled, false);
  assert.ok(body.integrationKeys.includes('Order ID'));
  assert.ok(body.integrationKeys.includes('Line ID'));
  assert.ok(body.modules.includes('bom'));
  assert.equal(env.DB.writeOps, 0);

  const page = await handleAccountingPreviewRequest(
    new Request('https://preview.test/accounting'),
    env
  );
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /TrendOS Accounting/);
  assert.match(html, /Order ID/);
  assert.match(html, /Line ID/);
  assert.match(html, /BOM \/ تكوين الأصناف/);
  assert.match(html, /localStorage/);
  assert.match(html, /بدون كتابة على الإنتاج/);
  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.equal(env.DB.writeOps, 0);

  const blocked = await handleAccountingPreviewRequest(
    new Request('https://preview.test/accounting', { method: 'POST' }),
    env
  );
  assert.equal(blocked.status, 405);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.authoritativeWrites, false);
  assert.equal(blockedBody.sheetsAuthoritative, true);
  assert.equal(env.DB.writeOps, 0);
}

async function testAccountingContractIsValidationOnly() {
  const env = makeEnv();
  assert.equal(isAccountingNativeModulePath('/v1/accounting/contract'), true);
  assert.equal(isAccountingNativeModulePath('/v1/accounting/validate'), true);

  const contract = await handleAccountingNativeModuleRequest(
    new Request('https://preview.test/v1/accounting/contract'),
    env
  );
  assert.equal(contract.status, 200);
  const contractBody = await contract.json();
  assert.equal(contractBody.mode, 'validation-only');
  assert.equal(contractBody.authoritativeWrites, false);
  assert.equal(contractBody.persistence, 'none');
  assert.ok(contractBody.entityTypes.includes('SalesInvoiceLine'));
  assert.ok(contractBody.envelope.required.includes('idempotencyKey'));
  assert.equal(env.DB.writeOps, 0);

  const validEnvelope = {
    entityType: 'SalesInvoiceLine',
    operation: 'validate-future-line',
    idempotencyKey: 'PREVIEW-SAFETY-LINE-001',
    payload: {
      invoiceLineId: 'INV-1-L1',
      invoiceId: 'INV-1',
      orderId: 'ORDER-1',
      sourceOrderId: 'ORDER-1',
      lineId: 'LINE-1',
      itemId: 'ITEM-1',
      quantity: 1,
      unitPrice: 100
    }
  };
  const validation = await handleAccountingNativeModuleRequest(
    new Request('https://preview.test/v1/accounting/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validEnvelope)
    }),
    env
  );
  assert.equal(validation.status, 200);
  const validationBody = await validation.json();
  assert.equal(validationBody.valid, true);
  assert.equal(validationBody.authoritativeWrites, false);
  assert.equal(validationBody.persistence, 'none');
  assert.equal(env.DB.writeOps, 0);

  const mismatch = await handleAccountingNativeModuleRequest(
    new Request('https://preview.test/v1/accounting/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...validEnvelope,
        idempotencyKey: 'PREVIEW-SAFETY-MISMATCH-001',
        payload: { ...validEnvelope.payload, sourceOrderId: 'ORDER-OTHER' }
      })
    }),
    env
  );
  assert.equal(mismatch.status, 422);
  const mismatchBody = await mismatch.json();
  assert.equal(mismatchBody.valid, false);
  assert.ok(mismatchBody.errors.some((x) => x.code === 'line-order-mismatch'));
  assert.equal(mismatchBody.persistence, 'none');
  assert.equal(env.DB.writeOps, 0);
}

function testWorkflowAndEntrySafetyContract() {
  const workflow = fs.readFileSync(
    path.join(root, '.github/workflows/trendos-cloudflare-edge-preview.yml'),
    'utf8'
  );
  const entry = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
  const previewConfig = fs.readFileSync(
    path.join(root, 'cloudflare-d1/preview/wrangler.toml'),
    'utf8'
  );

  const executableMigrationCommand = /^\s+(?:npx\s+--yes\s+)?wrangler@?.*\bd1\s+migrations\s+apply\b/im;
  assert.doesNotMatch(workflow, executableMigrationCommand);
  assert.match(workflow, /D1 migrations: NOT APPLIED BY PREVIEW WORKFLOW/);
  assert.match(entry, /cloud-write-gate\.mjs/);
  assert.match(entry, /accounting-preview\.mjs/);
  assert.match(entry, /accounting-native-module\.mjs/);
  assert.match(entry, /isAccountingPreviewPath/);
  assert.match(entry, /isAccountingNativeModulePath/);

  assert.match(previewConfig, /name\s*=\s*"trendos-edge-gateway-preview"/);
  assert.match(previewConfig, /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/);
  assert.match(previewConfig, /database_name\s*=\s*"trendos-main"/);
  assert.doesNotMatch(previewConfig, /migrations_dir\s*=/);
}

await testHealthIsReadOnlyWhenDisabled();
await testDisabledRouteCannotInitializeSchema();
await testEnabledAnonymousRequestCannotInitializeSchema();
await testAccountingPreviewSafety();
await testAccountingContractIsValidationOnly();
testWorkflowAndEntrySafetyContract();

console.log('Cloudflare Preview Safety V1 tests: PASS');
