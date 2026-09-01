# TrendOS Handoff

> **Read this in every new TrendOS execution chat.**
> Last consolidated: **2026-09-01 06:50 Africa/Cairo**.

## Mandatory read order

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`
3. `docs/trendos/TRENDOS_HANDOFF.md`
4. `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`
5. `docs/trendos/TRENDOS_TEST_MATRIX.md`

Do not ask the user to reconstruct work already recorded there.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Current sub-stage:

**PD-10 — HEALTH APPROVED BUT BLOCKED BY MISSING LIVE ENTRYPOINT WIRING**

Final TrendOS V1 launch target: **01/03/2027**.

## Repository / frozen candidate

Repository: `fawakhry/TrendOs`

Branches:
- `main` — production/default.
- `agent/go-live-2026-09-01-integrity` — active working branch.
- `backup/go-live-2026-08-30-pre-p0` — safety branch.
- `release/integrity-v1-predeploy-2026-08-31-r3` — current approved deployment candidate.

Current approved candidate:
- SHA `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- GitHub Actions run `33384689012` = **SUCCESS**.
- Do not fall back automatically to R1 or R2.

Do not move the frozen release branch silently.

## Production identity

Active Apps Script Web App:
- Version **144**, created Aug 31 2026 3:38 PM in the Apps Script UI.
- deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg` preserved.
- description `TrendOS Integrity V1 R3 - flags OFF - PD-09 2026-09-01`.
- public base GET renders the expected **TrendOS V1932** legacy landing page.
- rollback Version **143**, Aug 29 2026 11:37 PM.
- backend lineage `V1932_FULL_GO_LIVE_20260824`.
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.

Verified route lineage:
- Dashboard -> D1 Primary.
- Orders page -> D1 Fast V2.

Critical rule:
- **never overwrite production Apps Script from GitHub `Code.gs`.**

## Current architecture

Writes:
- Apps Script + Google Sheets authoritative.

Reads:
- Orders: D1 Fast V2/V2.3 + Sheets fallback.
- Dashboard: D1 Primary + Sheets fallback.

D1 / Cloudflare:
- Worker `trendos-d1-api` is deployed/configured as a read-first D1 API plus protected migration/mirror imports.
- business-facing Worker routes are GET/read routes; POST routes are protected `/v1/import/batch` and `/v1/import/sheet` mirror operations.
- there is no current Cloudflare business-write API for Order/Line, attendance, press, invoice, WhatsApp, or OPS mutations.
- Google Sheets + Apps Script remain authoritative for production writes during cutover.
- atomic Worker promote verified.
- one installed every-minute `d1OrdersLiveSyncTick` verified.
- source-snapshot consistency still needs runtime regression after new writer activation.

Fast Auth:
- V2.4 = forbidden.
- V2.5 SAFE = implemented + CI tested + optional + not part of first Core activation.

## Integrity V1 state

Implemented + CI-tested; installed and runtime-verified in Apps Script Head; deployed in Web App Version 144 with every flag OFF and no family activated:
- shared integrity foundation.
- Order/Line Integrity.
- Attendance/Cleaning Integrity.
- Press Integrity.
- Invoice/Ready Sweep Integrity.
- WhatsApp/Webhook Integrity.
- Handover/OPS Integrity.
- ANDON Integrity.
- Integrity Dashboard.
- Integration Router V1.
- Pre-deploy package safety gate.
- Fast Auth V2.5 SAFE optional lane.

Core Apps Script package:
1. `trendos-integrity-v1.gs`
2. `trendos-order-line-integrity-v1.gs`
3. `trendos-attendance-cleaning-integrity-v1.gs`
4. `trendos-press-integrity-v1.gs`
5. `trendos-invoice-integrity-v1.gs`
6. `trendos-whatsapp-integrity-v1.gs`
7. `trendos-handover-ops-integrity-v1.gs`
8. `trendos-andon-integrity-v1.gs`
9. `trendos-integrity-dashboard-v1.gs`
10. `trendos-integrity-router-v1.gs`

Optional excluded first-pass file:
- `D1_Fast_Auth_V2_5_Safe.gs`.

Frontend stable-send shim:
- `customer-manager-send-integrity-v1.js`.

## Safety switches

Master default OFF:
- `TRENDOS_INTEGRITY_V1_ENABLED`

Family flags default OFF:
- HEALTH
- ORDER_LINE
- ATTENDANCE_CLEANING
- PRESS
- INVOICE
- WHATSAPP
- OPS
- AUTOMATION

Fast Auth separate default OFF:
- `TRENDOS_FAST_AUTH_V25_ENABLED`

Installation and activation are separate operations.

## Source capture completed

Current supplied 13,959-line Apps Script snapshot confirms:
- `doGet`: V1932 -> V1900 -> V1898 -> legacy chain.
- `doPost`: JSON parse -> V1932 -> V1900/V1898 -> legacy/fallthrough.
- V1932 currently handles Meta verification and WhatsApp webhook before older routers.

Runtime execution screenshots on 2026-08-31 confirm:
- Version 143 still serves `doGet/doPost`.
- `d1OrdersLiveSyncTick` runs from Head and completed in visible rows.
- one `doGet` was still Running at ~81.9s at capture time; performance observation only, not classified as failure.

Checkpoint:
- `docs/trendos/checkpoints/PD04_RUNTIME_EXECUTION_BASELINE_2026-08-31.md`

## Apps Script / production checkpoint — PD-05 through PD-09

Live bound project:
- Apps Script project ID `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`.
- Production workbook ID `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`.
- 23 persisted Head files.
- all 10 ordered Integrity files plus `trendos-integrity-runtime-tools-v1.gs` installed.

A macOS editor-shortcut issue initially nested six newly added files inside default `myFunction`. It was detected by live PD-07 failure, bounded to those six files, repaired one by one, saved, reloaded, and exact-SHA verified against Candidate R3.

Verified after repair:
- PD-06R saved/persisted composition PASS.
- `trendosIntegrityDependencyHealthV1`: `success=true`, `codeReady=true`, `missing=[]`, required count 23.
- master and all eight family flags false.
- Fast Auth V2.5 absent.
- PD-08 legacy no-change smoke PASS.
- Triggers page shows exactly one `d1OrdersLiveSyncTick` time-based Head trigger.
- Version 144 is the production Web App; Version 143 remains the immediate rollback.
- PD-09 deployment PASS and public flags-OFF legacy smoke PASS.
- PD-09 private reconciliation PASS: Version 144 `doGet/doPost` completed, no Integrity business function observed, and exactly one `d1OrdersLiveSyncTick` trigger.
- HEALTH activation has separate user approval but has not been executed.

Detailed action/evidence/commit trail is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Confirmed tooling boundary

Authenticated Apps Script access is restored and the private execution/trigger reconciliation is complete.

Autonomous and completed:
- exact Candidate R3 fetch/SHA comparison.
- controlled Head source installation and repair.
- Apps Script save/reload verification.
- public dependency-health execution.
- deployment/trigger/execution-history read checks.
- GitHub memory/ledger updates.

Still requires explicit user approval:
- creating/updating the production Apps Script deployment.
- any Feature Flag activation.
- any later business/runtime activation with production consequences.

## EXACT CURRENT STOPPING POINT

**PD-10A — HEALTH route-wiring blocker; all flags remain OFF.**

Completed:
- PD-09 full flags-OFF deployment smoke PASS on Version 144.
- Version 144 filtered executions show Completed Web App `doGet/doPost`.
- exactly one Head time-based `d1OrdersLiveSyncTick`.
- no `trendosIntegrity*` business-family execution observed.
- user explicitly approved HEALTH only.
- read-only capture of current live `Code.gs`: 13,960 lines / 695,246 characters, one `doGet`, one `doPost`.

New blocking evidence:
- live `Code.gs` contains zero calls to `trendosIntegrityTryRouteV1_`.
- live `Code.gs` contains zero calls to `trendosIntegrityTryWebhookV1_`.
- its entrypoints still dispatch V1932 -> V1900 -> V1898 -> legacy chain.
- enabling master+HEALTH alone would not activate or prove the intended Web App Health route/dashboard.

No flag or source change was made after discovering this conflict.

Exact next action:
1. obtain explicit approval for a minimal guarded edit to the **current live** `Code.gs`; never replace it from repository source.
2. wire generic Integrity route handling and WhatsApp handoff with master/family flags still OFF.
3. save/parse and repeat dependency/composition checks.
4. deploy Version 145 with all flags OFF and keep Version 144/143 rollback evidence.
5. run flags-OFF legacy smoke.
6. only then activate master+HEALTH and execute the HEALTH regression.
7. on any failure, disable HEALTH/master and restore the latest verified deployment as appropriate.

## Persistent execution behavior

- perform every accessible read/search/test/GitHub action automatically.
- ask only for inaccessible UI actions or consequential production approval.
- after every material step update `TRENDOS_EXECUTION_LEDGER.md`.

## Non-negotiable safeguards

- no destructive historical cleanup.
- no invented finance/stock/state/payment/approval/energy values.
- Order ID is Order key; Line ID is active Line key.
- `مكرر` stays history and is excluded from active logic.
- external sends require durable idempotency before send.
- Sheets stays authoritative for writes until separately approved migration.
- V2.4 is forbidden.
- old modular V1932 files must not be blindly overlaid on consolidated live Code lineage.
- rollback is routing/code rollback, not deletion of integrity/audit data.
