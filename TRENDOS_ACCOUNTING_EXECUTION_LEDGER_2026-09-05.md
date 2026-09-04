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

## ACC-EXEC-005 — IMPLEMENTED / REGRESSION COVERAGE NEXT

Pre-step record was committed before code in `264d129a22d59bed4dcb3868583c7a8bcec8cb89`.

Implemented pure store-independent contract in `accounting/transaction-contract-v1.js`.

Code commit: `c563c81389a6eab233ce26668a5efed794de1722`.

Implemented invariants:
- Event ID is the idempotency key.
- canonical event payload contains stable Order ID, Line ID, source transaction, event type/version, item and quantity.
- deterministic canonical JSON + payload fingerprint for replay conflict detection.
- deterministic transaction, decision and operation IDs.
- successful formation maps deterministic movement plan into append-only stock-movement operations and final `completed` decision.
- shortage maps to final `failed` decision with zero operations.
- same key/same fingerprint can be classified as replay.
- same key/different fingerprint throws a hard `IDEMPOTENCY_KEY_REUSE_CONFLICT`.
- `persistenceIntent()` expresses one atomic append-only persistence unit without implementing a store.
- no live/persistent mutation introduced.

The implementation intentionally follows the already-documented append-only persistence correction: there is no mutable `claimed -> completed` state.

---

## ACC-EXEC-006 — STARTED / MATERIAL STEP RECORDED BEFORE TEST CODE

Add isolated regression coverage for the transaction/idempotency contract before any persistence adapter work.

Required checks:
- canonical object key order does not change payload fingerprint.
- identical source event produces identical transaction plan.
- successful formation emits completed decision and deterministic movement operations.
- shortage emits failed decision and zero operations.
- same event/same payload classifies as replay.
- same event/different payload raises idempotency reuse conflict.
- persistence intent is explicitly atomic + append-only and carries final decision + operations.
