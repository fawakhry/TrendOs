# TrendOS Blackbox — Cloud Migration V3

Date: 2026-09-13
Branch: `cloud-migration-v3-20260913`
Base commit: `6e2e9f5193ddc8b8e2bcc0603b1986ae3f5a7bff`

## Objective

Move TrendOS progressively from Apps Script request-time dependency to Cloudflare/D1 while preserving production safety and keeping Sheets / Apps Script authoritative for business writes until a separately approved authority cutover.

## Production safety boundary

This track does not authorize:

- production Worker deployment;
- production D1 migration;
- Apps Script deployment/version changes;
- secret rotation/change;
- Task `claimNext` / `completeTask` or any business mutation;
- Gaber material-control activation;
- D1 business-write authority cutover;
- RP-08.

Production frontend emergency baseline remains `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=false` until a separately qualified read cutover.

## Incident evidence carried into this track

- Legacy Worker session verification uses Apps Script GET with a 15-second abort.
- Direct read-only diagnostic run `34738294725` observed GET `verifyEmployeeSession` => HTTP 404 after 27.389 seconds.
- POST `verifyEmployeeSession` was independently observed to reach the Apps Script application lane successfully in roughly 4 seconds.
- `getRowsPageV1931` remains independently slow; Cloud migration must therefore remove request-time Apps Script dependency rather than only increasing timeouts.
- Owner rollback evidence from the Tasks V3 review records that the breaking Apps Script Version 156 was rolled back to the immediately previous production deployment. The exact prior numeric version was not independently observed and must not be guessed. Platform operation recovered after rollback.

## T1 — isolated POST session bridge — PASS

Implementation:

- `cloudflare-d1/src/cloud-session-bridge-v3.mjs`
- exact paths only:
  - `/v1/edge/session`
  - `/v1/edge/orders/session`
- wired before legacy session handlers in `cloudflare-d1/src/index_v2.js`.
- Apps Script verification transport changed for these isolated routes from query-string GET to JSON-in-`text/plain;charset=utf-8` POST body.
- Employee token is not placed in the upstream URL.
- Existing `EDGE_SESSION_SECRET` is consumed unchanged; no secret mutation was performed.
- No business write path or D1 authority changed.

Commits:

- bridge implementation: `b44e6224645b89dde2aad780ce8a5a79c8312b77`
- routing integration: `10d8396d1e3f1ae8643a3f6ed6ae3f74383f6f8c`
- contract tests: `2f7e772e7710aaf372c402c8ac58d6bb29d835e5`
- CI workflow: `07892674be6568d0c5b30a3dde9c862f8acbb18f`

Qualification:

- Workflow: `TrendOS Cloud Migration V3 T1 Session Bridge`
- Run: `34753119462`
- Conclusion: `SUCCESS`
- compatibility rerun after T2 integration: `34753227559` => `SUCCESS`
- `Run T1 session bridge contract tests`: SUCCESS
- `Assert production isolation`: SUCCESS
- expected contract output includes:
  - `CLOUD_SESSION_BRIDGE_V3_T1=PASS`
  - `APPS_SCRIPT_VERIFY_METHOD=POST`
  - `EMPLOYEE_TOKEN_IN_URL=NO`
  - `PRODUCTION_MUTATION=NO`

T1 is code/contract qualified only. It is NOT deployed to Production.

## T2 — Cloud-native Auth Shadow — PASS / DEFAULT OFF

Repository-only candidate migration:

- `cloudflare-d1/migrations/0004_cloud_auth_shadow_v1.sql`
- commit `3900186aa5e16ff857f8fd1a77834661f1aeffe8`
- table: `cloud_auth_sessions_v1`
- raw employee tokens are intentionally never stored.
- session key is `(username_key, token_fingerprint)`.
- fingerprint is a domain-separated HMAC-SHA256 derived using the existing `EDGE_SESSION_SECRET`; the secret itself was not changed or rotated.
- bounded cache TTL default 300 seconds, minimum 60, maximum 900.
- explicit expiry and revocation fields are present.

Auth module:

- `cloudflare-d1/src/cloud-auth-shadow-v1.mjs`
- commit `d10806654c1750d18c806fe4442760aa59791810`
- gate: `TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED`
- default state: OFF.

Cloud-first session integration:

- commit `aa63791c4e6d3dcde6fd952d86c40b6a1a1dba9b`
- on shadow hit: D1 validates the already-established bounded session projection and Apps Script is not called.
- on shadow miss: authoritative Apps Script POST verification remains the fallback.
- after a successful Apps Script POST verification, the shadow may be populated with fingerprint + bounded user claims.
- shadow lookup/write failure never grants authentication and does not invalidate an otherwise successful authoritative verification.

Tests / workflow:

- unit tests commit: `bc741accdc9addac0c044a83e380db9600478838`
- session-shadow integration test commit: `88a239207626a932f1ffb7ab00509808d57cd395`
- workflow integration commit: `bee8b8d836e68cc9d7cd4cb4204c5a744ba3d5c9`
- run `34753251908` => `SUCCESS`
- local SQLite migration validation commit: `67230c1f9163e00aa7922da3f3113180c408c7cb`
- run `34753283469` => `SUCCESS`

Qualified contract:

- shadow hit => zero Apps Script fetches;
- shadow miss => Apps Script POST fallback;
- raw employee token is absent from D1 write arguments;
- local SQLite candidate migration applies cleanly;
- candidate table starts empty;
- `PRODUCTION_D1_MIGRATION=NO`;
- `PRODUCTION_DEPLOY=NO`;
- production auth-shadow flag remains OFF/not deployed.

## T3 — Cloud-native Orders read readiness — PASS

Readiness qualification connects the new D1 auth shadow contract to the existing signed Orders Edge token and D1 Orders read canary.

Artifacts:

- test: `cloudflare-d1/test/cloud-orders-read-v3-readiness.test.mjs`
- test commit: `27a41c6b11d1ad43dbbeb481a3608541ea01255b`
- workflow: `.github/workflows/cloud-migration-v3-t3-orders-readiness.yml`
- workflow commit: `651bcfaaee1d73e5f90d3138d88f4cf984332473`

Qualification:

- run `34753308941` => `SUCCESS`
- normal flow under the contract:
  - D1 auth-shadow hit;
  - Orders Edge token issued;
  - D1 Orders page read;
  - Apps Script network calls = `0`;
  - response `dataSource = d1-edge-orders`;
  - no D1/business mutation in the read handler.
- `statusFilter=__DEBT__` intentionally remains `fallback=apps-script` because debt remains authoritative in the Apps Script/Sheets lane.

T3 is readiness only. Production Edge Orders Read remains disabled. No Worker deployment or D1 migration has been performed.

## T4 — Cloud-native Operator Task V3 read projection — IN PROGRESS

The older Tasks V3 isolation branch was reviewed as behavior/reference material only. It will not be bulk-merged because it diverges substantially and contains unrelated frontend/static changes.

T4 direction:

- Cloudflare + D1 for Task read/status projections;
- existing Edge session/auth primitives for operator identity;
- no Task route added to the main Apps Script router;
- no request-time main Apps Script dependency for ordinary Task status/read;
- no `claimNext` / `completeTask` routes in this phase;
- no Task D1 write authority;
- Sheets remains authoritative for business state;
- future mutation bridge, if approved later, must be isolated and compare-and-set against authoritative source state.

Candidate T4 gate: `TRENDOS_OPERATOR_TASK_V3_READ_ENABLED`, default OFF.

## Roadmap from this checkpoint

1. Finish T4 repository-only Task V3 read projection and contract tests.
2. Qualify zero-Apps-Script ordinary Task status reads using signed Edge identity.
3. Stop before the first Production D1 migration / Worker deploy decision.
4. If separately approved later: deploy code first under default-OFF gates, then stage auth-shadow/read-only canaries before any mutation authority.
5. Production Task mutation remains a later explicit owner decision after read-only canary acceptance.
6. Accounting, stock, Gaber Material Control and financial authority remain later-stage cutovers.
