import core from '../src/index_v2.js';
import {
  handleProductionShadowObserver,
  isProductionShadowPath
} from './observer.mjs';
import {
  handleProductionReconcileQualificationRequest,
  isProductionReconcileQualificationPath
} from '../src/cloud-write-production-reconcile-qualification.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // PERF-CF-02CL: isolated, exact-target Production qualification route.
    // Execution remains fail-closed while TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED != true.
    // This is intentionally kept outside the generic Cloud Write route/core entrypoint.
    if (isProductionReconcileQualificationPath(path)) {
      return handleProductionReconcileQualificationRequest(request, env, ctx);
    }

    if (isProductionShadowPath(path)) {
      return handleProductionShadowObserver(request, env, ctx);
    }

    return core.fetch(request, env, ctx);
  }
};
