# ACC-165 — A2.13 Production READONLY safe-idle and release decision
Date: 2026-10-10. Working branch: `audit/acc165-accounting-release-no-go-readonly-20261010`.

## Objective
Give a repeatable, executable **read-only** distinction between a green synthetic A2.13 test suite and **actual authorization** to issue a finance-changing A2.13 canary. Do not repeat supplier A2.10, waste A2.11 or dept-line A2.12 canaries; do not retry the historical A2.13 run #4.

## Source and implementation
- New test: `tests/easystore_a213_production_golive_decision.test.mjs` reads public static EasyStore config/app, public D1 health JSON, and the **existing checked-in** manual A2.13 workflow. It verifies OFF, READONLY, zero server command budget, correct frontend boot order and client safety guards, existing bounded 120s monitor and cleanup. It tests whether the manual workflow explicitly executes the published boot simulation **before** arming D1 and emits a machine-readable `financialLaunchDecision: NO_GO`.
- New GitHub Action: `.github/workflows/easystore-acc165-production-safety-no-go.yml` uses public GET only (no Cloudflare secrets or Wrangler, no financial writes). It executes existing published OFF/simulated-CANARY boot tests, synthetic SSO-to-button life-cycle, old white-screen regression and A2.13 workflow monitor invariants, then emits `artifacts/acc165-golive-decision.json` and a GitHub step summary. Also triggers automatically for changes on the accounting candidate branch/PR and supports manual read-only audit dispatch.
- Source of truth: `TrendOS_MASTER_BOOK.md`, [ACC-164 five-gate closeout plan](ACC164_ACCOUNTING_FINAL_CLOSEOUT_GATES_20261010.md), and immutable [run #4 D1 forensic check](https://github.com/fawakhry/TrendOs/actions/runs/38063721910).

## Execution evidence — verified
- [GitHub Actions run 38066390270](https://github.com/fawakhry/TrendOs/actions/runs/38066390270), job `114254788775`, complete with successful steps. Read-only source and live health proof:
  - `A213_DEPLOYED_JS_BOOTSTRAP_MODE_OFF=PASS`
  - `A213_DEPLOYED_JS_BOOTSTRAP_MODE_CANARY=PASS` (CANARY simulated in memory only)
  - `A213_OLD_BLANK_SCREEN_REGRESSION_DETECTED=PASS`
  - `A213_BROWSER_SSO_TO_VISIBLE_BUTTON=PASS` (synthetic session)
  - `A213_BROWSER_BUTTON_DISAPPEARS_ON_BUDGET_CONSUMPTION=PASS`
  - `ACC165_PUBLIC_UI_SAFE_OFF=PASS`
  - `ACC165_PRODUCTION_D1_READONLY_ZERO_BUDGET=PASS`
  - `ACC165_MANUAL_WORKFLOW_BOOT_GATE=MISSING`
  - `ACC165_PRODUCTION_A213_LIVE_CLOSE=NOT_PASSED`
  - `ACC165_LIVE_FINANCIAL_LAUNCH=NO_GO`
  - `ACC165_FINANCIAL_HTTP_POST=ZERO`.
- **Interpretation:** public EasyStore is safe for current read-only operation. The A2.13 manual workflow's preflight only checks text patterns and D1 state, and **does not execute the released browser bootstrap / SSO visibility regression before arming the server**. Run #4 had passed that weaker check while UI was actually broken. This change creates a separate observable gate, NOT an integrated mandatory gate.
- GitHub green or an artifact stating `PASS` is never permission to arm CANARY or execute a finance POST. The test intentionally reports `NO_GO` while finance remains OFF/READONLY and operator/financial approval cannot be established by unattended CI.

## Missing release authorization / next technical change
1. Secure maintainer review/authorization to change the *money-moving* `.github/workflows/easystore-a213-custody-close-canary-execution.yml`, enforcing the published UI bootstrap check **inside its Preflight step, before the first D1 write**. An earlier connector edit to this workflow was blocked; do not work around that boundary by generating alternative financial workflows.
2. After the authorized edit, re-run OFF/CANARY simulations and assure 120s monitoring, exact baseline, single command/one user, unique request-key handling, automatic backend cleanup and tested published-frontend OFF recovery remain intact.
3. Only with new specifically scoped owner approval, real authenticated on-site operator presence and a timed zero-value CANARY window may G1 be attempted. Do not infer prior user authorization extends indefinitely or permits silently repeating failed runs. After the pilot, independently audit D1 and restore frontend OFF.
4. Until then, proceed safely on G2 (finance employee permission evidence), G3 (opening balance source mapping), and G4 (offline full-flow tests); these do not require broad live financial writes.

## Status
`ACC165_SAFE_IDLE_VERIFIED`, `G1_PREARM_RELEASE_GATE=NOT_INSTALLED`, `G1_A213_LIVE_ACCEPTANCE=NOT_PASSED`, `FINANCIAL_LAUNCH=NO_GO`, `D1_WRITE_ACTIVITY=ZERO`. Next: ACC-166 **read-only** finance permission evidence and opening-balance source reconciliation.
