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
- `Run T1 session bridge contract tests`: SUCCESS
- `Assert production isolation`: SUCCESS
- Expected contract output includes:
  - `CLOUD_SESSION_BRIDGE_V3_T1=PASS`
  - `APPS_SCRIPT_VERIFY_METHOD=POST`
  - `EMPLOYEE_TOKEN_IN_URL=NO`
  - `PRODUCTION_MUTATION=NO`

T1 is code/contract qualified only. It is NOT deployed to Production.

## Roadmap from this checkpoint

### T2 — Cloud-native Auth Shadow

Create an isolated D1 auth/session shadow contract so Cloudflare can validate an already-established employee session without calling Apps Script on every request. Raw employee tokens must never be stored. Candidate design must use a non-reversible verifier/fingerprint, bounded TTL/revocation semantics, explicit schema versioning, and fail-closed behavior.

T2 development/migrations remain repository-only until a separate production migration decision.

### T3 — Orders read qualification

After T2 parity/freshness qualification, qualify D1 Orders reads without request-time Apps Script auth verification. Only then consider re-enabling the Production Edge Orders read flag under a separate production decision.

### T4 — Operator Task V3

Build Task V3 on cloud-native read/auth primitives; do not restore the old Apps-Script-heavy V2 proxy architecture.

### Later phases

Move remaining read-heavy customer/conversation surfaces, then introduce cloud write/outbox authority under explicit gates. Accounting, stock, material control and financial authority remain last-stage cutovers.
