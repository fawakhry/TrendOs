import baseWorker from './index.js';
import { handleMirrorRequest } from './mirror.js';

const MIRROR_PATHS = new Set([
  '/v1/import/sheet',
  '/v1/mirror/sheets',
  '/v1/mirror/stats',
  '/v1/mirror/sheet'
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (MIRROR_PATHS.has(path)) {
      return handleMirrorRequest(request, env, ctx);
    }

    return baseWorker.fetch(request, env, ctx);
  }
};
