# ACC-157 — A2.13 custody canary monitor timeout, isolated PREPARE
Date: 2026-10-10. Source HEAD: `3aebeada28c9f5e6095abe450d46fd2341fe791a`, branch `candidate/easystore-accounting-a2-20261005`.
Isolation: `fix/a213-custody-monitor-settlement-20261010`. Scope: REPO-ONLY change to the **manual-only** A2.13 execution monitor and offline tests; not a new financial execution.

## Latest authoritative evidence (reviewed, no new command)
- Supplier A2.10 completed successfully: `.github/a210-supplier-final-closure-result.txt`, inactive synthetic supplier with zero opening balance, Production READONLY and no write budget. No supplier retest.
- A2.13 attempted execution: https://github.com/fawakhry/TrendOs/actions/runs/37825991019 , job 113478882411. Its preflight passed, then `commands_started` became 1, and workflow raised `command started but did not settle within 30s`. Cleanup verified READONLY.
- The independent read-only reconciliation: https://github.com/fawakhry/TrendOs/actions/runs/37827293806 , job 113494283873, found `custodyCloses=0`, `custodyEvents=0`, `cashbox=0`, `stockMoves=0`, `requestLedger=6`, `events=6`, no A213-CCLOSE business request or event, and no canary budget. This establishes **no verified financial mutation**, not a reason to retry automatically.
- Existing published EasyStore `app.js` wraps D1 API calls in a 90,000 ms AbortController timer. The A2.13 workflow measures only seven STARTED/WRANGLER poll cycles (roughly 30s, excluding poll overhead) before reporting a failure. This monitoring timeout is premature relative to the client wait. It cannot by itself prove why the backend never committed: the failure could also be an employee-session, policy, D1 transaction or transport issue.
- Critically, `commands_started=1` is a **budget-reservation observation**, not evidence that the custody close transaction was committed or even reached the final INSERT.

## Exact proposed isolated change
1. Change only the A2.13 **manual workflow's observation window** from six 5-second poll intervals to an explicit wall-clock 120,000 ms limit starting upon observed reserved budget, providing the 90,000 ms UI fetch wait plus up to 30,000 ms observation/transport slack. Keep the 15-minute canary expiration, one-user/one-action/one-command budget, baseline, mandatory trap cleanup, and exact D1 evidence assertions unchanged.
2. Label a monitor timeout `UNKNOWN_OUTCOME_DO_NOT_RETRY`, not a successful or definitely failed custody close; trap must restore READONLY.
3. Add executable offline regression asserting no premature cutoff (simulation at 90/105/119s), fail-closed after 120s, and static workflow invariants. Add CI that does **not** execute the manual canary, call production APIs, or access Cloudflare secrets.
4. Observe GitHub CI and record exact run in this file before considering further action.

## Safety gates
- **DO NOT** arm CANARY, dispatch manual A2.13 execution, consume another command, open GENERAL, publish frontend, or mutate Sheets/D1.
- This is monitoring correctness only; do not describe the original A2.13 financial operation as passed.
- A **new** explicitly authorized pilot would require a separate live preflight, unique request key, replay/unknown-outcome reconciliation, permission authorization, and a validated cleanup/recovery plan. Owner consent is required.
- No customer/supplier/employee credentials or financial payloads in these records.

PREPARE=RECORDED; TEST/VERIFY=PENDING.

## ACC-157 / Step 02 — PREPARE synthetic D1 custody-close request after budget reservation
- The timeout monitor test alone cannot determine why the reserved A2.13 command left zero business-ledger records. Review the canonical **exact** frontend payload shape and native backend handler (same accounting candidate): synthetic action `closePurchaseCustodyV1920` has zero amount, a synthetic 2099 date, and server-side authorization.
- Next safe action is an **in-memory mocked database** functional API probe using the production-source handler in Node VM. Simulate a single permitted one-command `CANARY`, verify authorization, budget reserve, request ledger, custody-close event/record/commit batch and *no* cashbox/stock/custody settlement writes. Also verify READONLY path blocks command.
- No network, credentials, actual D1, or automatic CANARY execution; only mock SQL statement routing. This is a logic test, not proof of deployed worker behavior. If it fails, investigate exact source before touching live data.

## ACC-157 / Step 03 — verified test evidence (2026-10-10)
- Monitor-only fix in `.github/workflows/easystore-a213-custody-close-canary-execution.yml`: commit `c500360ab9c0c5afba078485fa3eb84046a1d31d`. Exact changes: `A213_SETTLEMENT_WAIT_MS=120000`, wall-clock start upon observing consumed budget, explicit `A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY` if no committed evidence by bound. **No SQL arm/cleanup policy changed.** Manual-only dispatch remains unchanged.
- Timeout shell regression: `tests/easystore_a213_timeout_monitor_regression.test.mjs` commit `687a7a91071d23fc0e445c10bb3c46f8ba16e1b6`. Executes the actual Bash timeout fragment with synthetic time at 0/30/90/105/119/120 seconds; asserts historical workflow safety.
- Deeper zero-balance custody handler test: `tests/easystore_a213_custody_handler_mock_execution.test.mjs` with real Worker handler code evaluated against an in-memory fake D1 and dummy authorized credentials. It covers synthetic CANARY one-command reservation, 1 PREPARED request ledger, single atomic close/event/COMMITTED batch, zero cashbox/stock/custody settlement, READONLY 503 and fake unauthenticated 401. **This is mock behavior, not Production success.**
- A first synthetic test-only CI run failed due to missing SQL identity on the mock prepared-statement wrapper; no evidence of a Cloudflare defect. The harness was corrected in commit `d93ad3d1ff3547cd0c12575b00c6326bdb7f26c0`. Preserve earlier failures as test-harness diagnostics, not Production regressions.
- **Final verified GitHub Actions SUCCESS**: https://github.com/fawakhry/TrendOs/actions/runs/38052120740, job `114213186224`; all historical A2.13 static/financial guard tests, bounded monitor tests, and actual accounting handler mock tests passed.
- Exact logs: `A213_90S_BROWSER_120S_MONITOR_BOUNDARY=PASS`, `A213_119S_CONTINUE_120S_UNKNOWN_FAIL_CLOSED=PASS`, `A213_ONE_COMMAND_AUTO_CLEANUP_INVARIANTS=PASS`, `A213_SYNTHETIC_HANDLER_CANARY_COMMIT_PIPELINE=PASS`, `A213_SYNTHETIC_CANARY_NO_CASHBOX_STOCK_SETTLEMENT=PASS`, `A213_SYNTHETIC_READONLY_AND_BAD_AUTH_FAIL_CLOSED=PASS`, `ACC157_DEPLOYED_READONLY_MODE=PASS`, `ACC157_DEPLOYED_FINANCE_WRITE_BUDGET=ZERO`, `ACC157_API_FINANCIAL_MUTATION=NO`.
- **Verified disposition:** `REPO_ONLY_FIXED_AND_TESTED`. Supplier A2.10 remains DONE. A2.13 actual live success remains BLOCKED/NOT_RETRIED; cannot prove original failure was caused exclusively by timeout. Production budget remains zero; no personal token, real customer balance or financial transaction written.

## Next strictly gated operation
- Independent code review + approved release/merge of *only* the A2.13 monitor change. A merge is NOT authorization to launch the manual `workflow_dispatch`.
- Before considering any new A2.13 live canary, owner must explicitly approve a fresh **one-command** exercise after reconciling prior request outcomes, native authorization scope, genuine browser employee session, and paired cleanup/restore. Never silently enable CANARY, alter balances, or execute a second financial command.

## ACC-158 / isolated verification PREPARE (2026-10-10)
- The currently passing in-memory A2.13 mock verifies SQL statement selection and atomic batch shape, **not** actual SQLite DDL/constraints. The original Production budget-reserved/no-ledger outcome remains without proven root cause.
- New exact safe task on existing `fix/a213-custody-monitor-settlement-20261010`: add `tests/easystore_a213_sqlite_migration_integration.test.mjs`, using Node built-in `node:sqlite` with a fresh `:memory:` database and the checked-in accounting migrations 0015,0020–0030. Execute the unchanged native Worker handler with synthetic employee/session and local DB adapter; assert one custody-close + one COMMITTED request ledger + one audit event, zero cash/stock/custody-event effects, and exact one-budget reservation. Test duplicate/idempotent request, READONLY denial and malformed synthetic request. This must not connect to Cloudflare nor use real data.
- Add the test to isolated `ACC-157 A2.13 Timeout Monitor Offline Verification` workflow with `node --experimental-sqlite`; no changes to the manual A2.13 financial workflow other than prior tested 120s monitoring fix, no deploy.
- If a local SQL error occurs, capture only synthetic SQL/error metadata in GitHub CI, fix the test when clearly a harness defect, or separately propose a server fix if an actual production-source SQL/DDL incompatibility is confirmed. Preserve evidence of any failures.
- No customer data, financial payloads, secrets or new D1 business writes. **No retry of actual A2.13**.
Status: PREPARED.

## ACC-158 / VERIFIED (2026-10-10) — real SQLite engine, synthetic isolated business flow
- Added `tests/easystore_a213_sqlite_migration_integration.test.mjs`, commit `870dc029b52c56a84ae4e1646d3e943d453525d7`. It constructs a fresh *in-memory* real SQLite database from checked-in accounting migration files 0015, 0020–0030; no historical data, credentials, or Cloudflare access.
- Included in the existing read-only ACC-157 GitHub CI, commit `d8caf3bc894415b8dd1862384943df22a95667d7`; Node 22 built-in SQLite with `--experimental-sqlite`, executes the **unmodified native Accounting handler source** against an async D1 adapter backed by an actual SQLite transaction.
- **Verified PASS:** https://github.com/fawakhry/TrendOs/actions/runs/38053563248, job `114217385375`:
  - `ACC158_REAL_SQLITE_MIGRATIONS_APPLIED=PASS`
  - `ACC158_REAL_SQLITE_CUSTODY_TRANSACTION=PASS` — one synthetic zero-value close, one COMMITTED request ledger, one immutable audit event.
  - `ACC158_REAL_SQLITE_IDEMPOTENCY_SECOND_COMMAND_BLOCKED=PASS` — replay of same request key gives duplicatePrevented without new writes; different key cannot consume a second command.
  - `ACC158_POST_RESERVATION_PRE_LEDGER_FAILURE_SAFETY=PASS` — injected *local-only* SQL ledger abort results in one consumed budget but no ledger, custody close or event, demonstrating this ambiguous state can arise if there is a failure after reservation.
  - `ACC158_NO_PRODUCTION_D1_ACCESS_OR_FINANCIAL_WRITE=PASS`; existing safety regressions and Production GET-only health also PASS with READONLY, zero budget.
- **Interpretation:** local source and current checked-in migration DDL are compatible on the A2.13 zero-balance path. It does *not* prove the deployed Cloudflare Worker, a live employee token, or the original 8 Oct frontend/API call succeeded. The injected abort models a possible failure category; it is not evidence that this exact SQL error occurred historically.
- **Disposition:** SCHEMA_COMPATIBILITY_TESTED, LIVE_FINANCIAL_CANARY_STILL_BLOCKED; prior A2.13 unknown outcome remains DO_NOT_RETRY pending independently reviewed release and explicit fresh one-command authorization.
