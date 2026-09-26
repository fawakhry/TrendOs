import core from '../src/index_v2.js';
import {
  handleProductionShadowObserver,
  isProductionShadowPath
} from './observer.mjs';
import {
  handleProductionReconcileQualificationRequest,
  isProductionReconcileQualificationPath
} from '../src/cloud-write-production-reconcile-qualification.mjs';
import {
  handleR4ProductionRecoveryRequest,
  isR4ProductionRecoveryPath
} from '../src/r4-guarded-recovery-production.mjs';
import {
  handleR5ProductionRecoveryRequest,
  isR5ProductionRecoveryPath
} from '../t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs';
import {
  handleT12ProductionCreateCanaryRequest,
  isT12ProductionCreateCanaryPath
} from '../src/t12-production-create-canary-handler.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // T12 owner-approved fresh-start CREATE canary. Installed default-OFF.
    // The D1 control table also enforces a one-unique-create budget.
    if (isT12ProductionCreateCanaryPath(path)) {
      return handleT12ProductionCreateCanaryRequest(request, env, ctx);
    }

    if (isR4ProductionRecoveryPath(path)) {
      return handleR4ProductionRecoveryRequest(request, env, ctx);
    }

    // R5 is default-OFF in the isolated branch; no production deploy here.
    if (isR5ProductionRecoveryPath(path)) {
      return handleR5ProductionRecoveryRequest(request, env, ctx);
    }

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
