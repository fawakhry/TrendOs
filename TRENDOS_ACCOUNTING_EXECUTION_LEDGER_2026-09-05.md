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

## ACC-EXEC-006 — IMPLEMENTED / EXECUTABLE VERIFICATION NEXT

Pre-test record was committed before test code in `07f5bcea4a59653504603b3c6fef59d9887bfac6`.

Regression test file created: `accounting/transaction-contract-v1.test.js`.

Test code commit: `f80085405dc2a0033ac9f76ef508e0e5bc6cbbac`.

Coverage added for:
- canonical key-order stability.
- identical event => identical transaction plan.
- completed formation => deterministic append operations.
- shortage => failed final decision with zero operations.
- same event/same canonical payload => replay, including changed runtime stock.
- same event/different canonical payload => hard idempotency conflict.
- persistence intent => atomic + append-only final decision and operations.

---

## ACC-EXEC-007 — VERIFICATION GAP IDENTIFIED / NO USER BLOCKER

Direct runtime clone was attempted after the pre-verification ledger record, but DNS still cannot resolve `github.com`; therefore local Node execution remains unavailable in this container.

GitHub Actions did run successfully for commit `f80085405dc2a0033ac9f76ef508e0e5bc6cbbac`, proving the branch's existing Integrity V1 suite is green. However, review of `.github/workflows/trendos-integrity-v1.yml` found that the new isolated `accounting/*.test.js` suites are not currently executed by that workflow. A green existing workflow therefore cannot be treated as executable proof for ACC-EXEC-001..006.

This is a CI coverage gap, not a user-dependent blocker.

---

## ACC-EXEC-008 — STARTED / MATERIAL STEP RECORDED BEFORE CI WORKFLOW CHANGE

Extend the existing branch Integrity V1 GitHub Actions workflow so it explicitly executes:
- `node accounting/domain-core-v1.test.js`
- `node accounting/transaction-contract-v1.test.js`

Also include the Accounting source/test paths in the pull-request path filter. This creates a repeatable executable gate for the isolated Accounting domain and transaction contract without touching production runtime or D1.
