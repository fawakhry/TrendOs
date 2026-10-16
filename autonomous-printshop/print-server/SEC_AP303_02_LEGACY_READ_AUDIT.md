# SERVER-30 / SEC-AP303-02 — Legacy customer/order read boundary (DRAFT)

**Date:** 2026-10-16 · **Code lane:** `audit/server30-legacy-sensitive-read-gate-20261016` · **Status:** SOURCE_ONLY_REVIEW / NOT_PRODUCTION_APPROVED.

## What was inspected (GitHub source, not the live Cloudflare artifact)

- `cloudflare-d1/src/index_v2.js` imports the legacy `index.js` implementation and ends with `return base.fetch(request, env, ctx)` for otherwise unmatched routes.
- `cloudflare-d1/src/index.js` holds historical D1 customer, order, message and inbox reads without an explicit per-request credential/department authorization check in the inspected GET handlers. This is a potentially sensitive boundary, **not confirmed production exploitation**.
- Repository code search finds `customer_manager_d1_bridge_v1934.js` as a consumer of the four historical route families. Its hard-coded host is **the distinct** `trendos.trendmall-contact.workers.dev`, not the `trendos-d1-api` service; it falls back to Apps Script when D1 reads fail. The bridge file's existence does not prove it is loaded by the active frontend, and this review did **not** probe either host or inspect external consumers.
- `cloudflare-d1/wrangler.toml` selects `production-shadow/index.js` for `trendos-d1-api`; that wrapper delegates unmatched routes to `src/index_v2.js`, which in turn falls through to the legacy `index.js`. Cloudflare screenshots (SERVER-51–55) confirm active editor version prefix `2b40f622` and public Production/Preview Workers URLs with no Worker-specific Access. A separate hostname/account/WAF rule audit and external-consumer inventory remain open.

## Defensive review patch and compatibility risks

The unmerged review patch on `index.js` rejects five historical GET read shapes before any D1 call, regardless of Origin or unaudited bearer text; health, OPTIONS and protected import routes are not deliberately changed. This is a **temporary fail-closed boundary for review**, not a finished replacement API or authorization system. It deliberately interrupts historical reads if deployed. **DO NOT merge or deploy** until all consumers are inventoried and migrated to explicit server-verified identity and per-department read controls, and a rollback/deprecation schedule is authorized. Browser fallback may preserve some flows but cannot be assumed for external callers.

Synthetic Node tests exercise both `index.js` and actual `index_v2.js` routing with a fake D1 that throws on `prepare`. Run via a dedicated read-only CI workflow. A pass establishes tested source behavior only; it is not a production Access/audit outcome. CI result to be recorded with run URL once verified.

## Outstanding blockers

1. Production source/version parity with Cloudflare API `2b40f622` not established.
2. All external/legacy Worker consumers and compatibility requirements unknown.
3. Cloudflare Access/origin rules not independently verified; CORS is **not** an authentication boundary.
4. No dedicated server identity, scopes, production credentials, D1 access authorization or Ubuntu HTTPS integration approved.
5. No live request/test, no D1 record read, and no deployment authorized.

`SEC_AP303_02=REVIEW_PATCH_ONLY` · `D1_PRODUCTION_TOUCHED=NO` · `UBUNTU_TOUCHED=NO` · `AUTO_MERGE=NO` · `AUTO_DEPLOY=NO`.


## SERVER-56 update — in-repo frontend call graph and offline compatibility evidence (2026-10-16)

**New source traces:** `index.html` includes `matbagy_theme_v1860.js`. At initialization `matbagy_theme_v1860.js` dynamically appends a script for `customer_manager_d1_bridge_v1934.js`; the bridge wraps `window.trendosSecureApiV1922`. For `customerManagerV1` **inbox/thread** it prefers historical GETs (`/v1/inbox`, `/v1/messages`, optionally `/v1/orders`, `/v1/customer`), and catches failures to call the original Apps Script-backed API. All other actions (including send/handoff/resolve) call the original API directly. This establishes a **source-level entrypoint**, stronger than mere existence of an unused file; activation of that entrypoint in a currently deployed browser remains unverified.

**Host separation is critical:** the bridge hardcodes `https://trendos.trendmall-contact.workers.dev`, while the audited active Worker and `cloudflare-d1/wrangler.toml` refer to `https://trendos-d1-api.trendmall-contact.workers.dev`. Do not assume the two Workers share the same live deployment or all consumers. `cloudflare-d1/apps-script-importer.gs` also calls a configured API `/v1/import/batch` **POST** with a separate migration secret. This is a different lane than legacy customer GET and must retain its auth guard.

**Offline compatibility test:** `tests/server56_legacy_customer_bridge_compat.test.mjs` runs `customer_manager_d1_bridge_v1934.js` under an in-memory VM with intercepted fake fetch and original API. It tests legacy inbox/thread 403 -> original Apps Script fallback, fake offline network failure -> fallback, write/actions not routed to legacy GET, original API preservation, host separation, frontend load chain, POST importer independence. [GitHub Actions #38940926060](https://github.com/fawakhry/TrendOs/actions/runs/38940926060) **9/9 PASS** at commit `67333c89c2f7f5234241c6651bc3721b550c133f`. The test performs **zero real requests**; it does not prove compatibility with every external client or Production deployment.

**Release decision stays HOLD:** no blanket Cloudflare Access change, no merge/deploy of PR #154, no automatic migration. Resolve external consumers, staging parity, hostname/WAF/Access scope, and owner-approved deployment/rollback separately. In-repo legacy browser fallback test passing is one piece of the compatibility evidence only.

`IN_REPO_CLIENT_GRAPH=DOCUMENTED`; `BROWSER_403_FALLBACK_SYNTHETIC=9/9_PASS`; `EXTERNAL_CONSUMERS=UNKNOWN`; `WORKER_HOSTS_DISTINCT=YES`; `SEC_AP303_02=OPEN`.
