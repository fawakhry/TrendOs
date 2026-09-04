import core from '../src/index_v2.js';
import {
  handleProductionShadowObserver,
  isProductionShadowPath
} from './observer.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (isProductionShadowPath(path)) {
      return handleProductionShadowObserver(request, env, ctx);
    }

    return core.fetch(request, env, ctx);
  }
};
