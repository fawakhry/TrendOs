# TrendOS Accounting — Black Box Execution Ledger

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`

This file is an executable continuation of the TrendOS Accounting black box. Every material implementation step must be recorded here BEFORE the corresponding code mutation.

## Execution rule
- Do not restart architecture from zero.
- Keep Accounting isolated from Profit Engine percentages/distributions.
- Do not mutate production Sheets/D1 from this workstream without passing the main Go-Live integrity gates.
- All new domain behavior must preserve stable IDs, idempotency boundaries, auditability, and line-level costing.

---

## ACC-EXEC-001 — STARTED (recorded before code mutation)

### Goal
Create the first isolated, production-safe Accounting domain-core slice as pure JavaScript with no external writes.

### Scope
1. Stable identifier validation/normalization for Order ID, Line ID, Item ID, Invoice ID, Purchase ID, Stock Movement ID and Payment ID.
2. Generic item/BOM structures supporting raw material, semi-finished, finished product and service.
3. Recursive BOM requirement expansion so unavailable intermediates can resolve to their underlying raw materials.
4. Cycle detection to prevent corrupt BOM recursion.
5. Quantity/stock sufficiency checks with explicit shortage results; never silently allow negative stock.
6. Recognized component-cost aggregation at line level.
7. Pure deterministic functions only; no Google Sheets, Apps Script, D1 or cash mutation.

### Safety reason
This is intentionally isolated from the current authoritative production write path. It can be reviewed/tested without bypassing the existing P0/GO-NO-GO gates.

### Expected deliverables
- `accounting/domain-core-v1.js`
- `accounting/domain-core-v1.test.js`

### Acceptance tests
- Stable IDs normalize deterministically.
- Invalid/mismatched Line ID is rejected.
- Recursive BOM expands raw -> semi-finished -> finished correctly.
- BOM cycles fail explicitly.
- Insufficient stock returns structured shortages and makes no mutation.
- Cost rollup equals the sum of resolved component requirements × unit recognized cost.

Status: STARTED — code mutation may now proceed.
