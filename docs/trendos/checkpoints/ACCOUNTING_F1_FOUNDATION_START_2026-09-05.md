# TrendOS Accounting F1 Foundation — Start Checkpoint

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## F1-START — PASS

This checkpoint starts the first implementation foundation after adopting EasyStore as the historical working baseline of primitive TrendOS Accounting.

## Scope of this increment

Build the non-destructive foundation required before any new authoritative financial write path:

1. Stable financial identities and canonical entity contracts.
2. Party model and Party Ledger transaction contract.
3. Shared TrendOS Accounting RBAC permissions contract.
4. Idempotent financial command envelope and duplicate/replay rules.
5. Immutable audit-event contract.
6. Item / Department / Profit Center identity validation.
7. Read-only Operations adapter for `Order ID + Line ID` facts from the existing TrendOS mirror.
8. Preview/API endpoints for contract inspection and validation only.

## Safety constraints

- No D1 migration.
- No new D1 financial write.
- No Apps Script production edit or deployment.
- No Google Sheets business-data mutation.
- No Production traffic cutover.
- Existing Sheets + Apps Script remain authoritative for financial writes.
- Orders/Lines read adapter must fail closed if mirror metadata is not ready/fresh enough.
- Shared session/RBAC contract replaces employee-name authorization; no name regex is accepted as an accounting permission source.

## Evidence already available

- EasyStore contains request-ID duplicate protection, party ledger, cashbox, purchases, collections, custody, day close, audit and health behavior.
- Current TrendOS Edge already has signed employee session mechanisms and a protected Orders/Lines D1 mirror read lane.
- Current Accounting Preview remains isolated and non-authoritative.

## Exact next step

Implement pure modules for Accounting foundation contracts and tests first. Then expose read-only foundation endpoints through the native Accounting module. Only after CI PASS will the read-only Orders/Lines adapter be wired to the Preview runtime.

**Production impact: NONE.**
