/**
 * Isolated R4 preview HTTP candidate. NOT IMPORTED BY ANY LIVE ROUTER.
 * A deployment must bind a separate test D1 until an explicitly approved
 * production change. Default OFF even in preview; no data/secrets in replies.
 */
import { buildIsolatedGuardedRecoveryBatch } from './t12-d1-guarded-recovery-batch-v1.mjs';

export const R4_RECOVERY_PREVIEW_PATH = '/v1/t12-preview/d1-recovery/apply';

function response(status, reason, extra = {}) {
  return new Response(JSON.stringify({
    success: status === 200, reason, productionWriteAuthorized: false,
    triggerRestartAuthorized: false, ...extra
  }), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  } });
}
function auth(request, env) {
  const expected = String(env.R4_PREVIEW_SECRET || '');
  const actual = String(request.headers.get('x-r4-preview-secret') || '');
  return expected.length >= 24 && actual.length === expected.length &&
    expected === actual;
}

export function isR4RecoveryPreviewPath(path) {
  return path === R4_RECOVERY_PREVIEW_PATH;
}

export async function handleR4RecoveryPreviewRequest(request, env) {
  // An authenticated, explicit test-DB-only flag is necessary but insufficient
  // for production: the route is not wired to a live worker, by design.
  if (env.R4_PREVIEW_ENABLED !== 'true' ||
      env.R4_TEST_DATABASE_ONLY !== 'true') {
    return response(423, 'preview-disabled');
  }
  if (request.method !== 'POST') return response(405, 'method-not-allowed');
  if (!auth(request, env)) return response(401, 'unauthorized');
  if (!env.DB || typeof env.DB.batch !== 'function') return response(503, 'test-db-required');
  const length = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(length) || length > 262144) return response(413, 'body-too-large');
  let raw = '';
  try { raw = await request.text(); }
  catch (_) { return response(400, 'body-unavailable'); }
  if (new TextEncoder().encode(raw).length > 262144) return response(413, 'body-too-large');
  let input;
  try { input = JSON.parse(raw); }
  catch (_) { return response(400, 'invalid-json'); }
  if (!input || input.operation !== 'preview-test-apply' || !input.snapshot) {
    return response(400, 'invalid-preview-contract');
  }
  let candidate;
  try { candidate = buildIsolatedGuardedRecoveryBatch(env.DB, input.snapshot); }
  catch (_) { return response(409, 'preflight-rejected'); }
  // No automatic retries. A lost response can happen AFTER commit.
  try {
    await env.DB.batch(candidate.statements);
  } catch (_) {
    return response(503, 'commit-unknown-reconcile-with-get');
  }
  return response(200, 'test-db-commit-observed', {
    summary: candidate.publicSummary,
    requiresPostWriteReadOnlyParity: true
  });
}
