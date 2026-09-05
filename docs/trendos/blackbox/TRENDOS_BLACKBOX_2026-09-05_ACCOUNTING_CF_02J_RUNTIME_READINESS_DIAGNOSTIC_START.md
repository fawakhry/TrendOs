# ACCT-CF-02J — Runtime Persistence Readiness Diagnostic Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02I`

## Pre-action record
The next material increment is to expose the already-tested Accounting persistence readiness state in the existing `/v1/accounting/health` Preview response.

This is diagnostics only. The route will evaluate configuration and report `ZERO_WRITE` or readiness state, but it must not invoke the persistence commit path, call D1 `prepare`/`batch`, mutate schema/data, or alter financial authority.

## Required invariants
- `authoritativeWrites: false` remains unchanged.
- `d1FinancialWrites: false` remains unchanged.
- Production/prod stays fail-closed.
- Default missing configuration remains `ZERO_WRITE`.
- Readiness may be visible in Preview/Test only when every explicit prerequisite is present.
- Google Sheets / Apps Script remains untouched and authoritative until a later explicit cutover decision.

## Material action after this record
Import `accountingPersistenceReadinessFromEnv` into `accounting-preview.mjs` and include a sanitized readiness diagnostic object in the health response only.

Status: STARTED
