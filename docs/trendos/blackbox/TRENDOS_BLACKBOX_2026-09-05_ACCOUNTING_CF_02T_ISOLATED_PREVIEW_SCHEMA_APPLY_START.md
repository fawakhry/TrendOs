# ACCT-CF-02T — Isolated Accounting Preview Schema Apply — START

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Verified starting point
- ACCT-CF-02S runtime schema-gap baseline workflow is wired and its latest run `33949101538` completed successfully.
- The isolated Preview D1 binding is `TRENDOS_ACCOUNTING_PREVIEW_DB` -> `trendos-accounting-preview`.
- Operations persistence schema is already prepared at `cloudflare-d1/schema-prep/accounting-operations-v1.sql` and matches the D1 persistence adapter tables.
- Production Accounting writes remain disabled; Google Sheets / Apps Script remains authoritative.

## Material step authorized by existing execution path
Apply **only** `accounting-operations-v1.sql` to the isolated `trendos-accounting-preview` D1 database, then immediately run the read-only schema preflight to prove both required tables are present.

## Safety boundary
- Preview D1 only.
- No `trendos-main` mutation.
- No finance journal schema in this step.
- No production binding or production write flag changes.
- No Google Sheets / Apps Script mutation.
- Schema is append-only and uses `CREATE ... IF NOT EXISTS` plus no-update/no-delete triggers.

## Exit criteria
1. Schema apply command succeeds against `trendos-accounting-preview` only.
2. Read-only runtime preflight reports `schemaReady=true` with zero missing required tables.
3. Integrity CI remains green.
4. Result is checkpointed before any next material step.
