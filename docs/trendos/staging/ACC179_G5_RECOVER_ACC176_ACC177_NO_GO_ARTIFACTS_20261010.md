# ACC-179 — Recover ACC-176/177 safety workflows after ACC-178 master-book merge (source-only)

Date: 2026-10-10 | Candidate: `candidate/easystore-accounting-a2-20261005`
Source branch: `fix/acc179-rebase-g5-safe-ci-evidence-20261010`

## Reason

[ACC-178 PR #59](https://github.com/fawakhry/TrendOs/pull/59) **MERGED** with byte-preserving master-book resolution rehearsal + CI tests. Its [postmerge CI #38075998785](https://github.com/fawakhry/TrendOs/actions/runs/38075998785) **SUCCESS** again proved isolated source-merged finance ACC-170/174/175 + shared T12 auth/customer compatibility; still **no production financial deployment**.

The old earlier source-only [ACC-176 PR #57](https://github.com/fawakhry/TrendOs/pull/57) and [ACC-177 PR #58](https://github.com/fawakhry/TrendOs/pull/58) were created from the pre-ACC178 accounting candidate. After #59 merged, GitHub accurately reported both PRs as **not mergeable** due to their independent appended `TrendOS_MASTER_BOOK.md` changes. It is unsafe to resolve this by accepting an old copy of the book or force-merging a stale branch.

## Applied actual changes

Re-created on a fresh ACC179 branch based on the **new** candidate, with exact old Git blob content, all eight non-master files:

ACC-176 original:
- `.github/workflows/easystore-acc176-finance-release-no-go.yml`
- `scripts/acc176_finance_release_readiness.mjs`
- `tests/easystore_acc176_finance_release_readiness.test.mjs`
- `docs/trendos/staging/ACC176_G5_READONLY_RELEASE_PREPARATION_NO_GO_20261010.md`

ACC-177 original:
- `.github/workflows/easystore-acc177-merged-worker-tree-offline.yml`
- `scripts/acc177_finance_worker_merged_tree_receipt.mjs`
- `tests/easystore_acc177_merge_tree_rehearsal.test.mjs`
- `docs/trendos/staging/ACC177_G5_SHARED_BASE_MERGE_COLLISION_SAFE_HALT_20261010.md`

All 8 original contents were fetched from their authoritative source branches and copied **verbatim** via GitHub connector, retaining matching blob SHA. The old master book copies were **NOT** copied or restored; the latest valid ACC-178 candidate book is retained, with a separate ACC-179 additive checkpoint documenting prior ACC-176/ACC-177 provenance.

## Technical boundaries and expectations

- ACC-176 workflow checks actual public EasyStore config + app GET and Worker finance-health GET for frontend OFF, backend READONLY, schema and zero bounded-canary user/action/expiry/money/command settings; source includes real ACC-170/174 SQL fixes and ACC-175 opt-in grant logic. Its code **never** infers finance GO from passing safe-idle; report remains `release_decision: NO_GO`.
- ACC-177 workflow detects the *existing* production deploy overlap between shared and accounting books; it must preserve the original fail-closed `BLOCKED_BY_UNAPPROVED_OVERLAP` receipt with **no fake merged tree** and NO live deploy. Later independent ACC-178 rehearsal remains the qualifying evidence for an actual disposable merged tree only.
- Both workflows have `permissions: contents: read`, no Cloudflare credentials or Cloudflare deploy, no D1 SQL writes, no financial HTTP POST, no live A2.13 dispatch, no authenticated staff grant changes. They do not add a production deployment workflow or resolve the original release GO/NO-GO authorization.
- This recovers original source-only CI files without modifying pre-existing finance source, shared platform, EasyStore frontend or employees.

## Release decision

**Finance Production remains NO_GO**. Owner/private G2 real staff identity-to-grant approvals (#40), G3 signed authoritative opening balances/cutover, G1 real bounded authenticated A2.13 custody close, G4 production-like integrated genuine finance transactions, G5 backup/restore/pinned approved release/real rollback are still OPEN. ACC-179 adds safety tooling and evidence, not a deployment permission.
