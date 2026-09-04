# PERF-CF-02AL — Dedicated Staging D1 Cloud Write PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`

## Dedicated staging resources
- D1 database: `trendos-staging`
- D1 database ID: `bfe05bde-a3a1-49bc-ad3d-3f0b94a8f8a6`
- Region observed at creation/query: WNAM
- Worker: `trendos-d1-staging`
- Worker URL: `https://trendos-d1-staging.trendmall-contact.workers.dev`
- Qualified Worker version: `859b13eb-70f5-4839-8b93-9d3c03041042`

## Migrations
Staging only:
- `0001_init.sql` PASS
- `0002_full_sheet_mirror.sql` PASS
- `0003_cloud_write_lane.sql` PASS

No production D1 migration was applied.

## Remote staging qualification
Cloud Write health returned:
- database = true
- enabled = true
- authConfigured = true
- writesAccepted = true
- schemaReady = true
- cutover = false
- sheetsAuthoritative = true

Qualification order:
- ID: `CW-STAGE-33905714964`
- first authenticated POST: HTTP 201, `idempotent=false`, `dataSource=d1-cloud-write-v1`, `sheetsSync=pending`
- repeated identical POST: HTTP 200, `idempotent=true`
- authenticated pending outbox GET: HTTP 200

Direct remote D1 proof for the qualification order:
- orders = 1
- cloud_write_events = 1
- cloud_write_outbox = 1

This proves no duplicate business/event/outbox row was created by the repeated request.

## Production safety recheck
Production endpoint `https://trendos-d1-api.trendmall-contact.workers.dev/v1/cloud/write/health` remained:
- enabled = false
- writesAccepted = false
- cutover = false
- sheetsAuthoritative = true

Marker: `PRODUCTION_CLOUD_WRITE_STILL_OFF_PASS`.

## Important interpretation
Remote D1 Cloud Write is qualified on the dedicated staging environment only.
The outbox remains pending because no real Sheets reconciliation transport has been authorized or enabled.

This checkpoint does NOT authorize Production Cloud Write.
