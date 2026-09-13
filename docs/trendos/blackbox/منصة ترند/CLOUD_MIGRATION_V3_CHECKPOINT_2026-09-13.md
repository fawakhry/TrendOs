# TrendOS Cloud Migration V3 — Checkpoint — 2026-09-13

## Scope

Branch: `cloud-migration-v3-20260913`

Goal: move TrendOS read/session traffic toward Cloudflare/D1 incrementally while keeping Google Sheets / Apps Script as the authoritative business-write path until a separately approved cutover.

This checkpoint records repository/CI qualification only. No production Worker deployment, production D1 migration, frontend cutover, secret rotation, Task mutation, or Sheets write-authority change was performed by T1–T5.

## Production state preserved at this checkpoint

- `window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`
- Apps Script / Sheets remains authoritative for business writes.
- No production D1 migration applied for Cloud Auth Shadow V1.
- No production sync gate was newly enabled.
- No production frontend Cloud Orders read cutover occurred.
- No `EDGE_SESSION_SECRET` change.
- No `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change.
- No `claimNext` / `completeTask` or other Task business mutation.

## T1 — POST Session Bridge

Purpose: remove the legacy GET verification dependency that had produced slow/404 session verification and 15-second Worker aborts.

Implementation:
- `cloudflare-d1/src/cloud-session-bridge-v3.mjs`
- exact session paths only:
  - `/v1/edge/session`
  - `/v1/edge/orders/session`
- Apps Script verification uses POST body (`text/plain;charset=utf-8`).
- employee token is not placed in the URL.

Initial implementation commit:
- `b44e6224645b89dde2aad780ce8a5a79c8312b77`

Qualification:
- T1 workflow later passed on integrated branch state.
- `APPS_SCRIPT_VERIFY_METHOD=POST`
- `EMPLOYEE_TOKEN_IN_URL=NO`
- `PRODUCTION_MUTATION=NO`

## T2 — D1 Auth Shadow

Purpose: allow short-lived verified employee-session reuse from D1 so a valid shadow hit does not call Apps Script.

Implementation:
- `cloudflare-d1/src/cloud-auth-shadow-v1.mjs`
- candidate migration: `cloudflare-d1/migrations/0004_cloud_auth_shadow_v1.sql`
- default OFF gate: `TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED`
- raw employee token is never stored; only HMAC-SHA256 fingerprint is persisted.

Qualification commit:
- `bee8b8d836e68cc9d7cd4cb4204c5a744ba3d5c9`

Qualification run:
- `34753251908` — SUCCESS

Key evidence:
- `CLOUD_AUTH_SHADOW_V1_T2=PASS`
- `RAW_EMPLOYEE_TOKEN_STORED=NO`
- `AUTH_SHADOW_DEFAULT_ENABLED=NO`
- `CLOUD_SESSION_BRIDGE_V3_AUTH_SHADOW_INTEGRATION=PASS`
- `SHADOW_HIT_APPS_SCRIPT_CALLS=0`
- `SHADOW_MISS_FALLBACK_METHOD=POST`
- `RAW_EMPLOYEE_TOKEN_D1_WRITE=NO`
- `PRODUCTION_D1_MIGRATION=NO`
- `PRODUCTION_DEPLOY=NO`

## T3 — Cloud-native Orders Readiness

Purpose: prove a qualified session can read normal Orders pages from D1 without Apps Script calls, while unsupported/sensitive reads retain explicit Apps Script fallback.

Qualification commit:
- `651bcfaaee1d73e5f90d3138d88f4cf984332473`

Qualification run:
- `34753308941` — SUCCESS

Key evidence:
- `CLOUD_ORDERS_READ_V3_T3_READINESS=PASS`
- `NORMAL_ORDERS_READ_APPS_SCRIPT_CALLS=0`
- `NORMAL_ORDERS_DATA_SOURCE=d1-edge-orders`
- `DEBT_FILTER_FALLBACK=apps-script`
- `BUSINESS_MUTATION=NO`
- `PRODUCTION_EDGE_ORDERS_ENABLE=NO`
- `PRODUCTION_WORKER_DEPLOY=NO`
- `SHEETS_WRITE_AUTHORITY_CHANGED=NO`

## T4 — Freshness / Sync Safety

Workflow:
- `.github/workflows/cloud-migration-v3-t4-freshness-sync.yml`

Commit:
- `ed321d502426a7f42b56e3f9a4e31b364a753950`

Run:
- `34753530695` — SUCCESS

Qualified areas:
- atomic Orders/Lines sync contracts
- delta sync rollback safety
- low-usage / zero-idle contracts
- Orders + Lines freshness gate
- stale/parity/shape fail-closed behavior
- idle heartbeat verification
- bounded operational enrichment mirrors
- bounded screen-view mirrors
- Edge field/data-shape contracts
- Line-ID repair contract

Boundary remained:
- `PRODUCTION_SYNC_ENABLE=NO`
- `PRODUCTION_WORKER_DEPLOY=NO`
- `PRODUCTION_D1_MIGRATION=NO`
- `PRODUCTION_FRONTEND_CUTOVER=NO`
- `SHEETS_WRITE_AUTHORITY_CHANGED=NO`
- `TASK_MUTATION=NO`
- `SECRET_CHANGE=NO`

## T5 — Pre-Cutover Regression Gate

Workflow:
- `.github/workflows/cloud-migration-v3-t5-precutover.yml`

Final workflow commit before successful run:
- `0d1683b2ca981e29604cbeece5311afbba29d2c0`

Final run:
- `34753744337` — SUCCESS

The first T5 attempts exposed historical test assumptions rather than Cloud regressions:
- historical 02CN test expected production Edge Orders flag `true`, while emergency recovery intentionally keeps it `false`;
- startup request-storm test expected old `20260906perf1` cache keys instead of current `20260906perfhotfix1`;
- return-traffic test also expected candidate Edge flag `true`.

Corrections were test/qualification-only:
- candidate `Edge=true` is simulated only inside the ephemeral CI checkout and restored before the job ends;
- repository `config.js` remains `false` and `git diff --exit-code -- config.js` must pass;
- startup guard assertions were aligned with the current hotfix cache keys.

Final T5 evidence:
- T1 session/auth contracts PASS
- Edge Orders candidate contract surface PASS
- frontend cutover candidate + traffic controls PASS
- `STARTUP_REQUEST_STORM_FRONTEND_GUARD_PASS`
- polling coalescing PASS
- resume no-auto-refresh PASS
- return-traffic quiet PASS
- Fly Print lane stability PASS
- post-write Line-ID/read consistency PASS
- `TrendOS Pre-deploy package V1 safety gate: OK`
- `CURRENT_PRODUCTION_FRONTEND_EDGE_READ=false`
- `PRODUCTION_WORKER_DEPLOY=NO`
- `PRODUCTION_D1_MIGRATION=NO`
- `PRODUCTION_SYNC_ENABLE=NO`
- `PRODUCTION_FRONTEND_CUTOVER=NO`
- `SHEETS_WRITE_AUTHORITY_CHANGED=NO`
- `TASK_MUTATION=NO`
- `SECRET_CHANGE=NO`

## Decision gate reached

Repository/CI work is qualified through T5. The next action changes production and therefore requires owner approval.

Recommended first production step is intentionally narrower than full Cloud cutover:

### T6A — Production Worker Session Bridge Canary

Proposed scope after explicit approval:
1. Deploy the qualified Worker code containing the POST session bridge.
2. Keep production frontend Edge Orders read flag OFF.
3. Do NOT apply Cloud Auth Shadow D1 migration in this first canary.
4. Do NOT enable Cloud Auth Shadow in this first canary.
5. Do NOT change Sheets/Apps Script write authority.
6. Do NOT enable Task mutations or change Task/Gaber gates.
7. Immediately verify production Worker baseline before/after deployment.
8. Run authenticated read-only session qualification against the production Worker using existing masked qualification credentials.
9. Verify `/v1/edge/orders/session` no longer suffers the legacy GET 404/15s failure and record measured duration.
10. Automatic Worker rollback if post-deploy baseline/session qualification fails.

Only after T6A passes should a separate decision be made for production D1 Auth Shadow migration/enablement and later frontend Orders-read canary/cutover.

## STOP

STOP at this checkpoint pending explicit owner approval for T6A production Worker Session Bridge Canary.
