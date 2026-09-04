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

## ACC-EXEC-004 — IMPLEMENTED / EXECUTION CHECK PENDING

Extended the domain core with deterministic, audit-ready formation movement planning.

Code commit: `75a595a806e71f38c5ef6925d81a18ee8abbd343`.

Implemented:
- stable `eventId`, Order ID, Line ID and source transaction validation
- shortage gate: failed formation returns zero planned stock mutations
- deterministic `PRODUCTION_CONSUMPTION` movement plan for every resolved requirement
- deterministic `PRODUCTION_OUTPUT` movement for the final item
- Order ID + Line ID carried on every movement
- deterministic movement/idempotency keys derived from event + sequence + item
- recognized cost carried through to the movement plan
- still pure planning only: no Google Sheets, D1, cashbox or live inventory mutation

Regression coverage commit: `9813cc30e74cbff9a798e5aafa727024b8124c85`.

Added tests for:
- identical input event => identical movement plan
- successful formation => requirements consumption + final output
- all movements preserve Order ID and Line ID
- shortage => zero movements

### Current verification state
Executable Node verification is still pending only because this runtime cannot resolve GitHub to clone the branch locally. No user decision or production permission is required for the next isolated development slice.

### Next safe continuation
Before adding any persistence adapter, implement the Accounting transaction/idempotency contract as a pure store-independent layer so a future Google Sheets/database adapter can atomically claim an event, persist all planned movements, and safely replay without duplication.

---

## ACC-EXEC-005 — STARTED / MATERIAL STEP RECORDED BEFORE CODE

Starting the pure store-independent Accounting transaction/idempotency contract. This slice will not write to Google Sheets, D1, cashbox, inventory, or production.

Pre-implementation reconciliation found an important existing Accounting persistence rule in `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_APPEND_ONLY_CORRECTION_2026-09-05.md`: idempotency is append-only and must persist one immutable final decision (`completed`, `failed`, or `ambiguous`) rather than a mutable `claimed -> completed` lifecycle. The new pure contract will therefore align with that safer immutable-final-decision model while still supporting atomic future persistence.

Planned contract invariants for this slice:
- Event ID is the idempotency boundary.
- Same Event ID + same canonical payload => safe replay/no duplicate mutations.
- Same Event ID + different canonical payload => hard idempotency conflict.
- Formation success => immutable `completed` transaction plan carrying every deterministic movement.
- Formation shortage/business failure => immutable `failed` decision with zero mutations.
- Transaction and payload fingerprints are deterministic and store-independent.
- No persistence adapter is introduced in ACC-EXEC-005.
