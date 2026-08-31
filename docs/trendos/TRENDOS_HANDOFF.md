# TrendOS Handoff

> **Read this in every new TrendOS execution chat.**
> Last consolidated: **2026-09-01 01:50 Africa/Cairo**.

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

**PD-09 — CONTROLLED DEPLOYMENT APPROVAL CHECKPOINT, ALL FLAGS OFF**

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
- Version **143**.
- Aug 29 2026 11:37 PM.
- backend `V1932_FULL_GO_LIVE_20260824`.
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

D1:
- atomic Worker promote verified.
- one installed every-minute `d1OrdersLiveSyncTick` verified.
- source-snapshot consistency still needs runtime regression after new writer activation.

Fast Auth:
- V2.4 = forbidden.
- V2.5 SAFE = implemented + CI tested + optional + not part of first Core activation.

## Integrity V1 state

Implemented + CI-tested; installed and runtime-verified in Apps Script Head, not deployed to the Web App:
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

## Apps Script Head checkpoint — PD-05 through PD-08 PASS

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
- Version 143 remains the production Web App and rollback.

Detailed action/evidence/commit trail is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Confirmed tooling boundary

Authenticated cloud-browser access to the exact bound Apps Script editor is available for the current controlled session.

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

**PD-09 — controlled production deployment approval checkpoint.**

Ready evidence:
- approved Candidate R3 fixed at `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- repaired Apps Script Head saves/parses and persists.
- dependency health PASS: `codeReady=true`, `missing=[]`.
- master + all families OFF.
- Fast Auth V2.5 not installed.
- legacy no-change smoke PASS.
- Version 143 remains active and is the rollback.

No production deployment has been created or changed.

Exact next action:
1. obtain explicit user approval for production Deploy.
2. deploy the current verified Head with every Integrity/Fast Auth flag still OFF.
3. capture the new Apps Script version/deployment ID.
4. run immediate flags-OFF legacy smoke.
5. on failure, restore Version 143; on PASS, stop at the HEALTH family activation checkpoint.
6. do not activate any family without its own checkpoint/regression.

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
