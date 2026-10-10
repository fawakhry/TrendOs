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
