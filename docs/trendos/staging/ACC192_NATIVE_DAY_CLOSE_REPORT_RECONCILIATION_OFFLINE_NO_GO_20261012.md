# ACC-192 — Native day-close report reconciliation (synthetic G4 only, NO_GO)

Date 2026-10-12. Primary accounting book: [EasyStore Accounting Master Book](https://github.com/fawakhry/EasyStore/blob/candidate/easystore-zero-google-audit-20261004/EASYSTORE_ACCOUNTING_MASTER_BOOK.md). This TrendOS file is a **source/test runbook**, not the finance master ledger.

## Implementation scope

New `tests/easystore_acc192_day_close_cash_debt_stock_reconcile_sqlite.test.mjs` runs the exact unmodified native accounting Worker source with actual finance migrations and mocked, authenticated sessions in Node 22 SQLite `:memory:`. It preserves/reuses known-safe ACC170 purchase/reversal/sale/cash and independent account balances.

- Reconciles a fake printed daily report against purchase total, sale amount, cash customer receipt, credit/receivable, recognized job cost and profit. Checks stored `report_json` and `report_hash` for existing departmental day close.
- Inserts and cleans clearly synthetic pending department purchase, unbilled department line and unclassified purchase into discarded SQLite only, proving each prevents day closure and creates no finance events or ledger movement.
- Proves overall day close must wait for both printing and laser day closes; aggregate report fields equal department sums.
- Repeating the same close with a distinct request key returns `duplicatePrevented` and does not add finance rows; all three closed report hashes match persisted values.
- Fake verified role spoof is denied; previously verified ACC170 READONLY finance denial remains covered, plus ACC188/189/190/193 regressions.
- Code only tests accounting, never invokes a production endpoint. No new Worker business writer was implemented or deployed.

## Real acceptance remains separate

No published Pages SHA, real user login, current production D1 inspection, cash/custody real close, financial POST, Cloudflare deployment, canary execution, physical inventory reconciliation, owner cutover date, backup/restore or staff-role change. G1–G5 OPEN, frontend last known OFF and backend last known READONLY, release **NO_GO**. This stage is `IN_PROGRESS_UNVERIFIED` until actual PR, exact-head and independent postmerge CI evidence and a canonical EasyStore book entry.
