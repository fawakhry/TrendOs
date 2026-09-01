# TrendOS Project Memory

> Canonical project memory for future chats and execution work.
> Last consolidated: **2026-09-01 18:33 Africa/Cairo**.
> Launch target: **01/03/2027 — TrendOS V1**, aligned with Matbagy third anniversary.

## Read first in every new TrendOS chat

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` — exact step-by-step execution history and current stopping point.
3. `docs/trendos/TRENDOS_HANDOFF.md`
4. `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md` when deployment/wiring is involved.
5. `docs/trendos/TRENDOS_TEST_MATRIX.md` for historical live failures and regression gates.

## Evidence rule

Use this precedence when reconciling conflicting history:

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

A plan is not implementation. A generated file is not deployment. A deployment is not production verification. **CI PASS does not mean production PASS.** Preserve unresolved conflicts as `Needs reconciliation` or `PARTIAL`.

## Project identity

TrendOS is the unified operating platform for Trend Mall / Matbagy operations. The target product connects the full business lifecycle:

`Lead -> Customer -> Order -> Design -> Production -> Invoice -> Payment -> Delivery -> Feedback -> Learning -> Growth`

## Product layers

1. **Core Operating System** — Customers, Orders, Order Lines, Production, Accounting, Payments, Delivery, Attendance, Cleaning, Press, HR, Handover, Integrity.
2. **Customer & Communication** — Customer 360, Customer Portal, WhatsApp, Unified Inbox, Feedback, Loyalty/Points.
3. **Matbagy AI Brain** — knowledge, approved replies, learning, local models, live TrendOS connectors.
4. **Smart Designer** — templates, layer editor, proof approval, archive, optional local/premium AI.
5. **Growth** — Lead Hunter, CRM, Facebook/Instagram lead discovery, follow-up and conversion.
6. **Infrastructure** — Cloudflare/D1 read layer, Apps Script write path, secure remote file access, backups and rollback.
7. **Future Network** — Marketplace, suppliers, logistics, white-label/multi-tenant expansion after V1 stabilization.

## Current program phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Current sub-stage:

**CORE-P0 REMEDIATION — PD-08-R4 PASS; FROZEN R4 INSTALLED AND VERIFIED IN APPS SCRIPT HEAD; VERSION 146 DEPLOY PENDING EXPLICIT APPROVAL; ORDER_LINE OFF.**

Integrity V1 Core R3 remains deployed in Apps Script Version 145. HEALTH is the only activated family and has passed deployed-route, dashboard-write, and legacy-regression checks; every business family and Fast Auth remain OFF. Frozen R4 is installed and verified in Apps Script Head only and is not deployed or activated.

## Current repository checkpoint

Repository: `fawakhry/TrendOs`

Branches:
- production/default: `main`
- active working: `agent/go-live-2026-09-01-integrity`
- safety: `backup/go-live-2026-08-30-pre-p0`
- deployed/approved source candidate: `release/integrity-v1-predeploy-2026-08-31-r3`
- frozen remediation successor: `release/integrity-v1-remediation-predeploy-2026-09-01-r4`

Approved deployment candidate:
- SHA: `ee03adab4c733aec909511b23dd80f42ad3b927e`
- GitHub Actions run: `33384689012`
- result: **SUCCESS**

Frozen remediation successor:
- SHA: `b940eb9ff08a094b2406e396eba6af73409e7f9c`
- exact-ref GitHub Actions: `33493914883`
- result: **SUCCESS**
- installed and save/reload-verified in Apps Script Head only; not deployed, activated, or serving traffic.

Do not fall back automatically to R1/R2 and do not move either frozen release branch silently. Documentation continues on the working branch.

## Production identity

Active Apps Script Web App:
- Version **145**
- created Sep 1 2026 7:12 AM in the Apps Script UI
- deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`
- preserved production URL on the same deployment ID
- immediate rollback Version **144**; deeper rollback Version **143**

Live identity:
- backend lineage `V1932_FULL_GO_LIVE_20260824`
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- public base GET with HEALTH ON renders **TrendOS V1932**

Verified Version 145 routing/deployment state:
- current live `Code.gs` was minimally wired from its own live source; never replaced from GitHub.
- guarded Integrity route/webhook calls are present.
- master and HEALTH are ON.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION are OFF.
- Fast Auth V2.5 is OFF/absent.
- deployed HEALTH route returns HTTP 200, codeReady=true, missing=[].
- exactly one Head/time-based `d1OrdersLiveSyncTick` remains.
- all temporary property/smoke helpers were removed; runtime-tools is exact Candidate R3.

**Never overwrite Apps Script production from GitHub `Code.gs`.** GitHub `Code.gs` is not an authoritative reconstruction of the live consolidated lineage.

## Latest verified Integrity checkpoint

HEALTH family:
- implementation/dependency/deployment/activation/runtime = **PASS**.
- isolated monitoring sheet `إدارة - صحة النظام` created/refreshed with 13 metrics + header.
- legacy base landing response remains unchanged.
- no business-family route or Integrity trigger activated.

Data-health observation:
- report `healthy=false`.
- read-only triage of all six CORE-P0 signals is complete:
  - `INVALID_LINE_IDS`: 229 legacy Line IDs are Date-coerced by cell type; the reviewed known-column adapter recovered **229/229**, including all **98 legacy open** Lines, with zero invalid, active-duplicate, or Order-mismatch results in RP-03.
  - `DUPLICATE_ATTENDANCE_SESSIONS`: 6 excess rows across 5 recent keys, with open/conflicting sessions. Active defect.
  - `DUPLICATE_CLEANING_RECORDS`: 16 excess completed/no-problem rows across 11 keys. Historical baseline debt.
  - `DUPLICATE_INVOICE_DRAFTS`: duplicate active unpriced drafts for Orders `3569`, `3572`, `3577`; unsent and total=0. Active legacy defect.
  - `PRESS_SOURCE_VIEW_MISMATCH`: nine current source Lines after display-value recovery. RP-03E proved `واجهة المكبس` is a non-authoritative legacy/stub sheet; backend queue reads `بنود الأوردرات` and the production frontend uses Print + Heat Press filters. Treat as WARN; no legacy-view write.
  - `PRESS_COMPLETED_WITHOUT_SESSION`: fourteen completed Lines lack Line-session evidence after display-value recovery, and no Line-session ledger sheet exists. Historical/schema traceability debt; do not invent links.

This is a HEALTH-monitoring and read-only triage success, not permission for cleanup or later-family activation. No production source cell was changed.

## Latest CORE-P0 remediation preview

RP-01/RP-02/RP-03 results:
- GitHub-only implementation commit `63d6dd50aee10b84ad35a9d06e9f4414254636d1`.
- cross-timezone evidence hardening commit `24b4e89a3d3866f8f95d28ec609a302ba908486e`.
- GitHub Actions `33491831765` = **SUCCESS**.
- exact read-only evidence: `docs/trendos/checkpoints/RP03_CORE_P0_PREVIEW_2026-09-01.md`.
- corrected plan: `docs/trendos/TRENDOS_CORE_P0_REMEDIATION_PLAN.md`.
- Press consumer contract: `docs/trendos/checkpoints/RP03E_PRESS_CONSUMER_CONTRACT_2026-09-01.md`.
- Line adapter, Attendance, Cleaning, and Invoice previews PASS.
- Press scope corrected to 9 queue Lines and 14 completed-without-Line-session Lines; the legacy view is explicitly non-authoritative and requires no write.
- production remains Version 145 with master+HEALTH ON only; the frozen R4 helper plus five modified modules are installed and verified in Apps Script Head only; no R4 deployment, registry, Sheet mutation, or business-family activation occurred.

## Current architecture

### Frontend
- GitHub Pages lineage.
- Customer Manager stable-send frontend shim prepared as `customer-manager-send-integrity-v1.js`.

### Backend / writes
- Google Apps Script remains operational backend/write path.
- Google Sheets remains authoritative for operational and financial writes.
- No approved D1 authoritative-write migration exists.

### D1 / fast reads
- D1 remains fast read/mirror layer.
- Sheets fallback remains mandatory.
- Orders + Lines atomic Worker promote is verified.
- newer mirror snapshot: 87 sheets / 31,176 rows / 87 ready / 0 pending.
- V2.3 stable page cache verified.
- source snapshot consistency around concurrent writer/sync remains a runtime regression gate.

### Fast Auth
- **V2.4 is rejected / forbidden for deployment.** Prepared source could cache raw password/token fields and lacked lifecycle invalidation wiring.
- `D1_Fast_Auth_V2_5_Safe.gs` is implemented and CI-tested as a separate optional lane.
- V2.5 uses strict non-secret allowlist + auth revision + kill switch.
- V2.5 is **not part of the first Core activation** and is **not deployed**.

## Integrity V1 implemented package

Core Apps Script modules prepared and CI-tested:

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

Machine-readable membership:
- `trendos-integrity-v1.package.json`

Optional performance module:
- `D1_Fast_Auth_V2_5_Safe.gs`

Frontend contract:
- `customer-manager-send-integrity-v1.js`

Deployment/wiring contract:
- `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`

Detailed execution evidence:
- `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`

## Integrity V1 safety model

Installation and activation are separate.

Master kill switch:
- `TRENDOS_INTEGRITY_V1_ENABLED`
- default OFF.

Family switches are also default OFF:
- HEALTH
- ORDER_LINE
- ATTENDANCE_CLEANING
- PRESS
- INVOICE
- WHATSAPP
- OPS
- AUTOMATION

Fast Auth V2.5 has a separate default-OFF switch:
- `TRENDOS_FAST_AUTH_V25_ENABLED`

When a new family is disabled, routing must fall through to legacy behavior rather than partially run both implementations.

## Core Integrity implementation results

### Shared integrity foundation
Implemented/tested:
- ID normalization.
- Cairo business date/calendar.
- Friday closed default + Special Schedule override.
- shared ScriptLock wrapper.
- durable idempotency/event ledger.
- automation-run ledger.
- fail-closed schema checks.

### Order / Line
Implemented/tested:
- Line ID authority over stale row number.
- active duplicate Line detection.
- Draft Item collision detection.
- shared Draft add/upload/submit lock contract.
- retry-safe reuse of checkpointed Order ID.

### Attendance / Cleaning
Implemented/tested:
- one canonical employee/day session.
- start+clockin atomic contract.
- repeated state transitions no-op/idempotent.
- clock-in prerequisite.
- business-calendar rules.
- Cleaning one/day and real checklist persistence.

### Press
Implemented/tested:
- Start/Stop lock and retry-safe Session ID.
- Order/Line snapshot ledger.
- actual Line IDs for completion.
- repeated Stop returns same result.
- fail closed on invalid queue identity.
- no invented energy costs.

### Invoice / Ready Sweep
Implemented/tested:
- canonical draft per Order/revision.
- finalized Order skipped by normal sweep.
- explicit reopen revision.
- finalize request key includes revision.
- partial/timeout retry uses same request key.
- material change during finalization fails closed.
- ambiguous notification is not auto-resent.

### WhatsApp
Implemented/tested:
- stable logical `clientRequestId` frontend/backend contract.
- durable outbound claim before Meta send.
- completed replay does not call Meta again.
- ambiguous send does not auto-retry.
- inbound Meta Message ID exact-once contract before mutation side effects.

### Handover / OPS / ANDON
Implemented/tested:
- structured Handover with Line ID + business date/shift/state.
- Handover revisions only when state changes.
- idempotent receipt.
- OPS_REPLY stable request ID.
- OPS_COACH state fingerprint.
- structured ANDON + resolution.
- automation run claim/complete/retry contract.

### Integrity Dashboard
Implemented/tested:
- counts plus problem IDs/details.
- integrity ledgers and latest automation run/error visibility.

### Router / composition / package gates
Implemented/tested:
- composed module syntax/collision test.
- dependency health checks internal functions.
- authenticated employee identity overrides spoofable payload identity.
- admin-only route checks.
- default-OFF master/family switches.
- package safety gate forbids `Code.gs`, V2.4 and old conflicting modular overlays.

## Historical live failures remain historical evidence

Do **not** rewrite the baseline Test Matrix as if production is fixed merely because Integrity V1 passes CI.

Production Version 143 historically still has confirmed live/source failures such as:
- duplicate Ready Sweep drafts.
- finalized->Ready Sweep regression.
- Attendance duplicate sessions/pulses.
- Cleaning duplicates.
- Press idempotency/traceability gaps.
- WhatsApp outbound retry gap.
- missing canonical Handover workflow beyond schema stub.

Those become production PASS only after controlled runtime activation/regression of Integrity V1.

## Current master technical plan

Primary plan: `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`.

Current execution order from here:

1. obtain explicit approval for PD-09-R4 Version 146 deployment.
2. deploy only the already verified Apps Script Head on the existing deployment ID, preserving master+HEALTH ON and keeping every business family and Fast Auth OFF.
3. immediately verify public/private flags state, legacy landing, execution history, and trigger count; roll back to Version 145 on failure.
4. keep the resolution registry absent until its separate production-write checkpoint and approval.
5. activate ORDER_LINE only after the deployment and registry gates pass, then continue one family at a time with runtime regression and immediate family rollback.
6. run D1 consistency regression.
7. run full E2E.
8. make the Core GO/NO-GO decision.
9. only after correctness is stable, enter the separate Fast Auth V2.5 lane.

Exact step-by-step sequence is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Current exact stopping point

**PD-08-R4 PASS — frozen R4 is installed and verified in Apps Script Head; production remains Version 145; STOP before Version 146 deployment pending explicit approval.**

Completed and verified:
- Apps Script Head contains 24 persisted files.
- `trendos-core-p0-remediation-v1.gs` plus the R4 Order/Line, Press, Invoice, Dashboard, and Router modules were installed from frozen candidate `b940eb9ff08a094b2406e396eba6af73409e7f9c`, saved, reloaded, and parser/composition checked.
- PD-06-R4 composition PASS: each scoped filename exists once; no parser/duplicate-global error; live `Code.gs` and untouched modules remain present.
- PD-07-R4 dependency health PASS: `success=true`, `codeReady=true`, `requiredCount=25`, `missing=[]`; master=true, HEALTH=true, every business family=false; Fast Auth V2.5 absent.
- PD-08-R4 legacy no-change smoke PASS: the Version 145 URL still renders TrendOS V1932, completed `doGet/doPost` traffic remains visible, and exactly one Head/time-based `d1OrdersLiveSyncTick` trigger remains.
- a failed in-place editor replacement produced a duplicate Order/Line global, failed closed, and was fully repaired by recreating only that Head file from the frozen R4 source.
- no R4 business runtime was executed and no registry, Sheet data, Script Property, route, trigger, deployment, Feature Flag, Fast Auth, or `Code.gs` change occurred.

Current production:
- active Web App Version **145** on the preserved deployment ID/URL.
- master+HEALTH ON only.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION, and Fast Auth OFF/absent.
- Version 145 is the immediate rollback for the next deployment; Version 144 and Version 143 remain deeper rollback points.

R4 checkpoint:
- branch `release/integrity-v1-remediation-predeploy-2026-09-01-r4`.
- SHA `b940eb9ff08a094b2406e396eba6af73409e7f9c`.
- exact-ref GitHub Actions run `33493914883` = **SUCCESS**.
- dependency contract: 25 required functions, zero missing.
- resolution registry is absent and no production source row was changed.

Open gate:
- obtain explicit approval for PD-09-R4.
- after approval only, deploy current verified Head as Version **146** on the existing deployment ID with properties unchanged: master+HEALTH ON only; all business families and Fast Auth OFF.
- immediately run deployment/legacy no-change smoke with Version 145 as rollback.
- do not create the registry or enable ORDER_LINE at the Version 146 checkpoint.
- preserve historical `مكرر`, keep Order ID/Line ID contracts unchanged, and never invent session links.

Exact action/evidence history is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Core invariants

- `Order ID` is the logical order key.
- `Line ID` is the logical unique key for active order lines.
- do not delete valid historical data.
- historical `مكرر` rows are preserved but excluded from active metrics/queues.
- repeated events must be idempotent.
- check-then-create/update requires shared lock or durable atomic claim.
- external sends require logical event claim before send.
- prices, stock, order states, settlements, energy values and approvals are never invented.
- operational truth comes from live TrendOS data.
- every fix requires `Expected / Actual / PASS|FAIL` evidence.

## Backups/checkpoints

- Main spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- Pre-Go-Live workbook backup exists: `BACKUP_TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY_2026-08-30_PRE_GO_LIVE_P0`.
- GitHub safety branch: `backup/go-live-2026-08-30-pre-p0`.
- frozen Integrity V1 predeploy branch exists.
- Production Apps Script is Version 145; Version 144 is immediate rollback and Version 143 is deeper rollback.

## Persistent working rule

The user does **not** want to repeatedly say “كمل” for steps that can be performed autonomously.

For TrendOS execution:
- automatically perform reads/searches/tests/GitHub work available through connected tools.
- ask the user only for an inaccessible UI action, consequential production decision, or required external evidence.
- never ask the user to copy/paste data that can be read through connected Sheets/Drive/Files/GitHub tools.
- after every material execution step, update `TRENDOS_EXECUTION_LEDGER.md` before moving on.

Before moving to a new major phase/chat, preserve:

`IMPLEMENTED + TESTED + VERIFIED + CHECKPOINT + ROLLBACK + GITHUB MEMORY UPDATED + EXACT NEXT STEP`

This file is the top-level memory entry point.