/* TrendOS Cloud Write Order V2 — STAGING Cloudflare -> Apps Script Bridge V1
 *
 * STAGING ONLY. Production Worker must never import this module.
 *
 * Auth model:
 * - caller must present a valid Staging Edge session token;
 * - Worker mints a new 60s bridge token with subject `cloud-write-v2-bridge`;
 * - Apps Script calls the fixed /validate endpoint with that token;
 * - no shared secret is copied into Apps Script/GitHub/chat.
 *
 * Qualification scope:
 * - exact fixed synthetic create-intent only;
 * - no D1 write in this module;
 * - business Order ID remains Apps Script-owned;
 * - Apps Script URL is a non-secret Staging config variable;
 * - Production cutover remains false.
 */

import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';
import { issueEdgeSessionToken, verifyEdgeSessionToken } from './edge-gateway.mjs';

export const CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH = '/v1/staging/cloud-write/v2/bridge/health';
export const CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH = '/v1/staging/cloud-write/v2/bridge/validate';
export const CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH = '/v1/staging/cloud-write/v2/bridge/execute';
export const CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT = 'cloud-write-v2-bridge';
export const CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VERSION = 'CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_WORKER_V1_20260905';

const FIXED_SYNTHETIC_INTENT = Object.freeze({
  clientRequestId: 'CWV2-STAGE-BRIDGE-001',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '988',
  customerName: 'Staging Cloud Write V2 Bridge Qualification',
  customerPhone: '01001112233',
  department: 'مكبس',
  itemName: 'V2 Bridge Qualification Item',
  qty: 1,
  priority: 'عادي',
  status: 'طلب جديد',
  flyPrint: false,
  source: 'TrendOS Staging V2 Bridge',
  notes: 'Synthetic staging-only V2 bridge qualification'
});

function text(value) {
  return String(value == null ? '' : value).trim();
}

function cleanPath(value) {
  const path = text(value).replace(/\/+$/, '');
  return path || '/';
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

function bearer(request) {
  const header = text(request.headers.get('authorization'));
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function edgeSecret(env) {
  return text(env && env.EDGE_SESSION_SECRET);
}

async function verifyCaller(request, env) {
  const verified = await verifyEdgeSessionToken(bearer(request), edgeSecret(env));
  if (!verified.ok) return { ok: false, code: verified.reason || 'unauthorized' };
  if (text(verified.payload && verified.payload.sub) === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT) {
    return { ok: false, code: 'bridge-token-cannot-invoke-execute' };
  }
  return { ok: true, payload: verified.payload };
}

export function isCloudWriteOrderV2StagingBridgePath(path) {
  const p = cleanPath(path);
  return p === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH ||
    p === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH ||
    p === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH;
}

async function handleHealth(request, env) {
  if (request.method !== 'GET') return json({ success: false, code: 'not-found', stagingOnly: true }, 404);
  const appsScriptConfigured = !!text(env && env.APPS_SCRIPT_API_URL);
  const edgeAuthConfigured = !!edgeSecret(env);
  return json({
    success: appsScriptConfigured && edgeAuthConfigured,
    service: 'trendos-cloud-write-order-v2-staging-bridge',
    version: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VERSION,
    stagingOnly: true,
    syntheticOnly: true,
    appsScriptConfigured,
    edgeAuthConfigured,
    businessOrderIdStrategy: 'apps-script-allocated',
    d1Written: false,
    productionCutover: false,
    productionRouteIntegrated: false
  }, appsScriptConfigured && edgeAuthConfigured ? 200 : 503);
}

async function handleValidate(request, env) {
  if (request.method !== 'POST') return json({ success: false, code: 'not-found', stagingOnly: true }, 404);
  const verified = await verifyEdgeSessionToken(bearer(request), edgeSecret(env));
  if (!verified.ok) {
    return json({
      success: false,
      bridgeAuthorized: false,
      code: verified.reason || 'unauthorized',
      stagingOnly: true,
      productionCutover: false
    }, 401);
  }
  const subject = text(verified.payload && verified.payload.sub);
  if (subject !== CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT) {
    return json({
      success: false,
      bridgeAuthorized: false,
      code: 'invalid-bridge-subject',
      stagingOnly: true,
      productionCutover: false
    }, 403);
  }
  return json({
    success: true,
    bridgeAuthorized: true,
    subject,
    stagingOnly: true,
    expiresAt: new Date(Number(verified.payload.exp) * 1000).toISOString(),
    productionCutover: false
  });
}

async function postToAppsScript(env, bridgeToken, canonicalCreateParams) {
  const url = text(env && env.APPS_SCRIPT_API_URL);
  if (!url) return { ok: false, code: 'apps-script-url-not-configured', httpStatus: 503 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        action: 'cloudWriteOrderV2StagingBridgeV1',
        bridgeToken,
        contractVersion: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VERSION,
        canonicalCreateParams
      }),
      redirect: 'follow',
      signal: controller.signal
    });
    const raw = await response.text();
    let body = {};
    try { body = JSON.parse(raw || '{}'); }
    catch (err) { return { ok: false, code: 'apps-script-invalid-json', httpStatus: response.status }; }
    if (!response.ok || body.success !== true || body.verified !== true || body.stagingOnly !== true || body.productionWriteExecuted !== false) {
      return {
        ok: false,
        code: text(body && body.code) || 'apps-script-bridge-rejected',
        httpStatus: response.status,
        upstream: body
      };
    }
    return { ok: true, body };
  } catch (err) {
    return { ok: false, code: err && err.name === 'AbortError' ? 'apps-script-timeout' : 'apps-script-unavailable', httpStatus: 502 };
  } finally {
    clearTimeout(timer);
  }
}

async function handleExecute(request, env) {
  if (request.method !== 'POST') return json({ success: false, code: 'not-found', stagingOnly: true }, 404);
  if (!edgeSecret(env)) return json({ success: false, code: 'edge-auth-not-configured', stagingOnly: true }, 503);
  const caller = await verifyCaller(request, env);
  if (!caller.ok) return json({ success: false, code: caller.code, stagingOnly: true, productionCutover: false }, 401);

  const contract = buildCanonicalOrderCreateIntentV2({ ...FIXED_SYNTHETIC_INTENT });
  if (!contract || contract.success !== true || contract.valid !== true) {
    return json({
      success: false,
      code: 'v2-contract-plan-failed',
      stagingOnly: true,
      syntheticOnly: true,
      d1Written: false,
      productionCutover: false,
      errors: Array.isArray(contract && contract.errors) ? contract.errors : []
    }, 500);
  }

  const now = Math.floor(Date.now() / 1000);
  const bridgeToken = await issueEdgeSessionToken({
    sub: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT,
    jti: `bridge-${contract.canonicalCreateParams.clientRequestId}`
  }, edgeSecret(env), now, 60);

  const upstream = await postToAppsScript(env, bridgeToken, contract.canonicalCreateParams);
  if (!upstream.ok) {
    return json({
      success: false,
      code: upstream.code,
      upstreamHttpStatus: upstream.httpStatus,
      stagingOnly: true,
      syntheticOnly: true,
      bridgeTokenReturned: false,
      d1Written: false,
      productionCutover: false,
      upstream: upstream.upstream && {
        success: upstream.upstream.success === true,
        code: text(upstream.upstream.code),
        verified: upstream.upstream.verified === true
      }
    }, upstream.httpStatus >= 400 && upstream.httpStatus < 600 ? upstream.httpStatus : 502);
  }

  const body = upstream.body;
  return json({
    success: true,
    verified: true,
    service: 'trendos-cloud-write-order-v2-staging-bridge',
    version: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VERSION,
    stagingOnly: true,
    syntheticOnly: true,
    callerSubject: text(caller.payload && caller.payload.sub),
    bridgeTokenReturned: false,
    clientRequestId: text(body.clientRequestId),
    orderId: text(body.orderId),
    lineId: text(body.lineId),
    linesCreated: Number(body.linesCreated || 0),
    duplicatePrevented: body.duplicatePrevented === true,
    idempotentReplay: body.idempotentReplay === true,
    businessOrderIdStrategy: 'apps-script-allocated',
    d1Written: false,
    productionWriteExecuted: false,
    productionCloudWriteChanged: false,
    productionCutover: false
  });
}

export async function handleCloudWriteOrderV2StagingBridgeRequest(request, env) {
  const path = cleanPath(new URL(request.url).pathname);
  if (path === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH) return handleHealth(request, env);
  if (path === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH) return handleValidate(request, env);
  if (path === CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH) return handleExecute(request, env);
  return json({ success: false, code: 'not-found', stagingOnly: true, productionCutover: false }, 404);
}
