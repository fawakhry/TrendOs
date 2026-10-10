# ACC-170 — G4 real Worker + SQLite finance cycle and supplier payment SQL fix
Date: 2026-10-10 | Branch: `test/acc170-finance-flow-sqlite-20261010`
Release status: **SOURCE FIX QUALIFIED OFFLINE; PRODUCTION FINANCIAL FLOW NOT ACCEPTED**.

## Goal and underlying defect
- The previously-merged finance tests for purchase/reversal/direct sale/day close mainly asserted source tokens. The actual SQLite-backed prior A2.13 test only exercised custody close. Neither is a substitute for testing the **interconnected** purchase/sale/stock/cash/ledger/report transaction path with the original Worker implementation.
- First ACC-170 in-memory test [run 38069267411](https://github.com/fawakhry/TrendOs/actions/runs/38069267411) failed because fixture expected READONLY even though migration default is OFF; fixed fixture only, never touched production.
- Second [run 38069291006](https://github.com/fawakhry/TrendOs/actions/runs/38069291006) got through fake supplier and material and exposed an actual finance SQL error **on a purchase with partial supplier payment**: `ERR_SQLITE_ERROR: 16 values for 17 columns`.
- Root cause: in `cloudflare-d1/src/employee-accounting-native-v1.mjs`, the `payment_paid` insert into `employee_accounting_party_ledger_v1` had only one bound placeholder after the hard-coded operation name; `operation_label` and `amount` both need separate values. The single-character source fix changed `'payment_paid',?,-1` to `'payment_paid',?,?,-1`, preserving the existing binds, transaction and business semantics.
- This is not a cosmetic warning. The missing SQL value made an actual direct purchase with a non-zero partial supplier payment fail on real SQLite. Since Production code was not deployed in ACC-170, **production is not proven repaired**.

## Implemented code and new true integration test
- `cloudflare-d1/src/employee-accounting-native-v1.mjs`: one local SQL parameter-list correction; no changes to permissions, deployment, endpoint availability, write modes, data or migrations.
- `tests/easystore_acc170_finance_flow_sqlite.test.mjs`: executes actual checked-in accounting migrations 0015 and 0020–0030, the unmodified original Worker handler (apart from removing its import for injecting a fake session verifier) and a minimal synthetic T12 customer dependency against Node SQLite `:memory:`.
- Starts with schema's real OFF default; switches to READONLY solely inside memory to prove finance rejection; simulates locally disabled canary policy/GENERAL only in the ephemeral SQLite fixture, never in production.
- Exercises with non-real data: verified-session client-role spoof rejection; new supplier, material, purchase 5 units/total 50/paid 20; supplier remaining 30 and cashbox 20; duplicate invoice rejected; purchase reversal restores stock and supplier balance while posting cash refund; reversal duplicate blocked; second purchase +5 paid 0; direct sale 2 units for 40 with 25 paid, customer outstanding 15, stock 3; journal amount check; daily report; day close and duplicate day-close; restore fixture READONLY and prove later sale rejected without new ledger, stock or cash writes.
- Workflow `.github/workflows/easystore-acc170-finance-flow-sqlite.yml` uses Node 22 and `--experimental-sqlite`, no credentials, internet finance requests, Wrangler or remote D1.
- This is a **full local scenario subset**, not the entire G4 acceptance: staff flows, real custody cash handoff, live refunds, multi-user concurrency, migration parity, invoice reopen and all department edge cases still require separate integrated/owner-approved acceptance.

## Verified CI and interpretation
- [GitHub Actions 38069360361](https://github.com/fawakhry/TrendOs/actions/runs/38069360361): **SUCCESS** after fixing the real purchase SQL, with purchase/reversal/direct sale/stock/party/cash/duplicate/role/READONLY checks.
- [GitHub Actions 38069423133](https://github.com/fawakhry/TrendOs/actions/runs/38069423133): **SUCCESS**, additionally checking the supplier payment ledger amount, actual SQLite day report, persisted day-close hash and duplicate close behavior.
- Output markers: `ACC170_SQLITE_REAL_WORKER_PURCHASE_STOCK_SUPPLIER_CASH=PASS`, `ACC170_SQLITE_REAL_WORKER_PURCHASE_REVERSAL=PASS`, `ACC170_SQLITE_REAL_WORKER_DIRECT_SALE_CUSTOMER_STOCK=PASS`, `ACC170_SQLITE_DAILY_REPORT_AND_DAY_CLOSE=PASS`, `ACC170_SQLITE_DUPLICATE_INVOICE_AND_REVERSAL_GUARDS=PASS`, `ACC170_SQLITE_VERIFIED_ROLE_SPOOF_DENIED=PASS`, `ACC170_SQLITE_READONLY_FINANCIAL_POST_DENIED=PASS`.
- Explicit release status: `ACC170_PRODUCTION_D1_WRITES=ZERO`, `ACC170_REAL_FINANCIAL_ACCEPTANCE=NOT_TESTED`; no claim that the production Worker includes the fix.

## G1–G5 and next step
- G1: merged ACC-168 mandatory prearm check; live authenticated A2.13 zero-balance close **not passed**. No replay of run #4.
- G2: issue #40 owner finance grants still open; no employee role change.
- G3: ACC-169 identified a candidate spreadsheet, not an authoritative signed opening balance; no migration authorized.
- G4: new local, real-implementation connected transaction scenario exposed and fixed one concrete SQL defect. Needs Production deployment approval and still lacks full real end-to-end signed acceptance.
- G5: no rollback deploy or general finance unlock.
- Next: after PR CI/review merge the narrow SQL source fix; track separate explicit Cloudflare deployment approval and then true transaction acceptance on an authorized environment. No live financial execution from this test.
- **Five original finance acceptance gates remain OPEN; source fix is not the same thing as deployed/reconciled financial closeout.**

## PR #51 final-head review and acceptance boundary
- [PR #51 ACC-170 integration run 38069531837](https://github.com/fawakhry/TrendOs/actions/runs/38069531837) completed **SUCCESS** on documentation-present code head `efa5523ff4927daa4c18a1cc18bf7b025b946ddd`.
- Unrelated but PR-triggered safety suite [ACC-166 38069531834](https://github.com/fawakhry/TrendOs/actions/runs/38069531834), [ACC-165 live GET safe-idle 38069531875](https://github.com/fawakhry/TrendOs/actions/runs/38069531875) and [A61 regression 38069531871](https://github.com/fawakhry/TrendOs/actions/runs/38069531871) all completed successful jobs.
- Patch review confirms the only financial source edit is adding the omitted binding placeholder to `payment_paid` INSERT. All other changed files: new isolated test, its CI, master book and this evidence file. A successful CI authorizes *code merge of this source-only fix*, not Cloudflare deploy or financial activity.
- Production **still must be considered potentially affected by the old SQL version** until an expressly approved Cloudflare deployment is executed and independently verified; do not infer an unperformed live purchase/reversal acceptance.
