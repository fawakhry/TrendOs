# ACC-189 — Composite costs, stock/waste overdraw, concurrent sales, offline D1

Date 2026-10-12. **Candidate source/CI only; real financial/inventory release NO_GO.**

## Source and isolated test

- \`cloudflare-d1/src/employee-accounting-native-v1.mjs\`: reject negative stock on **material create/update** before \`beginCommandV1\` can reserve an idempotency key. This prevents malformed or negative manual stock from becoming the current source-of-truth quantity. Valid positive/zero material changes still follow the original authenticated mode, SQL and version guards.
- \`tests/easystore_acc189_inventory_waste_composite_concurrent_sqlite.test.mjs\`: actual checked-in Worker handler and real migration schemas in transient Node SQLite \`:memory:\`, fake cloud session only. Never uses Cloudflare, real D1, employees or financial POST.
- Test matrix: fake paper (10 units, cost 10) + fake ink (10 units, cost 3); template (2 paper + 1 ink => unit cost 23), sale of 2 (manual cost 46, deduct 4 paper/2 ink), waste 1 paper only, refuse waste overdraw/negative stock/manual update/direct sale overdraw **with unchanged cash, stock and request ledgers**.
- Concurrent competing credit sale requests each need 4 more paper when 5 remain. Exactly one may commit; second must refuse via fresh stock check or optimistic SQL version guard. No negative balances, duplicate cashbox or invisible receivable.
- Role spoof and READONLY writes rejected. Regression ACC170/174/187/188 and A210 no-push checker.

This is not proof of actual production serializability or post-deploy inventory acceptance. Actual physical inventory count, costs/cutover, employee finance authorization and day-close acceptance remain separate G2–G5 owner decisions. Source code is not deployed. Frontend last known OFF, backend last known READONLY, release NO_GO.

If a test fails, record actual GitHub run and troubleshoot safely; don't label ACC189 complete until real exact-merge CI proof has been checked. Stage initially \`IN_PROGRESS_UNVERIFIED\`.
