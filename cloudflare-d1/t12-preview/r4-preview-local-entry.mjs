/**
 * R4 disposable LOCAL preview entrypoint. Not imported by the production Worker.
 * No Apps Script URL, no live DB binding, no production customer/order data.
 */
import {
  isR4RecoveryPreviewPath,
  handleR4RecoveryPreviewRequest
} from './t12-d1-guarded-recovery-preview-handler-v1.mjs';

const HEALTH = '/v1/t12-preview/d1-recovery/health';
const json = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});

export default {
  async fetch(request, env) {
    // Refuse any environment accidentally carrying the live DB binding.
    if (env.DB || env.APPS_SCRIPT_API_URL || env.D1_MIGRATION_SECRET) {
      return json(423, {success:false, reason:'unsafe-environment'});
    }
    const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (pathname === HEALTH) {
      if (request.method !== 'GET') return json(405, {success:false,reason:'method-not-allowed'});
      return json(200, {success:true, mode:'r4-disposable-local-preview',
        writesPerformed:false, productionWriteAuthorized:false});
    }
    if (!isR4RecoveryPreviewPath(pathname)) {
      return json(404,{success:false,reason:'not-found'});
    }
    return handleR4RecoveryPreviewRequest(request,env);
  }
};
