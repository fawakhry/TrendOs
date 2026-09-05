/* TrendOS PERF-CF-02CL Production Outbox -> Sheets Qualification Candidate
 *
 * PREPARED / NOT WIRED INTO PRODUCTION ENTRYPOINT.
 * This module is intentionally hard-bounded to the single synthetic order
 * created by PERF-CF-02CK. It is not a generic reconciliation route.
 */

import { verifyEdgeSessionToken } from './edge-gateway.mjs';
import { reconcileNextOutboxItem } from './cloud-write-reconcile-core.mjs';

const PREFIX = '/v1/qualification/cloud-write/reconcile';
const TARGET_ORDER_ID = 'CW-PROD-QUAL-33975124471';
const TARGET_OPERATION = 'upsert_order_to_sheets';
const CONFIRMATION = 'QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471';
const APPS_SCRIPT_ACTION = 'cloudWriteReconcileProductionQualificationV1';

function text(value) {
  return String(value == null ? '' : value).trim();
}

function enabled(env) {
  return text(env && env.TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED).toLowerCase() === 'true';
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
  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env && env.EDGE_SESSION_SECRET));
  if (verified.ok) return { ok: true, session: verified.payload };
  return {
    ok: false,
    response: json({
      success: false,
      code: verified.reason,
      message: 'Unauthorized production reconciliation qualification session',
      qualificationOnly: true,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 401)
  };
}

function canonicalize(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
    }
    return out;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return String(value);
}

function toHex(bytes) {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function payloadSha256(payload) {
  const canonical = JSON.stringify(canonicalize(payload || {}));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return toHex(new Uint8Array(digest));
}

function exactSyntheticPayload(payload) {
  return payload && typeof payload === 'object' && !Array.isArray(payload) &&
    payload._cloudWriteV1 === true &&
    text(payload.orderId) === TARGET_ORDER_ID &&
    text(payload.clientRequestId) === 'prod-qual-33975124471' &&
    text(payload.customerName) === 'TrendOS Production Cloud Write Qualification' &&
    text(payload.status) === 'cloud-qualification' &&
    text(payload.department) === 'SYSTEM-QUALIFICATION' &&
    text(payload.priority) === 'qualification' &&
    Number(payload.total) === 0 &&
    Number(payload.remaining) === 0;
}

function parsePayloadJson(value) {
  try {
    const parsed = JSON.parse(text(value) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
}

async function appsScriptTransport(env, job) {
  if (text(job && job.entityType) !== 'order' || text(job && job.operation) !== TARGET_OPERATION) {
    throw new Error('Qualification transport refuses unsupported reconciliation contract');
  }
  if (text(job && job.entityId) !== TARGET_ORDER_ID) {
    throw new Error('Qualification transport refuses any non-target Order ID');
  }
  if (!exactSyntheticPayload(job && job.payload)) {
    throw new Error('Qualification transport requires the exact PERF-CF-02CK synthetic payload');
  }

  const endpoint = text(env && env.APPS_SCRIPT_API_URL);
  const secret = text(env && env.TRENDOS_PROD_RECONCILE_QUALIFY_SECRET);
  if (!endpoint) throw new Error('Apps Script endpoint is not configured');
  if (!secret) throw new Error('Production reconciliation qualification secret is not configured');

  const sha256 = await payloadSha256(job.payload);
  const body = new URLSearchParams({
    action: APPS_SCRIPT_ACTION,
    confirmation: CONFIRMATION,
    entityType: 'order',
    entityId: TARGET_ORDER_ID,
    operation: TARGET_OPERATION,
    payloadJson: JSON.stringify(job.payload),
    payloadSha256: sha256,
    reconcileSecret: secret
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
    redirect: 'follow'
  });

  let result;
  try {
    result = await response.json();
  } catch (err) {
    throw new Error(`Apps Script qualification returned non-JSON HTTP ${response.status}`);
  }

  if (!response.ok) throw new Error(`Apps Script qualification HTTP ${response.status}`);
  if (!result || result.success !== true || result.qualification !== true || result.productionQualificationOnly !== true) {
    throw new Error(text(result && (result.message || result.code)) || 'Apps Script did not confirm qualification success');
  }
  if (result.persisted !== true || Number(result.existingMatchesAfter) !== 1) {
    throw new Error('Apps Script did not prove exactly one persisted Orders row');
  }
  if (text(result.entityId || result.orderId) !== TARGET_ORDER_ID) {
    throw new Error('Apps Script qualification entity mismatch');
  }
  if (text(result.payloadSha256).toLowerCase() !== sha256) {
    throw new Error('Apps Script qualification payload fingerprint mismatch');
  }
  if (result.productionCutover !== false || result.sheetsAuthoritative !== true) {
    throw new Error('Apps Script qualification authority boundary mismatch');
  }

  return {
    success: true,
    entityId: TARGET_ORDER_ID,
    orderId: TARGET_ORDER_ID,
    persisted: true,
    idempotent: result.idempotent === true,
    sheetsWritten: result.sheetsWritten === true,
    mutationCount: Number(result.mutationCount || 0),
    decision: text(result.decision),
    payloadSha256: sha256,
    note: `02CL qualification persisted target; decision=${text(result.decision) || 'confirmed'}; payloadSha256=${sha256}`
  };
}

async function exactTargetSnapshot(env) {
  const result = await env.DB.prepare(`
    SELECT
      o.id AS outboxId,
      o.event_key AS eventKey,
      o.entity_type AS entityType,
      o.entity_id AS entityId,
      o.operation AS operation,
      o.status AS outboxStatus,
      o.attempts AS attempts,
      o.next_attempt_at AS nextAttemptAt,
      o.last_error AS lastError,
      o.payload_json AS payloadJson,
      e.status AS eventStatus,
      e.sheets_status AS sheetsStatus
    FROM cloud_write_outbox o
    JOIN cloud_write_events e ON e.idempotency_key = o.event_key
    WHERE o.entity_type = 'order'
      AND o.entity_id = ?
      AND o.operation = ?
    ORDER BY o.id ASC
  `).bind(TARGET_ORDER_ID, TARGET_OPERATION).all();
  return Array.isArray(result && result.results) ? result.results : [];
}

async function health(env) {
  let database = false;
  let rows = [];
  try {
    const probe = await env.DB.prepare('SELECT 1 AS ok').first();
    database = !!(probe && Number(probe.ok) === 1);
    if (database) rows = await exactTargetSnapshot(env);
  } catch (err) {
    database = false;
  }

  const row = rows.length === 1 ? rows[0] : null;
  return json({
    success: database,
    service: 'trendos-production-reconcile-qualification-v1',
    preparedOnly: true,
    qualificationOnly: true,
    enabled: enabled(env),
    database,
    edgeAuthConfigured: !!text(env && env.EDGE_SESSION_SECRET),
    appsScriptConfigured: !!text(env && env.APPS_SCRIPT_API_URL),
    reconcileSecretConfigured: !!text(env && env.TRENDOS_PROD_RECONCILE_QUALIFY_SECRET),
    targetOrderId: TARGET_ORDER_ID,
    exactTargetRows: rows.length,
    outboxStatus: text(row && row.outboxStatus),
    eventStatus: text(row && row.eventStatus),
    sheetsStatus: text(row && row.sheetsStatus),
    attempts: Number((row && row.attempts) || 0),
    productionCutover: false,
    sheetsAuthoritative: true,
    genericDrainEnabled: false,
    time: new Date().toISOString()
  }, database ? 200 : 503);
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  } catch (err) {
    return {};
  }
}

function validConfirmation(body) {
  return text(body && body.confirmation) === CONFIRMATION && text(body && body.orderId) === TARGET_ORDER_ID;
}

async function executeQualification(request, env, session) {
  const body = await readBody(request);
  if (!validConfirmation(body)) {
    return json({
      success: false,
      code: 'exact-confirmation-required',
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 400);
  }

  const rows = await exactTargetSnapshot(env);
  if (rows.length !== 1) {
    return json({
      success: false,
      code: 'exact-target-row-count-mismatch',
      exactTargetRows: rows.length,
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 409);
  }
  const row = rows[0];
  if (!['pending', 'retry', 'processing'].includes(text(row.outboxStatus))) {
    return json({
      success: false,
      code: 'target-not-pending',
      outboxStatus: text(row.outboxStatus),
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 409);
  }
  const payload = parsePayloadJson(row.payloadJson);
  if (!exactSyntheticPayload(payload)) {
    return json({
      success: false,
      code: 'exact-synthetic-payload-required',
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 409);
  }

  const result = await reconcileNextOutboxItem(env, (job) => appsScriptTransport(env, job), {
    targetEntityType: 'order',
    targetEntityId: TARGET_ORDER_ID,
    targetOperation: TARGET_OPERATION,
    maxAttempts: 3,
    leaseSeconds: 90
  });

  return json({
    ...result,
    qualificationOnly: true,
    targetOrderId: TARGET_ORDER_ID,
    actor: text(session && session.sub),
    genericDrainEnabled: false,
    productionCutover: false,
    sheetsAuthoritative: true
  }, result.state === 'failed' ? 500 : result.state === 'retry' ? 503 : 200);
}

async function replayProof(request, env, session) {
  const body = await readBody(request);
  if (!validConfirmation(body)) {
    return json({ success: false, code: 'exact-confirmation-required', qualificationOnly: true, targetOrderId: TARGET_ORDER_ID, productionCutover: false, sheetsAuthoritative: true }, 400);
  }

  const rows = await exactTargetSnapshot(env);
  if (rows.length !== 1 || text(rows[0].outboxStatus) !== 'synced' || text(rows[0].eventStatus) !== 'reconciled' || text(rows[0].sheetsStatus) !== 'synced') {
    return json({
      success: false,
      code: 'synced-target-required-before-replay-proof',
      exactTargetRows: rows.length,
      outboxStatus: text(rows[0] && rows[0].outboxStatus),
      eventStatus: text(rows[0] && rows[0].eventStatus),
      sheetsStatus: text(rows[0] && rows[0].sheetsStatus),
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 409);
  }

  const payload = parsePayloadJson(rows[0].payloadJson);
  if (!exactSyntheticPayload(payload)) {
    return json({ success: false, code: 'exact-synthetic-payload-required', qualificationOnly: true, targetOrderId: TARGET_ORDER_ID, productionCutover: false, sheetsAuthoritative: true }, 409);
  }

  const transport = await appsScriptTransport(env, {
    eventKey: text(rows[0].eventKey),
    entityType: 'order',
    entityId: TARGET_ORDER_ID,
    operation: TARGET_OPERATION,
    attempts: Number(rows[0].attempts || 0),
    payload
  });

  if (transport.idempotent !== true || transport.sheetsWritten !== false || transport.mutationCount !== 0) {
    return json({
      success: false,
      code: 'replay-was-not-a-noop',
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 409);
  }

  return json({
    success: true,
    qualificationOnly: true,
    replayProof: true,
    idempotent: true,
    targetOrderId: TARGET_ORDER_ID,
    decision: transport.decision,
    payloadSha256: transport.payloadSha256,
    d1Written: false,
    sheetsWritten: false,
    mutationCount: 0,
    actor: text(session && session.sub),
    productionCutover: false,
    sheetsAuthoritative: true
  });
}

export function isProductionReconcileQualificationPath(path) {
  const clean = text(path).replace(/\/+$/, '') || '/';
  return clean === PREFIX || clean.startsWith(`${PREFIX}/`);
}

export async function handleProductionReconcileQualificationRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === `${PREFIX}/health`) {
    return health(env);
  }

  if (!enabled(env)) {
    return json({
      success: false,
      code: 'qualification-disabled',
      qualificationOnly: true,
      targetOrderId: TARGET_ORDER_ID,
      genericDrainEnabled: false,
      productionCutover: false,
      sheetsAuthoritative: true
    }, 423);
  }

  if (request.method !== 'POST' || (path !== `${PREFIX}/order` && path !== `${PREFIX}/order/replay-proof`)) {
    return json({ success: false, message: 'Not found', qualificationOnly: true, productionCutover: false, sheetsAuthoritative: true }, 404);
  }

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  if (path === `${PREFIX}/order/replay-proof`) return replayProof(request, env, auth.session);
  return executeQualification(request, env, auth.session);
}

export const productionReconcileQualificationContract = Object.freeze({
  prefix: PREFIX,
  targetOrderId: TARGET_ORDER_ID,
  operation: TARGET_OPERATION,
  confirmation: CONFIRMATION,
  appsScriptAction: APPS_SCRIPT_ACTION
});
