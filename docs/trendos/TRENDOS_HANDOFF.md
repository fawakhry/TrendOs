# TrendOS Handoff

> Read this file first in a new execution chat. Last consolidated: 2026-08-30.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Final TrendOS V1 launch target: **01/03/2027**.

Repository:
- `fawakhry/TrendOs`
- production/default: `main`
- working: `agent/go-live-2026-09-01-integrity`
- safety: `backup/go-live-2026-08-30-pre-p0`

Canonical plan: `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Canonical read order

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_HANDOFF.md`
3. `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md`
4. `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`
5. `docs/trendos/inventory/D1_DASHBOARD_PATH_INVENTORY.md`
6. `docs/trendos/inventory/D1_ATOMIC_SYNC_INVENTORY.md`
7. `docs/trendos/inventory/D1_WORKER_ATOMIC_ROUTING_INVENTORY.md`
8. `docs/trendos/inventory/APPS_SCRIPT_TRIGGER_INVENTORY.md`
9. `docs/trendos/inventory/AUTH_PATH_INVENTORY.md`
10. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
11. `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`
12. `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`
13. `docs/trendos/inventory/CLEANING_INVENTORY.md`
14. `docs/trendos/inventory/PRESS_INVENTORY.md`
15. `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md`
16. `docs/trendos/inventory/HANDOVER_OPS_INVENTORY.md`
17. `docs/trendos/TRENDOS_TEST_MATRIX.md`
18. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

Evidence precedence:
`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`.

## Production identity

Active Apps Script Web App:
- Version **143**
- timestamp: **Aug 29 2026 11:37 PM**
- deployment ID prefix matches production `config.js`

Live health previously verified:
- backend `V1932_FULL_GO_LIVE_20260824`
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- 87 sheets

Version 143 top-level routes verified from Project History source snapshot:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

**Do not overwrite Apps Script from GitHub `Code.gs`; GitHub is behind deployed/editor D1 wiring.**

## Current architecture checkpoint

### Writes
Google Apps Script + Google Sheets remain authoritative for operational/financial writes.

### Reads
- Orders: D1 Fast V2/V2.3 + Sheets fallback.
- Dashboard: D1 Primary + Sheets fallback.
- Fast Auth V2.4: prepared only; not installed/deployed/verified.

### D1 sync
Verified:
- exactly one installed `d1OrdersLiveSyncTick` trigger.
- Head / Time-driven / Minutes timer / Every minute.
- Apps Script stages Orders + Lines under a ScriptLock and sends one combined promote.
- Worker validates staging and executes one transactional `env.DB.batch(statements)`.

Open D1 issues:
- source snapshot consistency: writers including `updateLine_()` and `submitCustomerDraft_()` do not all honor the same shared lock, so Orders and Lines can be sampled at different logical moments before an atomic D1 promote.
- promote-success / mirror-stats-failure ambiguity remains recoverability/observability debt.

## Authentication baseline — inventory complete

Current legacy auth is uncached and reads the Users sheet authoritatively on each request.

Verified:
- `authorize_()` -> `findUser_()`.
- hot-path Token/Last Login schema check.
- full Users used-range read + sequential username scan.
- Active check, constant-time token compare, session expiry.
- session default 12h, configurable/clamped 1–72h.
- login rotates Token + Last Login.
- logout/password change clear Token.
- bad/expired auth can clear stored Token.

`INV-09G/H/I/J = PASS`.

Fast Auth V2.4 invalidation/runtime remains pending because V2.4 is not deployed.

## Live Line-ID baseline

Original live `بنود الأوردرات` audit snapshot:
- 194 rows including header.
- 35 rows status `مكرر`.
- no Line ID has more than one non-`مكرر` live row.

Current zero-active-duplicate baseline = PASS; concurrency regression remains pending.

Data-quality-only cases:
- `3216-02`
- `3536-01`

Do not repair/delete blindly.

Current Line IDs such as `3637-02`, `3647-01`, `3651-02` render literally. Historical `سجل تنبيهات التشغيل` also proves older Line IDs were sometimes coerced into Date values, so normalization/text-format protection is still required.

## INV-03 Invoice / Ready Sweep — complete, NOT green

Report: `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`

Live draft baseline:
- 50 Ready Sweep rows.
- 47 unique Order IDs.
- duplicates: `3577`, `3572`, `3569` each have two Draft IDs.

`glaPrepare_()` has no lock around find -> append/update.

`REG-20 = FAIL — LIVE + SOURCE`.

Ready Sweep does not check final-invoice state. A finalized order can remain operationally ready, be swept again, and its draft can regress from `تم التقفيل` to `يحتاج تسعير/اعتماد`.

`REG-22 = FAIL — SOURCE CONTRACT`.

Unpriced safety is positive: all inspected unpriced drafts remain total 0 with an explicit blocker.

`REG-24 = PASS — LIVE + SOURCE`.

Final writer has ScriptLock + persisted request-key replay protection, but multi-sheet finalization is not transactionally repairable after every partial failure. Invoice-ready WhatsApp send remains separately non-idempotent.

## INV-04 Attendance / Clock-in — complete, NOT green

Report: `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`

Live duplicate daily-session groups:
- Revan 2026-08-27 x3.
- Wael 2026-08-29 x2.
- Revan 2026-08-29 x2.
- Revan 2026-08-30 x2.

`REG-07 = FAIL — LIVE + SOURCE RACE`.

Pulse ledger has no event key/debounce. One Wael session has four Resume pulses within ~20 seconds.

`REG-09 = FAIL`.

Clock-in is configured required but broader attendance activity does not enforce it.

`REG-10 = FAIL`.

Cairo business-date day rollover is isolated correctly (`REG-11 PASS`). Friday/business-calendar policy remains uncentralized.

## INV-05 Cleaning — complete, NOT green

Report: `docs/trendos/inventory/CLEANING_INVENTORY.md`

Live baseline:
- 31 cleaning rows.
- 17 unique employee/date pairs.
- 14 excess duplicate rows across 10 duplicate groups.

`cleaningV1_()` uses check -> append without lock/event key.

`REG-14 = FAIL — LIVE + SOURCE RACE`.

Backend hardcodes checklist success values instead of persisting the real checklist payload, and several live cleaning configuration keys are not consumed by the supplied backend path.

## INV-06 Press — complete, NOT green

Report: `docs/trendos/inventory/PRESS_INVENTORY.md`

Current source queue using exact `pressQueue_()` criteria:
- 8 unique press orders.
- 0 urgent.

Legacy `واجهة المكبس` contains only the header / 0 data rows. Current V1932 backend computes directly from Lines.

Start and Stop lack shared lock/idempotent request contracts:
- `REG-17 = FAIL`.
- `REG-18 = FAIL`.

Sessions store counts but no specific Order IDs/Line IDs, so line-to-session proof is impossible:
- `REG-19 = FAIL`.

Power/rate are blank/disabled and source does not invent electricity costs.

## INV-07 WhatsApp / Customer Manager — complete, NOT green

Report: `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md`

### Inbound
Merged/current `cmAppendMessage_()` is stronger than older assumptions:
- UserLock 10s.
- Meta Message ID scan under lock.
- duplicate Meta ID returns existing internal message ID instead of appending.

However the outer merged webhook calls `cmMetaMessageExists_(metaId)`, and that helper definition was not found in any accessible current/Library/GitHub/Drive source snapshot.

Do **not** state that live Version 143 is definitely broken from this alone because exact project composition is still unresolved. Treat the accessible merged/fix source family as having an unresolved dependency that must not be redeployed blindly.

Standalone `customer-manager-backend-v1932.gs` is older and lacks the newer append-level duplicate guard, proving source lineage drift.

Live Customer Manager has four TEST inbound rows with distinct Meta IDs; no live duplicate Meta ID in that small baseline.

`REG-25 = PARTIAL — SOURCE COMPOSITION BLOCKER`.

### Outbound
Customer Manager send and `glaSendReady_()` call Meta before any durable logical send claim. A retry after ambiguous completion can send another real message with a new Meta ID.

`REG-26 = FAIL — SOURCE CONTRACT`.

### Feedback
Standalone feedback module has a stronger ScriptLock/Order guard, while merged `cfScan_()` is check -> Meta send -> append without a surrounding lock.

Live `تقييم العملاء` has confirmed duplicate Order IDs including `3579`, `3632`, `3697`, `3583`, plus schema drift between old/new feedback lineages.

V1940 deploy health checks top-level functions only and would not catch the missing webhook helper/dependency graph.

## INV-08 Handover / OPS — complete, NOT green

Report: `docs/trendos/inventory/HANDOVER_OPS_INVENTORY.md`

No canonical Handover route/ledger was found in the accessible current source:
- no Line-ID + shift/businessDate event.
- no persisted real-status/blocker/next-action contract.
- current End Day UI only shows a dashboard summary.

Live OPS_COACH notes instruct employees to perform Hand-over, but those are instructions rather than structured handover records.

`saveMatbagyNote_()` is generic UUID append-only with no lock/entity key/event key/state fingerprint.

Employee replies and ANDON create fresh timestamp-based OPS_REPLY notes, so logical retry is not idempotent and entity binding is free text.

- `REG-27 = FAIL — HANDOVER CONTRACT ABSENT`.
- `REG-28 = FAIL — OPS EVENT CONTRACT`.

Trend Master automation queue has deterministic repetition keys, but existing-key scan -> append has no ScriptLock and the core run has no durable run claim. Concurrent runs can duplicate one logical event.

`REG-29 = FAIL — SOURCE RACE`.

Historical automation-queue Line IDs contain many Date-coerced values, strengthening the requirement for centralized text ID normalization.

## Phase 0 inventory status

### Module inventories complete
- `INV-01` Orders / Lines — PASS inventory.
- `INV-02` installed triggers/cadence — PASS.
- `INV-03` Invoice / Ready Sweep — PASS inventory, correctness failures open.
- `INV-04` Attendance / Clock-in — PASS inventory, correctness failures open.
- `INV-05` Cleaning — PASS inventory, correctness failures open.
- `INV-06` Press — PASS inventory, correctness failures open.
- `INV-07` WhatsApp / Feedback — PASS inventory, correctness/source-composition failures open.
- `INV-08` Handover / OPS — PASS inventory, correctness contract absent/open.

### Still partial before Phase 0 checkpoint closes
- `INV-09` overall: current D1/auth path mostly mapped; Fast Auth V2.4 invalidation/runtime and selected forced-failure evidence remain not deployed/not verified.
- `INV-10`: active Version 143 and top-level routes are verified, but exact complete Apps Script project file/source composition remains unresolved.

Phase 0 is now **consolidation + authoritative-source reconciliation**, not another module inventory.

## Current GO/NO-GO

**NO-GO**.

Confirmed blockers include:
1. Ready Sweep duplicate drafts.
2. finalized invoice can regress into Ready Sweep/pricing queue.
3. Attendance duplicate sessions and pulse events.
4. required Clock-in not enforced before broader activity.
5. Cleaning duplicate daily records/checklist contract gaps.
6. Press Start/Stop concurrency and no line-level session traceability.
7. WhatsApp outbound send is not logically idempotent; inbound source dependency/composition unresolved.
8. no canonical Handover ledger; OPS/ANDON notes are non-idempotent/free-form.
9. Trend Master queue concurrent-run race.
10. historical Line-ID date coercion.
11. D1 Orders/Lines source snapshot consistency gap.
12. full regression/E2E pack not run.

Positive evidence:
- current live zero active duplicate Line-ID baseline.
- D1 Worker atomic promote verified.
- one-minute D1 sync trigger verified.
- unpriced invoice paths do not invent prices.
- Cairo attendance day rollover isolation works.
- Press energy cost is not invented when configuration is blank.

## Exact current stopping point

**Phase 0 final reconciliation.**

Autonomous next work:
1. reconcile as much of Version 143 Apps Script composition as possible from GitHub history, deploy manifest, Library builds and known Project History evidence.
2. inspect Fast Auth V2.4 prepared source for invalidation/security contract only — do not install/deploy.
3. update `PRODUCTION_SOURCE_RECONCILIATION.md` + Test Matrix with the strongest achievable evidence boundary.
4. freeze the CORE-P0 repair set.
5. only then begin `trendos-integrity-v1.gs` implementation on the working branch; no production deploy without an explicit verified checkpoint.

## First implementation after Phase 0

Create shared `trendos-integrity-v1.gs` to centralize:
- Order ID normalization.
- Line ID normalization/text protection.
- shared mutation locks.
- durable idempotency claim/complete/lookup.
- Cairo Business Calendar / businessDate / schedule.
- automation-run start/finish ledger.
- open/closed/finalized eligibility helpers.
- Handover event model.
- OPS state fingerprint/event key.

Then patch modules against that shared contract rather than independent local fixes.

## Non-negotiable safeguards

- Never delete valid historical data.
- Never invent prices/states/payments/stock/approval facts.
- Order ID is the order key.
- Line ID is the logical active-line key.
- repeated writes must become idempotent.
- check-then-write requires a shared lock or atomic durable claim.
- `مكرر` rows remain history but do not count as active work.
- Google Sheets remains write authority/fallback until an approved migration changes it.
- do not deploy from GitHub `Code.gs` until production source composition is reconciled.
- tests record Expected / Actual / PASS|FAIL.
