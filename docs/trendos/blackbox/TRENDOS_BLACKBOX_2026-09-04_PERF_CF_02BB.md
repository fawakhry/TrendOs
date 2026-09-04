# TrendOS Blackbox — PERF-CF-02BB — 2026-09-04

## Event
Canonical Apps Script Order write contract audited after Production Cloud Write read-only preflight.

## Finding
The canonical operational create path `createManualOrder_(e)` is a multi-entity/business-side-effect transaction, not a partial Orders-row append.

It owns/coordinates authorization, ScriptLock, V1908 idempotency, customer/external identity, debt policy, department normalization, fly-print priority, duplicate/open-order rules, numeric Order ID allocation, Line ID allocation, multi-department split, Orders summary, Lines, Activity Log, Trend Master queue, data-version bump and response persistence.

## Block
Current Cloud Write V1 is not eligible for production cutover. Its D1-first `orderId` + partial order payload cannot faithfully reproduce the canonical Apps Script create contract and conflicts with the current Apps Script-owned numeric business Order ID allocator.

`TRENDOS_CLOUD_WRITE_V1_ENABLED` must remain false on production.

## Next
Prepare a pure CI-only Cloud Write Order Contract V2 that outputs a canonical create intent/parameter plan, performs no mutations, is not imported by production, and leaves business Order ID allocation to Apps Script until a separately qualified staging adapter exists.

## Authority pointer
`docs/trendos/checkpoints/PERF_CF_02BB_CANONICAL_ORDER_WRITE_CONTRACT_AUDIT_V1_BLOCKED_2026-09-04.md`
