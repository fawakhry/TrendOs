# ACC-178 — Tested merged Worker tree with lossless shared + accounting master-book reconciliation

**Date:** 2026-10-10 | **Stage:** G5 isolated pre-release integration | **Finance release decision: NO_GO**

## Actual result

[Original GitHub real conflict inventory #38075366856](https://github.com/fawakhry/TrendOs/actions/runs/38075366856) proved an actual `git merge --no-commit --no-ff` of accounting and the latest pinned shared platform contains **exactly one unresolved path**: `TrendOS_MASTER_BOOK.md`. No other unresolved code conflict was detected.

The common ancestor of these two active sources is `4431ce61ad40f1f76003b80b0c6ebf43695abacf`. Accounting master-book content is strictly **append-only relative to the full byte sequence of the base** (original base book 202,543 UTF-8 characters, accounting book 262,355 before ACC-178; shared master 309,273). The newer shared book revised its intro and appended substantial platform history, which must not be dropped.

ACC-178 adds `scripts/easystore_acc178_reconcile_book.py`: for the **actual Git index stage 1/2/3 files** of the single unresolved book, it requires accounting to begin with the exact whole ancestor, requires the unique last 4096 bytes of the ancestor to be present in the shared book followed by shared changes, rejects duplicate reconciled headers, and constructs:

```
combined_master_book = shared_book_verbatim
                       + explicit ACC178 provenance separator
                       + accounting[len(common_base_book):]  # byte-exact appended accounting history
```

The shared platform book including all of its revised header, instructions and later projects is retained byte-for-byte. Every original post-base accounting entry (ACC-157 onward, including ACC-170/174/175 and current ACC178) is appended unchanged. The earlier original accounting book remains accessible by its exact immutable Git commit. The script records SHA-256 of the original base, shared book, accounting book, accounting appended suffix and combined book. There is **no `-X ours` / `-X theirs` overwrite, dropped timeline, overwrite of live books, forced merge or modification to production deployment guards**.

## Tested executable integrated Worker tree

[ACC-178 successful actual merged-tree qualification #38075811493](https://github.com/fawakhry/TrendOs/actions/runs/38075811493), job `114282411358`:

- Accounting isolated checkout source SHA: `b922ee0aa16ff6191ce72151bd75d4de22c8dd41`
- Shared platform pinned source SHA: `7d20cfc463ce084ceaba8ac440dffa53512fe662`
- Actual Git worktree **uncommitted merged source tree** SHA: `9e714ac606937067e7ade05c48a47b4a377357a5`
- Reconciled master book SHA-256: `f2db989d9a5ad464175a61bd7ef455d959e6768e3e22a76f44a83f4e17b6324a`
- Checks: `ACC178_VERBATIM_SHARED_BOOK_AND_ACCOUNTING_APPEND=PASS`, `ACC178_ORIGINAL_BOOK_SHA256_PROVENANCE=PASS`, `ACC178_MUTATED_OR_MISSING_HISTORY_FAIL_CLOSED=PASS`, `ACC178_BOTH_BOOK_TIMELINES_PRESERVED=PASS`, `ACC178_RECONCILED_TREE_SHA=9e714ac606937067e7ade05c48a47b4a377357a5`.
- The original Worker route/syntax and actual migrated SQLite finance handler tests on that **resolved, integrated worktree** all PASS: [ACC-170] purchase/partial supplier payment/reversal/direct sale/stock/cashbox/day close and readonly rejection; [ACC-174] staff purchased stock exactly once, approval, handoff/settlement/zero-value close, deferred payable, rejection/reversal, idempotency and readonly; [ACC-175] fake cloud-verified principal strict roster and invalid/role spoof rejection with fallback absent server-only gate.
- Shared T12 smoke on the **same merged tree** PASS: `cloudflare_a51_production_shadow_customer_route.test.mjs`, `t12_customer_native_search_a54.test.mjs`, `employee_auth_native_a61.test.mjs`. No network or external real employee session was used in these tests.
- Original shared-branch staged changes had **42 existing trailing whitespace diagnostics**, including shared master record workflow files; ACC-178 reports them without rewriting platform history. These are source hygiene diagnostics, **not a waived conflict or proof that final deployment is safe**. Scripts do fail closed for unresolved files other than the book.
- Workflow GitHub permissions `contents: read`. No Cloudflare credentials or Wrangler, D1 production DML, HTTP finance POST, Pages deploy, Worker deploy, live rollback or staff grant updates. Output receipt stored in GH Actions artifact for 7 days, containing SHA hashes/counts/NO_GO but **not** the confidential complete book text.

## Difference from ACC-177 / outstanding deployment conflict

[ACC-177 original safety halt](ACC177_G5_SHARED_BASE_MERGE_COLLISION_SAFE_HALT_20261010.md) was correct: the **existing historical production deployment workflow** rejects any source overlap including the master book before any Worker merge. ACC-178 proves that in a separate disposable Git worktree, **the only actual merge conflict can be resolved losslessly and authentic finance/shared code tests pass**. It does **not** modify the old production deploy workflow or silently exempt the book. The accounting branch and shared branch have not been merged via a permanent reviewed two-parent Git commit; hence the original G5 deployed release blocker remains, and a new approved integration PR must preserve both histories and review the exact merged tree.

## Required before production

1. Review the merged-source candidate together with the printshop/shared platform maintainer, preserving the provenance/hashes; integrate as a **reviewed source merge**, not a forced bypass.
2. Re-run exact candidate tests and dependency checks on immutable reviewed commit SHA; check cross-family production runtime and Worker version pin.
3. Independently create **and restore-verify** a secure financial D1 backup on a nonproduction target; capture existing Worker version, isolated rollback controls and runbook.
4. Obtain owner approval of G2 private authenticated finance roster (#40), G3 opening balances/cutover, a narrowly scoped production release, G1 A2.13 single authenticated zero-value custody acceptance and G4 real end-to-end financial tests.

**Financial go-live gates G1–G5 all OPEN. The merged tree is a test artifact, not a deployed version.**