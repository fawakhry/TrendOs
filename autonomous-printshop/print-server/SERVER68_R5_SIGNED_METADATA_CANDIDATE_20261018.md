# SERVER-68K — Signed R5 mirror metadata read compatibility candidate
**Date:** 2026-10-18 · **Authority:** User asked to continue *GitHub preparation only*. NO Cloudflare Stage/Production deploy, NO GitHub merge, NO D1 live query, NO Apps Script changes, NO Ubuntu real-order read.
**Review:** [Draft PR #190](https://github.com/fawakhry/TrendOs/pull/190), stacked above #187 (SERVER-67) and #185 (SERVER-66).

## What existed / avoided duplication
- SERVER-30/66 already add Source-only **fail-closed 403** to legacy customer/order/inbox and mirror GETs.
- SERVER-67 already provides signed HMAC principal `trendos_mirror_metadata`, endpoint `GET /v1/service/mirror/sheets`, 30-second timestamp validity, nonce consumed atomically by Durable Object; metadata and row access are separate principals.
- SERVER-68 already has a local Workerd + fake D1 + Durable Object canary and 100-row parity adapter for Apps Script.
- **Remaining R5 blocker:** `.github/workflows/trendos-r5-periodic-controlled.yml` forcibly checks out exact commit `b7e85647ac205b93f22e9f9ea1da58b21d54e4c0`, deploys to `trendos-d1-api`, and checks `GET /v1/mirror/sheets` **HTTP 200**, including a potentially destructive deploy/redeploy rollback path. Do not edit/trigger this workflow in this phase.

## New source-only additions
1. `cloudflare-d1/r5-server68-signed-metadata-preflight.mjs`: `makeR5SignedMetadataRequest()` constructs `GET /v1/service/mirror/sheets` with the exact SERVER-67 HMAC-SHA256 canonical signing payload, principal `trendos_mirror_metadata`, cryptographically random nonce (24 bytes), signed timestamp and no Origin header. URL must be **HTTPS**, host must exactly equal separately specified `expectedHostname`, and URL must have no user credentials, port, query, fragment or non-root base path. Secret length validated 32–256. Credentials do not appear in returned probe verdict; no legacy fallback.
2. `qualifyR5SignedMirrorMetadata()` **requires explicit injected `fetchImpl`** to prevent accidental internet calls from import/offline tests. It requires HTTP 200 and `success:true` with a metadata-only `sheets` array; no redirect/HTTP downgrade, no secret or customer fields included in returned verdict. It is **not wired into** R5 workflow, not a credential provisioning mechanism or live CLI.
3. `tests/server68_r5_signed_metadata_preflight.test.mjs`: fake D1 + local fake Durable Object storage; confirms signed read success, nonce replay rejection, no D1 on wrong secret/disabled flag, host/URL/credential validation, no implicit network, redirect and response contract failures, legacy GET continues 403. No live HTTP, no secrets, no production IDs.
4. Existing `.github/workflows/server68-isolated-stage-preflight.yml` now includes this candidate and test in source-only CI. It still invokes Wrangler with `--dry-run` and runs synthetic localhost Workerd/D1/DO, **never deploys**.

## Actual verification
[GitHub Actions 39071054165](https://github.com/fawakhry/TrendOs/actions/runs/39071054165): **SUCCESS, 172/172 Node tests PASS (0 fail)**, Wrangler isolated dry-run PASS; local runtime logs `SERVER68_LOCAL_REAL_WORKER=PASS; SQLITE_D1_SYNTHETIC=PASS; DO_NONCE_REPLAY=PASS; AUTH_DENY=PASS; NO_REMOTE_DEPLOY=TRUE`.
Previous run: 147/147; increase by 25 source-only R5 candidate tests.

## Release gates still BLOCKED
- This proof does **NOT** fix the deployed R5 workflow: exact pinned SHA + old GET=200 check unchanged. To remove the blocker, design a **separately reviewed** candidate operator workflow that checks the new signed metadata route, requires an operator-confirmed destination, explicit rollback strategy, and secure runtime secret storage; no new production deployment until owner authorizes.
- Actual Cloudflare worker `trendos-d1-staging` existing version `99e823b2` remains unchanged. Owner-provided bundle indicated unguarded legacy reads; Access application was absent, URL enabled, source-version equivalence unproven. Never reuse its preexisting 11-table staging DB as disposable.
- Remote synthetic Worker + isolated D1/DO and signed customer-less canary NOT deployed. No client rollouts or Apps Script triggers changed. Ubuntu remains disconnected, laser/printers OFF.
- `SEC-AP303-02=OPEN_HIGH`; `R5_AUTHENTICATED_COMPATIBILITY=SOURCE_TESTED_ONLY`; `PRODUCTION_CHANGE=NO`; `DRAFT_PR190=OPEN`.
