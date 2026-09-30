# TrendOS T12 — Entry495 — Browser Google transport removed; Repo-only qualification

Date: 2026-09-30 Cairo
Repository: `fawakhry/TrendOs`
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`
Base commit: `b4daab73635261a0413ff935a028b5f8fdaf9206`

## Scope and checkpoint
Entry493 was read first. The current Master Book/Handoff already contained Entry494; it is preserved. No canary, enrollment, login attempt, deployment, migration, Production setting/property change, or business-data mutation was executed.

```ini
APPS_SCRIPT_PRODUCTION_VERSION=158
EMPLOYEE_AUTH_CONTROL_MODE=OFF
NATIVE_USER_COUNT=0
NATIVE_READY_COUNT=0
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
SOURCE_QUALIFICATION=PASS_LOCAL
SOURCE_DEPLOYED=NO
```

These Production values are the supplied/documented checkpoint, not a fresh live measurement in this Repo-only task.

## Root cause
The browser `config.js` exposed the Google Web App URL through `WEB_APP_URL`, `TREND_API_URL`, and `API_URL`. `app.js`'s secure wrapper selected `MATBAGY_SECURE_API_PROXY_URL || API_URL`; the proxy was empty, so even the secure wrapper used direct Google fetch with browser redirect following. Google's Apps Script response/redirect did not provide the browser's required CORS contract. The observed googleusercontent 404 is an upstream/redirect failure; source inspection alone cannot determine whether that individual response was expired or otherwise invalid.

Direct/fallback legacy transport also existed in:
`attendance-clockin-ui-v1.js`, `attendance-live-timer-v1.js`, `attendance-v1.js`, `employee-cleaning-prep-v1.js`, `hr-v1.js`, `customer-manager-v1.js`, `customer-feedback-v1.js`, `go-live-autopilot-v1.js`, `press-control-v1.js`, `manager-center-v1932.js`, `employee-manager-strips-v2.js`, `employee-ops-coach-v1.js`, `employee-andon-v1.js`, `work-queue-v1.js`, `operator-task-workflow-v2.js`, and `trend-master-resilience-v1931.js`.

Orders `trendos-edge-orders-read-v1.js` called the original legacy wrapper through `hybridAppsScriptFallback()` when 02CR was stale/unavailable, during stale cooldown, or under the post-write read barrier. That turned a D1 freshness failure into a second browser Google request. Freshness/HTTP failures must not be treated as proof that the employee session expired.

## Source changes
- `browser-api-transport-v1.js`: fixed Cloud API transport at `/v1/legacy-api`; browser fetch guard rejects Apps Script hosts, and redirects fail closed. No automatic retry or credential persistence.
- `employee-api-dispatcher-v1.js`: current-main dispatcher reconciled onto the branch. OFF-mode never executes a caller-supplied direct legacy invoker; legacy authority is reached through Cloud transport. Native/bridge flags remain false and policies empty.
- `app.js`: secure wrapper delegates to Cloud transport. Orders service errors carrying a code do not invoke message-based logout.
- The 15 legacy UI modules listed above, excluding Trend Master, delegate their existing action/payload to the employee dispatcher; missing dispatcher fails closed. Press/Work Queue no longer repeat a failed request through another transport.
- `trend-master-resilience-v1931.js`: panel reads use the dispatcher; no direct legacy fetch.
- `config.js`: deprecated Google endpoint metadata removed from browser; generic aliases remain empty and are NOT repointed globally to Cloudflare. Modules now use explicit transport/dispatcher functions. Server `APPS_SCRIPT_API_URL` is untouched.
- `index.html`: synchronous guard/transport before app, dispatcher after app; updated script cache tags.
- `trendos-edge-orders-read-v1.js`: qualified 02CR still primary; freshness/503/invalid JSON/missing mirror/cooldown/post-write barrier return `ORDERS_CLOUD_UNAVAILABLE`, without legacy page fallback. Failed page reads preserve current UI rows and employee session. Debt/unsupported legacy reads use Cloud transport, not browser Google.
- `cloudflare-d1/src/legacy-browser-transport-v1.mjs` + `index_v2.js`: exact `/v1/legacy-api` source route. POST-only with explicit existing-action allowlist and configured CORS origins. Fixed upstream from existing server `APPS_SCRIPT_API_URL`; Apps Script continues to authorize legacy tokens/actions. No arbitrary target, D1 access, native assertion, bridge secret, logs, persistence, or retries. Upstream HTML/404/network failures become sanitized 502, while genuine HTTP-200 auth rejection is preserved. Google redirect headers are not forwarded to Browser. Customer and Order CREATE/search Cloud authority cannot fall through this route.
- New isolated CI contains no secrets, Cloudflare calls, Wrangler, migrations, deploy, or production qualification requests.

## Current-main parity retained
The branch frontend snapshot predates several current-main fixes. To avoid undoing deployed behavior, the four touched shell files (`app.js`, `config.js`, `index.html`, `trendos-edge-orders-read-v1.js`) were reconciled against current-main blobs before applying this transport change:
- app: `1e8f24c99c0c60c99caf96fabec85ebd6ff7774f`
- config: `7e963a9cd65324a04f1137f99cc52648e56e492a`
- index: `b9856ae00e64a76e0988411758d6ae9a4a4bae6b`
- Orders wrapper: `ff19e15bcedb68e926ed614a74c503c0b81f2621`

Retained behavior includes A60 mandatory password-change enforcement, manual Trend Master loading, global Orders summary, status UX, canonical frontend redirect, and native-token-safe legacy write dispatch. No new order-identity/status transformation was introduced. Existing tests still verify the already-qualified identity repair.

## Tests
All are isolated and passed locally on Node 24:
```bash
for f in *.js; do node --check "$f"; done
node --check cloudflare-d1/src/index_v2.js
node --check cloudflare-d1/src/legacy-browser-transport-v1.mjs
node tests/frontend_no_direct_google_transport_a61.test.mjs
node tests/legacy_browser_transport_a61.test.mjs
node tests/frontend_employee_api_dispatcher_a61.test.mjs
node tests/frontend_legacy_module_dispatch_a61.test.mjs
node tests/frontend_edge_orders_cutover_02ct.test.mjs
node tests/frontend_order_status_write_consistency_02cv.test.mjs
node tests/frontend_order_status_ux_02cv.test.mjs
node tests/frontend_flyprint_lane_stability_02cv.test.mjs
node tests/frontend_t12_customer_cloud_only_a56.test.mjs
node tests/employee_auth_native_a61.test.mjs
node tests/employee_legacy_auth_bridge_a61.test.mjs
```
The new regression scans 50 frontend runtime JS/HTML files, including dormant root modules and Accounting runtime sources. Docs, test fixtures, tooling, and backend sources/config are excluded. It rejects direct Google endpoint literals and legacy alias fetch calls. Dynamic tests reject configured Google URLs and legacy invokers and require browser redirect rejection. Fifteen module tests verify existing action/payload forwarding. Orders tests cover stale proof, missing mirror, HTTP errors, invalid JSON, and persisted post-write barriers. Backend transport tests verify origin/action/method restrictions, fixed upstream, no redirect header leakage, sanitized errors, genuine auth rejection, and no retries.

The older 02CV static test was stale against the branch snapshot; current-main parity restored its actual UI contract. Its cache-tag assertion was updated to this candidate's tag. No runtime regression was hidden by removing that test.

205 existing workflow triggers were checked before updating the branch. Existing production deploy/canary/migration triggers require other branches or their own unchanged trigger/workflow files. This commit only triggers isolated qualification (new CI, A56 CI, OFF-state source preflight), not Production execution.

## Owner-only manual Cloudflare sequence
1. Checkout the final exact branch commit recorded in the task report. Run the listed local tests. Compare active Production source/bindings with the qualified branch; stop on any unexplained drift.
2. Publish the API source using the existing `production-shadow/index.js` entry and its complete import graph to existing `trendos-d1-api`, through your established manual process. Include the new module and `index_v2.js` import/route. Preserve live dependencies, D1 binding, CORS origins, and `APPS_SCRIPT_API_URL`; keep all A61 flags OFF. Do not apply migration 0009, change secrets, or run any historical auth canary workflow.
3. Verify `/v1/legacy-api` using the non-auth probes below and check existing native/bridge health remains OFF. If the route is absent or CORS preflight fails, do not publish frontend yet.
4. Assemble frontend assets from this qualified branch commit (all root HTML/JS/CSS), not the unmodified `main` checkout used by historical A57B workflow. Include both new transport and dispatcher files; publish only assets to existing `trendos-ui` using its current asset serving worker/binding. No API-base global flip, Native-only, Bridge enablement, secret, or D1 change.
5. Hard reload the UI and verify below. Stop on regression. Restore the previous API/frontend versions together if rollback is needed; no data/schema rollback.

The assistant executed none of those manual steps.

## Post-deploy verification (owner only)
Non-mutating probes, no passwords/tokens:
```bash
curl -i -X OPTIONS 'https://trendos-d1-api.trendmall-contact.workers.dev/v1/legacy-api' \
  -H 'Origin: https://trendos-ui.trendmall-contact.workers.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
curl -i 'https://trendos-d1-api.trendmall-contact.workers.dev/v1/legacy-api' \
  -H 'Origin: https://trendos-ui.trendmall-contact.workers.dev' \
  -H 'Content-Type: application/json' --data '{"action":"__transport_probe__"}'
curl -fsS 'https://trendos-d1-api.trendmall-contact.workers.dev/v1/employee/auth/health'
curl -fsS 'https://trendos-d1-api.trendmall-contact.workers.dev/v1/employee/legacy-action/health'
```
Expected: preflight 200 + matching Allow-Origin; invalid action 403 `LEGACY_ACTION_DENIED` with zero upstream request; native mode OFF / flags false; bridge disabled / allowlist zero. Secret absence remains valid in this source-install phase.

In Browser after hard reload:
- Network: employee login/session/action requests go to Cloud endpoints only; no Apps Script or googleusercontent request/redirect. Enter credentials only in the normal UI, never chat/logs/report.
- Check count only (do not dump resource URLs or payloads):
```js
performance.getEntriesByType('resource').filter(e => /^https:\/\/(script\.google\.com|script\.googleusercontent\.com)\//i.test(e.name)).length
```
Expected `0` for a fresh navigation. CORS error count to those hosts must also be zero.
- Existing legacy login must retain its `mustChange` behavior. A service/network 502 or Orders 503 must not clear the employee session or present an auth-expiry claim. Genuine upstream auth rejection must remain rejected.
- Orders fresh 02CR: normal rows. Orders stale/503: explicit Cloud-unavailable message, no legacy page fallback and no session clearing. Test network outage with DevTools request blocking for the page route only; isolated tests additionally cover actual 503/freshness responses. Do not alter live freshness budgets or mirror/control data to force a failure.
- Do not create Orders or change statuses for verification.

## Remaining Zero-Google work
This removes browser Google API transport only; legacy authorization and legacy business execution are still Google-backed server-side. Enrollment/Diya native proof, native auth authority, legacy business-route migration, and operational mirror freshness remain separate work. No nonce/enrollment behavior was changed in this urgent transport-fix task.

```ini
CLOUDFLARE_DEPLOY=NO
WRANGLER_EXECUTED=NO
D1_MIGRATION=NO
PRODUCTION_FLAGS_MUTATION=NO
SECRETS_MUTATION=NO
SCRIPT_PROPERTIES_MUTATION=NO
ORDER_MUTATION=NO
CUSTOMER_MUTATION=NO
ACCOUNTING_MUTATION=NO
NEXT_STEP=OWNER_MANUAL_CLOUD_TRANSPORT_INSTALL_AND_FRONTEND_VERIFY
```
