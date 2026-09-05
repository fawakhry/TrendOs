# ACCT-CF-02O — Isolated Accounting Preview D1 Discovery Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02N`

## Pre-action record
The live schema-preflight endpoint is proven fail-closed because `TRENDOS_ACCOUNTING_PREVIEW_DB` is not injected into the isolated Preview runtime.

The next material step is configuration discovery only: inspect repository Cloudflare/Wrangler/workflow configuration for an already-existing isolated/non-production D1 database that is safe to bind explicitly to Accounting Preview.

## Hard boundary
- Do not use generic `env.DB` as an Accounting persistence binding.
- Do not bind a known Production D1 database.
- Do not create a database or mutate Cloudflare account configuration during discovery.
- Do not apply migrations/schema changes.
- Do not enable Preview or Production financial writes.
- Google Sheets / Apps Script remains authoritative.

If an existing isolated database is identified with sufficient evidence, the next step may prepare a dedicated Preview binding configuration. If none exists and creation/configuration requires unavailable Cloudflare account permissions, document the exact permission boundary before treating it as a user blocker.

Status: STARTED
