# TrendOS Handoff

> **Read this in every new TrendOS execution chat.**
> Last consolidated: **2026-08-31 01:21 Africa/Cairo**.

## Mandatory read order

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`
3. `docs/trendos/TRENDOS_HANDOFF.md`
4. `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md` for deployment/wiring work.
5. `docs/trendos/TRENDOS_TEST_MATRIX.md` for historical live failures and GO/NO-GO gates.

Do not ask the user to reconstruct work already recorded in these files.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Current sub-stage:

**PRE-DEPLOY SOURCE CAPTURE / CONTROLLED INSTALLATION PREPARATION**

Final TrendOS V1 launch target: **01/03/2027**.

## Repository / checkpoints

Repository: `fawakhry/TrendOs`

Branches:
- `main` — production/default.
- `agent/go-live-2026-09-01-integrity` — active working branch.
- `backup/go-live-2026-08-30-pre-p0` — safety branch.
- `release/integrity-v1-predeploy-2026-08-30` — frozen candidate branch.

Frozen candidate:
- SHA `e72d873603841bc8e41bd8c228e3240f2feb2a29`.
- GitHub Actions run `33328415852` = **SUCCESS**.

Do not silently move the frozen release branch. A newer candidate requires an explicit new freeze/checkpoint.

## Production identity

Active Apps Script Web App:
- Version **143**.
- Aug 29 2026 11:37 PM.

Verified runtime identity:
- backend `V1932_FULL_GO_LIVE_20260824`.
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- 87 sheets.

Verified top-level production/source-history routes:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`.
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`.

Critical rule:
- **Do not overwrite production Apps Script from GitHub `Code.gs`.**

## Architecture checkpoint

Writes:
- Google Apps Script + Google Sheets remain authoritative.

Reads:
- Orders: D1 Fast V2/V2.3 + Sheets fallback.
- Dashboard: D1 Primary + Sheets fallback.

D1:
- atomic Worker promote verified.
- one installed every-minute `d1OrdersLiveSyncTick` verified.
- source-snapshot consistency around concurrent writer/sync remains a runtime regression gate.

Fast Auth:
- V2.4 = **forbidden / do not deploy**.
- V2.5 SAFE = implemented + CI-tested + optional + not deployed.

## Integrity V1 implementation state

All below are **IMPLEMENTED + CI TESTED on GitHub + NOT DEPLOYED**:

- shared integrity foundation.
- Order/Line Integrity.
- Attendance/Cleaning Integrity.
- Press Integrity.
- Invoice/Ready Sweep Integrity.
- WhatsApp/Webhook Integrity.
- Handover/OPS Integrity.
- ANDON Integrity.
- Integrity Dashboard/Observability.
- Fast Auth V2.5 SAFE optional lane.
- composed Apps Script collision/syntax test.
- Integration Router V1.
- pre-deploy package safety gate.

Core package files:
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

Optional first-excluded performance file:
- `D1_Fast_Auth_V2_5_Safe.gs`.

Frontend stable outbound request shim:
- `customer-manager-send-integrity-v1.js`.

Machine-readable package:
- `trendos-integrity-v1.package.json`.

Deployment instructions:
- `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`.

Full chronological history/evidence:
- `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`.

## Safety switches

Master:
- `TRENDOS_INTEGRITY_V1_ENABLED` — default OFF.

Family switches — all default OFF:
- HEALTH
- ORDER_LINE
- ATTENDANCE_CLEANING
- PRESS
- INVOICE
- WHATSAPP
- OPS
- AUTOMATION

Fast Auth separate switch:
- `TRENDOS_FAST_AUTH_V25_ENABLED` — default OFF.

Installation must happen with all flags OFF. Activation is family-by-family only after runtime regression.

## Historical live failures

The existing production baseline remains historically NOT GREEN until runtime activation proves the new paths:
- duplicate Ready Sweep drafts.
- finalized order could regress to sweep/pricing.
- Attendance duplicate sessions/pulses.
- Cleaning duplicate employee/day rows.
- Press Start/Stop concurrency + missing Line traceability.
- WhatsApp outbound retry gap and inbound source-composition uncertainty.
- Handover was only a header-only schema stub with no proven backend workflow.
- OPS/ANDON generic notes were non-idempotent.
- automation check->append race.
- historical Line-ID date coercion.
- D1 source snapshot gap.

Do not mark these production PASS from CI alone.

## Source capture already completed

Current 13,959-line supplied Apps Script snapshot confirms:

`doGet(e)`:
- V1932 router first.
- V1900 second.
- V1898 third.
- then legacy action chain.

`doPost(e)`:
- parse JSON.
- V1932 first.
- V1900/V1898.
- action fallthrough can call `doGet(... __returnRawV1922:true)`.

`trendosV1932TryRoute_()`:
- Meta verification GET.
- WhatsApp webhook POST handled before older routers.
- existing WhatsApp payload calls Feedback then Customer Manager webhook.

This gives the conceptual wiring point, but not the full live project file list.

## Confirmed tooling boundary

Available autonomously:
- GitHub reads/writes/CI.
- Google Sheets/Drive reads and supported native writes.
- conversation/library Files.

Not available:
- direct write access to the Google Apps Script source project.

Therefore Apps Script source installation needs one controlled user-assisted editor action sequence.

## EXACT CURRENT STOPPING POINT

Resume at **PD-04** from `TRENDOS_EXECUTION_LEDGER.md`.

The user should provide one screenshot of:
- main workbook -> Extensions -> Apps Script.
- full source-file list visible in the left sidebar.

Until that screenshot:
- **do not add source files**.
- **do not edit Code.gs**.
- **do not Deploy**.
- **do not enable any Integrity flag**.

## Next execution sequence after screenshot

1. Reconcile exact live Apps Script file list and collision risk.
2. If PASS, install the 10 Core Integrity files with all flags OFF.
3. Save/parse only.
4. Run `trendosIntegrityDependencyHealthV1_()` manually.
5. Verify no legacy behavior change while flags OFF.
6. Freeze rollback Apps Script version/deployment.
7. Deploy with flags still OFF.
8. Activate families one at a time with runtime regression:
   - HEALTH
   - ORDER_LINE
   - ATTENDANCE_CLEANING
   - PRESS
   - INVOICE
   - WHATSAPP outbound + frontend shim
   - WHATSAPP inbound
   - OPS/HANDOVER/ANDON
   - AUTOMATION
9. D1 consistency regression.
10. full E2E.
11. GO/NO-GO.
12. Fast Auth V2.5 only after correctness is stable.

## Persistent execution behavior

The user does not want to repeatedly say “كمل” for work that can be done autonomously.

Therefore:
- perform every accessible read/search/test/GitHub action automatically.
- only ask for truly inaccessible UI actions or consequential production approval.
- do not ask the user to paste data available through connected tools.
- after every material step, update `TRENDOS_EXECUTION_LEDGER.md` before continuing.

## Non-negotiable safeguards

- no destructive historical cleanup during rollout.
- no invented finance/stock/state/payment/approval/energy values.
- Order ID is order key; Line ID is active Line key.
- `مكرر` rows remain history, excluded from active logic.
- external sends require durable idempotency before send.
- Google Sheets remains authoritative write source until separately approved migration.
- V2.4 Fast Auth is forbidden.
- old modular V1932 files must not be blindly overlaid on consolidated live Code lineage.
- rollback is code/routing rollback, not deletion of integrity/audit data.
