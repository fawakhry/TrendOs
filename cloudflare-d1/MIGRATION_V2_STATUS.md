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

## Safety rules

1. The full mirror is copy-only. It does not delete or modify source Google Sheets data.
2. D1 secrets remain in Script Properties / Cloudflare secrets and are never committed to GitHub.
3. Google Sheets remains the write source during the first mirror pass.
4. After the full mirror completes, perform a second catch-up pass before each subsystem cutover.
5. Cut over reads first, then writes, then leave Sheets as fallback, then retire Sheets only after parity checks.

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

`wrangler.toml` now points to `src/index_v2.js`, which delegates all existing API routes to the previous `src/index.js` and intercepts only the new mirror routes.
