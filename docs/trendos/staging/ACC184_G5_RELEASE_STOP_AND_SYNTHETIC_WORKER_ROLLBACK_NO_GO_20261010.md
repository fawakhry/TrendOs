# ACC-184 — Financial release STOP matrix and synthetic Worker rollback boundary

**Date:** 2026-10-10  
**Scope:** offline CI, tests, code and documentation ONLY.  
**Decision:** NO_GO. No live Worker, Pages, D1, employee grant or financial action.

## Provenance: what actually happened before this stage

ACC-183 [PR #64](https://github.com/fawakhry/TrendOs/pull/64) was already MERGED before ACC-184 began. The real [postmerge job 38083057715](https://github.com/fawakhry/TrendOs/actions/runs/38083057715), job 114303759642, finished SUCCESS at accounting source commit 9af8c034992d765cf124dbf59768f01c717bc108. Its pinned T12 source is 7d20cfc463ce084ceaba8ac440dffa53512fe662 and the observed isolated reconciled tree is **f7413b3e44cd028351f5e8490c6c3a500d01e0a1**, recovered from the actual Action job log. Wrangler 4.33.2 compiled README.md (115 bytes), index.js (1,039,708 bytes), index.js.map (1,597,605 bytes) in --dry-run without Cloudflare credentials. This is only **historical source/build evidence**; it is not an approved or currently deployed Worker version, and the later master-book-only candidate commit is not the same tree.

## Safety controls implemented

- The ACC184_G5_RELEASE_STOP_INPUT_NO_GO_20261010.json document pins the **observed previous GitHub receipt** and explicitly leaves previous production Worker version ID/provenance **null**, real protected D1 backup/restore **false**, live rollback proof **false**, G1–G5 signoffs **false**, start date **null**, old float-head manual deployment approval **false**, financial writes **OFF/READONLY**, and finance release **NO_GO**. These are last reported controls or known *missing proofs*, **not a fresh production query**.
- The easystore_acc184_release_stop_rollback_model.py checker treats the entire historical input as immutable: changed schema, any additional/missing field, hash/tree/compiler/run identity drift, employee permissions, D1 binding approval represented by a forged new field, finance GO, frontend/backend mode, canary budget, or cutover date cause STOP. Python strict type checks prevent 0 being accepted as False.
- The script emits nine actionable stop reasons for G1–G5; missing real Worker version and its provenance are explicit. It **never supplies an alternate historical Worker version** or a mock ID as production evidence.
- Pure in-memory simulate_offline_rollback exercises two **fake byte snapshots** and a **fake immutable database**. It rejects changed database bytes, because reverting Worker code cannot reverse committed D1 data. The test deliberately uses **no Cloudflare API**, Wrangler, database, URLs, credentials, real employee identity or production restore.
- The easystore-acc184-finance-release-stop-rollback-offline.yml workflow has contents:read, no credentials, no Cloudflare deployment, no real financial POST or D1 SQL. It runs fail-closed ACC184 negative tests plus the original offline ACC170/174/175/180/182/183 regression checks and retains only a non-sensitive aggregate NO_GO JSON receipt for 14 days.

## Mandatory tasks before a real owner-approved release

1. **G1:** One separately authorized authenticated bounded custody-close acceptance (old A2.13 attempts are not to be replayed).
2. **G2:** Owner-approved real finance employee/role map in [Issue #40](https://github.com/fawakhry/TrendOs/issues/40), positive and negative real-identity signoff, preserve existing employee login behavior.
3. **G3:** Actual stocktake, treasury/custody and remaining old liabilities recorded and signed. User chose new books without historic transaction import, **not** production data deletion. The cutover date stays null until separate owner-approved go-live.
4. **G4:** Approved actual full purchasing, sales, stock, cashbox, debt, refund and day-close acceptance.
5. **G5:** **At authorized release time only**, operator must securely identify and retain the currently deployed Worker version ID, immutable deployment/route/env/D1 binding provenance, protect a **real** D1 backup, perform an **independent isolated real-data restore**, and qualify non-destructive rollback/monitoring. If the previous Worker ID, config or binding is missing/changed, STOP. If real database rows change, a Worker rollback alone is insufficient: restore/reconcile requires distinct authorization. Do not place secrets or financial records in a public GitHub issue/artifact.
6. Prior historic .github/workflows/easystore-a2-accounting-readonly-api-deploy.yml follows a floating shared head and overlaps the protected main book. **Do not dispatch it.** Future approved release must be separately pinned, reviewed and issued an independent deployment permission.

## Evidence discipline

The ACC-183 run succeeded (verified before this stage), but the ACC-184 source-only checks and CI must only be marked successful **after the actual GitHub Actions result**. A PR merge does not authorize deployment. No new live production-state claims are made.
