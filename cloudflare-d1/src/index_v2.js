import base from './index.js';
import { handleMirrorRequest } from './mirror.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

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
