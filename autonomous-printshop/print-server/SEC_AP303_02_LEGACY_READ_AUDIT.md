# SERVER-30 / SEC-AP303-02 — Legacy customer/order read boundary (DRAFT)

**Date:** 2026-10-16 · **Code lane:** `audit/server30-legacy-sensitive-read-gate-20261016` · **Status:** SOURCE_ONLY_REVIEW / NOT_PRODUCTION_APPROVED.

## What was inspected (GitHub source, not the live Cloudflare artifact)

- `cloudflare-d1/src/index_v2.js` imports the legacy `index.js` implementation and ends with `return base.fetch(request, env, ctx)` for otherwise unmatched routes.
- `cloudflare-d1/src/index.js` holds historical D1 customer, order, message and inbox reads without an explicit per-request credential/department authorization check in the inspected GET handlers. This is a potentially sensitive boundary, **not confirmed production exploitation**.
- Repository code search finds `customer_manager_d1_bridge_v1934.js` as a consumer of the four historical route families. Its hard-coded host is **the distinct** `trendos.trendmall-contact.workers.dev`, not the `trendos-d1-api` service; it falls back to Apps Script when D1 reads fail. The bridge file's existence does not prove it is loaded by the active frontend, and this review did **not** probe either host or inspect external consumers.
- `cloudflare-d1/wrangler.toml` selects `src/index_v2.js` for `trendos-d1-api`. Cloudflare Access, non-GitHub consumers, production-source parity, and external routing rules remain unverified.

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
