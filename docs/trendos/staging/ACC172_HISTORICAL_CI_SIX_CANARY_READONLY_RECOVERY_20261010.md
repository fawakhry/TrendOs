# ACC-172 — Repair stale A2.11/A2.12 read-only qualification against six-canary baseline
Date: 2026-10-10 | Branch `fix/acc172-historical-readonly-six-baseline-20261010`
Status: **source/CI offline PASS; real historical qualification job results pending post-merge; financial production NO-GO**.

## Incident and verified root cause
- ACC-170 merge [PR #51](https://github.com/fawakhry/TrendOs/pull/51) auto-triggered all affected accounting-source CI. Actual source/SQLite transaction integration was green, but [A2.11 qualification 38069630653](https://github.com/fawakhry/TrendOs/actions/runs/38069630653) failed because it expected the obsolete **four-canary** `requestLedger=4`; [A2.12 qualification 38069630721](https://github.com/fawakhry/TrendOs/actions/runs/38069630721) failed expecting the obsolete **five-canary** `deptLines=0`.
- The [A2.13 qualification](https://github.com/fawakhry/TrendOs/actions/runs/38069630693) uses the established **six-canary** baseline: materials/templates/parties/partyBalances/waste/deptLines each 1; requestLedger/events each 6; custody close, custody events, cashbox, stock, party ledger, purchases, daily purchases, final invoices and day closes each 0.
- Historical A2.11 and A2.12 operations had already completed successfully. Their original manual canary execution and manual deploy files are **not changed**, and there was no old canary replay.

## Exact remediation, not relaxing the controls
- `.github/workflows/easystore-a211-waste-qualification.yml`: the *qualification only* is now aligned to all 17 exact six-canary table counts. Preserves deployed frontend `OFF`, empty action list, `READONLY` server, no authority, zero commands, no Google business calls and a D1 `SELECT` statement only. Historical qualification logging now says `ALREADY_COMPLETED_NO_REPLAY` instead of implying an upcoming A2.11 write.
- **Removed A2.11's inappropriate GitHub repository mutation**: replaces workflow `contents: write` with `contents: read`, removes `tee .github/a211-waste-qualification-result.txt` and bot `git commit`/`git push` from the live CI job. Its already-committed historical `.github/a211-waste-qualification-result.txt` remains unchanged, and no repository artifact is overwritten.
- `.github/workflows/easystore-a212-dept-line-qualification.yml`: updates only current read-only D1 exact baseline (deptLines=1, requestLedger/events=6), labels the historical A2.12 candidate `ALREADY_COMPLETED_NO_REPLAY`, preserves OFF/READONLY/zero-budget checks and its D1 SELECT.
- New `tests/easystore_acc172_historical_baseline_regression.test.mjs` statically verifies A211/A212/A213 all match same full 17-table snapshot, no workflow_dispatch, no repo write permission or git push, SELECT-only D1 and OFF/READONLY/zero command budget. Negative tests reject old counts, loosened backend mode, changed D1 SELECT into UPDATE, and repository writes.
- New `.github/workflows/easystore-acc172-historical-readonly.yml` runs the regression with Node22 **without Cloudflare credentials or remote SQL** on PR; main existing A2.11/A2.12 qualification workflows will still run their actual authorized **read-only** D1 SELECT + public health checks on merge to the accounting candidate.

## Evidence
- [ACC-172 offline workflow #38070091539](https://github.com/fawakhry/TrendOs/actions/runs/38070091539) **SUCCESS**, job 114265550131; outputs `ACC172_A211_A212_A213_CURRENT_SIX_CANARY_EXACT_COUNTS=PASS`, `ACC172_A211_AUTOBOT_REPOSITORY_MUTATION_REMOVED=PASS`, `ACC172_READONLY_D1_QUERY_AND_OFF_HEALTH_LOCKED=PASS`, `ACC172_OLD_BASELINES_AND_WRITE_PERMISSION_MUTATIONS_REJECTED=PASS`.
- No new A2.11/A2.12 execution; no Worker or Pages deployment; no finance POST, D1 INSERT/UPDATE/DELETE, Cloudflare finance unlock or employee permission change. Note that the source CI itself does not prove future live mutable finance acceptance.

## Release impact
- Operational benefit: avoids false red historical checks after future accounting-code merges, and stops a read-only qualification from committing on the production-connected candidate branch.
- Strict **fail-closed**: any amount of legitimate concurrent live financial business evolution that changes the six-table snapshot will make these CI qualification checks fail for explicit review. Exact baseline is a snapshot, not a claim that counts should never change after future signed go-live.
- G1 actual custody close still not accepted; G2 role grant #40 still requires owner signoff; G3 authoritative opening books and cutover date not signed; G4 SQL fix ACC-170 merged source only (not deployed); G5 release handover not approved. Five original financial acceptance gates remain open.
