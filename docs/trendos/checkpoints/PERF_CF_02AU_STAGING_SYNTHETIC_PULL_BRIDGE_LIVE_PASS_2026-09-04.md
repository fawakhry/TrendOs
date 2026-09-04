# PERF-CF-02AU — Staging Synthetic Pull Bridge LIVE PASS — 2026-09-04

## Result
PASS. The safe bridge needed for a real Staging D1 -> Apps Script authenticated dry-run is now live on the dedicated staging Worker, while the equivalent route remains absent from Production.

## Apps Script live prerequisite already proven
The operator ran `runTrendOSCloudWriteDryRunSelfTest()` in the live Apps Script project after Version 152 and the internal dry-run secret gate were installed.

Observed safe result:
- `success=true`
- `dryRun=true`
- `readOnly=true`
- `sheetsWritten=false`
- `mutationCount=0`
- `targetSheet=الأوردرات`
- `requiredColumnsPresent=true`
- `existingMatches=0`
- `decision=would_insert`
- `eligibleForFutureWrite=true`
- `planCount=8`
- schema fingerprint present
- payload SHA-256 present

This proved the live Orders sheet schema is compatible with the dry-run mapping and no Sheet mutation occurred.

## Staging-only synthetic sample bridge
Added GET-only route:

`/v1/staging/cloud-write/reconcile/sample`

Implementation:
- `cloudflare-d1/src/cloud-write-staging-reconcile.mjs`
- reachable only through `cloudflare-d1/staging/index.js`
- Production continues to use `cloudflare-d1/src/index_v2.js` directly.

Safety constraints:
- `CW-STAGE-*` IDs only
- `entityType=order`
- `operation=upsert_order_to_sheets`
- payload `orderId` must equal entity ID
- `_cloudWriteV1=true`
- exact synthetic identity only:
  - customer name: `Staging Cloud Write Qualification`
  - phone: `01001112233`
- GET/read-only
- `Cache-Control: no-store`
- no D1 mutation
- no Apps Script call
- no secret exposure
- no raw actor/error fields returned by the sample response.

## CI qualification
`staging-synthetic-sample-readonly-gate` PASS.

Verified:
- staging-entrypoint only
- synthetic-only
- read-only
- Production entrypoint does not import the staging reconciliation module.

## Dedicated staging deployment
Trigger commit:
`72f0d3f80a5ee225981a79b6d805e93a77c19888`

Remote qualification run/job:
- run `33912472435`
- job `101151822569`

Dedicated D1:
- name: `trendos-staging`
- id: `bfe05bde-a3a1-49bc-ad3d-3f0b94a8f8a6`

Staging Worker deployment:
- worker: `trendos-d1-staging`
- URL: `https://trendos-d1-staging.trendmall-contact.workers.dev`
- Worker Version ID: `3efa46c7-4ba4-4144-acbf-e1dbaf3497b6`

Remote staging qualification PASS:
- Cloud Write health PASS
- first staging write HTTP 201
- idempotent repeat HTTP 200
- exactly one order/event/outbox row in dedicated staging D1
- remote reconciliation completed `staging_verified`
- `sheets_status=not_written_staging`
- note includes `NO_SHEETS_WRITE`
- direct D1 verification reported `rows_written=0` for the verification query.

## Live sample probe
Live probe run/job:
- run `33912630584`
- job `101152358780`

Observed:
- Staging sample HTTP 200
- entity ID: `CW-STAGE-33912472435`
- `outboxStatus=staging_verified`
- `sheetsStatus=not_written_staging`
- synthetic payload identity verified.

Production isolation probe:
- same `/v1/staging/cloud-write/reconcile/sample` path on Production returned HTTP 404.

## Production safety recheck
Production Cloud Write health remained:
- `enabled=false`
- `writesAccepted=false`
- `cutover=false`
- `sheetsAuthoritative=true`

Staging reconciliation health path on Production also returned 404.

Therefore this subphase did not enable Production Cloud Write and did not authorize any Google Sheets write.

## Apps Script staging pull candidate
Prepared:
- `apps-script/patches/CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs`
- top-level manual function: `runTrendOSCloudWriteStagingPullDryRun()`

Its CI gate `apps-script-staging-pull-dryrun-gate` PASS.

Contract:
- exactly one GET to the fixed dedicated staging sample URL
- validates staging-only + synthetic-only response
- reads `TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET` internally
- passes the secret only to the local `trendosCloudWriteReconcileDryRunV1_` function
- never logs/returns/transfers the secret
- no Sheet mutation
- no Script Property mutation
- no Drive write
- no production Worker call.

## Next exact action
Install the prepared Apps Script staging-pull helper as a separate script file and run `runTrendOSCloudWriteStagingPullDryRun()` once.

No Web App deployment is required for that manual function.

Pass criteria:
- `STAGING_PULL_DRYRUN_PASS=...`
- `success=true`
- `stagingOnly=true`
- `syntheticOnly=true`
- source entity begins `CW-STAGE-`
- `dryRun=true`
- `readOnly=true`
- `sheetsWritten=false`
- `mutationCount=0`
- `requiredColumnsPresent=true`.

Do not enable Production Cloud Write after this checkpoint.
