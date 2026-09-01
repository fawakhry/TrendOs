# TrendOS Project Memory

> Canonical project memory for future chats and execution work.
> Last consolidated: **2026-09-01 22:56 Africa/Cairo**.
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

**CORE-P0 REMEDIATION — PD-09-R4 PASS; VERSION 146 ACTIVE; RP-06 REGISTRY ROLLBACK CONTRACT FIX CI PASS; STOP BEFORE REGISTRY INSTALL/WRITE OR ORDER_LINE ACTIVATION.**

Frozen R4 is deployed in Apps Script Version 146 on the preserved deployment ID. HEALTH remains the only activated family; every business family and Fast Auth remain OFF. Post-deploy landing, dependency/property health, execution-history, and trigger checks passed.

## Current repository checkpoint

Repository: `fawakhry/TrendOs`

Branches:
- production/default: `main`
- active working: `agent/go-live-2026-09-01-integrity`
- safety: `backup/go-live-2026-08-30-pre-p0`
- previous deployed baseline: `release/integrity-v1-predeploy-2026-08-31-r3`
- current deployed remediation source: `release/integrity-v1-remediation-predeploy-2026-09-01-r4`

Previous R3 baseline:
- SHA: `ee03adab4c733aec909511b23dd80f42ad3b927e`
- GitHub Actions run: `33384689012`
- result: **SUCCESS**

Current deployed remediation candidate:
- SHA: `b940eb9ff08a094b2406e396eba6af73409e7f9c`
- exact-ref GitHub Actions: `33493914883`
- result: **SUCCESS**
- installed in Apps Script Head and deployed as production Version 146; only HEALTH is active and all business families remain OFF.

Do not fall back automatically to R1/R2 and do not move either frozen release branch silently. Documentation continues on the working branch.

## Production identity

Active Apps Script Web App:
- Version **146**
- created Sep 1 2026 5:19 PM in the Apps Script UI
- deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`
- preserved production URL on the same deployment ID
- description `TrendOS Integrity V1 R4 - Master+HEALTH ON - Business Flags OFF - PD-09-R4 2026-09-01`
- immediate rollback Version **145**; deeper rollback Versions **144** and **143**

Live identity:
- backend lineage `V1932_FULL_GO_LIVE_20260824`
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- public base GET renders **TrendOS V1932**

Verified Version 146 state:
- frozen R4 Head composition is the deployed source.
- current live `Code.gs` was not edited or replaced during R4 installation/deployment.
- master and HEALTH are ON.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION are OFF.
- Fast Auth V2.5 is OFF/absent.
- post-deploy dependency health: success=true, codeReady=true, requiredCount=25, missing=[].
- Version 146 `doGet/doPost` completed traffic is visible with no failed row in the inspected first page.
- exactly one Head/time-based `d1OrdersLiveSyncTick` remains.
- direct query-string HEALTH navigation was blocked by the cloud-browser client before reaching Apps Script; it is recorded as tooling PARTIAL, not application failure.

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
- production is Version 146 with master+HEALTH ON only; frozen R4 is deployed; no registry, Sheet mutation, property change, or business-family activation occurred.

## Registry rollback contract precheck

- fail-closed review found a real gap before any Sheet write: the original reader filtered inactive rows before revision precedence, so append-only rollback rows could not deactivate older active mappings.
- working-branch source commit `b5f8a5e75c330c2bddd222c2d566c69ae92e703a` implements latest-row-wins precedence for each exact `Canonical ID + Superseded ID + Classification` identity before applying `Active?`.
- regression test commit `d3b74288a76d3e0def40324cbfc205c7de83d9a8` covers targeted/full deactivation, reactivation, array-order fallback, classification identity, stale evidence, and canonical conflict.
- GitHub Actions run `33552134647` on documented head `0cb69ecaf3dcdce5ee8c062545b68f0e7b4af80c` = **SUCCESS**.
- status is GitHub-only: the revised helper is not installed/deployed; no resolution registry exists; no production Sheet, Apps Script, property, route, trigger, or flag changed.

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

1. keep verified Version 146 serving with master+HEALTH ON only.
2. design and CI-test a separate one-time ScriptLock-protected registry writer with exact schema validation and live evidence-hash recheck; do not install it or create/write the registry without explicit approval.
3. after registry verification, request separate approval before ORDER_LINE activation.
4. activate ORDER_LINE and later families one at a time with runtime regression and immediate family rollback on failure.
5. run D1 consistency regression.
6. run full E2E.
7. make the Core GO/NO-GO decision.
8. only after correctness is stable, enter the separate Fast Auth V2.5 lane.
9. after Core is closed, resume the controlled Cloudflare/D1 cutover: mirror consistency, API write contracts, then workload migration in stages.

Exact step-by-step sequence is canonical in `TRENDOS_EXECUTION_LEDGER.md`.

## Current exact stopping point

**PD-09-R4 PASS — Version 146 is active and verified; RP-06 registry rollback contract fix is CI PASS on GitHub only; STOP before registry installation/write or ORDER_LINE activation.**

Completed and verified:
- frozen R4 branch `release/integrity-v1-remediation-predeploy-2026-09-01-r4`, SHA `b940eb9ff08a094b2406e396eba6af73409e7f9c`, exact-ref CI `33493914883` SUCCESS.
- 24-file Apps Script Head composition includes the R4 remediation helper and five modified modules.
- Version **146** is active on the preserved deployment ID with Version 145 as immediate rollback.
- public base URL renders TrendOS V1932.
- post-deploy dependency/property health completed: `success=true`, `codeReady=true`, `requiredCount=25`, `missing=[]`; master=true, HEALTH=true, every business family=false; Fast Auth absent.
- Version 146 `doGet/doPost` completed executions are visible; no failed Version 146 row appeared in the inspected first page.
- exactly one Head/time-based `d1OrdersLiveSyncTick` trigger remains; latest matching execution completed.
- direct query-string HEALTH navigation was client-blocked before reaching Apps Script and remains PARTIAL route evidence only.
- no registry, Sheet data, Script Property, trigger, route wiring, source, business Feature Flag, Fast Auth, or `Code.gs` change occurred during post-deploy checks.

Current production:
- active Web App Version **146**.
- master+HEALTH ON only.
- ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION, and Fast Auth OFF/absent.
- Version 145 immediate rollback; Versions 144 and 143 deeper rollback points.

Open gate:
- design and CI-test the ScriptLock-protected resolution-registry writer and its fail-closed live evidence recheck.
- obtain explicit approval before creating/writing that registry.
- obtain separate explicit approval before enabling ORDER_LINE.
- preserve historical `مكرر`, keep Order ID/Line ID contracts unchanged, and never invent session links.
- continue family-by-family runtime activation only after each exact checkpoint passes.

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
- Production Apps Script is Version 146; Version 145 is immediate rollback, with Versions 144 and 143 as deeper rollback points.

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