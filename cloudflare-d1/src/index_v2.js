import base from './index.js';
import { handleMirrorRequest, isMirrorPath } from './mirror-gate.mjs';
import { handleEdgeGatewayRequest, isEdgeGatewayPath } from './edge-gateway.mjs';
import { handleCloudWriteRequest, isCloudWritePath } from './cloud-write-gate.mjs';
import { handleNormalizedImportRequest, isNormalizedImportPath } from './normalized-import-gate.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Parallel secure lane only. No existing frontend route is redirected here.
    if (isEdgeGatewayPath(path)) {
      return handleEdgeGatewayRequest(request, env, ctx);
    }

    // Parallel cloud-write lane only. The gate is fail-closed and mutation-free while OFF.
    if (isCloudWritePath(path)) {
      return handleCloudWriteRequest(request, env, ctx);
    }

    // Normalized imports are protected before touching D1. Chunked live-sync requests
    // advance migration freshness only on a successful final chunk.
    if (isNormalizedImportPath(path)) {
      return handleNormalizedImportRequest(request, env, ctx);
    }

    // Mirror GETs are SELECT-only; unauthorized imports are rejected before
    // the legacy schema/write implementation can run.
    if (isMirrorPath(path)) {
      return handleMirrorRequest(request, env, ctx);
    }

    return base.fetch(request, env, ctx);
  }
};
