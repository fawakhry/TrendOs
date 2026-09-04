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

## ACC-EXEC-001 — IMPLEMENTED / EXECUTION CHECK PENDING

Created the first isolated Accounting domain core in `accounting/domain-core-v1.js`. It contains stable ID validation, generic item/BOM normalization, recursive formation planning, cycle detection, shortage evaluation and recognized-cost rollup. No external writes are performed.

Initial code commit: `057424738210955ef29d9330654f24aaeb8d9cef`.

---

## ACC-EXEC-002 — IMPLEMENTED / EXECUTION CHECK PENDING

Created `accounting/domain-core-v1.test.js` in commit `725d0a060891cd20bf66f6347280f98b6c520356` with coverage for ID normalization, Line/Order mismatch, recursive BOM, intermediate stock, cycles, shortages/no mutation, and recognized cost.

Local test execution was attempted, but the runtime could not resolve `github.com`, so the repository could not be cloned into the execution container. This is an environment/network limitation, not a product blocker. Static review continues instead of stopping.

---

## ACC-EXEC-003 — IMPLEMENTED / EXECUTION CHECK PENDING

Static review found that shared intermediate inventory could be allocated more than once across independent recursive BOM branches.

Correction completed in commit `a66cf6070fecc26fa1300314598a56fd373f3c08`:
- internal stock reservation ledger added
- caller stock remains immutable
- each available intermediate unit can be reserved only once across the full expansion

Regression test added in commit `6c40b072ae11ddd335f754b36b9129fb0054bfda` using two branches that both require the same semi-finished component while only one unit is available.

---

## ACC-EXEC-004 — STARTED (recorded before code mutation)

### Goal
Extend the pure domain core from “can this item be formed?” to “what exact auditable stock movements would be required?” without performing those writes.

### Required behavior
- Accept stable `eventId`, `Order ID`, `Line ID` and source transaction reference.
- Reuse the recursive BOM/shortage planner.
- If any shortage exists, return zero movement mutations.
- If sufficient stock exists, return deterministic planned movements for:
  - production consumption of resolved requirements
  - production output of the final item
- Preserve Order ID + Line ID on every planned movement.
- Produce deterministic movement keys from the same event input so replaying the same event produces the same plan and can be idempotently persisted later.
- Do not touch Google Sheets, D1, cashbox or any live inventory balance.

### Acceptance
- same input event twice => exactly identical movement keys/order/content
- insufficient stock => no planned mutations
- successful formation => one consumption movement per resolved requirement + one output movement
- all movements retain Order ID and Line ID

Status: STARTED — code mutation may now proceed.
