# ACCT-CF-02M — Runtime Schema Preflight Diagnostic Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02L`

## Pre-action record
The next material increment is to expose the tested read-only Accounting persistence schema preflight through the Accounting Native Runtime.

Endpoint target:
- `GET /v1/accounting/persistence-schema-preflight`

## Binding boundary
The runtime diagnostic may inspect **only** `env.TRENDOS_ACCOUNTING_PREVIEW_DB` when that binding is explicitly injected.

It must never fall back to the generic `env.DB` binding or discover/select any ambient database. If `TRENDOS_ACCOUNTING_PREVIEW_DB` is absent, the endpoint must fail closed with the preflight result `D1_NOT_INJECTED`.

## Safety invariants
- GET only.
- Metadata reads only (`sqlite_master` / `PRAGMA table_info`).
- No statement `run()`.
- No DB `batch()`.
- No migrations or schema mutation.
- No Production or Preview financial write.
- `authoritativeWrites=false`.
- `mutationPerformed=false`.
- Google Sheets / Apps Script remains authoritative.

Status: STARTED
