# TrendOS Blackbox — T6B Cloud Auth Shadow Production Canary PASS

Date: 2026-09-13
Status: **PASS / RETAINED IN PRODUCTION**

## Scope

T6B changed only the Cloudflare employee-session verification hot path. It did **not** change Sheets business-write authority, Task mutation authority, frontend Orders routing, Gaber Material Control, Integrity flags, or Apps Script production deployment.

T6B was built from the retained T6A Worker baseline:

- T6A base commit: `164bde4273c27d956986d43e5b2b74013d4e4422`
- T6B branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
- final race-window fix commit: `b3176c8d82ad974094c3328d23e29556e209bba3`

## Production change retained

D1 migration:

- `cloudflare-d1/migrations/0004_cloud_auth_shadow_v1.sql`
- table: `cloud_auth_sessions_v1`

Worker runtime:

- `TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED = true`
- `CLOUD_AUTH_SHADOW_TTL_SECONDS = 300`
- final Worker Version ID: `3b819fd3-e73d-46f8-9150-f73c282706ab`

The auth shadow stores only a 64-character HMAC-SHA256 token fingerprint. The raw employee token is not stored in D1.

Runtime behavior:

1. First valid employee-session verification is a D1 miss.
2. The Worker verifies through the qualified Apps Script **POST** lane.
3. A fingerprinted shadow record is stored for 300 seconds.
4. Repeated verification for the same employee token is served from D1 without an Apps Script verification call.
5. On miss/expiry, the path falls back to Apps Script POST.

## Final production qualification

Workflow:

- `TrendOS Cloud Migration V3 T6B Final Production Canary`
- run: `34768601492`
- job: `103753950827`
- conclusion: **SUCCESS**

Final qualification sequence:

- fresh Apps Script login: PASS
- first `/v1/edge/session`: `authSource=apps-script-post` — PASS
- repeated `/v1/edge/session`: `authSource=d1-auth-shadow-v1` — PASS
- `/v1/edge/orders/session`: `authSource=d1-auth-shadow-v1` — PASS

Measured latency from the final production run:

- Apps Script verification miss: **4105 ms**
- D1 auth-shadow hit: **129 ms**
- Orders-session D1 auth-shadow hit: **122 ms**

Post-deploy production health baseline: PASS.

Task unauthenticated boundary remained enforced: PASS.

D1 row safety check:

- active shadow row present: PASS
- fingerprint length exactly 64: PASS
- raw employee token stored: **NO**

Automatic rollback step was present but skipped on the final run because all gates passed.

## Failed attempts and containment

Earlier T6B attempts were fail-closed:

- a workflow syntax failure stopped before D1 mutation;
- the migration/schema were then applied and independently verified;
- failed Worker canaries automatically rolled back to T6A;
- the retained D1 table was inert whenever the Worker flag was off;
- a later failure was traced to a qualification-token race between a separate login step and the canary request, not to D1 SQL or HMAC logic;
- commit `b3176c8d82ad974094c3328d23e29556e209bba3` moved fresh login and all qualification requests into one process immediately after deploy, eliminating that race window.

No failed attempt changed Sheets authority, Task mutation state, frontend Orders routing, or secrets.

## Authority and feature boundaries after T6B

Unchanged:

- Sheets / Apps Script remain authoritative for business writes.
- frontend `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` remains **false**.
- no user-visible Orders read cutover was made by T6B.
- no Operator Task mutation was enabled.
- no `claimNext` or `completeTask` production mutation was enabled.
- no Gaber Material Control rollout.
- no `EDGE_SESSION_SECRET` rotation/change.
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change.
- no Apps Script production deploy by T6B.

## Remaining performance blocker

T6B removes repeated Apps Script session-verification latency after the first qualified verification, but it does **not** repair the slow Apps Script Orders read path.

Known direct evidence remains:

- POST `getRowsPageV1931` approximately **19.9 s** in a prior direct production probe, with worse cold behavior observed previously.

Therefore frontend Edge Orders Read must remain OFF until the Cloud/D1 Orders read path is independently qualified for freshness/parity and latency.

## Immediate next controlled stage

Build and run a **read-only Cloud Orders parity/freshness qualification** while keeping the frontend flag OFF.

The qualification must prove, before any user-visible routing decision:

- session verification is D1-shadow fast after the first verification;
- the Cloud/D1 Orders read response is available and bounded;
- parity/freshness against the authoritative source is within an explicitly measured contract;
- no Business Data mutation occurs;
- Sheets write authority is unchanged;
- no Task mutation or Task authority change occurs;
- no secret change occurs;
- any candidate Worker change has an automatic rollback gate.

A later frontend Orders cutover is a separate decision boundary and is **not authorized by this checkpoint**.
