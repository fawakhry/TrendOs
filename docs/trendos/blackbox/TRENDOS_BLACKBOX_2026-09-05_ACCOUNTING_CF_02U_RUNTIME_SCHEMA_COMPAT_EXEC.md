# TrendOS Black Box — Accounting ACCT-CF-02U Runtime Schema Compatibility Execution

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-02U Runtime Schema Compatibility Start`
Status: `IN PROGRESS / ZERO-WRITE`

## Verified current state
- `ACCT-CF-02T` is already PASS.
- Isolated Cloudflare D1 database `trendos-accounting-preview` exists and has the audited Operations Accounting schema.
- Preview Worker source config binds that isolated database as `TRENDOS_ACCOUNTING_PREVIEW_DB`.
- Shared `DB -> trendos-main` remains the general TrendOS read mirror and is not authorized as the Accounting writable store.
- `accounting-native-module.mjs` injects only `env.TRENDOS_ACCOUNTING_PREVIEW_DB` into `/v1/accounting/persistence/schema-preflight`.
- The existing schema-preflight runtime workflow still asserts the older safe-fail state `503 / D1_NOT_INJECTED`; that expectation is now stale after ACCT-CF-02T.

## ACCT-CF-02U execution action
Upgrade the **read-only runtime verification** so the live Preview endpoint must recognize the isolated Accounting schema and report it compatible/persistence-ready.

The verification must continue to prove:
- HTTP GET only for schema recognition;
- POST remains blocked;
- `authoritativeWrites=false`;
- `mutationPerformed=false`;
- `cutover=false`;
- Sheets + Apps Script remain authoritative;
- no `ACCOUNTING_D1_WRITE_PREVIEW` enablement;
- no D1 migration command;
- no write or cleanup command;
- no Production routing/configuration change.

## Exact next step
Read the current schema-preflight handler payload contract, then update only the runtime verification assertions to match the new bound-schema state. Run the workflow and record executable PASS/FAIL evidence before advancing to any write-capable Preview step.

## Production impact
NONE.

No financial mutation is authorized by this checkpoint.
