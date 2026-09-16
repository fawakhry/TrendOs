import {
  TASKS_V3_PREVIEW_ALLOWED_OPS,
  proxyTasksV3ReadonlyPreview
} from './tasks-v3-readonly-preview.mjs';

const T2_OPERATOR = 'وائل';
const T2_ROLE = 'WAEL';

function text(value) {
  return String(value == null ? '' : value).trim();
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

function failure(code) {
  return { success: false, code };
}

export default {
  async fetch(request, env) {
    const workerStartedAt = performance.now();
    let upstreamFetchMs = 0;
    const respond = (body, init) =>
      timedJsonResponse(body, init, workerStartedAt, upstreamFetchMs);

    if (request.method !== 'POST') {
      return respond(failure('METHOD_NOT_ALLOWED'), {
        status: 405,
        headers: { allow: 'POST' }
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return respond(failure('INVALID_JSON'), { status: 400 });
    }

    const op = text(payload && payload.op);
    const operator = text(payload && payload.operator);
    const role = text(payload && payload.role).toUpperCase();

    if (!TASKS_V3_PREVIEW_ALLOWED_OPS.includes(op)) {
      return respond(failure('T2_OPERATION_FORBIDDEN'), { status: 400 });
    }
    if (operator !== T2_OPERATOR) {
      return respond(failure('T2_OPERATOR_FORBIDDEN'), { status: 400 });
    }
    if (role !== T2_ROLE) {
      return respond(failure('T2_ROLE_FORBIDDEN'), { status: 400 });
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
      op,
      operator,
      role,
      payloadJson: payload && payload.payloadJson,
      fetchImpl: measuredFetch
    });

    return respond(result, {
      status: result && result.success === true ? 200 : 400
    });
  }
};
