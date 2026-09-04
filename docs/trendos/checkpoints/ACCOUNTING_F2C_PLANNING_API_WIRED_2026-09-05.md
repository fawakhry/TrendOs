# Accounting F2-C — Planning API Wired

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Action
Added Preview-only Finance API and wired it into the native Accounting module.

Source:
- `cloudflare-d1/src/accounting-finance-api-v1.mjs`
- `cloudflare-d1/src/accounting-native-module.mjs`

Commits:
- API source: `208743cb9c1c4072c4a64eb63f31204a68d803b5`
- native wiring: `8795980fbba29b3e3b08e61109985085c1186395`

Native Accounting version advanced to:
`TRENDOS_ACCOUNTING_NATIVE_V0_6_20260905`

## New routes
### `GET /v1/accounting/finance`
Returns F2 metadata, Chart/plan rules and Treasury identity requirements.

### `POST /v1/accounting/finance/plan`
Returns a balanced financial posting plan only.

Response contract always retains:
- `planningOnly=true`
- `persisted=false`
- `authoritativeWrites=false`
- `persistence=none`

Invalid plans return 422; invalid JSON returns 400; non-allowed methods return 405.

## Integration contract update
Native integration metadata now exposes:
- stable Treasury ID / Cashbox ID identity;
- F2 Finance endpoints;
- invariant that cash/treasury legs use stable Treasury IDs rather than account names alone.

## Production impact
NONE.
No persistence adapter was introduced. The Finance API cannot write D1, Apps Script or Google Sheets.

## Exact next step
Add API-level/Native-route tests, update CI path coverage and Preview runtime verification, then observe exact deployed V0.6 before declaring F2 planning surface PASS.

**Status: WIRED — verification pending.**
