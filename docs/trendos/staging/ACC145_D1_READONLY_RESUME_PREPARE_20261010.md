# ACC-145 — D1 accounting read-only resume / PREPARE

Date: 2026-10-10 (Africa/Cairo).
Task: ACC-145, step 01.
Branch: `audit/easystore-d1-readonly-resume-20261010`.
Base source: `candidate/easystore-accounting-a2-20261005` @ `3aebeada28c9f5e6095abe450d46fd2341fe791a`.
EasyStore deployed source: `fawakhry/EasyStore` main @ `cf03dfe8a38350b5c08e56452f3ab31593fd49b0`.
Scope: DOC_WRITE for this PREPARE, then a single GitHub workflow addition that runs **read-only live diagnostics**. No Apps Script, D1, Cloudflare production mutation.

## Evidence before action
- Last verified A2.13 D1 reconciliation: run 37827293806 (2026-10-08): `READONLY`, no allowed financial action, no A2.13 committed custody close, total 6 request/event entries.
- Last controlled guard deploy: run 37828275952 success (2026-10-08), READONLY.
- EasyStore main config: `EASYSTORE_ACCOUNTING_D1_WRITES=false`, `EASYSTORE_ACCOUNTING_D1_WRITE_MODE='OFF'`, allowed actions `[]`.
- Diaa session test 37829796169 failed 401/miss; no assumption that GitHub secrets contain a working employee session.
- A2.11 and A2.12 legacy gate failures 37827835584/37827835536 use earlier 4/5-canary row baselines and must not be treated as current production evidence.

## Proposed exact action and expected result
1. Create a **new** workflow derived verbatim from the existing, previously successful `.github/workflows/easystore-accounting-runtime-checkpoint-audit.yml`, configured to trigger only on changes to its own path on this isolated audit branch.
2. Check in GitHub Actions a current public health probe, deployed EasyStore config, deployed Worker version and **SELECT COUNT only** on exact accounting D1 tables.
3. Assert READONLY, zero allowed users/actions/command budget, cloud read flags, and record count drift as a failure requiring reconciliation (no repair or retry of financial commands).
4. Fetch the workflow run and log result, classify PASS/FAIL/UNKNOWN. Do not claim a Production PASS before seeing actual runner output.

## Safety constraints
- Neither this documentation nor the workflow contains credentials or session tokens.
- Workflow may **read** GitHub Actions Cloudflare secrets at runtime through the existing pinned Wrangler CLI but must not print, copy, or transmit their values. SELECT-only query and GET health/config.
- Never execute `A2.13`, open `CANARY`/`GENERAL`, run any `UPDATE/INSERT/DELETE/CREATE`, apply migrations, deploy/rollback Workers, or modify any accounting row.
- If outputs change from approved baseline, **stop and investigate**; do not overwrite current facts or rearm consumed budgets.

Expected condition: Production diagnostic result with evidence link and zero requested writes.

Status at PREPARE: NOT_STARTED; pending readback of this file and separate workflow commit.

## ACC-145 / Step 01 — VERIFIED RESULT (2026-10-10)
- Implementation branch HEAD (workflow commit): `05bf49d94d9aa35526593142eaa271eb282fe56b`.
- Added exactly `.github/workflows/easystore-d1-readonly-resume-20261010.yml`; derived from previously successful checkpoint audit. No production source files modified.
- Workflow file Git blob readback: `84a86b1a304414388b2f3b90a8dfd56568d30adc`.
- GitHub Actions run: https://github.com/fawakhry/TrendOs/actions/runs/38046689276
- Job id: `114197539891`; conclusion: **SUCCESS**.
- Verified API version: `2b40f622-60ce-4d70-83d1-b334ddc42833`; Accounting mode `READONLY`; policy epoch `39`; schema ready `true`.
- Financial authoritative writes: `false`; accounting Google business calls observed in this endpoint: `0`; frontend write mode `OFF`, global writes `false`, allowed frontend canary actions `[]`.
- Server canary allowlist: 0 users and 0 actions. Guards asserted command budget zero and no commands started.
- Exact count snapshot: materials=1, templates=1, parties=1, deptLines=1, waste=1, partyBalances=1, custodyCloses=0, custodyEvents=0, stockMoves=0, finalInvoices=0, cashbox=0, purchases=0, dailyPurchases=0, dayCloses=0, partyLedger=0, txGuard=0, requestLedger=6, events=6. Total business rows=18.
- Approved baseline drift: none. `ACCOUNTING_RUNTIME_CHECKPOINT=PASS`, `PRODUCTION_MUTATION=NO`.
- Conclusion: **COMMITTED_VERIFIED** (new GitHub workflow + run), **READ_VERIFIED** (Production read-only snapshot). Not evidence of financial-write readiness, authenticated EasyStore SSO, or A2.13 success.
- No secrets, employee session tokens, customer identities or financial payloads recorded.

## ACC-145 / Step 02 — next one safe step
Investigate stale 4-canary and 5-canary baseline expectations in A2.11/A2.12 CI **offline only**. Compare expected counts with present six-canary base. Do not rewrite production D1 or rearm A2.13. Require a separate reviewed test change; keep historical baseline tests if they assert replay history.


## ACC-146 / Step 00 — PREPARE (2026-10-10)
Task: ACC-146, Step 00. Classification: DOC_WRITE before REPO_ONLY test/workflow addition.
HEAD_BEFORE: `3d1ca8a320970311ee245416e44d93f219b14fa2`. Accounting source branch remains `candidate/easystore-accounting-a2-20261005`. No Production mutation permitted.
- Re-read historical `easystore-a211-waste-qualification.yml` and `easystore-a212-dept-line-qualification.yml`. A2.11 requires `requestLedger=4/events=4/waste=0/deptLines=0` and A2.12 requires `requestLedger=5/events=5/waste=1/deptLines=0`. These are **historical pre-canary gates**, not current state assertions.
- The exact new verified production snapshot (run 38046689276) has `requestLedger=6/events=6/waste=1/deptLines=1`, all non-synthetic financial entities zero, `READONLY`, `OFF`, and no write budget.
- Previous failed A2.11/A2.12 jobs reflect valid stale-baseline failures, not evidence of defective A2.11/A2.12 guard code. Do **not** mutate historical expected values or rerun past financial canaries.
- Proposed exact files (audit branch only): one new `.github/workflows/easystore-acc146-a211-a212-current-qualification.yml` and one offline guard test `tests/easystore_acc146_baseline_lineage.test.mjs`. The workflow must run read-only A2.11/A2.12 source tests then current A145 Production D1 SELECT-only snapshot and fail closed if runtime diverges.
- Expected: GitHub Actions SUCCESS with both A2.11 and A2.12 guards plus current closed-state baseline verified. Readback the workflow and test after commit; check run conclusion and actual logs. Historical workflows are unchanged. No cloud mutations.
- STOP on mismatch/partial result; never claim this validates A2.13 custody-close execution or general finance writes.
Status: PREPARED; separate code commit pending.


## ACC-146 / Step 01 — VERIFIED RESULT (2026-10-10)
- Test commit `9b33e5a3a00dd4465a18504e5e59dbcadd865832`; new workflow commit `a7594e8a1489a9b927f35ce62cae25a409a5b39c`.
- Workflow file `.github/workflows/easystore-acc146-a211-a212-current-qualification.yml` readback Git blob `08ee755bd064250424a5ff2b2bb63b99dec058b7`; test file `tests/easystore_acc146_baseline_lineage.test.mjs` blob `34b1b34e5f265f176c18a2f2835481b6c57d5061`.
- Live read-only workflow **SUCCESS**: https://github.com/fawakhry/TrendOs/actions/runs/38047096908; job `114198716103`.
- Log proof: `A211_WASTE_CANARY_SERVER_GUARD=PASS`, `A212_DEPT_LINE_SERVER_GUARD=PASS`, `A212_DEPT_LINE_TDZ_REGRESSION=PASS`, `ACC146_HISTORICAL_A211_A212_BASELINES_PRESERVED=PASS`, `ACC146_CURRENT_SIX_CANARY_CLOSED_BASELINE_TEST=PASS`, `ACC146_A211_A212_GUARD_TESTS=PASS`.
- Verified Production in same run: `ACCOUNTING_CHECKPOINT_MODE=READONLY`, `POLICY_EPOCH=39`, `TOTAL_BUSINESS_ROWS=18`, `ACCOUNTING_RUNTIME_CHECKPOINT=PASS`, `PRODUCTION_MUTATION=NO`.
- Independent frontend transport regression run 38047099172 **SUCCESS**.
- Historical workflow files remained unchanged. The historical A2.11/A2.12 jobs are correctly classified as obsolete time-scoped pre-canary gates, not new production failures.
- Result: **COMMITTED_VERIFIED + TESTED + LATEST VERIFIED READONLY LIVE**. No A2.13 success claim; no write authority.

## ACC-147 / Step 00 — PREPARE for SSO source-level gap audit
- Next task: inspect current TrendOS→EasyStore employee session transfer (especially cross-origin browser restrictions, nonce, opener and source origin checks) and native D1 session verification, **REPO READ ONLY** until an exact repair is justified.
- Do not use TinyFish, do not capture browser tokens, do not ask for employee password, and do not mutate production; pursue offline tests and isolated branch only.
- If source currently has no authenticated cross-origin handoff, prepare a least-privilege scoped fix with regression tests, and record gate before modifications.

## ACC-147 / Step 01 — PREPARED target to verify live SSO deployment
- Source review: `candidate/t12-full-cloud-cutover-a56-20260929` app.js defines `entry619PostEmployeeSso` with exact `targetOrigin`, matching ACK `origin+source+nonce`, and 8.5s bounded sends; `openAccounting` requires a nonempty TrendOS employee token and passes a fresh `ssoNonce` URL query (no bearer token in URL).
- `fawakhry/EasyStore` main app.js accepts `TRENDOS_EMPLOYEE_SSO_V1` only from allowlisted origins, requires opener-source agreement and matching nonce issued within 30s, then sends SSO ACK. No separate EasyStore password.
- `fawakhry/TrendOs` main is an older source and lacks this entry619 sender; main source must not be silently treated as serving production, which is Cloudflare `trendos-ui`.
- Proposed action: new **read-only** GitHub workflow scoped to this isolated audit branch and its own file, fetching **public runtime assets** `trendos-ui` config/app and `fawakhry.github.io/EasyStore` config/app, and `trendos-d1-api` accounting health. No employee login/session/token collection. Verify SSO sender+receiver contract exists LIVE, EasyStore writes remain OFF, server READONLY, and record exact pass/fail with run link.
- Source evidence is NOT proof that a real user session handoff succeeds. Real authenticated browser smoke is separately required by the owner, without transferring tokens to GitHub.
- No frontend/API deploy, D1 migration or command, financial data mutation, or password action.
- STOP on any runtime mismatch; record the specific missing contract without changing Production.
Status: PREPARED; verify this record before repository-only addition.
