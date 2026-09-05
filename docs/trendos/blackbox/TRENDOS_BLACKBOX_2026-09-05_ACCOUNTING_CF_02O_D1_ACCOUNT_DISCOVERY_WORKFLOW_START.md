# ACCT-CF-02O — Cloudflare D1 Account Discovery Workflow Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action record
Repository inspection confirms the isolated Preview Worker currently binds only generic `DB` to `trendos-main`, documented as the existing shared read mirror. That binding is explicitly ineligible for Accounting persistence/schema preflight.

The existing Preview deployment workflow already uses configured Cloudflare account/API credentials. The next material action is therefore a read-only GitHub Actions discovery workflow that executes `wrangler d1 list` using those existing credentials to inventory D1 database metadata and determine whether an already-existing isolated Accounting/Preview database can be reused.

## Hard safety boundary
- Discovery/list commands only.
- No `d1 create`, delete, execute, migration, schema mutation, binding edit, or write.
- Do not alter `cloudflare-d1/preview/wrangler.toml` in this step.
- `trendos-main` / generic `DB` remains forbidden as Accounting persistence storage.
- No financial write/cutover.

If no suitable isolated database exists, the result will establish whether the next step is safe isolated resource creation using existing Cloudflare permissions or a genuine permission blocker.

Status: STARTED
