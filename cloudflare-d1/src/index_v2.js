import { LEGACY_BROWSER_PATH, handleLegacyBrowserTransport } from './legacy-browser-transport-v1.mjs';
import base from './index.js';
import { handleMirrorRequest, isMirrorPath } from './mirror-gate.mjs';
import { handleMirrorDeltaRequest, isMirrorDeltaPath } from './mirror-delta-gate.mjs';
import { handleEdgeGatewayRequest, isEdgeGatewayPath } from './edge-gateway.mjs';
import { handleEdgeCustomerSearchRequest, isEdgeCustomerSearchPath } from './edge-customer-search-v1.mjs';
import { handleCloudSessionBridgeV3, isCloudSessionBridgeV3Path } from './cloud-session-bridge-v3.mjs';
import { handleEmployeeNativeAuthRequest, isEmployeeNativeAuthPath } from './employee-auth-native-v1.mjs';
import { handleEmployeeLegacyBridgeRequest, isEmployeeLegacyBridgePath } from './employee-legacy-bridge-v1.mjs';
import { handleEmployeeOpsNativeRequest, isEmployeeOpsNativePath } from './employee-ops-native-v1.mjs';
import { handleEmployeeContentNativeRequest, isEmployeeContentNativePath } from './employee-content-native-v1.mjs';
import { handleEmployeeCommsNativeRequest, isEmployeeCommsNativePath } from './employee-comms-native-v1.mjs';
import { handleOperatorTaskEdgeRequest, isOperatorTaskEdgePath } from './operator-task-edge-v2.mjs';
import { handleEdgeOrdersReadCanaryRequest, isEdgeOrdersReadPath } from './edge-orders-read-v1-canary.mjs';
import { handleEdgeOrders02CRCanaryRequest, isEdgeOrders02CRPath } from './edge-orders-read-02cr-freshness.mjs';
import { handleEdgeOrdersServiceRequest, isEdgeOrdersServicePath } from './edge-orders-service-v1.mjs';
import { repairEdgeOrdersResponse02CX } from './edge-orders-line-id-repair-02cx.mjs';
import { guardEdgeOrdersPageRequest } from './edge-orders-freshness-gate.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from './edge-orders-idle-verifier.mjs';
import { handleT12ReadOverlayRequest, isT12ReadOverlayPath } from './t12-read-overlay-handler.mjs';
import { handleT12OperationalRuntimeRequest, isT12OperationalRuntimePath } from './t12-operational-runtime-handler.mjs';
import { handleT12GeneralCreateRequest, isT12GeneralCreatePath } from './t12-general-create-handler.mjs';
import { handleT12CustomerWriteRequest, isT12CustomerWritePath } from './t12-customer-write-handler.mjs';
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

    // Browser legacy transport: fixed server-side upstream; no authority cutover.
    if (path === LEGACY_BROWSER_PATH) return handleLegacyBrowserTransport(request, env);

    // T12 A61: Native employee auth foundation. Exact paths only; schema/control
    // and Wrangler flags keep this fail-closed until a separate production cutover.
    if (isEmployeeNativeAuthPath(path)) {
      return handleEmployeeNativeAuthRequest(request, env, ctx);
    }

    // T12 A61 compatibility bridge. D1 authenticates the employee; Apps Script
    // receives only a short-lived server-to-server assertion. Default-OFF.
    if (isEmployeeLegacyBridgePath(path)) {
      return handleEmployeeLegacyBridgeRequest(request, env, ctx);
    }

    if (isEmployeeOpsNativePath(path)) {
      return handleEmployeeOpsNativeRequest(request, env, ctx);
    }

    if (isEmployeeContentNativePath(path)) {
      return handleEmployeeContentNativeRequest(request, env, ctx);
    }

    if (isEmployeeCommsNativePath(path)) {
      return handleEmployeeCommsNativeRequest(request, env, ctx);
    }

    // CLOUD-MIGRATION-V3/T6A: exact session paths only. This replaces the
    // legacy Apps Script GET verification transport with POST and does not
    // alter business reads, business writes, D1 authority, Tasks, or secrets.
    if (isCloudSessionBridgeV3Path(path)) {
      return handleCloudSessionBridgeV3(request, env, ctx);
    }

    // Canonical TrendOS-native Accounting route and read-only integration contract.
    if (isAccountingNativeModulePath(path)) {
      return handleAccountingNativeModuleRequest(request, env, ctx);
    }

    // Temporary isolated engineering alias retained while Accounting is promoted
    // into the shared TrendOS shell. It does not change financial write authority.
    if (isAccountingPreviewPath(path)) {
      return handleAccountingPreviewRequest(request, env, ctx);
    }

    // T12 A51: authenticated D1 customer directory search. Read-only mirror lane;
    // customer CREATE/update remains Apps Script-authoritative with frontend fallback.
    if (isEdgeCustomerSearchPath(path)) {
      return handleEdgeCustomerSearchRequest(request, env, ctx);
    }

    // CLOUD-MIGRATION-V3/T11: Service-only Orders read candidate. This route is
    // independent from 02CR because Service is order-level and the three
    // production department screens are line-level. It remains unreachable from
    // the frontend until a separate parity-gated cutover enables screen=service.
    if (isEdgeOrdersServicePath(path)) {
      return handleEdgeOrdersServiceRequest(request, env, ctx);
    }

    // PERF-CF-02CR qualified production-read route. 02CU wraps the existing
    // handler with a metadata-only freshness guard. 02CX then repairs only the
    // proven Google-Sheets date-coercion Line-ID pattern before rows leave D1.
    if (isEdgeOrders02CRPath(path)) {
      const response = await handleEdgeOrders02CRCanaryRequest(request, env, ctx);
      return repairEdgeOrdersResponse02CX(response);
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

    // T12 Cloud-native read overlay. Authenticated SELECT-only lane; independent of Sheets mirror freshness.
    if (isT12ReadOverlayPath(path)) {
      return handleT12ReadOverlayRequest(request, env, ctx);
    }

    // T12 operational runtime for Cloud-native line status/notes/notification updates only.
    if (isT12OperationalRuntimePath(path)) {
      return handleT12OperationalRuntimeRequest(request, env, ctx);
    }

    // T12 guarded Cloud-native CREATE lane. DB control defaults OFF.
    if (isT12GeneralCreatePath(path)) {
      return handleT12GeneralCreateRequest(request, env, ctx);
    }

    // T12 Cloud-native customer master write lane. Schema/control defaults OFF.
    // Search remains the independent A51 read lane until customer write cutover.
    if (isT12CustomerWritePath(path)) {
      return handleT12CustomerWriteRequest(request, env, ctx);
    }

    // Operator Task V2 hybrid facade. Exact paths only; fail-closed/default-OFF;
    // Apps Script/Sheets remains Task write authority; this lane has no D1 Task writes.
    if (isOperatorTaskEdgePath(path)) {
      return handleOperatorTaskEdgeRequest(request, env, ctx);
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
