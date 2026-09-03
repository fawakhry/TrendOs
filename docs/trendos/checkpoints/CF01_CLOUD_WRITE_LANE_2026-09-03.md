# CF-01 — Cloudflare D1 Cloud Write Lane Checkpoint

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`

## Objective

Start the real TrendOS migration from Google Sheets / Apps Script toward Cloudflare by adding the first protected D1 write lane for order creation.

This checkpoint is intentionally not a production cutover. It installs a default-off Cloudflare write path that can be previewed and activated separately.

## Existing production boundaries preserved

- Apps Script production deployment remains unchanged.
- Google Sheets remains authoritative for production writes.
- GitHub `Code.gs` is still forbidden as a production overwrite source.
- No frontend route was redirected to the new Cloud Write Lane.
- No business-family Integrity flag was activated.
- No Script Property, Sheet data, trigger, or Apps Script deployment was changed by this checkpoint.

## Implemented files

- `cloudflare-d1/migrations/0003_cloud_write_lane.sql`
- `cloudflare-d1/src/cloud-write.mjs`
- `cloudflare-d1/src/index_v2.js`
- `tests/cloudflare_cloud_write_v1.test.mjs`
- `.github/workflows/trendos-cloudflare-edge-preview.yml`
- `cloudflare-d1/MIGRATION_V2_STATUS.md`

## New D1 schema

`cloud_write_events`

Purpose: immutable/idempotent D1 write ledger.

Key columns:
- `idempotency_key`
- `entity_type`
- `entity_id`
- `operation`
- `status`
- `actor`
- `payload_json`
- `result_json`
- `sheets_status`

`cloud_write_outbox`

Purpose: pending reconciliation/sync queue while Sheets remains authoritative.

Key columns:
- `event_key`
- `entity_type`
- `entity_id`
- `operation`
- `status`
- `attempts`
- `next_attempt_at`
- `payload_json`

## New Worker routes

`GET /v1/cloud/write/health`

Returns installation and safety state:
- `enabled`
- `writesAccepted`
- `pendingOutbox`
- `cutover=false`
- `sheetsAuthoritative=true`

`POST /v1/cloud/orders`

Creates a D1 order only when:
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=true`.
- the request has a valid Edge bearer token signed by `EDGE_SESSION_SECRET`.
- the request has `clientRequestId` or `x-idempotency-key`.

Safety behavior:
- repeated request returns the original write event.
- non-idempotent attempt to overwrite an existing D1 order returns HTTP 409.
- every accepted order write creates a pending outbox item for later Sheets reconciliation.

`GET /v1/cloud/write/outbox?status=pending`

Protected read route to inspect D1 writes still awaiting Sheets reconciliation.

## Test coverage

Added `tests/cloudflare_cloud_write_v1.test.mjs`.

Covered cases:
- Cloud write route recognition.
- health reports default-off and no cutover.
- write attempt while disabled returns blocked status.
- enabled lane rejects missing Edge bearer token.
- enabled lane accepts valid Edge bearer token.
- order create writes D1 order + event + outbox.
- duplicate idempotency key returns original event without duplicate outbox.
- existing order conflict returns HTTP 409.
- pending outbox inspection works under auth.

Local isolated result before GitHub upload:

```text
Cloudflare Cloud Write V1 tests: PASS
```

## Current state after checkpoint

Installed in GitHub only. Not deployed to production by this checkpoint.

Next safe execution step:

1. Deploy isolated Cloudflare preview Worker using the existing workflow.
2. Run `/v1/cloud/write/health` and confirm `enabled=false`, `cutover=false`, `sheetsAuthoritative=true`.
3. Apply D1 migration `0003_cloud_write_lane.sql` to preview/staging D1.
4. Turn `TRENDOS_CLOUD_WRITE_V1_ENABLED=true` only in preview.
5. Create one test order through `/v1/cloud/orders` using an Edge session.
6. Verify D1 order, event, and outbox rows.
7. Keep frontend and production Apps Script writes unchanged until reconciliation sync is implemented and verified.
