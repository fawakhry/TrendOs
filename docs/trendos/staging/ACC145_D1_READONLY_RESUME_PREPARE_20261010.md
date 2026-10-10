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