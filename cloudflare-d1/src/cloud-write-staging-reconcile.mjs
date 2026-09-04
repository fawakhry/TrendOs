/* TrendOS Cloud Write Staging Reconciliation V1
 *
 * STAGING-ONLY verification transport. It never calls Apps Script and never
 * writes Google Sheets. A successful verification closes an outbox row as
 * `staging_verified` with `sheets_status=not_written_staging`.
 *
 * The /sample route is also staging-only and read-only. It exposes only the
 * known synthetic CW-STAGE-* qualification payload so Apps Script can prove
 * its authenticated dry-run mapping without transferring any long-lived
 * reconciliation secret to Cloudflare/GitHub.
 */

import { verifyEdgeSessionToken } from './edge-gateway.mjs';
import { reconcileNextOutboxItem } from './cloud-write-reconcile-core.mjs';

const PREFIX = '/v1/staging/cloud-write/reconcile';
const SAMPLE_CUSTOMER_NAME = 'Staging Cloud Write Qualification';
const SAMPLE_CUSTOMER_PHONE = '01001112233';

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

function parsePayload(value) {
  try {
    const parsed = JSON.parse(text(value) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
}

function isSyntheticSample(row, payload) {
  const entityId = text(row && row.entityId);
  return text(row && row.entityType) === 'order' &&
    text(row && row.operation) === 'upsert_order_to_sheets' &&
    entityId.startsWith('CW-STAGE-') &&
    payload &&
    text(payload.orderId) === entityId &&
    payload._cloudWriteV1 === true &&
    text(payload.customerName) === SAMPLE_CUSTOMER_NAME &&
    text(payload.customerPhone) === SAMPLE_CUSTOMER_PHONE;
}

async function stagingSample(env, url) {
  const requestedId = text(url.searchParams.get('entityId'));
  if (requestedId && !requestedId.startsWith('CW-STAGE-')) {
    return json({
      success: false,
      code: 'staging-id-required',
      stagingOnly: true,
      readOnly: true,
      sheetsWritten: false
    }, 400);
  }

  let sql = `
    SELECT
      o.id AS outboxId,
      o.entity_type AS entityType,
      o.entity_id AS entityId,
      o.operation AS operation,
      o.status AS outboxStatus,
      o.attempts AS attempts,
      e.status AS eventStatus,
      e.sheets_status AS sheetsStatus,
      e.payload_json AS payloadJson,
      e.created_at AS createdAt,
      e.updated_at AS updatedAt
    FROM cloud_write_outbox o
    JOIN cloud_write_events e ON e.idempotency_key = o.event_key
    WHERE o.entity_type = 'order'
      AND o.operation = 'upsert_order_to_sheets'
      AND o.entity_id LIKE 'CW-STAGE-%'
  `;
  const binds = [];
  if (requestedId) {
    sql += ' AND o.entity_id = ?';
    binds.push(requestedId);
  }
  sql += ' ORDER BY o.id DESC LIMIT 25';

  let result;
  try {
    let stmt = env.DB.prepare(sql);
    if (binds.length) stmt = stmt.bind(...binds);
    result = await stmt.all();
  } catch (err) {
    return json({
      success: false,
      code: 'staging-sample-db-error',
      stagingOnly: true,
      readOnly: true,
      sheetsWritten: false
    }, 503);
  }

  const rows = Array.isArray(result && result.results) ? result.results : [];
  for (const row of rows) {
    const payload = parsePayload(row && row.payloadJson);
    if (!isSyntheticSample(row, payload)) continue;

    return json({
      success: true,
      service: 'trendos-cloud-write-staging-sample-v1',
      stagingOnly: true,
      syntheticOnly: true,
      readOnly: true,
      sheetsWritten: false,
      entityType: 'order',
      entityId: text(row.entityId),
      operation: 'upsert_order_to_sheets',
      payload,
      outboxStatus: text(row.outboxStatus),
      eventStatus: text(row.eventStatus),
      sheetsStatus: text(row.sheetsStatus),
      attempts: Number(row.attempts || 0),
      createdAt: text(row.createdAt),
      updatedAt: text(row.updatedAt)
    });
  }

  return json({
    success: false,
    code: 'staging-synthetic-sample-not-found',
    stagingOnly: true,
    syntheticOnly: true,
    readOnly: true,
    sheetsWritten: false
  }, 404);
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

  if (request.method === 'GET' && path === `${PREFIX}/sample`) {
    return stagingSample(env, url);
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
