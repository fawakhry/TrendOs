# TrendOS Handoff

> **Read this in every new TrendOS execution chat.**
> Last consolidated: **2026-08-31 12:40 Africa/Cairo**.

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

**PD-05 — CONTROLLED APPS SCRIPT INSTALLATION, FIRST FILE ONLY, ALL FLAGS OFF**

Final TrendOS V1 launch target: **01/03/2027**.

## Repository / frozen candidate

Repository: `fawakhry/TrendOs`

Branches:
- `main` — production/default.
- `agent/go-live-2026-09-01-integrity` — active working branch.
- `backup/go-live-2026-08-30-pre-p0` — safety branch.
- `release/integrity-v1-predeploy-2026-08-30` — frozen deployment candidate.

Frozen candidate:
- SHA `e72d873603841bc8e41bd8c228e3240f2feb2a29`.
- GitHub Actions run `33328415852` = **SUCCESS**.

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

Implemented + CI-tested on GitHub, not deployed:
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

## Apps Script editor file-list reconciliation — PD-04 PASS

Visible current editor files:
- `appsscript.json`
- `Code.gs`
- `AI_Webhook.gs.gs`
- `OpenAI_Setup.gs`
- `D1_Migration.gs`
- `D1_Full_Migration.gs`
- `D1_Orders_Live_Sync.gs`
- `D1_Orders_Primary_Read.g...` — UI truncated
- `D1_Dashboard_Primary_Re...` — UI truncated
- `D1_Orders_Fast_V2.gs.gs`
- `Set_D1_URL.gs.gs`

Result:
- no Integrity V1 file already present.
- no V2.4 file visible.
- no old standalone V1932 overlay files visible.
- uniquely namespaced Integrity foundation can be added safely as the first controlled installation step.

Checkpoint:
- `docs/trendos/checkpoints/PD04_APPS_SCRIPT_FILE_LIST_2026-08-31.md`
- commit `7f091fe4df88a014a5de773817fef0731c4d42c6`.

Execution Ledger update commit:
- `00ace61d4391dfc25ae2b76f4f3e1912ebbbe86a`.

## Confirmed tooling boundary

Autonomous:
- GitHub read/write/CI.
- Google Sheets/Drive supported operations.
- conversation/library files.

Unavailable:
- direct write access to Apps Script source project.

Therefore only Apps Script editor file creation/paste/save requires user assistance.

## EXACT CURRENT STOPPING POINT

**PD-05 — add the first Integrity source file only.**

User action:
1. Apps Script Editor -> `+` beside Files -> Script.
2. Name it exactly `trendos-integrity-v1` (Apps Script appends `.gs`).
3. paste the frozen candidate content of `trendos-integrity-v1.gs` from SHA `e72d873603841bc8e41bd8c228e3240f2feb2a29`.
4. Save.
5. do not edit `Code.gs`.
6. do not Deploy.
7. do not add/enable Script Properties.
8. provide screenshot of the new file/save state or any parser error.

Expected:
- file saves successfully.
- existing production route behavior is unchanged because nothing is wired or enabled.

After PASS:
- add remaining Core files one at a time, save/parse after each.
- run dependency health.
- smoke legacy with all flags OFF.
- freeze rollback version.
- only then deploy with flags OFF and start family-by-family activation.

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
