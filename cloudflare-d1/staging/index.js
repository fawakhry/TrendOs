/* TrendOS D1 Staging Entrypoint V1
 *
 * Adds staging-only verification routes in front of the normal TrendOS D1
 * Worker. Production continues to use src/index_v2.js directly and therefore
 * cannot route /v1/staging/cloud-write/reconcile/* or the V2 intent-plan route.
 */

import base from '../src/index_v2.js';
import {
  handleStagingCloudWriteReconcileRequest,
  isStagingCloudWriteReconcilePath
} from '../src/cloud-write-staging-reconcile.mjs';
import {
  handleCloudWriteOrderV2StagingRequest,
  isCloudWriteOrderV2StagingPath
} from '../src/cloud-write-order-contract-v2-staging.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (isCloudWriteOrderV2StagingPath(path)) {
      return handleCloudWriteOrderV2StagingRequest(request, env, ctx);
    }

    if (isStagingCloudWriteReconcilePath(path)) {
      return handleStagingCloudWriteReconcileRequest(request, env, ctx);
    }

    return base.fetch(request, env, ctx);
  }
};
