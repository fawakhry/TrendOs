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

### Test gate
The code is not considered complete until executable regression tests are added and pass.

---

## ACC-EXEC-002 — STARTED (recorded before test mutation)

### Goal
Add executable regression coverage for the domain core before extending Accounting functionality.

### Planned acceptance tests
1. IDs normalize deterministically.
2. Line ID/order mismatch is rejected.
3. Final product recursively resolves through a semi-finished component into raw materials.
4. Available semi-finished stock is consumed as a requirement before recursion for the remainder.
5. BOM cycle fails with `BOM_CYCLE`.
6. Shortages are explicit and no stock object is mutated.
7. Recognized cost matches resolved requirements.

Status: STARTED — test file mutation may now proceed.
