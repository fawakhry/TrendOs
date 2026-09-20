/**
 * TrendOS R4 one-time Orders/Lines recovery route.
 * Fail-closed unless the exact production target and temporary enable flag are set.
 * The authenticated Apps Script caller supplies a freshly captured bounded proposal;
 * every changed row is guarded by its D1 pre-image and both tabs commit in one batch.
 */
import { buildGuardedRecoveryBatchFromPlan } from
  '../t12-preview/t12-d1-guarded-recovery-batch-v1.mjs';

export const R4_PRODUCTION_RECOVERY_PATH = '/v1/admin/r4/orders-recovery/apply';
const TARGET = 'trendos-main/5c4b92bf-e043-4f6e-bd6d-d514a92cd825';
const MAX_BODY_BYTES = 262144;

function reply(status, reason, extra = {}) {
  return new Response(JSON.stringify({
    success: status === 200,
    reason,
    automaticRetryAllowed: false,
    requiresPostWriteReadOnlyParity: status === 200,
    triggerRestartAuthorized: false,
    ...extra
  }), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  } });
}

function authorized(request, env) {
  const expected = String(env.MIGRATION_SECRET || '').trim();
  const supplied = String(request.headers.get('x-migration-secret') || '').trim();
  return expected.length >= 24 && supplied.length === expected.length && supplied === expected;
}

export function isR4ProductionRecoveryPath(path) {
  return path === R4_PRODUCTION_RECOVERY_PATH;
}

export async function handleR4ProductionRecoveryRequest(request, env) {
  if (env.TRENDOS_R4_RECOVERY_ENABLED !== 'true' ||
      env.TRENDOS_R4_RECOVERY_TARGET !== TARGET) {
    return reply(423, 'recovery-disabled-or-wrong-target');
  }
  if (request.method !== 'POST') return reply(405, 'method-not-allowed');
  if (!authorized(request, env)) return reply(401, 'unauthorized');
  if (!env.DB || typeof env.DB.batch !== 'function') {
    return reply(503, 'production-d1-binding-unavailable');
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) {
    return reply(413, 'body-too-large');
  }
  let raw;
  try { raw = await request.text(); }
  catch (_) { return reply(400, 'body-unavailable'); }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return reply(413, 'body-too-large');
  }
  let input;
  try { input = JSON.parse(raw); }
  catch (_) { return reply(400, 'invalid-json'); }
  if (!input || input.operation !== 'r4-orders-recovery-apply' || !input.proposal) {
    return reply(400, 'invalid-recovery-contract');
  }
  let candidate;
  try { candidate = buildGuardedRecoveryBatchFromPlan(env.DB, input.proposal); }
  catch (_) { return reply(409, 'preflight-rejected'); }
  try {
    await env.DB.batch(candidate.statements);
  } catch (_) {
    return reply(503, 'commit-unknown-reconcile-with-get');
  }
  return reply(200, 'production-d1-commit-observed', {
    summary: candidate.publicSummary,
    statements: candidate.statements.length
  });
}
