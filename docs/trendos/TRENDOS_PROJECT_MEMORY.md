# TrendOS Project Memory

> Canonical project memory for future chats and execution work.
> Last consolidated: **2026-09-01 11:44 Africa/Cairo**.
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

**CONTROLLED FAMILY ACTIVATION — HEALTH PASS; CORE-P0 READ-ONLY TRIAGE COMPLETE; REMEDIATION/BASELINE DECISION REQUIRED BEFORE ORDER_LINE.**

Integrity V1 Core is installed and deployed in Apps Script Version 145. HEALTH is the only activated family and has passed deployed-route, dashboard-write, and legacy-regression checks; every business family and Fast Auth remain OFF.

## Current repository checkpoint

Repository: `fawakhry/TrendOs`

Branches:
- production/default: `main`
- active working: `agent/go-live-2026-09-01-integrity`
- safety: `backup/go-live-2026-08-30-pre-p0`
- approved pre-deploy candidate: `release/integrity-v1-predeploy-2026-08-31-r3`

Approved deployment candidate:
- SHA: `ee03adab4c733aec909511b23dd80f42ad3b927e`
- GitHub Actions run: `33384689012`
- result: **SUCCESS**

Do not fall back automatically to R1/R2 and do not move the frozen release branch silently. Documentation continues on the working branch.

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
  - `INVALID_LINE_IDS`: 229 legacy Line IDs are Date-coerced by cell type; 131 closed and **98 not closed**. Live ORDER_LINE compatibility blocker.
  - `DUPLICATE_ATTENDANCE_SESSIONS`: 6 excess rows across 5 recent keys, with open/conflicting sessions. Active defect.
  - `DUPLICATE_CLEANING_RECORDS`: 16 excess completed/no-problem rows across 11 keys. Historical baseline debt.
  - `DUPLICATE_INVOICE_DRAFTS`: duplicate active unpriced drafts for Orders `3569`, `3572`, `3577`; unsent and total=0. Active legacy defect.
  - `PRESS_SOURCE_VIEW_MISMATCH`: four current source Lines versus zero view rows. Current view-generation mismatch.
  - `PRESS_COMPLETED_WITHOUT_SESSION`: three delivered legacy Lines and no Line-session ledger sheet. Historical/schema traceability debt.

This is a HEALTH-monitoring and read-only triage success, not permission for cleanup or later-family activation. No production source cell was changed.

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

1. exact current Apps Script file-list capture/reconciliation.
2. install Core Integrity files with **all flags OFF**.
3. save/parse only; no activation.
4. dependency health.
5. legacy no-change smoke with flags OFF.
6. controlled Web App deployment checkpoint with flags still OFF.
7. activate route families one at a time with runtime regression and immediate family rollback on failure.
8. D1 consistency regression.
9. full E2E.
10. GO/NO-GO.
11. only after correctness is stable: separate Fast Auth V2.5 lane.

Exact step-by-step sequence is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Current exact stopping point

**PD-10V — HEALTH family PASS; six CORE-P0 signals triaged read-only; STOP before ORDER_LINE.**

Current production:
- Apps Script Version 145.
- master+HEALTH ON only.
- every other Integrity family and Fast Auth OFF.
- legacy landing, deployed HEALTH route, dashboard write, execution history, and trigger reconciliation PASS.
- Version 144 immediate rollback; Version 143 deeper rollback.

Open gate:
- prepare a non-destructive remediation/baseline plan from the completed classifications.
- the first technical blocker is legacy Date-coerced Line IDs, including 98 not-closed rows; ORDER_LINE must remain OFF until compatibility is proven.
- active Attendance sessions and duplicate invoice drafts need canonical resolution with audit preserved.
- Cleaning duplicates and completed-without-session Press signals need explicit historical-baseline treatment, not deletion or invented links.
- diagnose Press view generation without mutating the four source Lines.
- preserve historical `مكرر`, and do not change Order ID/Line ID contracts.
- do not write production data or activate ORDER_LINE without a separate explicit checkpoint/approval.

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