# ACC-174 — Real Worker / SQLite department purchase custody integrated flow

Date: 2026-10-10 | Branch: `test/acc174-dept-purchase-custody-sqlite-20261010`
Status: **SQL source defect fixed in candidate PR branch and qualified offline. NO live finance acceptance, no deployment.**

## Objective and production isolation

Continue after ACC-173 without replaying successful A2.10 supplier, A2.11 waste or A2.12 department canaries; do not rerun A2.13 failed real attempt. ACC-170 covered direct supplier purchase/reversal/direct sale/day close. This increment covers actual staff departmental purchase and custody handoff/settlement including authorized role separation, supplier ledger, cashbox and stock once.

New `tests/easystore_acc174_department_purchase_custody_sqlite.test.mjs` executes the real checked-in Worker handler (fake verified session injected) against ALL accounting SQLite migrations in `:memory:`, with a minimal fake T12 customer dependency. Public Cloudflare, workers, D1, genuine sessions and user data are never accessed; a local, discarded `GENERAL` fixture permits the synthetic scenario without enabling Production.

## Real source defect caught, corrected

- [First new integration run 38071416496](https://github.com/fawakhry/TrendOs/actions/runs/38071416496) failed immediately on `savePurchaseCustodyV1920`, **SQLite `13 values for 12 columns`**; not a test harness failure. The live-source SQL had a hard-coded `'HANDOFF'` value AND seven positional placeholders afterward where only six are needed.
- Isolated **one-character SQL fix**, original file `cloudflare-d1/src/employee-accounting-native-v1.mjs`: `VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)` → `VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)`. Existing eleven bound values map to the exact twelve table columns including the fixed movement type. No policy/auth/endpoint/DB schema mutation.
- [Second GitHub Actions run 38071456697](https://github.com/fawakhry/TrendOs/actions/runs/38071456697) **SUCCESS**, job 114269533269, running exact source/migrations/SQL in memory. This proves the corrected SQL inserts, but **not** that a Production Cloudflare Worker has been updated or that the current D1 dataset can accept a real custody event.

## Integrated synthetic transaction assertions

1. Finance approver authenticated as verified synthetic `admin` opens 20-value `HANDOFF` for a fake print staff identity. One cashbox entry and 20 custody balance.
2. Verified synthetic `print` employee cannot approve, including with a forged `role:admin` client claim. Can record a 2 × 10 cash purchase; stock increases **once** and no supplier invoice, supplier balance or duplicate cashbox posted while status `PENDING`. Same request ID replays idempotently.
3. Finance approver processes employee's pending purchase to an official invoice. Confirms approved state, only one stock move, zero supplier debt, one `PURCHASE_SETTLEMENT` custody event for 20, no second cashbox entry. Repeated approval does not create another financial invoice/event.
4. Zero-balance custody close records exactly one close with **zero** additional cashbox event and one logical close on duplicate request. This is local/offline; **the actual G1 one-off D1 CANARY close remains pending**.
5. A later synthetic 3 × 10 deferred departmental purchase is approved: stock remains single-applied, supplier payable rises to 30; no cashbox or custody settlement.
6. A third pending 1 × 10 deferred purchase is rejected: newly applied stock reverses from 6 to 5 without touching supplier payable or cashbox; duplicate rejection blocked; already approved purchase cannot be rejected.
7. Real Worker department report and day close run against those in-memory financial rows. After fixture returns `READONLY`, further department write is rejected with all tracked financial counters and balances unchanged.

Outputs in successful CI: `ACC174_REAL_WORKER_DEPT_BUY_STOCK_ONCE=PASS`, `ACC174_REAL_WORKER_APPROVAL_SUPPLIER_CUSTODY_LEDGER=PASS`, `ACC174_REAL_WORKER_ZERO_CUSTODY_CLOSE_NO_CASH_SIDE_EFFECT=PASS`, `ACC174_REAL_WORKER_DEFERRED_PAYABLE_NO_CASH=PASS`, `ACC174_REAL_WORKER_REJECT_PENDING_STOCK_REVERSAL=PASS`, `ACC174_REAL_WORKER_ROLE_SEPARATION_AND_DUPLICATE_BLOCKS=PASS`, `ACC174_REAL_WORKER_DAY_REPORT_AND_CLOSE=PASS`, `ACC174_READONLY_FAIL_CLOSED=PASS`.

## CI and scope

- Added `.github/workflows/easystore-acc174-dept-custody-sqlite.yml` for Node22 local SQLite-only on PR and source changes, with `permissions: contents: read`; no credential, Worker deployment, Wrangler or Production D1 connections.
- Source fix is not a Production deploy. No Cloudflare Workers or Pages publish, employee grant mutation, finance API POST or D1 write. Existing READONLY/OFF and no-retry A2.13 live production safety boundaries unchanged.
- This does **not** imply entire finance G4 gate passed. Real purchase/receipt/stock and genuine employee authorization acceptance, concurrency and operations owner signoff need explicitly approved real-environment safeguards, and opening source G3 remains unsigned. G1, G2 issue #40, G3, G4, G5 are still open.
