import { MemoryAssetStore, MemoryCaseStore } from './storage-adapters.mjs';
import { D1CaseStore, D1TenantDirectory } from './d1-tenant-store.mjs';
import { DEFAULT_TENANT_ID } from './orchestrator-core.mjs';
import { hasPermission, PERMISSIONS, permissionsForRoles } from './permissions.mjs';
import { ResilientProviderExecutor } from './provider-executor.mjs';
import { MemoryRateLimiter } from './rate-limit.mjs';
import { runOrchestrationTurn } from './orchestrator-runtime.mjs';
import { createLiveProvidersFromEnv } from './live-providers.mjs';
import { validateSandboxConfig } from './sandbox-config.mjs';
import { createSandboxPersistenceFromEnv, persistSandboxEvidence } from './cloud-sandbox-persistence.mjs';

const MAX_BODY_BYTES = 1024 * 1024;
const memoryCaseStore = new MemoryCaseStore();
const assetStore = new MemoryAssetStore();
const rateLimiter = new MemoryRateLimiter({ limit: 20, windowMs: 60_000 });
const providerExecutor = new ResilientProviderExecutor({
  timeoutMs: 45_000,
  maxRetries: 1,
  failureThreshold: 3,
  cooldownMs: 30_000,
});

export default {
  async fetch(request, env) {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const url = new URL(request.url);

    try {
      const readiness = validateEnv(env);

      if (request.method === 'GET' && url.pathname === '/health') {
        return json(200, {
          ok: readiness.ok,
          service: 'matbagy-runtime-worker',
          version: '0.9',
          mode: 'SANDBOX',
          live_ai: readiness.ok,
          providers: {
            OPENAI: env.OPENAI_MODEL || 'gpt-5.6-terra',
            GEMINI: env.GEMINI_MODEL || 'gemini-3.8-flash',
          },
          persistence: String(env.SANDBOX_PERSISTENCE_ENABLED || '').toLowerCase() === 'true' ? 'GITHUB_AND_DRIVE_SANDBOX' : 'MEMORY_ONLY',
          case_state_persistence: readiness.tenantDbEnabled ? 'D1_SANDBOX' : 'MEMORY_ONLY',
          production_integrations: false,
          blockers: readiness.blockers,
          request_id: requestId,
        }, requestId);
      }

      if (request.method !== 'POST' || url.pathname !== '/v1/turn') {
        return json(404, errorBody('NOT_FOUND', 'route not found', requestId), requestId);
      }

      if (!readiness.ok) {
        return json(503, errorBody('SANDBOX_NOT_READY', readiness.blockers.join('; '), requestId), requestId);
      }

      const auth = authenticate(request, env);
      if (!auth.ok) return json(401, errorBody(auth.code, auth.message, requestId), requestId);

      if (!hasPermission(auth, PERMISSIONS.RUNTIME_TURN)) {
        return json(403, errorBody('FORBIDDEN', 'runtime:turn permission required', requestId), requestId);
      }

      const rate = rateLimiter.consume(`${auth.tenant_id}:${auth.subject}`);
      if (!rate.allowed) {
        return json(429, {
          ...errorBody('RATE_LIMITED', 'sandbox request limit exceeded', requestId),
          retry_after_ms: Math.max(0, rate.resetAt - Date.now()),
        }, requestId);
      }

      const body = await readJson(request);
      if (!body?.caseData || typeof body?.userRequest !== 'string') {
        return json(400, errorBody('INVALID_REQUEST', 'caseData and userRequest are required', requestId), requestId);
      }

      const requestedTenantId = String(body.caseData.tenant_id || auth.tenant_id).trim();
      if (requestedTenantId !== auth.tenant_id) {
        return json(403, errorBody('TENANT_FORBIDDEN', 'tenant scope mismatch', requestId), requestId);
      }
      const scopedCaseData = { ...body.caseData, tenant_id: auth.tenant_id };

      let activeCaseStore = memoryCaseStore;
      if (readiness.tenantDbEnabled) {
        const directory = new D1TenantDirectory(env.DB);
        const resolved = await directory.resolvePrincipal(auth.tenant_id, auth.subject);
        if (!resolved.ok) {
          return json(403, errorBody(resolved.code, 'tenant or membership is not active', requestId), requestId);
        }
        activeCaseStore = new D1CaseStore(env.DB);
      }

      const providers = createLiveProvidersFromEnv(env);
      const result = await runOrchestrationTurn({
        userRequest: body.userRequest,
        caseData: scopedCaseData,
        providers,
        caseStore: activeCaseStore,
        assetStore,
        providerExecutor,
        actor: {
          subject: auth.subject,
          tenant_id: auth.tenant_id,
          roles: auth.roles,
          permissions: auth.permissions,
          environment: 'SANDBOX',
        },
      });

      let externalPersistence = { enabled: false, writes: [] };
      try {
        const persistence = createSandboxPersistenceFromEnv(env);
        externalPersistence = await persistSandboxEvidence({
          requestId,
          persistence,
          payload: buildEvidencePayload({
            requestId,
            body: { ...body, caseData: scopedCaseData },
            result,
          }),
        });
      } catch (error) {
        if (String(env.SANDBOX_PERSISTENCE_ENABLED || '').toLowerCase() === 'true') {
          return json(502, {
            ...errorBody('EXTERNAL_SANDBOX_PERSISTENCE_FAILED', error?.message || 'sandbox persistence failed', requestId),
            provider_result: result,
          }, requestId);
        }
      }

      return json(result.ok ? 200 : 422, {
        request_id: requestId,
        runtime_version: '0.9',
        persistence: externalPersistence.enabled ? 'GITHUB_AND_DRIVE_SANDBOX' : 'MEMORY_ONLY',
        case_state_persistence: readiness.tenantDbEnabled ? 'D1_SANDBOX' : 'MEMORY_ONLY',
        external_persistence: externalPersistence,
        ...result,
      }, requestId);
    } catch (error) {
      const code = error?.code || 'INTERNAL_ERROR';
      const status = code === 'BODY_TOO_LARGE' ? 413 : code === 'INVALID_JSON' ? 400 : 500;
      return json(status, errorBody(code, error?.message || 'unknown error', requestId), requestId);
    }
  },
};

export function validateEnv(env = {}) {
  const blockers = [];
  if (String(env.MATBAGY_RUNTIME_MODE || '').toUpperCase() !== 'SANDBOX') blockers.push('MATBAGY_RUNTIME_MODE must be SANDBOX');
  if (!env.OPENAI_API_KEY) blockers.push('OPENAI_API_KEY missing');
  if (!env.GEMINI_API_KEY) blockers.push('GEMINI_API_KEY missing');
  if (!env.RUNTIME_BEARER_TOKEN) blockers.push('RUNTIME_BEARER_TOKEN missing');

  const sandbox = validateSandboxConfig({
    mode: env.MATBAGY_RUNTIME_MODE,
    githubBranch: env.GITHUB_SANDBOX_BRANCH,
    githubPathPrefix: env.GITHUB_SANDBOX_PREFIX,
    driveSandboxFolderId: env.DRIVE_SANDBOX_FOLDER_ID,
    canonicalDriveRootId: env.CANONICAL_DRIVE_ROOT_ID,
  });
  if (!sandbox.valid) blockers.push(...sandbox.errors);

  const tenantDbEnabled = String(env.TENANT_DB_ENABLED || '').toLowerCase() === 'true';
  if (tenantDbEnabled && (!env.DB || typeof env.DB.prepare !== 'function' || typeof env.DB.batch !== 'function')) {
    blockers.push('DB binding missing or invalid while TENANT_DB_ENABLED=true');
  }

  const persistenceEnabled = String(env.SANDBOX_PERSISTENCE_ENABLED || '').toLowerCase() === 'true';
  if (persistenceEnabled) {
    if (!env.GITHUB_SANDBOX_TOKEN) blockers.push('GITHUB_SANDBOX_TOKEN missing while persistence enabled');
    if (!env.GOOGLE_OAUTH_CLIENT_ID) blockers.push('GOOGLE_OAUTH_CLIENT_ID missing while persistence enabled');
    if (!env.GOOGLE_OAUTH_CLIENT_SECRET) blockers.push('GOOGLE_OAUTH_CLIENT_SECRET missing while persistence enabled');
    if (!env.GOOGLE_OAUTH_REFRESH_TOKEN) blockers.push('GOOGLE_OAUTH_REFRESH_TOKEN missing while persistence enabled');
  }

  return {
    ok: blockers.length === 0,
    blockers,
    sandbox: sandbox.normalized,
    persistenceEnabled,
    tenantDbEnabled,
  };
}

function buildEvidencePayload({ requestId, body, result }) {
  return {
    evidence_version: 'MATBAGY_LIVE_SANDBOX_V1',
    request_id: requestId,
    created_at: new Date().toISOString(),
    environment: 'SANDBOX',
    tenant_id: body?.caseData?.tenant_id || null,
    case_id: body?.caseData?.case_id || null,
    user_request: body?.userRequest || '',
    authority: result?.authority || 'ADVISORY_ONLY',
    stage: result?.stage || null,
    routing: result?.routing || null,
    outputs: result?.outputs || [],
    errors: result?.errors || [],
    verification: result?.persistence?.verification || null,
    production_integrations: false,
  };
}

function authenticate(request, env) {
  const raw = String(request.headers.get('authorization') || '').trim();
  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, code: 'AUTH_REQUIRED', message: 'Bearer token required' };
  if (match[1] !== env.RUNTIME_BEARER_TOKEN) return { ok: false, code: 'INVALID_TOKEN', message: 'Invalid sandbox token' };
  const tenantId = String(env.SANDBOX_TENANT_ID || DEFAULT_TENANT_ID).trim();
  const roles = ['operator'];
  return {
    ok: true,
    subject: 'matbagy-sandbox-operator',
    tenant_id: tenantId,
    roles,
    permissions: permissionsForRoles(roles),
  };
}

async function readJson(request) {
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_BODY_BYTES) {
    const error = new Error('request body exceeds 1 MB');
    error.code = 'BODY_TOO_LARGE';
    throw error;
  }
  if (!buffer.byteLength) return {};
  const raw = new TextDecoder().decode(buffer);
  try { return JSON.parse(raw); } catch {
    const error = new Error('invalid JSON');
    error.code = 'INVALID_JSON';
    throw error;
  }
}

function errorBody(code, message, requestId) {
  return { ok: false, error: { code, message }, request_id: requestId };
}

function json(status, body, requestId) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestId,
      'cache-control': 'no-store',
    },
  });
}
