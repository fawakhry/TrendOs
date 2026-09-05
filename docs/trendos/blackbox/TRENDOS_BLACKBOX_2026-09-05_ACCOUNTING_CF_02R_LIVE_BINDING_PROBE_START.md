# ACCT-CF-02R — Live Accounting Preview Binding Probe Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Resume point
ACCT-CF-02Q deployed Preview binding `TRENDOS_ACCOUNTING_PREVIEW_DB` -> isolated D1 `trendos-accounting-preview` (`bf53471a-913a-44e1-a9f4-d647237592e1`). Accounting schema remains unapplied and authoritative writes remain disabled.

## Material action started
Add a mutation-free runtime probe that reports whether the dedicated accounting D1 binding is injected into the deployed Preview Worker. The probe must not execute SQL, apply schema, call `prepare`, `batch`, or mutate data.

## Safety invariants
- Preview only.
- GET/diagnostic only.
- No SQL.
- No D1 mutation.
- No schema application.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=false` remains unchanged.
- Production and Google Sheets / Apps Script authority unchanged.

Status: STARTED
