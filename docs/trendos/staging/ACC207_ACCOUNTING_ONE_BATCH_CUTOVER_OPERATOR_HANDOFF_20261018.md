# ACC207 — One-batch accounting go-live acceptance / operator handoff (NOT A NEW BOOK)

**2026-10-18 — current status: FINANCE_RELEASE=NO_GO.** Engineering preparation only, source-only under stacked [TrendOS Draft #200](https://github.com/fawakhry/TrendOs/pull/200) and [#198](https://github.com/fawakhry/TrendOs/pull/198). The sole accounting historical and owner-decision record remains EasyStore `EASYSTORE_ACCOUNTING_MASTER_BOOK.md`, linked via [EasyStore Draft #71](https://github.com/fawakhry/EasyStore/pull/71). This file is an **execution handoff checklist**, not an alternative account ledger or owner's decision book.

## What is actually available

- Native accounting purchase/invoice/collection/stock/day-close Worker test path using disposable real SQLite, including original ACC170 supplier SQL fix. This proves only the checked-in Worker under simulated sessions, not the currently deployed version.
- ACC175 exact verified-user finance roster resolver present but **not ENFORCE activated** and no real private signed employee grant matrix.
- Native ACC205 official customer ID READONLY balance vs COMMITTED credit events: posted credit and fake-tamper detection, not proof of an accountable customer's consent.
- Native ACC206 exact invoice + COMMITTED original request + cashbox row READONLY return exposure audit: detects missing/mismatched physical cash evidence or UNDER_REVIEW invoice. **No native customer CASH_REFUND or CUSTOMER_CREDIT-ISSUE authorization/handler**, no returned item level liability or inventory restock/waste posting.
- ACC207 consolidated [CI](https://github.com/fawakhry/TrendOs/actions/runs/39072826185) runs eight independent native / policy / refund negative / credit / source release tests at the exact same source tree, completed SUCCESS, without any financial production connection.
- Stage components & rollback drills from prior work remain independent and NOT verified in production by this CI.

## Fastest safe first phase

Prepare a private isolated environment with dummy customers/transactions only; have staff exercise the actual accounting Worker and UI under **server finance READONLY + frontend finance writes OFF** and zero canary budgets. Verify documented role access, customer-account lookup, invoice reports and return previews **without payments**. Do not enable GENERAL or CANARY, put real customer files into synthetic environments, or migrate actual D1 at this stage. Any server stage/cloud integration requires separate service/permissions and owner-approved scope.

A decision to run a **sales-and-collections-only production launch while deferring cash refunds** is an explicit owner *scope decision*, **not inferred** by the engineering team. A restricted first phase still needs verified real employee grants, signed opening/cash custody, isolated backup+restore, exact pinned deployed Worker and owner go-live approval, as appropriate to its financial actions.



## ACC211 delegated scope update — 2026-10-19

The owner issued a **general technical-decision delegation**. The engineering team has now **SELECTED** the conservative restricted first phase (**cash-only sales and cash-only customer collections**; NO refunds/returns/credit/supplier/manual corrections) as the scope for eventual *owner-approved* rollout. This resolves the **D3 scope-selection choice only**, and is implemented in the native checked-in worker as a **server-only optional extra deny guard**, not an activation of the production ledger. See [ACC211 phase-one decisions, exact remaining evidence and guard semantics](./ACC211_OWNER_DELEGATED_FINANCE_PHASE1_SCOPE_DECISIONS_20261019.md).

G1 real custody and responsible operator, G2 private verified user permissions, G3 opening date/real balances, G4 genuine item-refund/post-day-close approvals and first trusted financial transaction, G5 independent backup+restore evidence, and release pinned SHA/maintenance operator remain **UNSUPPLIED**, not tacit YES. Do not send individual approval questions during independent coding work; keep a single acceptance packet. All accounts remain `FINANCE_RELEASE=NO_GO`, no production deployment. This addendum supersedes only the **D3 scope-selection choice** in the older table below.

## Owner decision batch — resolve once, privately (do not post employee details into GitHub)

| ID | Decision/evidence needed | Consequence if pending |
|---|---|---|
| D1 / G2 | Authenticated login IDs + finance scope (full/final/print/laser/none) signed privately by owner; select trusted reviewer and independent approver | Explicit ENFORCE roster remains disabled; do not infer permissions from names |
| D2 / G3 | Intended accounting start date, 0-vs-existing opening balances, evidence sources and actual customer/supplier/cash/stock totals, preparer+reviewer signoff | No live cutover/financial writing |
| D3 / G4 | Confirm Day-1 money scope: (A) all accounting incl approved returns after actual refund handler acceptance or (B) restricted sales/collections only with ALL refunds blocked pending a later explicit owner approval | No production finance GO, no automatic cash payouts |
| D4 / G4 | Resolve item-level partial invoice/discount/payment allocation for returns; real returned-item evidence custody, over-cap approval roles, post-close invoice/dispute flows, and department-specific production overhead drivers/rates | Real refunds/credit posting, disposal/cost posting and day-close corrections remain blocked |
| D5 / G1/G5 | Identify responsible cash custodian + independent verifier, permit single controlled nonzero/zero-balance cashier canary only after stage acceptance; private backup operator, RPO/RTO & distinct isolated restore target | No genuine financial test, trusted backup, rollback GO |
| D6 / RELEASE | Explicitly approve exact immutable release commit, private deployment operator, maintenance slot, staff training, emergency stop/rollback and post-live sign-off once all acceptance evidence verified | No merge, migration, Cloudflare production deploy or finance mode enablement |

**ALREADY APPROVED — DO NOT RE-ASK:** Owner's eight bounded ACC187 business rules: (1) cash/customer-credit/or mixed settlement per approved case; (2) personalized name/photo no ordinary change-of-mind return except verified manufacturing defect/Trend Mall error; (3) case-by-case timing subject to law; (4) cash+credit cap on *paid amount attributable to returned items* less previously compensated, separate exception approval for excess; (5) returned goods quarantine until actual inspection, damaged goods = waste; (6) waste at genuine manufacturing cost and separately approved third-party recovery; (7) actual manufacturing cost = materials + direct labor + allocated overhead; (8) department-specific documented overhead drivers with consistent use and prospective change approval. These are policy choices, NOT live refund authorization.

## Engineer's independent implementation queue (not new owner questions)

1. Proven authenticated staff role grants + negative privilege tests in a private stage, independent of body-supplied fields. Existing code ACC175 only tests fake verifier and remains unactivated.
2. Unique immutable official customer ID persisted at valid order creation, manual identity provenance/hard conflict rejections and multi-source balance/operational debt consistency; BOOK18/19/28 remain open.
3. Per-return case immutable invoice/item/cash/credit allocation evidence and server-validated management authorization; atomic refund+credit liability+stock/waste compensating entries and idempotency; never treat invoice reopen as payout.
4. Real deployment version-pin with safe stage, independent backup/export+restore, actual rollback and immutable verified report, all with finance OFF/READONLY until owner GO.
5. Run authenticated signed day-1 accounting cash/sales/collection/close acceptance against explicitly authorized safe environment; compare source and deployed version. Roll back/stop on disagreement; no automatic retry for PREPARED commands.

## Operator-friendly offline source verification (no credentials; no network)

From a separate TrendOs checkout of the exact PR SHA with Node 22+:

```bash
node scripts/acc207_finance_release_batch.mjs --out /tmp/acc207-release-report.json
node --test tests/easystore_acc207_finance_release_batch_no_go.test.mjs
```

The report is sanitized source and decisions metadata only, never an approval artifact. **Expected:** `codeInspectionPassed=true`, `G1..G5=OPEN`, `financeRelease=NO_GO`. Validating its contents does not authenticate staff/backup signatures. It does not enable money writes or deploy the program.

## Explicit STOP / recovery

If any preview detects mismatched invoice cash, missing request COMMITTED, stale customer binding, credit liability mismatch, stock/waste gap, unreconciled opening amount, disabled role grant, backup integrity issue or pending command, block financial release and seek owner-attested correction. Never erase or replay a PREPARED money command as if it were a new sale. Isolate restore test from production; Worker rollback does not reverse posted money. An autonomous agent, GitHub Action or successful synthetic CI cannot authorize cash/refund/debt release.

**Nonnegotiable flags**: `G1=OPEN`, `G2=OPEN`, `G3=OPEN`, `G4=OPEN`, `G5=OPEN`, `FINANCE_RELEASE=NO_GO`, `PRODUCTION_DEPLOYED=NO`, `LIVE_FINANCE_ACCEPTANCE=NOT_YET`. Draft/unmerged.
