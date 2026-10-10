# ACC-182 — Actual pinned merged Worker tree, exact source authentication drift and immutable offline NO-GO receipt

**Date:** 2026-10-10  
**Scope:** G5 source-only release preparation, with production and finance explicitly locked.  
**Result:** offline merged Worker tree + customer/auth/finance SQLite validation PASS, **release NO_GO**.

## Why this stage exists

ACC-178 proved that accounting and the T12 shared platform can be merged and that both book timelines can be preserved. The existing manual real `.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml` still **fetches the latest unpinned T12 shared head** and blocks the shared `TrendOS_MASTER_BOOK.md` overlap. Thus its current deployment path is **not approved/qualified**, and source-only ACC-178 does not authorize dispatch. ACC-181 owner direction demands fresh books with **no historic transaction import** and **no start date until a separately approved go-live**; automatic opening remains prohibited.

Inspection of actual original source revealed an important exact merge difference in `cloudflare-d1/wrangler.toml`, the Cloudflare Worker source config. The accounting branch says:
```
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"
```
The pinned shared branch `candidate/t12-full-cloud-cutover-a56-20260929` at commit `7d20cfc463ce084ceaba8ac440dffa53512fe662` says `"true"` for **exactly these two variables**. Git's three-way merge includes the shared config (accounting branch retained the common-base version). This is a source **difference**, not a demonstrated Production environment change; the existing manual workflow generates a `keep_vars = true` deployment config. **Do not infer that live auth has switched or that its real employee behavior is automatically qualified.**

## Executed original-code, isolated source reconciliation

Implemented:
- `scripts/easystore_acc182_offline_worker_release_manifest.py` confirms actual checkout HEAD and exact Git `write-tree` SHA with no unresolved staged file and no unstaged modifications. Requires the full source byte hashes of the **unchanged accounting handler**, `src/index_v2.js` dispatcher, `production-shadow/index.js`, owner ACC-181 finance cutover JSON and old manual release workflow to match their accounting-branch bytes. Checks the exact supplier-payment and custody-handoff SQL repairs and trusted session-based finance roster handler.
- TOML parser `tomllib` verifies that Worker identity/entrypoint/D1 binding and **all variables except the two exact reviewed employee authentication flags** are unchanged, and those two must have the exact expected `"false"` → `"true"` source transition. Anything else fails closed: an extra production write/canary flag, bad database binding, unexpected config value, missing variable, or a routing change. Source drift **never authorizes a live authentication settings change**.
- Verifies new finance cutover remains `cutover_date_local:null`, no auto activation, existing `READONLY` and frontend `OFF`, and immutable `release_decision:NO_GO`.
- `tests/easystore_acc182_offline_worker_release_manifest.test.py` injects tampered Git SHAs, file differences, unauthorized D1/canary config changes, changed entrypoint, forged finance cutover/GENERAL/CANARY mode and altered historical deployment workflow; all must fail closed.
- `.github/workflows/easystore-acc182-offline-pinned-worker-artifact.yml` checks out the exact Git commit, checks that the latest shared branch still matches pinned `7d20...`, performs **actual `git merge --no-commit` in an ephemeral checkout**, confirms exactly one unresolved file `TrendOS_MASTER_BOOK.md`, and invokes ACC-178's byte-exact three-way lossless book reconciler against the original `:1/:2/:3` index blobs. Then runs *original merged* finance ACC-170/174 SQLite Worker scenarios, ACC-175 cloud-verified fake-role tests and shared T12 customer-search, auth and production-shadow tests. Writes the exact resulting Git tree SHA and non-sensitive source-hash receipt, never a deployment artifact or a finance GO claim.
- The receipt includes **no secrets, financial data, employee names or access grants**, and hardcodes `safe_to_execute_old_deploy_workflow:false`, real production backup/restore `false`, old live Worker rollback proof `false`, finance start date `null`, production mutations `0` and `release_decision:NO_GO`.

## Evidence

[ACC-182 initial exact offline Worker merge CI #38082129213](https://github.com/fawakhry/TrendOs/actions/runs/38082129213), job `114301041139`, **SUCCESS** on isolated source commit `70eb3f338e193c39fbcdfd29d06963fa007d4e2b`, shared source `7d20cfc463ce084ceaba8ac440dffa53512fe662`, reconciled (uncommitted, undeployed) **Git tree `53c94de34ba65752c4f180b6a718e9ed87cdf392`**:

```
ACC182_SOURCE_SHA_AND_SHARED_REF_TAMPER_DENIED=PASS
ACC182_EMPLOYEE_AUTH_FLAG_DIFF_EXACTLY_TWO=PASS
ACC182_FINANCE_ROUTING_AND_SQL_UNEXPECTED_MERGE_CHANGE_DENIED=PASS
ACC182_D1_BINDING_SHARED_CONFIG_DRIFT_AND_CUTOVER_AUTO_GO_DENIED=PASS
ACC182_REAL_MERGED_ACCOUNTING_AND_SHARED_RUNTIME_SOURCE_TESTS=PASS
ACC182_ACCOUNTING_WORKER_SOURCE_UNCHANGED=PASS
ACC182_SHARED_AUTH_SOURCE_FLAG_DRIFT_REVIEWED=PASS
ACC182_OWNER_DEFERRED_CUTOVER_DATE_UNSET=PASS
ACC182_OLD_DEPLOY_NOT_SAFE_TO_DISPATCH=YES
ACC182_RELEASE_DECISION=NO_GO
ACC182_PRODUCTION_MUTATIONS=ZERO
```

This "pinned candidate" refers to **one observed offline Git tree**, not a signed or deployed immutable production release. Any later candidate-source change generates a **different tree SHA** and must be re-reviewed and retested. The real manual deployment workflow remains unmodified and is **not dispatchable safely** because of the source overlap/approval constraints.

## Still open before financial go-live

G1 real bounded authenticated A2.13 custody-close acceptance; G2 owner-signed permissions and verified operator sessions (#40); G3 owner-approved physical inventory, cash and old-obligation boundary, with effective date **chosen only at actual separately approved launch**; G4 real operating finance cycle with reviews; G5 encrypted genuine Cloudflare D1 backup, *isolated* full restore and reconciliation, pre-existing production Worker version pin with controlled rollback drill, reviewed exact code artifact and approved release window.

No data deletion, import, live Worker/Pages deploy, Cloudflare API credentials, D1 remote query/write, real financial POST, authorizing finance grants or actual A2.13 arm in ACC-182.
