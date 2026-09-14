import { proxyTasksV3ReadonlyPreview } from './tasks-v3-readonly-preview.mjs';

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

