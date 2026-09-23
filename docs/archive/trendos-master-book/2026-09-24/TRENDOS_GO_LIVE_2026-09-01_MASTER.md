# TrendOS Go-Live 01/09/2026 — Integrated Integrity Master Plan

## Scope
This file merges the prior TrendOS repair/go-live workstreams with the current D1 architecture and is the handoff source for future chats.

Target spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Target repo: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`
Backup branch: `backup/go-live-2026-08-30-pre-p0`

## Non-negotiable rules
- Never delete valid historical data.
- Never invent prices, order states, financial settlements, or press energy values.
- Duplicate events do not count as production.
- `Line ID` is the logical unique key for order lines.
- `Order ID` is the logical unique key for orders.
- Every write path must become idempotent.
- Use locks around check-then-create/update paths.
- Fix root causes in Apps Script / triggers / mapping / views / automation; do not hide symptoms in UI.
- Regression tests must record Expected / Actual / PASS|FAIL.
- Do not declare GO until every P0 gate is green.

## Current architecture baseline
### Google Sheets / Apps Script
Google Sheets remains the authoritative write source for operational and financial writes.
Current production package uses the existing `Code.gs` plus V1932/V1940 modules such as:
- `v1932-router.gs`
- `customer-manager-backend-v1932.gs`
- `customer-feedback-backend-v1.gs`
- `attendance-backend-v1.gs`
- `attendance-clockin-backend-v1.gs`
- `hr-backend-v1.gs`
- `cleaning-backend-v1.gs`
- `press-control-backend-v1.gs`
- `go-live-autopilot-v1.gs`

### D1 read path
- Full D1 migration completed for the mirror.
- Orders + Order Lines use Atomic live sync: staging first, then one promote.
- Production D1 remains READY while staging is built.
- Stable page cache V2.3 works.
- Latest verified read source: `D1_FAST_STABLE_CACHE_V23`.
- Remaining performance bottleneck is Apps Script authorization, not D1.
- `D1_Orders_Fast_V2_4.gs` (Fast Auth V2.4) has been prepared but is NOT yet installed/deployed. Preserve this checkpoint until integrity P0 changes are separated and tested.

## Safety snapshots already created
- Google Sheet backup: `BACKUP_TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY_2026-08-30_PRE_GO_LIVE_P0`
- GitHub backup branch: `backup/go-live-2026-08-30-pre-p0`

## Important configuration finding
Spreadsheet metadata currently reports timezone `America/Los_Angeles`, while operational modules explicitly use `Africa/Cairo` and business rules require Cairo time. Treat this as a configuration integrity risk. Do not change it blindly; first inventory all code/formulas that depend on spreadsheet/script timezone, then normalize through one Business Calendar layer.

---

# Execution order

## Phase 0 — Inventory and baseline (no production mutation except snapshots)
1. Inventory all functions, routes, triggers and sheets for:
   - order/line creation and updates
   - invoice draft sweep/finalization
   - attendance and clock-in
   - cleaning
   - press queue/session
   - WhatsApp webhook/send
   - OPS_REPLY / OPS_COACH
   - hand-over
   - Go-Live plan / E2E
2. Capture current integrity counts.
3. Record active trigger list and execution cadence.
4. Build a map: Event -> Entry point -> Lock -> Idempotency key -> Sheet(s) written -> Retry behavior.

## Phase 1 — Shared integrity foundation (must precede module fixes)
Create shared backend helpers, ideally in a new Apps Script module such as `trendos-integrity-v1.gs`:
- `trendosNormalizeOrderId_(value)`
- `trendosNormalizeLineId_(value)`
- `trendosBusinessDate_(date)`
- `trendosBusinessSchedule_(date)`
- `trendosIsBusinessDay_(date)`
- `trendosEventKey_(eventType, entityId, businessDate, relevantState)`
- `trendosIdempotencyClaim_(...)`
- `trendosIdempotencyComplete_(...)`
- `trendosIdempotencyLookup_(...)`
- `trendosWithLock_(scope, fn)`
- `trendosAutomationRunStart_/Finish_`
- centralized closed/open-state helpers.

The idempotency store must not rely on timestamps as uniqueness. It must support retry-safe update semantics.

## Phase 2 — P0 Line ID integrity + transaction-like Order/Line writes
Issues: P0-01, P0-02, P0-10, P1-19, P1-20.

Required changes:
- All line creation paths become UPSERT by normalized `Line ID`.
- More than one ACTIVE row for the same Line ID is forbidden.
- Historical rows already marked `مكرر` stay preserved.
- Duplicate rows are excluded from active queue/productivity/KPI calculations.
- Force Line ID writes as literal text and format relevant columns Plain Text.
- Add repair detector for date-coerced IDs; recover only from reliable Order/source evidence.
- Add lock around order + lines creation and safe retry completion of partial states.

Acceptance:
- Same Line create event x5 => one active line.
- Same Order create event x2 => one order, original IDs reused.
- concurrent triggers do not double-create.

## Phase 3 — Business Calendar + Attendance + Cleaning
Issues: P0-03, P0-04, P1-15, P1-16.

One Business Calendar:
- Timezone: `Africa/Cairo`
- Default work hours: `12:00 -> 21:00`
- Weekly holiday: Friday
- `تشغيل - مواعيد خاصة` overrides defaults.
- All attendance/cleaning/standard-work/press/hand-over alert rules call the same calendar helpers.

Observed gaps to fix:
- Attendance pulses are append-only; resume currently has no shared event idempotency/debounce.
- Clock-in can fall back to creating/starting attendance when today row is absent; race protection must be added.
- Cleaning sequentially checks employee+date, but has no lock and does not use the requested full logical key employee+department+businessDate+checklistType.

Acceptance:
- Clock-in x2 => one operational session.
- fallback after clock-in => no second session.
- resume x5 rapidly => one logical resume event.
- activity before clock-in => Missing Clock-in alert only; do not invent startAt.
- day rollover does not inherit prior session.
- Friday no Special Schedule => no missing-attendance/cleaning failure.
- Friday with active Special Schedule => normal rules apply.
- Cleaning submit x2 => one logical record.

## Phase 4 — Press source queue, view and session integrity
Issues: P0-05, P0-06.

Current backend already derives `pressQueue_()` from `بنود الأوردرات`, but must be upgraded:
- normalize/dedupe by Line ID.
- exclude `مكرر` and all centralized closed states.
- include Line ID in queue item objects.
- make `واجهة المكبس` use exactly the same source/filter contract.
- calculate `PRESS_SOURCE_QUEUE_COUNT` and `PRESS_VIEW_QUEUE_COUNT` and alert on mismatch.

Press session must record:
- Session ID
- Start
- Operator
- Support operator
- Queue at start
- Line IDs included
- End
- actual completed count
- Queue at end
- duration
- minutes/order

Observed gaps:
- current press session row stores counts but not the included Line IDs.
- start check is not protected by a shared lock, so concurrent starts can race.
- repeated stop is not designed as an idempotent close operation.

Acceptance:
- create press-required line => appears once in press view.
- Start x2 => one open session.
- Close x2 => same close result, no second close mutation.
- press-required line reaching completed state without a corresponding press event => integrity alert, not an accusation.

## Phase 5 — Invoice Generator / Ready Sweep
Issues: P0-07, P0-08, P0-09.

Observed root-cause candidates already confirmed in current code:
- Ready Sweep calls `glaPrepare_()` and recreates a missing draft; manually deleting/closing a draft leaves no persistent order-level generation state.
- `glaUpsertDraft_()` is sequentially an upsert by Order ID, but check-then-append is not protected by a lock, so concurrent sweeps can create duplicates.
- There is no single centralized `isInvoiceDraftEligible(order)` used by all prepare/sweep entry points.
- Draft calculation currently sources billable totals from `حسابات - فواتير الأقسام`; zero totals must be traced against approved sale-price source/mapping before changing data.

Fix sequence:
1. Implement centralized eligibility.
2. Add order-level Invoice Generation State / material-change signature.
3. Lock + idempotency around draft UPSERT.
4. Never regenerate settled/closed manual draft unless a material change is recorded.
5. Trace Approved Sale Price source and mapping; do not invent prices.
6. Exclude delivered/cancelled/duplicate/other closed states.

Acceptance:
- Ready Sweep x10, no data change => draft count unchanged.
- Invoice generation x10 => one draft/order/version.
- delivered order + sweep => no new draft.
- approved-priced order => draft total equals exact approved sum.
- unpriced order => remains `يحتاج تسعير/اعتماد` with evidence.

## Phase 6 — WhatsApp / Webhook production safety
Issue: P0-13.

Observed confirmed gap:
- current webhook appends each incoming Meta message through `cmAppendMessage_()` and does not reject a previously processed `Meta Message ID` before append.

Fix:
- Meta Message ID becomes primary idempotency component when present.
- lock webhook processing.
- same incoming message x5 => one stored inbound event and no duplicate order/action.
- retry-safe outbound message state.
- never create Final Order before required confirmation.
- never send unapproved total/invoice.

## Phase 7 — Hand-over, OPS follow-up, fact-based alerts
Issues: P0-11, P1-14, P1-15.

- One hand-over event per Line ID + shift/business date.
- Store current status, stop reason, next action, responsible person, timestamp.
- OPS_REPLY follow-up state: replyId, followedUpAt, coachNoteId.
- do not create second OPS_COACH without new reply/state.
- every alert stores explicit evidence fields; inactivity alone is never treated as proof of absence/negligence/machine failure.

## Phase 8 — Data Integrity Dashboard + Observability
Issues: P1-17, P1-18.

Create `إدارة - صحة النظام` with counts + drill-down IDs for:
- active duplicate Line IDs
- duplicate attendance sessions
- duplicate cleaning records
- duplicate draft invoices
- closed orders with draft
- press source/view queue counts + mismatch
- press-completed lines without session/event
- invalid/date-coerced Line IDs
- unpriced drafts
- unresolved P0 blockers
- open ANDON
- last successful automation run
- last automation error

Create unified automation run log:
Run ID, function, start/end, status, rows read/created/updated/skipped duplicate, errors, retry count.

## Phase 9 — D1 performance lane
Only after correctness gates are stable:
- install/test `D1_Orders_Fast_V2_4.gs`.
- verify `FAST_AUTH_CACHE_V24` after first authoritative auth.
- keep writes/financial gates on Google Sheets.
- do not allow performance cache changes to weaken authorization or integrity rules.

## Phase 10 — Regression + E2E + Go/No-Go
Regression minimum:
- same Order event x2
- same Line event x5
- Clock-in x2
- fallback after Clock-in
- resume x5 rapidly
- Cleaning x2
- Ready Sweep x10
- Invoice generation x10
- same WhatsApp webhook x5
- create Press Line -> visible in view
- Start Press x2
- Close Press x2
- delivered order -> Ready Sweep
- Line IDs `-01`, `-02`
- Friday without Special Schedule
- Friday with Special Schedule
- two concurrent triggers

Each test stores Expected / Actual / PASS|FAIL.
Then run the full 20 E2E scenarios.

# GO / NO-GO gates
GO is forbidden unless all are true:
1. zero active duplicate Line IDs
2. Ready Sweep produces no duplicate drafts
3. approved pricing maps correctly into draft totals
4. closed/delivered orders do not return to draft queue
5. Press Source Queue = Press View Queue
6. Press Session tracking complete
7. Attendance/Cleaning idempotency passes
8. Line IDs remain literal text
9. WhatsApp webhook idempotent
10. all 20 E2E scenarios PASS
11. zero open P0 blockers

Final output format:
`Issue ID | Root Cause | Files/Functions Changed | Fix | Test | Result | Remaining Risk`

Decision must be exactly GO or NO-GO, with reasons for NO-GO.

---

# Chat handoff / continuation prompt
Paste this into a new chat when the current chat becomes too long:

> Continue the TrendOS Go-Live 01/09/2026 integrity program from `TRENDOS_GO_LIVE_2026-09-01_MASTER.md` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Do not restart analysis from scratch and do not modify production blindly. The main spreadsheet is `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`. A spreadsheet backup named `BACKUP_TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY_2026-08-30_PRE_GO_LIVE_P0` and GitHub backup branch `backup/go-live-2026-08-30-pre-p0` already exist. Google Sheets remains authoritative for writes. D1 Orders/Lines Atomic Sync is already working; V2.3 stable page cache is verified; Fast Auth V2.4 is prepared but intentionally not yet deployed. Continue in the master-plan order: finish Inventory -> shared idempotency/business-calendar/locking foundation -> P0 Line/Order integrity -> Attendance/Cleaning -> Press -> Invoice -> WhatsApp -> Hand-over/OPS -> Integrity Dashboard/Observability -> D1 Fast Auth -> Regression/E2E -> GO/NO-GO. Preserve historical valid data; never invent prices/states; Line ID is the logical unique key and Order ID the order key. Every fix must be idempotent and tested with Expected/Actual/PASS|FAIL. Before any major mutation, confirm the existing snapshot is sufficient or make an additional snapshot. Do not declare GO unless all master-plan gates pass.
