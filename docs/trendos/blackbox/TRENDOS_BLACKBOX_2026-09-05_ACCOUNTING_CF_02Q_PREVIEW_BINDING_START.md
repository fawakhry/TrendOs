# ACCT-CF-02Q — Dedicated Accounting Preview Binding Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent: `ACCT-CF-02P COMPLETE`

## Verified prerequisites
- Dedicated D1 exists and is idempotently verified: `trendos-accounting-preview` / `bf53471a-913a-44e1-a9f4-d647237592e1`.
- Existing Preview Wrangler config binds only generic `DB` to `trendos-main` as the existing read mirror.
- Existing Preview entrypoint forwards the `env` object to core and does not need a Production code-path change to expose an additional Preview-only binding.

## Next material action
Add a second D1 binding to `cloudflare-d1/preview/wrangler.toml` only:
- binding: `TRENDOS_ACCOUNTING_PREVIEW_DB`
- database_name: `trendos-accounting-preview`
- database_id: `bf53471a-913a-44e1-a9f4-d647237592e1`

Keep the existing `DB -> trendos-main` mirror binding unchanged.

## Hard safety boundary
- Preview config only.
- No Production Wrangler/config change.
- No schema, migration, SQL, or data write.
- No authoritative write enablement.
- No change to `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`.
- Google Sheets / Apps Script remains authoritative.

Status: STARTED
