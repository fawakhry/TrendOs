# SERVER-56 — Legacy read consumer compatibility matrix (SOURCE + SYNTHETIC ONLY)

**Date:** 2026-10-16 · **SEC-AP303-02:** OPEN, HIGH PRIORITY · **Production:** untouched

## Proven repository call graph

`index.html` → `matbagy_theme_v1860.js` → dynamic `customer_manager_d1_bridge_v1934.js` → wraps `trendosSecureApiV1922` → tries legacy GET for `customerManagerV1` inbox/thread → on failure calls original Apps Script API. The original `customer_manager_v1933.js` dispatches `customerManagerV1` with user session parameters. This source path **can** be loaded by the frontend, not proof that a specific Production browser currently executed it.

The bridge hardcodes the distinct Worker `trendos.trendmall-contact.workers.dev`; `cloudflare-d1/wrangler.toml` points to `trendos-d1-api` and entrypoint `production-shadow/index.js`. These are **not interchangeable** without explicit Cloudflare mapping evidence.

## Consumer matrix — what changes might break

| Source (known) | Host/route | Behavior | Evidence level | Deployment impact of blocking |
|---|---|---|---|---|
| `index.html` & `matbagy_theme_v1860.js` | Loads V1934 script | Creates potential browser dependency | GitHub code link established | Need deployed UI script/version verification |
| `customer_manager_d1_bridge_v1934.js` | Separate `trendos` Worker `GET /v1/inbox` | Customer inbox; catches GET failures and calls original Apps Script API | Mock VM 403 PASS | Fallback should work in tested cases; Production not verified |
| Same client | `trendos` Worker `GET /v1/messages` (optional `/v1/orders`, `/v1/customer`) | Thread context, order/customer enrichment | Source + mock 403 messages PASS | Optional enrichment failures may not trigger global fallback; inspect UX, not equivalent to full compatibility proof |
| Same client | Apps Script `customerManagerV1` send/suggest/handoff/resolve | Mutations remain routed to original API | VM fake transport PASS | Do not disable original Apps Script write authority |
| `cloudflare-d1/apps-script-importer.gs` | Configured Worker URL `POST /v1/import/batch` | Migration/live-sync import with `x-migration-secret` | Source inspection only; no live import test | Do not accidentally block POST, secret validation or Cloudflare route |
| `cloudflare-d1/src/index.js` | `trendos-d1-api` GET `/v1/orders[/*]`, `/v1/customer`, `/v1/messages`, `/v1/inbox` | Historical D1 read helpers via router fallback | Static source & fake D1 tests from PR #154 | Proposed 403 denies these GETs; list external users before production patch |
| `cloudflare-d1/src/index_v2.js` | `trendos-d1-api` fallback | Unmatched path delegates to legacy handler | Static source + CI | Deploying only a partial bundle may miss security guard |
| `trendosshop_read_once.py` | `trendos-d1-api` `GET /v1/printshop/service/orders/page` | New print/laser-only reader, default OFF | SERVER-33/34 synthetic 18/18 on Ubuntu | Real principal and Cloudflare route not deployed |

**Unknowns:** external/browser-independent integrations and operational clients; actual current browser scripts and versions; distinct `trendos` Worker deployment and D1 permissions; Cloudflare WAF/account/hostname rules; preview worker protections; live schema and runtime parity; all Access/authorization requirements. Do **not** mistake code search absence for proof of zero consumers.

## CI gate added (not production authorization)

`tests/server56_legacy_customer_bridge_compat.test.mjs` uses Node VM with a fake `fetch` and fake Apps Script function. **Nine tests passed**, [GitHub Actions #38940926060](https://github.com/fawakhry/TrendOs/actions/runs/38940926060), original suite commit `67333c89...`. Covers 403 fallback, rejected transport fallback, action separation, source call graph, distinct host, migration POST separation. No real API, customer data, secrets or device action.

## Compatible release route to propose for explicit owner approval

1. Obtain a complete inventory of callers and their business criticality; check separate `trendos` Worker without live sensitive-data requests. Confirm mobile, external and scheduled consumers.
2. Qualify authenticated replacement routes for human customer/employee operations and print/laser line-scoped machine reads in non-production with synthetic D1. Deny missing credentials **before querying D1**.
3. Decide a narrow change to `trendos-d1-api` legacy GETs based on PR #154, while preserving signed/authorized import POST, health endpoint, and unrelated routes. PR #151 scope-grant fix and PR #160 service reader must also be qualified with source parity.
4. Freeze/record current Cloudflare Worker deployment version `2b40f622`, establish explicit rollback procedure and recoverability of prior artifact/config. Predefine 403/401/error monitoring, order UI sanity checks, Apps Script fallback and legacy bridge checks.
5. Ask the owner to approve **each** Production mutation (auth/Access/WAF, merge, deploy, account provisioning) separately. Avoid blanket Access enablement that might interrupt current frontend and other apps.
6. After rollout approval, run minimally invasive metadata-only/authorized checks with redaction. No unsanctioned Production tests.

`OWNER_APPROVAL_FOR_PRODUCTION=NOT_GRANTED` · `D1_PRODUCTION_QUERIES=NONE` · `PR_MERGE=NO` · `WORKER_DEPLOY=NO` · `UBUNTU_LIVE_READ=NO`.
