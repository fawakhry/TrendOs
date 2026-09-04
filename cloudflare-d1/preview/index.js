import core from '../src/index_v2.js';
import {
  handleProductionShadowPreviewRequest,
  isProductionShadowPreviewPath
} from './production-shadow-preview.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Preview-only, fixed-synthetic, mutation-free Production Shadow observer.
    // Production index_v2.js deliberately does not import this route.
    if (isProductionShadowPreviewPath(path)) {
      return handleProductionShadowPreviewRequest(request, env, ctx);
    }

    return core.fetch(request, env, ctx);
  }
};
