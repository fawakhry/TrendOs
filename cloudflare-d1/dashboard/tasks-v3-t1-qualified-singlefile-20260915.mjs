// TrendOS Tasks V3 T1 — qualified read-only dashboard single-file candidate
// Derived from qualified T1 preview code at c537bd3004e937ad4e40f15acc964eebcbbbf687.
// ISOLATED T1 WORKER ONLY. No production routes. No task mutations.

const TASKS_V3_PROTOCOL = 'TRENDOS_TASKS_V3_READONLY_1';
const TASKS_V3_PREVIEW_ALLOWED_OPS = Object.freeze([
  'health',
  'status',
  'flyPrint',
  'pressCandidates'
]);
const TASKS_V3_PREVIEW_ALLOWED_ROLE = 'WAEL';
const TASKS_V3_PREVIEW_TIMEOUT_MS = 5000;

function text(value) {
  return String(value == null ? '' : value).trim();
}

function payloadJsonText(value) {
  if (value == null || value === '') return '{}';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function canonicalPayload(payload) {
  return [
    TASKS_V3_PROTOCOL,
    text(payload.op),
    text(payload.operator),
    text(payload.role).toUpperCase(),
    text(payload.assertedAt),
    text(payload.nonce),
    payloadJsonText(payload.payloadJson)
  ].join('\n');
}

async function hmacSha256Hex(value, secret, cryptoImpl) {
  const encoder = new TextEncoder();
  const key = await cryptoImpl.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoImpl.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  );
  return toHex(signature);
}

async function buildTasksV3PreviewAssertion({
  op,
  operator,
  role = TASKS_V3_PREVIEW_ALLOWED_ROLE,
  payloadJson = '{}',
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
  nonce,
  cryptoImpl = globalThis.crypto
}) {
  const normalizedOp = text(op);
  const normalizedOperator = text(operator);
  const normalizedRole = text(role).toUpperCase();
  const normalizedSecret = text(secret);
  const normalizedPayloadJson = payloadJsonText(payloadJson);

  if (!TASKS_V3_PREVIEW_ALLOWED_OPS.includes(normalizedOp)) {
    throw new Error('TASKS_V3_PREVIEW_OPERATION_FORBIDDEN');
  }
  if (normalizedRole !== TASKS_V3_PREVIEW_ALLOWED_ROLE) {
    throw new Error('TASKS_V3_PREVIEW_ROLE_FORBIDDEN');
  }
  if (!normalizedOperator) {
    throw new Error('TASKS_V3_PREVIEW_OPERATOR_REQUIRED');
  }
  if (!normalizedSecret) {
    throw new Error('TASKS_V3_PREVIEW_SECRET_NOT_CONFIGURED');
  }
  if (!cryptoImpl || !cryptoImpl.subtle) {
    throw new Error('TASKS_V3_PREVIEW_CRYPTO_UNAVAILABLE');
  }

  const resolvedNonce = text(nonce) ||
    (typeof cryptoImpl.randomUUID === 'function' ? cryptoImpl.randomUUID() : '');
  if (!resolvedNonce) {
    throw new Error('TASKS_V3_PREVIEW_NONCE_UNAVAILABLE');
  }

  const payload = {
    protocol: TASKS_V3_PROTOCOL,
    op: normalizedOp,
    operator: normalizedOperator,
    role: normalizedRole,
    assertedAt: String(Number(nowSeconds)),
    nonce: resolvedNonce,
    payloadJson: normalizedPayloadJson
  };

  payload.signature = await hmacSha256Hex(
    canonicalPayload(payload),
    normalizedSecret,
    cryptoImpl
  );

  return payload;
}

function failure(code, detail = '') {
  return {
    success: false,
    code,
    detail: text(detail)
  };
}

async function proxyTasksV3ReadonlyPreview({
  env,
  op,
  operator,
  role = TASKS_V3_PREVIEW_ALLOWED_ROLE,
  payloadJson = '{}',
  fetchImpl = globalThis.fetch,
  cryptoImpl = globalThis.crypto,
  nowSeconds = Math.floor(Date.now() / 1000),
  nonce,
  timeoutMs = TASKS_V3_PREVIEW_TIMEOUT_MS
}) {
  const upstream = text(env && env.TASKS_V3_APPS_SCRIPT_URL);
  const secret = text(env && env.TASKS_V3_SHARED_SECRET);

  if (!upstream || !secret) {
    return failure('TASKS_V3_PREVIEW_CONFIG_MISSING');
  }
  if (typeof fetchImpl !== 'function') {
    return failure('TASKS_V3_PREVIEW_FETCH_UNAVAILABLE');
  }

  let assertion;
  try {
    assertion = await buildTasksV3PreviewAssertion({
      op,
      operator,
      role,
      payloadJson,
      secret,
      nowSeconds,
      nonce,
      cryptoImpl
    });
  } catch (err) {
    return failure(text(err && err.message) || 'TASKS_V3_PREVIEW_ASSERTION_FAILED');
  }

  const controller = new AbortController();
  const boundedTimeout = Math.max(
    1,
    Math.min(
      Number(timeoutMs) || TASKS_V3_PREVIEW_TIMEOUT_MS,
      TASKS_V3_PREVIEW_TIMEOUT_MS
    )
  );
  const timer = setTimeout(() => controller.abort(), boundedTimeout);

  try {
    const response = await fetchImpl(upstream, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain;charset=utf-8',
        accept: 'application/json'
      },
      body: JSON.stringify(assertion),
      redirect: 'follow',
      signal: controller.signal
    });

    const raw = await response.text();
    let body;
    try {
      body = JSON.parse(raw || '{}');
    } catch (_) {
      return failure('TASKS_V3_PREVIEW_INVALID_JSON');
    }

    if (!response.ok) {
      return failure('TASKS_V3_PREVIEW_UPSTREAM_HTTP', String(response.status));
    }

    return {
      success: body && body.success === true,
      code:
        body && body.success === true
          ? 'OK'
          : text(body && body.code) || 'TASKS_V3_PREVIEW_UPSTREAM_REJECTED',
      status: response.status,
      body
    };
  } catch (err) {
    if (controller.signal.aborted || (err && err.name === 'AbortError')) {
      return failure('TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT');
    }
    return failure('TASKS_V3_PREVIEW_UPSTREAM_ERROR', err && err.name);
  } finally {
    clearTimeout(timer);
  }
}

function timingDuration(value) {
  return Math.max(0, Number(value) || 0).toFixed(2);
}

function timedJsonResponse(body, init, workerStartedAt, upstreamFetchMs) {
  const response = Response.json(body, init);
  const workerElapsedMs = performance.now() - workerStartedAt;
  response.headers.set(
    'Server-Timing',
    `worker;dur=${timingDuration(workerElapsedMs)}, upstream;dur=${timingDuration(upstreamFetchMs)}`
  );
  return response;
}

export default {
  async fetch(request, env) {
    const workerStartedAt = performance.now();
    let upstreamFetchMs = 0;

    const respond = (body, init) =>
      timedJsonResponse(body, init, workerStartedAt, upstreamFetchMs);

    if (request.method !== 'POST') {
      return respond(
        { success: false, code: 'METHOD_NOT_ALLOWED' },
        { status: 405, headers: { allow: 'POST' } }
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return respond(
        { success: false, code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const measuredFetch = async (...args) => {
      const upstreamStartedAt = performance.now();
      try {
        return await fetch(...args);
      } finally {
        upstreamFetchMs = performance.now() - upstreamStartedAt;
      }
    };

    const result = await proxyTasksV3ReadonlyPreview({
      env,
      op: payload && payload.op,
      operator: payload && payload.operator,
      role: payload && payload.role,
      payloadJson: payload && payload.payloadJson,
      fetchImpl: measuredFetch
    });

    return respond(result, {
      status: result && result.success === true ? 200 : 400
    });
  }
};
