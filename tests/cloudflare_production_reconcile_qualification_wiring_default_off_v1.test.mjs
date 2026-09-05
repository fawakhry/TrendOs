import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import production from '../cloudflare-d1/production-shadow/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const wrapper = fs.readFileSync(path.join(root, 'cloudflare-d1/production-shadow/index.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
const wrangler = fs.readFileSync(path.join(root, 'cloudflare-d1/wrangler.toml'), 'utf8');

assert.equal(wrapper.includes("../src/cloud-write-production-reconcile-qualification.mjs"), true, '02CL route must be isolated in Production wrapper');
assert.equal(wrapper.includes('isProductionReconcileQualificationPath(path)'), true, '02CL path gate must be explicit');
assert.equal(wrapper.includes('handleProductionReconcileQualificationRequest(request, env, ctx)'), true, '02CL handler must be routed explicitly');
assert.equal(core.includes('cloud-write-production-reconcile-qualification'), false, '02CL must stay outside generic core entrypoint');
assert.match(wrangler, /^TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"$/m);
assert.doesNotMatch(wrangler, /^TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "true"$/m);
assert.doesNotMatch(wrangler, /^TRENDOS_PROD_RECONCILE_QUALIFY_SECRET\s*=/m, 'qualification secret must not be committed as a plain var');

const request = new Request('https://worker.test/v1/qualification/cloud-write/reconcile/order', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    confirmation: 'QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471',
    orderId: 'CW-PROD-QUAL-33975124471'
  })
});

// Deliberately no DB, no EDGE_SESSION_SECRET and no Apps Script configuration.
// A correct default-OFF route must reject before touching any of them.
const response = await production.fetch(request, {
  TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED: 'false'
}, {});

assert.equal(response.status, 423);
const body = await response.json();
assert.equal(body.success, false);
assert.equal(body.code, 'qualification-disabled');
assert.equal(body.qualificationOnly, true);
assert.equal(body.targetOrderId, 'CW-PROD-QUAL-33975124471');
assert.equal(body.genericDrainEnabled, false);
assert.equal(body.productionCutover, false);
assert.equal(body.sheetsAuthoritative, true);

console.log('02CL Production wrapper wiring: ISOLATED ROUTE + CONFIG DEFAULT-OFF + PRE-DB/PRE-AUTH FAIL-CLOSED PASS');
