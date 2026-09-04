# PERF-CF-02AJ — Live Production frontend cutover probe PASS — 2026-09-04

## External runtime probe
A read-only GitHub Runner fetched the actually published GitHub Pages assets with cache-busting query parameters.

PASS conditions verified:
- live `/TrendOs/config.js` returned HTTP 200;
- live `/TrendOs/trendos-edge-orders-read-v1.js` returned HTTP 200;
- live config contains production D1 Worker URL `https://trendos-d1-api.trendmall-contact.workers.dev`;
- live config contains `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`;
- live config loads `trendos-edge-orders-read-v1.js?v=20260904b`;
- live loader defaults to the correct production D1 Worker;
- live loader declares `d1-orders-read-first-apps-script-fallback` mode;
- live loader retains original Apps Script fallback;
- anonymous Production Orders Edge route remains HTTP 401.

## Conclusion
Production frontend Orders read cutover is LIVE.
Eligible `getRowsPageV1931` reads now attempt Cloudflare/D1 first.
Writes, debt reads, unsupported reads, and every Edge failure remain on / fall back to Apps Script.
Cloud Write remains OFF.

## Next operational check
Observe real user sessions and page latency/errors. If any regression appears, flip the single production config flag back to false; no backend or data rollback is required for frontend rollback.
