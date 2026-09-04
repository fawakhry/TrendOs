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

## ACC-EXEC-001 — IMPLEMENTED / TESTING PENDING

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

### Material change completed
Created `accounting/domain-core-v1.js` in commit `057424738210955ef29d9330654f24aaeb8d9cef`.

Implemented:
- stable ID normalization/validation
- Order/Line relationship validation
- generic item and BOM line normalization
- recursive BOM expansion
- cycle detection
- stock sufficiency evaluation without mutation
- recognized-cost rollup
- formation planning that returns `mutation: null` by design

---

## ACC-EXEC-002 — IMPLEMENTED / EXECUTION CHECK PENDING

Created `accounting/domain-core-v1.test.js` in commit `725d0a060891cd20bf66f6347280f98b6c520356` with coverage for ID normalization, Line/Order mismatch, recursive BOM, intermediate stock, cycles, shortages/no mutation, and recognized cost.

Local test execution was attempted, but the runtime could not resolve `github.com`, so the repository could not be cloned into the execution container. This is an environment/network limitation, not a product blocker. Static review continues instead of stopping.

---

## ACC-EXEC-003 — STARTED (recorded before code mutation)

### Static-review defect found
The initial recursive BOM resolver reads the same intermediate stock quantity independently for each recursion branch. If the same semi-finished component is referenced by multiple parent branches, its available stock could be allocated more than once in the plan.

### Required correction
Introduce an internal reservation ledger during planning so each unit of available intermediate stock can be allocated only once across the full recursive expansion. The caller's stock object must remain immutable.

### Regression addition
Add a test where two branches require the same intermediate component while only one unit exists; the resolver must reserve that one unit once and recursively expand the remaining demand.

Status: STARTED — corrective code mutation may now proceed.
