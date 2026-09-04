# ACCT-CF-02 — Accounting Domain/API Contract Plan

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-01C PASS` in `docs/trendos/checkpoints/ACCOUNTING_CF_RUNTIME_PASS_2026-09-05.md`.

## Action before implementation
Define the next Accounting increment as a **non-mutating contract/validation layer** on the isolated Cloudflare Preview Worker.

## Scope
Add canonical V1 contracts for:
- SalesInvoice
- SalesInvoiceLine
- Payment
- Purchase
- PurchaseLine
- Expense
- Item
- BOM
- BOMLine
- StockMovement
- CashTransaction

The contract must preserve stable identifiers and future replay-safe writes. It must require an `idempotencyKey` for validation envelopes intended to represent a future write command, but the current Preview route performs validation only and must not persist anything.

## Required invariants
- Order ID remains the order integration key.
- Line ID is mandatory for order-line economics and must be consistent with its Order ID when both are present.
- Never use customer/supplier/item names as primary integration keys.
- Monetary values must be finite and non-negative unless a specific transaction direction/type defines otherwise.
- Quantity for material movement/line quantities must be positive.
- Item types remain generic: Raw Material, Semi-finished, Finished Product, Service.
- No partner/investor percentage fields are accepted as Accounting contract fields.
- Every future write command must be replay-safe/idempotent.
- Validation must never access D1, Apps Script, Google Sheets, or any external service.

## Preview endpoints
- `GET /v1/accounting/contract` — return contract metadata/fields/enums/invariants.
- `POST /v1/accounting/validate` — validate one command envelope only and return normalized validation result; no persistence.

All other Accounting POST routes remain blocked.

## Tests/gates
- Add dedicated local/CI contract tests.
- Add the test to the existing Cloudflare Preview pre-deploy safety gate.
- Extend the independent Accounting runtime verification workflow to verify the live contract endpoint, one valid validation request, one invalid Line/Order request, and zero-write/sandbox authority markers.

## Production impact
NONE. GitHub/isolated Preview only. No D1 migration or authoritative financial write is authorized by this plan.

## Rollback
Revert only ACCT-CF-02 source/test/workflow commits. ACCT-CF-01C remains a valid fallback Preview.

## Exact next step
Implement the contract module and wire it into the Accounting Preview handler, then add tests before observing any deployment result.
