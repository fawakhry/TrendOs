import base from './index.js';
import { handleMirrorRequest } from './mirror.js';
import { handleEdgeGatewayRequest, isEdgeGatewayPath } from './edge-gateway.mjs';
import { handleCloudWriteRequest, isCloudWritePath } from './cloud-write.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Parallel secure lane only. No existing frontend route is redirected here.
    if (isEdgeGatewayPath(path)) {
      return handleEdgeGatewayRequest(request, env, ctx);
    }

    // Parallel cloud-write lane only. Default-off and never cuts over legacy writes by itself.
    if (isCloudWritePath(path)) {
      return handleCloudWriteRequest(request, env, ctx);
    }

    if (
      path === '/v1/import/sheet' ||
      path === '/v1/mirror/sheets' ||
      path === '/v1/mirror/stats' ||
      path === '/v1/mirror/sheet'
    ) {
      return handleMirrorRequest(request, env, ctx);
    }

    return base.fetch(request, env, ctx);
  }
};
