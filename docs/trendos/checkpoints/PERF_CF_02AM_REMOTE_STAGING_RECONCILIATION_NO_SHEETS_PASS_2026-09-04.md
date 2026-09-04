# PERF-CF-02AM — Remote Staging Reconciliation NO-SHEETS PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`

## Scope
Qualified a remote reconciliation runtime on the dedicated staging Worker only. The runtime verifies Cloud Write outbox payloads and state transitions without calling Apps Script and without writing Google Sheets.

## Staging boundary
- D1 database: `trendos-staging`
- D1 database ID: `bfe05bde-a3a1-49bc-ad3d-3f0b94a8f8a6`
- Worker: `trendos-d1-staging`
- Worker URL: `https://trendos-d1-staging.trendmall-contact.workers.dev`
- Qualified Worker version: `e7376288-a171-4cf1-a58e-0c13c481e131`
- Staging entrypoint: `cloudflare-d1/staging/index.js`
- Staging verification flag: `TRENDOS_STAGING_RECONCILE_VERIFY_ENABLED=true`

Production continues to use `cloudflare-d1/src/index_v2.js` and therefore does not route the staging reconciliation path.

## Runtime contract
Staging reconciliation route:
- GET `/v1/staging/cloud-write/reconcile/health`
- POST `/v1/staging/cloud-write/reconcile/next`

The verifier:
- accepts order entities only;
- accepts `upsert_order_to_sheets` only;
- refuses non-test order IDs that do not begin `CW-STAGE-`;
- verifies payload order ID matches the outbox entity ID;
- requires `_cloudWriteV1=true`;
- computes SHA-256 over the payload;
- never calls Apps Script;
- never writes Google Sheets.

Successful completion state is deliberately NOT `synced`:
- outbox status = `staging_verified`
- event status = `staging_verified`
- `sheets_status = not_written_staging`
- `sheetsWritten = false`
- note contains `NO_SHEETS_WRITE`.

## Remote qualification
GitHub Actions run: `33906359032`
Job: `provision-and-qualify-staging` / `101132101850`
Result: PASS.

Qualification target:
- order ID: `CW-STAGE-33906359032`
- first Cloud Write POST: HTTP 201
- repeated identical POST: HTTP 200 / `idempotent=true`
- pending outbox API: HTTP 200
- direct D1 pre-reconciliation counts: order=1, event=1, outbox=1

The reconciliation runtime processed pending staging rows FIFO and completed three historical/test rows as `staging_verified`:
1. `CW-STAGE-33905430077`
2. `CW-STAGE-33905714964`
3. `CW-STAGE-33906359032`

Target direct D1 state after reconciliation:
- outbox_status = `staging_verified`
- attempts = 1
- event_status = `staging_verified`
- sheets_status = `not_written_staging`
- note = `STAGING_VERIFY_ONLY sha256=3975428874eea39aad835dcff9f7484d935825e4a3b3febe77a8dba460bb5755; NO_SHEETS_WRITE`

## Production isolation proof
During the same run:
- Production `/v1/cloud/write/health` remained `enabled=false`, `writesAccepted=false`, `cutover=false`, `sheetsAuthoritative=true`.
- Production `/v1/staging/cloud-write/reconcile/health` returned HTTP 404.

Marker: `PRODUCTION_CLOUD_WRITE_STILL_OFF_AND_STAGING_ROUTE_ABSENT_PASS`.

## Decision
PASS for remote staging reconciliation mechanics and route isolation.

This checkpoint does NOT authorize:
- Production Cloud Write;
- any production D1 migration;
- any Google Sheets write from Cloudflare;
- marking a row as real `synced` without a real isolated Sheets transport qualification.

## Next engineering boundary
Design and qualify a Sheets reconciliation contract in dry-run/read-only mode first. The next contract must validate mapping, schema, order ID, and payload fingerprint without mutating any Sheet.
