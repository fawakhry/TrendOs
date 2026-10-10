# ACC-164 — Accounting final closeout: five remaining acceptance gates
Date: 2026-10-10 | Scope: TrendOS → EasyStore ES46 → Cloudflare D1
Status: **ROADMAP_VERIFIED; ACCOUNTING_PRODUCTION_CLOSEOUT_NOT_COMPLETE**.

## Source of truth and scope
- Main evolving checkpoint: `TrendOS_MASTER_BOOK.md` in `candidate/easystore-accounting-a2-20261005`.
- Production EasyStore GitHub Pages: `https://fawakhry.github.io/EasyStore/`; backend `/v1/employee/accounting`.
- This is a **count of acceptance gates, not an elapsed-time or percentage estimate**. A gate can expose a defect that needs repair; no guaranteed calendar ETA is appropriate until production financial write authorization and historical data scope are settled.
- Do **not** re-run completed supplier A2.10, waste A2.11 or department-line A2.12 canaries.
- Do **not** conflate synthetic offline CI with Production money-moving acceptance.
- A historical architecture reference from 2026-09-04 describes a design-era status, **not current implementation progress**; use current D1/CI/source checkpoints for completion claims.

## Verified already, do not repeat
1. Supplier A2.10 final cleanup/acceptance recorded in `.github/a210-supplier-final-closure-result.txt`. Waste A2.11 and department-line A2.12 passed their earlier bounded trials. Preserve their historical evidence; no replay.
2. [A2.13 #4 actual run](https://github.com/fawakhry/TrendOs/actions/runs/38061161009) armed one bounded window, but the then-published frontend failed to render; there is **no accepted custody close**. [Independent D1 SELECT-only forensics](https://github.com/fawakhry/TrendOs/actions/runs/38063721910) confirmed **zero A2.13 request/event/close/cashbox/stock effects**, unchanged checked baseline, and READONLY with zero budget. No silent retry.
3. [ACC-157/158 synthetic handler + SQLite tests](https://github.com/fawakhry/TrendOs/actions/runs/38053563248) passed and established the native zero-balance handler/DDL logic in memory. This does not prove the deployed worker can execute a real authenticated close.
4. [EasyStore white-screen hotfix](https://github.com/fawakhry/EasyStore/pull/26) published; [public asset and D1 GET verification](https://github.com/fawakhry/EasyStore/actions/runs/38062527289) passed. User's new session screenshot confirms the accounting shell loads with SSO indication; server remains READONLY and frontend mode OFF.
5. [ACC-162 published boot CI](https://github.com/fawakhry/TrendOs/actions/runs/38064111451) passed for OFF + mock CANARY startup. [ACC-163 nonce-bound fake SSO-to-button life-cycle CI](https://github.com/fawakhry/TrendOs/actions/runs/38065195195) passed for button visible under simulated bounded server health and hidden when command budget is consumed. [PR #43](https://github.com/fawakhry/TrendOs/pull/43) and [PR #44](https://github.com/fawakhry/TrendOs/pull/44) merged to Accounting candidate.
6. EasyStore's [emergency frontend OFF workflow](https://github.com/fawakhry/EasyStore/pull/25) is installed; its local conversion test passed. **Its actual dispatch→commit→GitHub Pages revert path has not yet been proven end-to-end**.
7. Source-side authentication, read-only UI and SSO smoke are not proof of financial role authorization. [ACC-156 role matrix issue #40](https://github.com/fawakhry/TrendOs/issues/40) remains an explicit release gate.

## Exactly five remaining acceptance gates — not five coding commits

| Gate | Acceptance/closure required | Status | Evidence when complete |
| --- | --- | --- | --- |
| **G1. A2.13 custody close** | Verify current public UI actually boots **before** arming; ensure an authorized user is physically ready; explicitly approve **one fresh** zero-value CANARY only after checking old request outcomes, and ensure the candidate 120s watcher, single request key, 15m expiry, automatic READONLY cleanup and rollback plan. The authenticated click must cause exactly one COMMITTED request ledger + custody close + event, with no cashbox/stock/party-ledger side effects, confirmed by independent post-run SELECT and published OFF. If unknown, STOP and reconcile; no second click or dispatch. | **BLOCKED: no accepted live close** | Human authorized execution, exact GitHub run + D1 SELECT evidence, Worker and public frontend OFF |
| **G2. Financial roles and permissions** | Reconcile server-native/legacy authenticated employee IDs to finance permission grants. Confirm Diaa/other staff scope with the owner, negative authorization tests, and no broadening by client-supplied role/name fields. Resolve [issue #40](https://github.com/fawakhry/TrendOs/issues/40) through reviewed, isolated implementation and controlled release. | **PENDING role matrix / signoff** | Approved matrix, CI negatives and positive signed-in employee read/write scope checks |
| **G3. Existing financial data / opening balances** | Establish authoritative historical source and cutover date. Reconcile suppliers, customers, inventory, open payables/receivables, custody, treasury and invoice totals against source records. The previous 21 Google Sheets tabs / sampled 60-row read were **not** proof the old balances had been migrated. Only if the owner confirms no legacy balance needs transfer may migration be marked N/A with signed zero-opening ledger evidence. No financial import without separate approval/backups/validated mapping. | **NOT YET VERIFIED; migration scope conditional** | Source/target reconciliation signed by owner; validated import or explicit N/A with source evidence |
| **G4. Full finance operating acceptance** | Execute bounded approved end-to-end scenarios for real-workflow purchase, sale, stock/cost, custody, supplier/customer balances, cashbox, reversal/duplicate prevention, day close and reporting in the authorized production-like environment. No new live writes merely to test without approved safeguards. Resolve defects by role/scenario, not by restarting old green canaries. | **MIXED offline CI passes; live integrated acceptance NOT COMPLETE** | CI + reviewed transaction audit and operator finance signoff by business scenario |
| **G5. Release, rollback and handover** | Approve final production permissions/write operating mode, backups, monitoring/alerts, runbook, tested emergency rollback, accountant/operator acceptance and postrelease reconciliation. Verify published frontend and server state. Merge/publish Workers/migrations only under explicit authorization; avoid uncontrolled GENERAL financial writes. | **NOT COMPLETE** | signed GO/NO-GO, deployed version pins, rollback proof and handoff |

## Immediate safe execution sequence
1. **Done:** ACC-163 test integrated in Accounting candidate; both PR #43 and PR #44 merged; live public UI remains OFF and backend READONLY in the last verified GET.
2. **Next read-only technical gate:** maintain a current public bootstrap/SSO/health CI check and compare the actual manual execution workflow to the intended prearm readiness checks. A prior attempt to edit the finance-changing workflow was blocked; that safety gate must **not** be bypassed through another workflow. Ask for the authorized maintainer review before changing the manual workflow.
3. **Next owner-coordinated gate:** when G1 technical prerequisites, login, operator availability and audited rollback are ready, obtain **fresh explicit** bounded financial-canary approval. Never interpret earlier `ابدأ` as approval for an unlimited or later repeated financial write.
4. Move next to G2, G3, G4, G5 in order after accounting for parallel read-only preparation where possible.

## ETA interpretation
- **Five gates remain.** They are not five button clicks or five guaranteed working days.
- Full go-live ETA is **not defensible yet**: G1 awaits a real money-writing canary, G2 needs approved role grants, G3 may require a historical balance migration, and G4 can surface transactional bugs.
- The safe source/test work can continue without TinyFish. The owner's actual employee browser and explicit authorization are needed at the controlled real financial execution boundary.

## Guardrail / checkpoint
- Latest independently confirmed financial control: `READONLY` / zero command budget / published frontend `OFF`.
- No new finance POST, Wrangler DML, server CANARY arm, D1 migration, employee-role mutation or GitHub Pages deploy was performed by ACC-164.
- Next AP step: `ACC-165_READONLY_PREARM_RELEASE_GATE_REVIEW` (source/CI-only) followed by separately approved G1 controlled pilot; G1 remains unpassed until live D1 exact evidence exists.
