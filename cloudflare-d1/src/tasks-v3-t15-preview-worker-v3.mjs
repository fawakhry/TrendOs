import {
  readTasksV3T15Preview,
  refreshTasksV3T15Snapshot
} from './tasks-v3-t15-d1-preview-v3.mjs';

function duration(value) {
  return Math.max(0, Number(value) || 0).toFixed(2);
}

function timedJson(body, init, workerStartedAt, d1Ms) {
  const response = Response.json(body, init);
  response.headers.set(
    'Server-Timing',
    `worker;dur=${duration(performance.now() - workerStartedAt)}, upstream;dur=0.00, d1;dur=${duration(d1Ms)}`
  );
  return response;
}

export default {
  async fetch(request, env) {
    const workerStartedAt = performance.now();
    let d1Ms = 0;
    const respond = (body, init) => timedJson(body, init, workerStartedAt, d1Ms);

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
      return respond({ success: false, code: 'INVALID_JSON' }, { status: 400 });
    }

    const d1StartedAt = performance.now();
    let result;
    try {
      result = await readTasksV3T15Preview({
        env,
        op: payload && payload.op,
        operator: payload && payload.operator,
        role: payload && payload.role
      });
    } finally {
      d1Ms = performance.now() - d1StartedAt;
    }

    return respond(result, {
      status: result && result.success === true
        ? 200
        : Number(result && result.httpStatus) || 400
    });
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil((async () => {
      const result = await refreshTasksV3T15Snapshot({ env });
      if (!result || result.success !== true) {
        console.error(
          'TASKS_V3_T15_REFRESH_FAILED',
          result && result.code,
          result && result.detail
        );
      }
    })());
  }
};
