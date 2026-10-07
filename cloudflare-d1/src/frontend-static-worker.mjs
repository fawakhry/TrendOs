export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('x-trendos-frontend', 'cloudflare-worker');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    const criticalNoStore = new Set([
      '/',
      '/index.html',
      '/config.js',
      '/app.js',
      '/employee-api-dispatcher-v1.js',
      '/attendance-v1.js',
      '/attendance-clockin-ui-v1.js'
    ]);
    if (criticalNoStore.has(path)) {
      headers.set('cache-control', 'no-store, no-cache, must-revalidate');
      headers.set('pragma', 'no-cache');
      headers.set('expires', '0');
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
