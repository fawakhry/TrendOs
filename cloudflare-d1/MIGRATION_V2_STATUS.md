# TrendOS D1 Migration V2

## Objective
Move TrendOS operational data from Google Sheets to Cloudflare D1 without interrupting production, while keeping Google Sheets as a temporary fallback until parity is verified.

## Current state

Already normalized in D1:
- customers
- orders
- customer-manager messages
- customer-manager conversations

The production Google spreadsheet currently contains 87 tabs. A pre-migration backup copy was created before V2 work started.

## V2 full mirror

The V2 migration adds a loss-minimizing raw mirror for every Google Sheet tab:

- `sheet_catalog` stores sheet metadata and headers.
- `sheet_rows` stores each source row by original row number.
- raw values, display values, and formulas are preserved separately.
- `sheet_migration_runs` records completed sheet-copy runs.

Worker routes:
- `POST /v1/import/sheet` — authenticated batch import from Apps Script.
- `GET /v1/mirror/stats` — total mirror status.
- `GET /v1/mirror/sheets` — per-sheet status/counts.
- `GET /v1/mirror/sheet?name=...` — paged verification reads.

Apps Script runner:
- `startD1FullMigration()` starts a resumable migration.
- `d1FullMigrationTick()` continues automatically every minute.
- `getD1FullMigrationStatus()` reports progress and D1 mirror totals.
- `stopD1FullMigration()` stops the runner without deleting copied data.

## V3 / Cloud Write Lane checkpoint — 2026-09-03

A first real Cloudflare write lane is now implemented in GitHub on the active working branch. This is not a production cutover.

Purpose:
- start moving order creation toward Cloudflare/D1.
- keep Google Sheets authoritative while proving D1 write safety.
- create an outbox record for later Sheets reconciliation/sync instead of silently bypassing Sheets.

New D1 structures:
- `cloud_write_events` — idempotent write ledger keyed by `idempotency_key`.
- `cloud_write_outbox` — pending reconciliation queue for syncing D1-originated writes back to Sheets while Sheets remains authoritative.

New Worker routes:
- `GET /v1/cloud/write/health` — installed health/status check; reports `enabled`, `writesAccepted`, `pendingOutbox`, `cutover=false`, and `sheetsAuthoritative=true`.
- `POST /v1/cloud/orders` — protected, idempotent D1 order-create lane.
- `GET /v1/cloud/write/outbox?status=pending` — protected pending outbox inspection.

Safety gates:
- the lane is default OFF unless `TRENDOS_CLOUD_WRITE_V1_ENABLED=true` is set in Cloudflare Worker vars/secrets.
- write requests require a valid Edge session bearer token verified with `EDGE_SESSION_SECRET`.
- every create request requires `clientRequestId` or `x-idempotency-key`.
- duplicate requests return the original event instead of creating a second order/outbox row.
- non-idempotent overwrite of an existing D1 order is refused with HTTP 409.
- no Apps Script deployment, Google Sheet mutation, frontend cutover, or production flag activation is performed by this code.

Files added/changed:
- `migrations/0003_cloud_write_lane.sql`
- `src/cloud-write.mjs`
- `src/index_v2.js`
- `tests/cloudflare_cloud_write_v1.test.mjs`
- `.github/workflows/trendos-cloudflare-edge-preview.yml`

Local pre-upload test result:
- `node tests/cloudflare_cloud_write_v1.test.mjs` = PASS in isolated mock-D1 execution.

## Safety rules

1. The full mirror is copy-only. It does not delete or modify source Google Sheets data.
2. D1 secrets remain in Script Properties / Cloudflare secrets and are never committed to GitHub.
3. Google Sheets remains the write source during the first mirror pass.
4. After the full mirror completes, perform a second catch-up pass before each subsystem cutover.
5. Cut over reads first, then writes, then leave Sheets as fallback, then retire Sheets only after parity checks.
6. Cloud Write Lane V1 must remain OFF until preview deployment, D1 schema migration, and controlled order-write shadow test pass.
7. Turning on `TRENDOS_CLOUD_WRITE_V1_ENABLED` is a separate runtime activation step; it is not implied by merging code.

## Planned cutover order

1. Orders + order lines
2. Customers + users/sessions
3. Accounting + inventory
4. Attendance / HR / cleaning / press operations
5. Customer portal / conversations / drafts / files metadata
6. Platform configuration / marketplace / franchise / service routing
7. Audit/activity/automation logs and remaining operational tabs
8. Final reconciliation and Google Sheets read-only fallback period

## Files added

- `migrations/0002_full_sheet_mirror.sql`
- `src/mirror.js`
- `src/index_v2.js`
- `D1_Full_Migration.gs`
- `migrations/0003_cloud_write_lane.sql`
- `src/cloud-write.mjs`
- `tests/cloudflare_cloud_write_v1.test.mjs`

`wrangler.toml` points to `src/index_v2.js`, which delegates existing API routes to the previous `src/index.js`, intercepts only mirror routes, and now exposes a separate default-off Cloud Write Lane without redirecting existing frontend or Apps Script traffic.
