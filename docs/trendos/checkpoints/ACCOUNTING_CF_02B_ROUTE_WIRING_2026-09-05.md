# ACCT-CF-02B — Accounting Contract Route Wiring

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-02A`

## Action
Wired the canonical validation contract into the native TrendOS Accounting Preview module.

Updated:
`cloudflare-d1/src/accounting-native-module.mjs`

Commit:
`b83fd63e094e97dad245a60737cba0f67cce9601`

## New Preview-only API routes

### `GET /v1/accounting/contract`
Returns Accounting entity metadata, fields, enums, envelope rules and invariants.

### `POST /v1/accounting/validate`
Validates one future-write command envelope and returns normalized output/errors only.

No command is executed and no financial fact is persisted.

## Method safety
- `/v1/accounting/contract` rejects non-GET methods with 405.
- `/v1/accounting/validate` accepts POST only; GET and other methods are rejected with 405.
- invalid JSON is rejected with HTTP 400.
- contract validation failures use HTTP 422.
- every response keeps `authoritativeWrites=false`; validation also declares `persistence=none`.

## Architecture note
The routes are owned by `accounting-native-module.mjs`, which is dispatched before the temporary `/accounting` engineering alias. This keeps the new canonical contract under the native TrendOS Accounting surface while leaving the V0.1 UI alias unchanged.

## Production impact
NONE.
- no D1 query/write in the new contract path;
- no Apps Script call;
- no Sheet access;
- no production route/cutover;
- no write authority change.

## Exact next step
Add dedicated contract tests covering valid commands, missing idempotency keys, Line/Order mismatch, forbidden profit-sharing percentage fields, money/quantity constraints, enum constraints, method safety and zero-persistence markers. Then record test-wiring checkpoint.

**Status: PASS — route wiring implemented; tests pending.**
