# ACCT-CF-02E — Accounting V1 Runtime Verification Wiring

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-02D`

## Action
Extended the independent Accounting Preview runtime workflow:

`.github/workflows/trendos-accounting-preview-runtime.yml`

Commit:
`00b3ae2c73d5310f05a68b665d9cc65b463582a2`

## Runtime checks now required
- Accounting health authority remains read-only and Cloud Write OFF.
- Native TrendOS Accounting integration identifies EasyStore as the historical working baseline.
- `GET /v1/accounting/contract` exposes V1 validation metadata and idempotency requirements.
- Valid SalesInvoiceLine command envelope validates with HTTP 200 and `persistence=none`.
- Line/Order mismatch returns HTTP 422 with `line-order-mismatch`.
- Investor/profit-sharing percentage fields return HTTP 422 with `profit-sharing-field-forbidden`.
- Native UI shell is verified against the current EasyStore-baseline banner rather than the superseded pre-EasyStore wording.
- Temporary `/accounting` engineering alias remains available.
- Authoritative POST attempts to health/integration/contract remain blocked.

## Important fix
The previous Accounting runtime workflow failed only because its UI assertion still expected the old phrase `الحسابات جزء من TrendOS`, while the source had already moved to the EasyStore-baseline banner. The runtime assertion is now aligned to the current canonical UI contract (`TrendOS Native Module` + `EasyStore` + `Order ID / Line ID`) without weakening financial safety checks.

## Production impact
NONE. Runtime verification only; no production route/cutover, D1 migration, Apps Script deployment, Sheet mutation or financial persistence.

## Exact next step
Observe the newly triggered Accounting Native CI, Cloudflare Auto Preview, and Accounting Preview Runtime runs. Classify deployment separately from the known unrelated Orders/Lines freshness gate. If contract CI/runtime passes, close ACCT-CF-02 and proceed to the first authenticated read-only TrendOS Order/Line accounting slice.

**Status: PASS — runtime verification wired; Actions observation pending.**
