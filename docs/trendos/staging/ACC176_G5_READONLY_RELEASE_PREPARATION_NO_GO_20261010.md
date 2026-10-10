# ACC-176 — Finance Worker release preflight, source pinning gap and explicit NO-GO

**2026-10-10 | Source branch:** `safety/acc176-readonly-finance-release-preflight-20261010`
**Result:** public GET safe-idle PASS; release authorization **NO_GO**; no deployment, backup write, finance POST or D1 mutation.

## Why ACC-176 was necessary
The actual accounting source fixes from [ACC-170 / PR #51](https://github.com/fawakhry/TrendOs/pull/51) and [ACC-174 / PR #55](https://github.com/fawakhry/TrendOs/pull/55) are merged in `candidate/easystore-accounting-a2-20261005`, as is [ACC-175 owner-roster infrastructure / PR #56](https://github.com/fawakhry/TrendOs/pull/56). Previous acceptance tests verified **checked-in code and synthetic in-memory D1**, not the currently deployed Cloudflare Worker.

Source review showed:
- `cloudflare-d1/wrangler.toml` targets `cloudflare-d1/production-shadow/index.js`, which imports `src/index_v2.js`, which routes to the original `src/employee-accounting-native-v1.mjs`. Source reachability is therefore checked; a source change affects other shared Worker endpoints on an eventual real deployment.
- The pre-existing manual `.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml` **merges the latest separate shared base** via `git merge --no-edit FETCH_HEAD` before `wrangler deploy`. Existing overlapping-file guards and rollback are beneficial, but without independently pinning/reviewing the resulting merged Git tree and validating backup restoration, the exact final deploy artifact and blast radius remain unproven.
- An isolated Cloudflare D1 backup/restore proof, owner-signed release ticket, signed G2 staff roster and G3 opening books do not exist in the ACC-176 evidence. **Do not claim any backup was taken or restored.**

## Implemented (read-only, no credentials)
- `scripts/acc176_finance_release_readiness.mjs` compares the committed deploy entrypoint/chain, fixes for supplier `payment_paid` and `HANDOFF` SQL placeholders, inactive strict roster config, and manual A2.13 published bootstrap safety checks against production **public GET** EasyStore `config.js`, `app.js` and accounting `/health`.
- Backend health must explicitly return `success=true`, `schemaReady=true`, `READONLY`, `authoritativeWrites=false`, `writeCanaryReady=true` and all six canary user/action/money/expiry/command fields as **present numeric zero**. Published EasyStore flag declarations must occur exactly once with OFF, READONLY and no finance write/actions.
- Report in `artifacts/acc176-finance-release-no-go.json` includes original Worker source SHA-256, boolean checks and eight explicit release blockers. Every execution outputs `release_decision: NO_GO` **even when read-only checks are green**. No production secrets, employee list or private business rows are in the artifact.
- `tests/easystore_acc176_finance_release_readiness.test.mjs` exercises synthetic negative cases for missing/nonzero canary fields, every dangerous server mode, duplicate or missing client OFF/READONLY flags, removal of either SQL repair, missing approved roster strict handler, missing A2.13 prearm check and an incorrect Worker entrypoint. Also confirms auto-GO never follows from synthetic green checks.
- `.github/workflows/easystore-acc176-finance-release-no-go.yml`: on PR and source paths, Node22 offline negatives and two public asset GETs + backend health GET; validates published app syntax and OFF-mode bootstrap, evaluates NO_GO report, uploads **non-sensitive artifact** for 14 days. GitHub contents permission read-only, **no Cloudflare credentials, Wrangler, D1 commands, Worker/Pages deploy, HTTP finance POST or workflow_dispatch**.

## Live GET and CI evidence
[ACC-176 source CI and public safe-idle #38073710691](https://github.com/fawakhry/TrendOs/actions/runs/38073710691) **SUCCESS**, job `114276189313`.

Logs include:
```
ACC176_LOCAL_ENTRYPOINT_AND_FINANCE_SQL_SOURCE=PASS
ACC176_SOURCE_REGRESSION_AND_BOOTSTRAP_NEGATIVES=PASS
ACC176_RUNTIME_OFF_READONLY_ALL_ZERO_FIELDS_NEGATIVES=PASS
ACC176_NEVER_AUTO_APPROVES_RELEASE=PASS
ACC176_ENTRYPOINT_POINTS_TO_ORIGINAL_WORKER=PASS
ACC176_BOTH_FINANCE_SQL_FIXES_PRESENT=PASS
ACC176_PUBLISHED_FRONTEND_OFF=PASS
ACC176_PUBLIC_SERVER_READONLY=PASS
ACC176_PUBLIC_SERVER_ALL_CANARY_ALLOWANCES_ZEROED=PASS
ACC176_OLD_RELEASE_JOB_NOT_VERSION_PINNED=PASS
ACC176_PUBLIC_SAFE_IDLE=PASS
ACC176_RELEASE_DECISION=NO_GO
ACC176_PRODUCTION_MUTATIONS=ZERO
```

`ACC176_OLD_RELEASE_JOB_NOT_VERSION_PINNED=PASS` means the preflight **detected a known unpinned merge risk**, not that the deploy is qualified. This check is informational; the resulting release decision remains NO_GO.

## Before an actual code-only Worker deployment can be approved
1. Resolve G1 actual authenticated A2.13 owner-authorized zero-value acceptance; do not replay A2.10/A2.11/A2.12 or the failed previous A2.13 without fresh scoped approval.
2. Obtain owner-signed explicit finance username-to-role mapping (#40) and verify on genuine logged-in staff; staged ACC-175 `ENFORCE` is **not configured**. Production money writes stay READONLY, even under any new code-only release.
3. Establish authoritative G3 historical opening-balance source, cutover date and reconciled ledgers; sign off any migration before D1 import.
4. Independently prove database recovery: backup identifier/timestamp, protected retention, restore to isolated nonproduction target, checksum/sample validation, recovery operator and time-bound rollback evidence. Never run the backup or restore from this CI.
5. Pin exact source candidate commit **after any shared-base merge**, review cross-endpoint diff, record the current active Worker version, stage safe readonly health/negative tests, obtain operator maintenance window and a **fresh narrowly scoped production deployment approval**. Keep existing frontend OFF, server READONLY, command budget=0, all financial grants unchanged; roll back to exactly the captured predeploy version on any drift, fail closed on unknown outcome.
6. Verify post-release all Worker families, request-ledger invariance, Cloudflare backend and EasyStore public UI; separately approve G4 genuine operating transactions and G5 monitored rollback drills.

**Release state:** G1–G5 remain OPEN. ACC-176 is a safe source/GET preflight and a precise stop checklist, **not** a backup, deployment, D1 migration, real transaction or authorization for one.
