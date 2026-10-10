# ACC-177 — Actual shared-base Worker merge rehearsal: old deploy guard blocked by master-book overlap

**Date:** 2026-10-10
**Source branch:** `test/acc177-accounting-worker-merge-tree-rehearsal-20261010`
**Outcome:** **SAFE_HALT_PASS; MERGED_WORKER_TREE_NOT_CREATED; PRODUCTION_RELEASE_NO_GO**.

## Context and inspected source

Following ACC-176, inspected the real manual accounting readonly deployment workflow `.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml`. Before `wrangler deploy`, it obtains latest `candidate/t12-full-cloud-cutover-a56-20260929`, checks every file changed by that shared base against accounting changes since the common ancestor, and allows exactly the pre-existing two workflow file exceptions. All other path overlaps trigger a **hard failure**. This is an existing valid security gate and was NOT weakened.

In the original ACC-177 GitHub Actions dry-run:
- Accounting rehearsal SHA `bc40ccf333917d5a5d8959fff5f0d9cb48657aa1`, shared-base branch commit `7d20cfc463ce084ceaba8ac440dffa53512fe662`.
- [First ACC-177 run 38074527827](https://github.com/fawakhry/TrendOs/actions/runs/38074527827) correctly FAILED at **source-overlap guard** with `ACC177_RELEASE_MERGE_SOURCE_OVERLAP_BLOCKED=TrendOS_MASTER_BOOK.md`, `ACC177_SHARED_ACCOUNTING_OVERLAP=TrendOS_MASTER_BOOK.md`. No Worker tree was merged, no finance test on merged code occurred.
- Independent GitHub content comparison confirmed `TrendOS_MASTER_BOOK.md` differs significantly between accounting and shared branches (accounting blob `a49ba2b4b478fbfddd7172db1d1233e610b56631`, shared blob `b8971a397304a75ed30db56f36e6da516ab302c7` during initial check). Both contain real history for different active projects. **Neither book should be replaced wholesale or discarded.**
- Critical adjacent source comparison: `cloudflare-d1/src/employee-accounting-native-v1.mjs` on accounting is blob `eb6f73f2c5750316af587832868a4a8604372614`, but the shared branch holds a separate older file blob `66440daa0c737966221f5b279a210b4211144d2c`; `src/index_v2.js` and `production-shadow/index.js` blobs matched. This does NOT make cross-family runtime compatibility or deploy safe; no merged Worker release accepted.

## Implemented fail-closed diagnostic

Added:
- `scripts/acc177_finance_worker_merged_tree_receipt.mjs`: a source-only receipt validator. An **unblocked** rehearsal would require actual `git merge --no-commit` in an isolated worktree and then pass ACC-170/174 actual Worker SQLite cases and ACC-175 fake verified principal roles; manifest records both input commit IDs and the *actual uncommitted Git tree* SHA. Even an unblocked merge still outputs `NO_GO` and does not authorize deploy.
- When overlapping non-allowlisted paths are detected, its explicit `--blocked` mode stores a non-sensitive, accurate `BLOCKED_BY_UNAPPROVED_OVERLAP` status with both input source commit IDs, worker source SHA-256 fingerprints and the offending file paths. It explicitly records `merged_tree_created: false` and `integrated_merged_tree_tests_executed: false`. It does NOT forge a successful merge tree or silently ignore a book conflict.
- `tests/easystore_acc177_merge_tree_rehearsal.test.mjs`: negative cases reject invalid SHA, SQL placeholder regression (ACC-170 or ACC-174), absent ACC-175 verified roster, any unapproved shared source overlap including `index_v2`, Worker, `wrangler.toml` and `TrendOS_MASTER_BOOK.md`; confirms that both merge-success receipts and blocked receipts always remain NO_GO.
- `.github/workflows/easystore-acc177-merged-worker-tree-offline.yml`: Node22 source-tests and local `git fetch`/diff/overlap detection using read-only GitHub access; records exact branch SHA; only attempts isolated git worktree merge/real finance in-memory tests when original deploy overlap guard reports **NO COLLISION**. With a collision, writes a 14-day, non-sensitive **blocked receipt**, outputs successful *safety guard enforcement*, and never attempts merge/deploy. **No Cloudflare secret, Wrangler deploy, D1 DML, Pages edit or financial HTTP POST**.

## Final checked dry-run evidence

[ACC-177 safe-halt run #38074706828](https://github.com/fawakhry/TrendOs/actions/runs/38074706828) **SUCCESS** on source SHA `ef6483da7124ea58ead0f6d8e099f76e6dc7e38a`, shared SHA `7d20cfc463ce084ceaba8ac440dffa53512fe662`:
```
ACC177_CONFLICTED_BOOK_FAIL_CLOSED_WITHOUT_FAKE_MERGED_TREE=PASS
ACC177_UNAPPROVED_SHARED_SOURCE_OVERLAP_REJECTED=PASS
ACC177_SUPPLIER_CUSTODY_SQL_AND_ROSTER_REGRESSIONS_REJECTED=PASS
ACC177_SHARED_ACCOUNTING_OVERLAP=TrendOS_MASTER_BOOK.md
ACC177_EXISTING_RELEASE_GUARD=BLOCKED_BY_TrendOS_MASTER_BOOK.md
ACC177_SAFE_HALT_WITH_NO_DEPLOYMENT=YES
ACC177_EXISTING_PRODUCTION_DEPLOY_GUARD=BLOCKED
ACC177_MERGE_TREE=NOT_CREATED
ACC177_RELEASE_DECISION=NO_GO
ACC177_PRODUCTION_MUTATIONS=ZERO
```
The CI run shows the safety stop and evidence capture work. It does **not** show that the candidate Worker successfully merges with the shared base, or that any deployment was executed or approved.

## Release decision and remediation boundary

**Immediate G5 stop:** original existing deploy workflow cannot be reused safely while this unreviewed source overlap persists. A future owner-approved integration must reconcile and preserve BOTH master-book timelines without wiping active printshop work, verify exact final merged tree, rerun both accounting and shared-platform regression checks, pin an immutable approved deploy artifact, prove restorable backup/rollback, and receive fresh controlled change authorization. Do not bypass the legacy overlap guard, force `git merge -X ours`, erase one book, modify live employee permissions, or deploy based only on a successful CI safety-halt.

G1 original actual A2.13 authenticated custody close, G2 owner grant matrix (#40), G3 signed opening balances, G4 real finance transaction acceptance, G5 backup/pinned release/rollback all remain OPEN. Accounting backend must remain READONLY and frontend OFF unless separately authorized.
