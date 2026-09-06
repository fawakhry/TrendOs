import base from './index.js';
import { handleMirrorRequest, isMirrorPath } from './mirror-gate.mjs';
import { handleMirrorDeltaRequest, isMirrorDeltaPath } from './mirror-delta-gate.mjs';
import { handleEdgeGatewayRequest, isEdgeGatewayPath } from './edge-gateway.mjs';
import { handleEdgeOrdersReadCanaryRequest, isEdgeOrdersReadPath } from './edge-orders-read-v1-canary.mjs';
import { handleEdgeOrders02CRCanaryRequest, isEdgeOrders02CRPath } from './edge-orders-read-02cr-canary.mjs';
import { guardEdgeOrdersPageRequest } from './edge-orders-freshness-gate.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from './edge-orders-idle-verifier.mjs';
import { handleCloudWriteRequest, isCloudWritePath } from './cloud-write-gate.mjs';
import { handleNormalizedImportRequest, isNormalizedImportPath } from './normalized-import-gate.mjs';
import { handleAccountingPreviewRequest, isAccountingPreviewPath } from './accounting-preview.mjs';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath
} from './accounting-native-module.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Canonical TrendOS-native Accounting route and read-only integration contract.
    if (isAccountingNativeModulePath(path)) {
      return handleAccountingNativeModuleRequest(request, env, ctx);
    }

    // Temporary isolated engineering alias retained while Accounting is promoted
    // into the shared TrendOS shell. It does not change financial write authority.
    if (isAccountingPreviewPath(path)) {
      return handleAccountingPreviewRequest(request, env, ctx);
    }

    // PERF-CF-02CR isolated qualification route only. No production frontend URL
    // is redirected here. The handler requires an authenticated Edge session and
    // fail-closes unless the operational lines/customer/restriction mirrors carry
    // the exact qualified 02CR note and row-count parity.
    if (isEdgeOrders02CRPath(path)) {
      return handleEdgeOrders02CRCanaryRequest(request, env, ctx);
    }

    // Secure D1 Orders/Lines read lane. Before any business-row query, the
    // metadata-only guard rejects stale/unready raw mirrors back to Apps Script.
    // 02CO routes through a default-OFF canary wrapper that preserves the
    // original session exchange and applies Apps-Script-like default page scoping.
    if (isEdgeOrdersReadPath(path)) {
      const heartbeatOptions = ordersIdleHeartbeatVerifierEnabled(env)
        ? {
            verifyIdleSourceFreshness: async () => fetchOrdersIdleHeartbeat(env)
          }
        : {};
      const blocked = await guardEdgeOrdersPageRequest(request, env, Date.now(), heartbeatOptions);
      if (blocked) return blocked;
      return handleEdgeOrdersReadCanaryRequest(request, env, ctx);
    }

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

    // Row-level mirror delta lane. Authenticated, schema-mutation-free and atomic
    // across all sheets included in the request.
    if (isMirrorDeltaPath(path)) {
      return handleMirrorDeltaRequest(request, env, ctx);
    }

    // Mirror GETs are SELECT-only; unauthorized imports are rejected before
    // the legacy schema/write implementation can run.
    if (isMirrorPath(path)) {
      return handleMirrorRequest(request, env, ctx);
    }

    return base.fetch(request, env, ctx);
  }
};
