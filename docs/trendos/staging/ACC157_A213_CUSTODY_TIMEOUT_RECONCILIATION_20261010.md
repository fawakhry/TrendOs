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
