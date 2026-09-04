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
Added tests for identical replay plans, linked IDs, successful movements and shortage zero-mutation behavior.

---

## ACC-EXEC-005 — IMPLEMENTED
Pre-step record commit: `264d129a22d59bed4dcb3868583c7a8bcec8cb89`.
Implemented pure store-independent contract in `accounting/transaction-contract-v1.js`.
Code commit: `c563c81389a6eab233ce26668a5efed794de1722`.
Implemented Event-ID idempotency, canonical payload fingerprinting, deterministic transaction/decision/operation IDs, completed/failed immutable decisions, replay classification, hard conflicting-key rejection, and append-only atomic persistence intent. No live mutation introduced.
The contract follows the existing append-only persistence correction and does not use a mutable `claimed -> completed` lifecycle.

---

## ACC-EXEC-006 — IMPLEMENTED
Pre-test record commit: `07f5bcea4a59653504603b3c6fef59d9887bfac6`.
Created `accounting/transaction-contract-v1.test.js` in commit `f80085405dc2a0033ac9f76ef508e0e5bc6cbbac` covering deterministic plans, failed zero-operation decisions, safe replay, conflicting payload reuse, canonical fingerprint stability and atomic append-only persistence intent.

---

## ACC-EXEC-007 — VERIFICATION GAP RESOLVED
Direct container clone still fails because runtime DNS cannot resolve `github.com`. Review showed the existing Integrity workflow was green but did not execute the new Accounting suites, so it could not be used as proof.

---

## ACC-EXEC-008 — IMPLEMENTED / EXECUTABLE PASS
Pre-CI-change record commit: `e2d77822c4443d02bda08c71afabdeefd8ab687c`.
Updated `.github/workflows/trendos-integrity-v1.yml` in commit `25cb07fdd29f4ba466a96fcdf9a6eeacdbe35282` to execute both isolated Accounting suites and include Accounting paths in PR filtering.

GitHub Actions run `33929116835`, job `101203913655`, completed successfully. Both explicit steps passed:
- `Run TrendOS Accounting domain-core-v1 tests` — success
- `Run TrendOS Accounting transaction-contract-v1 tests` — success
The full existing integrity job also remained green.

ACC-EXEC-001 through ACC-EXEC-006 now have executable CI proof on the working branch.

---

## ACC-EXEC-009 — STARTED / MATERIAL STEP RECORDED BEFORE ADAPTER CODE

Next safe slice: implement a reference in-memory persistence adapter for the new transaction contract before touching any real D1/Sheets binding.

Purpose:
- prove the adapter semantics for `NEW`, safe `REPLAY`, and conflict without external side effects;
- apply an entire persistence intent atomically in memory (all operations + one immutable final decision or none);
- reject duplicate operation IDs and partial commits;
- make stored decisions append-only/immutable;
- provide an executable reference contract that a future D1 adapter must match.

This reference adapter is test-only/in-process persistence and does not modify D1, Google Sheets, cashbox, live stock or production.
