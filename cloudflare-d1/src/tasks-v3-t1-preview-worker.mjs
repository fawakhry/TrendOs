import { proxyTasksV3ReadonlyPreview } from './tasks-v3-readonly-preview.mjs';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return Response.json(
        { success: false, code: 'METHOD_NOT_ALLOWED' },
        { status: 405, headers: { allow: 'POST' } }
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return Response.json(
        { success: false, code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const result = await proxyTasksV3ReadonlyPreview({
      env,
      op: payload && payload.op,
      operator: payload && payload.operator,
      role: payload && payload.role,
      payloadJson: payload && payload.payloadJson
    });

    return Response.json(result, {
      status: result && result.success === true ? 200 : 400
    });
  }
};
