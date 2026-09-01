# TrendOS Handoff

> **Read this in every new TrendOS execution chat.**
> Last consolidated: **2026-09-01 18:33 Africa/Cairo**.

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

**PD-08-R4 PASS — FROZEN R4 INSTALLED AND VERIFIED IN APPS SCRIPT HEAD; STOP BEFORE VERSION 146 DEPLOY PENDING EXPLICIT APPROVAL**

Final TrendOS V1 launch target: **01/03/2027**.

## Repository / frozen candidate

Repository: `fawakhry/TrendOs`

Branches:
- `main` — production/default.
- `agent/go-live-2026-09-01-integrity` — active working branch.
- `backup/go-live-2026-08-30-pre-p0` — safety branch.
- `release/integrity-v1-predeploy-2026-08-31-r3` — current deployed/approved source candidate.
- `release/integrity-v1-remediation-predeploy-2026-09-01-r4` — frozen remediation successor; installed in Apps Script Head only, not deployed or activated.

Current approved candidate:
- SHA `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- GitHub Actions run `33384689012` = **SUCCESS**.
- Do not fall back automatically to R1 or R2.

Frozen remediation successor:
- branch `release/integrity-v1-remediation-predeploy-2026-09-01-r4`;
- SHA `b940eb9ff08a094b2406e396eba6af73409e7f9c`;
- exact-ref GitHub Actions `33493914883` = **SUCCESS**;
- R4 is installed and save/reload-verified in Apps Script Head only; it is not deployed or activated.

Do not move either frozen release branch silently.

## Production identity

Active Apps Script Web App:
- Version **145**, created Sep 1 2026 7:12 AM in the Apps Script UI.
- deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg` preserved.
- description `TrendOS Integrity V1 Router Wiring - flags OFF - PD-10 2026-09-01` (description records deployment-time state; HEALTH was activated later through Script Properties).
- public base GET with HEALTH ON still renders the expected **TrendOS V1932** legacy landing page.
- immediate rollback Version **144**; deeper rollback Version **143**.
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

Implemented + CI-tested; installed in Apps Script Head; deployed in Web App Version 145 with exact-verified guarded live entrypoint wiring. HEALTH is the only activated family and passed deployed route, dashboard write, and legacy regression:
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

Current production properties:
- `TRENDOS_INTEGRITY_V1_ENABLED` = ON.
- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED` = ON.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, and AUTOMATION = OFF.
- `TRENDOS_FAST_AUTH_V25_ENABLED` = OFF/absent.

Installation and activation remain separate operations. HEALTH property rollback is master+HEALTH OFF; deployment rollback is Version 144, with Version 143 deeper rollback.

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
- 24 persisted Head files.
- all 10 ordered Integrity files plus `trendos-integrity-runtime-tools-v1.gs` and the R4 remediation helper are installed.
- the helper plus the five R4-modified modules were installed from the frozen R4 blobs, saved, reloaded, and parser/composition checked.

A macOS editor-shortcut issue initially nested six newly added files inside default `myFunction`. It was detected by live PD-07 failure, bounded to those six files, repaired one by one, saved, reloaded, and exact-SHA verified against Candidate R3.

Verified after repair:
- PD-06R saved/persisted composition PASS.
- `trendosIntegrityDependencyHealthV1`: `success=true`, `codeReady=true`, `missing=[]`, required count 23.
- master and all eight family flags false.
- Fast Auth V2.5 absent.
- PD-08 legacy no-change smoke PASS.
- Triggers page shows exactly one `d1OrdersLiveSyncTick` time-based Head trigger.
- Version 145 is the production Web App; Version 144 is immediate rollback and Version 143 is deeper rollback.
- PD-09 deployment PASS and public flags-OFF legacy smoke PASS.
- PD-09 private reconciliation PASS: Version 144 `doGet/doPost` completed before HEALTH activation, no Integrity business function observed, and exactly one `d1OrdersLiveSyncTick` trigger.
- PD-10 HEALTH activation is executed and runtime-verified; master+HEALTH are ON only.

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

**PD-08-R4 PASS — frozen R4 is installed and verified in Apps Script Head; production remains Version 145; STOP before Version 146 deployment pending explicit approval.**

Completed and verified:
- Apps Script Head contains 24 persisted files, including the new `trendos-core-p0-remediation-v1.gs` helper and the five R4-modified modules.
- the R4 helper, Order/Line, Press, Invoice, Dashboard, and Router sources were installed from frozen candidate `b940eb9ff08a094b2406e396eba6af73409e7f9c`, saved, reloaded, and passed composition/parser verification.
- PD-06-R4 composition PASS: each scoped filename exists once; no duplicate-global/parser error; `Code.gs` and all untouched modules remain present.
- PD-07-R4 dependency health PASS: `success=true`, `codeReady=true`, `requiredCount=25`, `missing=[]`, master=true, HEALTH=true, and every business family=false; Fast Auth V2.5 absent.
- PD-08-R4 legacy no-change smoke PASS: Version 145 still serves the TrendOS V1932 landing page; completed Version 145 `doGet/doPost` executions remain visible; exactly one Head/time-based `d1OrdersLiveSyncTick` trigger remains.
- one failed editor replacement attempt created a duplicate Order/Line global; it failed closed, was recorded, and was repaired by deleting only the malformed Head file and recreating it from the exact frozen R4 source.
- no R4 business function was run. No registry, Sheet data, Script Property, route, trigger, deployment, Feature Flag, Fast Auth, or `Code.gs` change was made.

Current production:
- Web App Version **145** is still active on the preserved deployment ID/URL.
- master+HEALTH are ON only.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION, and Fast Auth are OFF/absent.
- Version 145 is the immediate rollback for the next deployment; Version 144 and Version 143 remain deeper rollback points.

R4 evidence:
- frozen branch `release/integrity-v1-remediation-predeploy-2026-09-01-r4`.
- frozen SHA `b940eb9ff08a094b2406e396eba6af73409e7f9c`.
- exact-ref GitHub Actions run `33493914883` = **SUCCESS**.
- dependency health result: 25 required functions, zero missing.

Exact next action:
1. obtain explicit approval for PD-09-R4.
2. only after that approval, deploy the current verified Head as Version **146** on the existing deployment ID with current properties unchanged: master+HEALTH ON only; every business family and Fast Auth OFF.
3. perform immediate public/private flags-state and legacy no-change smoke with Version 145 as the rollback target.
4. do not create the resolution registry and do not enable ORDER_LINE at this checkpoint.

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
