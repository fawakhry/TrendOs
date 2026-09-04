/* TrendOS Cloud Write Staging Reconciliation V1
 *
 * STAGING-ONLY verification transport. It never calls Apps Script and never
 * writes Google Sheets. A successful verification closes an outbox row as
 * `staging_verified` with `sheets_status=not_written_staging`.
 */

import { verifyEdgeSessionToken } from './edge-gateway.mjs';
import { reconcileNextOutboxItem } from './cloud-write-reconcile-core.mjs';

const PREFIX = '/v1/staging/cloud-write/reconcile';

function text(value) {
  return String(value == null ? '' : value).trim();
}

function enabled(env) {
  return text(env && env.TRENDOS_STAGING_RECONCILE_VERIFY_ENABLED).toLowerCase() === 'true';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function bearerToken(request) {
  const header = text(request.headers.get('Authorization'));
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

async function requireSession(request, env) {
  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env.EDGE_SESSION_SECRET));
  if (verified.ok) return { ok: true, session: verified.payload };
  return {
    ok: false,
    response: json({
      success: false,
      message: 'Unauthorized staging reconciliation session',
      code: verified.reason,
      stagingOnly: true,
      sheetsWritten: false
    }, 401)
  };
}

function toHex(bytes) {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function payloadSha256(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload || {}));
  const digest = await crypto.subtle.digest('SHA-256', raw);
  return toHex(new Uint8Array(digest));
}

async function stagingVerificationTransport(job) {
  if (text(job.entityType) !== 'order') {
    throw new Error('Staging verifier accepts order entities only');
  }
  if (text(job.operation) !== 'upsert_order_to_sheets') {
    throw new Error('Staging verifier accepts the order reconciliation operation only');
  }
  if (!text(job.entityId).startsWith('CW-STAGE-')) {
    throw new Error('Staging verifier refuses non-test order IDs');
  }

  const payload = job.payload || {};
  if (text(payload.orderId) !== text(job.entityId)) {
    throw new Error('Staging verifier payload orderId mismatch');
  }
  if (payload._cloudWriteV1 !== true) {
    throw new Error('Staging verifier requires a Cloud Write V1 payload');
  }

  const sha256 = await payloadSha256(payload);
  return {
    success: true,
    entityId: job.entityId,
    sha256,
    note: `STAGING_VERIFY_ONLY sha256=${sha256}; NO_SHEETS_WRITE`
  };
}

async function health(env) {
  let database = false;
  let pending = null;
  let verified = null;
  try {
    const probe = await env.DB.prepare('SELECT 1 AS ok').first();
    database = !!(probe && Number(probe.ok) === 1);
    if (database) {
      const counts = await env.DB.prepare(`
        SELECT
          SUM(CASE WHEN status IN ('pending','retry','processing') THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'staging_verified' THEN 1 ELSE 0 END) AS verified
        FROM cloud_write_outbox
      `).first();
      pending = Number((counts && counts.pending) || 0);
      verified = Number((counts && counts.verified) || 0);
    }
  } catch (err) {
    database = false;
  }

  return json({
    success: database,
    service: 'trendos-cloud-write-staging-reconcile-v1',
    stagingOnly: true,
    enabled: enabled(env),
    database,
    authConfigured: !!text(env.EDGE_SESSION_SECRET),
    pending,
    verified,
    completionState: 'staging_verified',
    sheetsStatus: 'not_written_staging',
    sheetsWritten: false,
    productionCutover: false,
    time: new Date().toISOString()
  }, database ? 200 : 503);
}

export function isStagingCloudWriteReconcilePath(path) {
  const clean = text(path).replace(/\/+$/, '') || '/';
  return clean === PREFIX || clean.startsWith(`${PREFIX}/`);
}

export async function handleStagingCloudWriteReconcileRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === `${PREFIX}/health`) {
    return health(env);
  }

  if (!enabled(env)) {
    return json({
      success: false,
      message: 'Staging reconciliation verification is disabled',
      stagingOnly: true,
      sheetsWritten: false
    }, 423);
  }

  if (request.method !== 'POST' || path !== `${PREFIX}/next`) {
    return json({ success: false, message: 'Not found', stagingOnly: true, sheetsWritten: false }, 404);
  }

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const result = await reconcileNextOutboxItem(env, stagingVerificationTransport, {
    completionMode: 'staging-verified',
    maxAttempts: 3,
    leaseSeconds: 60
  });

  return json({
    ...result,
    stagingOnly: true,
    mode: 'staging-verification-no-sheets',
    actor: text(auth.session && auth.session.sub),
    sheetsWritten: false
  }, result.state === 'failed' ? 500 : result.state === 'retry' ? 503 : 200);
}
