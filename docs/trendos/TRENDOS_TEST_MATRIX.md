# TrendOS Test Matrix

> Every implementation test must record: **Expected / Actual / PASS|FAIL**.
> Do not mark a feature verified because a file exists or a deployment action succeeded.

## A. Already verified / historical evidence

| Test | Expected | Actual | Result | Notes |
|---|---|---|---|---|
| GitHub working branch exists | branch available | `agent/go-live-2026-09-01-integrity` exists | PASS | current working branch |
| D1 full mirror | all sheets ready | newer project snapshot: 87 sheets / 31,176 rows / 87 ready / 0 pending | PASS | newer state outranks older snapshot |
| D1 stable cache V2.3 | cache path used | Version 143 contains `D1_FAST_STABLE_CACHE_V23`; historical runtime observed ~20ms cache lookup | PASS | source + historical runtime |
| Fast Auth V2.4 | installed and verified | Version 143 Orders read still calls `authorize_()` before stable cache; V2.4 prepared only | NOT RUN / NOT DEPLOYED | do not claim active |

## B. Phase 0 inventory tests

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| INV-01 | enumerate Order/Line create/update entry points | complete current-source list | documented in `inventory/ORDERS_LINES_INVENTORY.md` | PASS — REPO SOURCE |
| INV-02 | enumerate active Apps Script triggers | function + cadence | UI shows exactly one `d1OrdersLiveSyncTick`, `Time-driven` -> `Minutes timer` -> `Every minute`, deployment `Head` | PASS — UI EVIDENCE |
| INV-02A | exactly one installed D1 live-sync handler | one active handler, no duplicate | one visible `d1OrdersLiveSyncTick` row, error rate 0% at evidence time | PASS — UI EVIDENCE |
| INV-02B | installed D1 cadence | every 1 minute | edit/details UI shows `Every minute` | PASS — UI EVIDENCE |
| INV-03 | map invoice sweep/finalize paths | all entry points + idempotency risks documented | Ready Sweep, draft prepare, pricing, finalization, notification and reopen mapped; live duplicate drafts verified | PASS — SOURCE + LIVE DATA |
| INV-04 | map Attendance/Clock-in paths | all entry points + session/event integrity documented | routes, session start, clock-in, pulses, state computation, schedule and live attendance baseline mapped; live duplicate sessions/events verified | PASS — SOURCE + LIVE DATA |
| INV-05 | map Cleaning paths | status/complete, uniqueness, schedule/config and live baseline documented | check-then-append path, schema drift, config mismatch and 31-row live baseline mapped; 14 excess duplicate records verified | PASS — SOURCE + LIVE DATA |
| INV-06 | map Press queue/session paths | all entry points documented | PENDING | PENDING |
| INV-07 | map WhatsApp webhook/send paths | all entry points documented | PENDING | PENDING |
| INV-08 | map Handover/OPS paths | all entry points documented | PENDING | PENDING |
| INV-09 | map D1 sync/read/auth paths | current paths documented | D1 read/sync/Worker + legacy auth baseline/session/setup/invalidation entry points mapped; V2.4 invalidation/runtime parity still pending | PARTIAL |
| INV-09A | inspect D1 primary helper safety/fallback | source + fallback + auth known | Primary V1 uses feature flag, `authorize_()`, safety snapshot, cache, Sheets fallback | PASS — SOURCE |
| INV-09B | inspect production Orders Fast V2/V2.3 | exact sequence known | auth -> V2.3 stable cache -> probe -> V2.2 cache -> D1 build -> Sheets fallback | PASS — VERSION 143 SOURCE |
| INV-09C | determine Fast Auth V2.4 presence | exact auth known | Version 143 uses legacy `authorize_()` before cache | PASS — NOT DEPLOYED IN THIS PATH |
| INV-09D | inspect Dashboard D1 path | auth/safety/result/fallback known | D1-primary with shared safety snapshot and automatic Sheets fallback | PASS — VERSION 143 SOURCE |
| INV-09E | inspect Apps Script atomic/live sync | lock/stage/promote/cadence/error behavior known | `d1OrdersLiveSyncTick()` mapped; stages Orders+Lines, one promote, ScriptLock | PASS — SOURCE |
| INV-09F | verify Worker-side atomic promote | both sheets switch together transactionally | all staged sheets validated then one `env.DB.batch(statements)` | PASS — SOURCE + PLATFORM CONTRACT |
| INV-09G | map current `authorize_()` baseline | exact auth sequence known | Users lookup -> active -> token constant-time compare -> session expiry; failed auth may clear token | PASS — SOURCE |
| INV-09H | map `findUser_()` authoritative lookup | exact Users lookup/read pattern known | full Users `getDataRange().getValues()`, header resolution, sequential username scan; no cache/index | PASS — SOURCE |
| INV-09I | map session expiry policy | exact TTL/time rules known | default 12h; Script Property override; clamped 1–72h; unparsable issuedAt expires | PASS — SOURCE |
| INV-09J | map `ensureUsersSetup_()` hot-path work | setup calls/writes/cost known | header check on every auth; can append missing Token/Last Login headers; current headers already exist | PASS — SOURCE + LIVE HEADER |
| INV-10 | verify production source/version manifest | active deployment + source composition known | Version 143/runtime/top-level routes verified; full project composition still pending | PARTIAL |
| INV-10A | active deployment version | known | Version 143, Aug 29 2026 11:37 PM | PASS |
| INV-10B | deployment ID matches config | same deployment | visible prefix matches production config | PASS — PREFIX |
| INV-10C | deployed runtime identity | expected backend/workbook | `V1932_FULL_GO_LIVE_20260824`, correct workbook, Orders 152, Lines 180, 87 sheets | PASS |
| INV-10D | Version 143 D1 routes | exact targets known | Dashboard -> D1 Primary V1; Orders page -> D1 Fast V2 | PASS — SOURCE SNAPSHOT |

## C. Core integrity regression — required before Phase 1 exit

| ID | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| REG-01 | same Order create event x2 | one order, original ID reused | PENDING | PENDING |
| REG-02 | same Line create event x5 | one active Line ID | PENDING | PENDING |
| REG-02A | current live Line-ID baseline | zero Line IDs with >1 non-`مكرر` row | current live 194-row Lines snapshot has no Line ID with more than one non-`مكرر` row | PASS — LIVE DATA |
| REG-03 | concurrent Order/Line create triggers | no duplicate/partial active state | PENDING | PENDING |
| REG-04 | Line ID `3637-02` write/read | remains literal string | current live value appears literally as `3637-02`; write/read regression not yet executed | PARTIAL — LIVE READ |
| REG-05 | Line ID `3647-01` write/read | remains literal string | current live value appears literally as `3647-01`; write/read regression not yet executed | PARTIAL — LIVE READ |
| REG-06 | Line ID `3651-02` write/read | remains literal string | current live value appears literally as `3651-02`; write/read regression not yet executed | PARTIAL — LIVE READ |
| REG-07 | Clock-in x2 | one operational session / one daily clock-in | live attendance has duplicate employee/date sessions: Revan 2026-08-27 x3, Revan 2026-08-29 x2, Revan 2026-08-30 x2, Wael 2026-08-29 x2; `attStart_()` has no lock | FAIL — LIVE BASELINE + SOURCE RACE |
| REG-08 | fallback after Clock-in | no second session | per-row clock-in repeat is guarded, but find/start/check/write has no shared lock and duplicate daily sessions already exist | PENDING — KNOWN GAP |
| REG-09 | resume x5 rapidly | one logical resume event | Wael session `AT-20260829-وائل-5167c552` contains four Resume pulses within ~20 seconds; `attAppendPulse_()` appends blindly | FAIL — LIVE + SOURCE |
| REG-10 | activity before Clock-in | alert only, no operational activity before required clock-in | live config requires Clock-in, but `attendanceV1_()` only requires an open session and does not check `تسجيل الحضور` before activity events | FAIL — SOURCE CONTRACT |
| REG-11 | day rollover | prior session not inherited | `attFindToday_()` keys by Cairo business date; live new days use new sessions even when prior rows remain unended | PASS — SOURCE + LIVE BEHAVIOR |
| REG-12 | Friday without Special Schedule | no attendance/cleaning obligation/failure under closed-day policy | shared attendance/cleaning scheduler has no weekday/business-day rule; without exact special row it falls back to default 12:00 | PENDING — KNOWN BUSINESS-CALENDAR GAP |
| REG-13 | Friday with active Special Schedule | normal configured rules apply | exact-date override exists; integrated Friday/business-calendar regression not yet run | PENDING |
| REG-14 | Cleaning submit x2 | one logical cleaning record per employee/business day | live Cleaning sheet has 31 rows / 17 unique employee-date pairs = 14 excess rows across 10 duplicate groups; `cleaningV1_()` has no lock/event key | FAIL — LIVE BASELINE + SOURCE RACE |
| REG-15 | create press-required line | appears once in Press View | PENDING | PENDING |
| REG-16 | Press source/view counts | equal | PENDING | PENDING |
| REG-17 | Press Start x2 | one open session | PENDING | PENDING |
| REG-18 | Press Close x2 | same close result, no second mutation | PENDING | PENDING |
| REG-19 | completed press line without session | integrity alert only | PENDING | PENDING |
| REG-20 | Ready Sweep x10, no data change | one active draft/order; count unchanged | live draft sheet already has 50 Ready Sweep rows / 47 unique Order IDs; `3577`,`3572`,`3569` each have two Draft IDs; `glaPrepare_()` has no lock | FAIL — LIVE BASELINE + SOURCE |
| REG-21 | invoice generation x10 | one final invoice/order/version | final writer has ScriptLock + persisted request-key replay protection; full x10 runtime not executed; partial-write completion repair gap remains | PENDING — SOURCE STRONG / RUNTIME NEEDED |
| REG-22 | finalized/closed order + sweep | no return to pricing/draft queue unless explicit reopen | Ready Sweep ignores final invoice state; finalized order can remain operationally ready, be swept again, and draft can regress from `تم التقفيل` to `يحتاج تسعير/اعتماد` | FAIL — SOURCE CONTRACT |
| REG-23 | approved-priced order | exact approved total | PENDING | PENDING |
| REG-24 | unpriced order | explicit needs pricing/approval; never invent price | all 50 inspected Ready Sweep drafts show total 0 + explicit `لا توجد بنود معتمدة بسعر بيع.` blocker | PASS — LIVE + SOURCE |
| REG-25 | same WhatsApp webhook x5 | one inbound logical event/action | PENDING | PENDING |
| REG-26 | repeated outbound retry | no duplicate logical send/action | `glaSendReady_()` has no durable notification event idempotency; repeated finalize can avoid invoice duplicate but still resend WhatsApp | PENDING — KNOWN GAP |
| REG-27 | duplicate handover event | one Line ID + shift/businessDate event | PENDING | PENDING |
| REG-28 | repeated OPS follow-up without new state | no duplicate coach event | PENDING | PENDING |
| REG-29 | two concurrent automation triggers | no duplicated business mutation | PENDING | PENDING |
| REG-30 | D1 unsafe/partial state | fallback/reject rather than unsafe data | PENDING | PENDING |
| REG-31 | Line mutation while Orders+Lines stage | promoted D1 pair represents one consistent logical source state | current `updateLine_()` does not honor D1 tick ScriptLock | PENDING — KNOWN GAP |

## D. D1 performance / integrity lane

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| D1-01 | current atomic Orders+Lines sync health | atomic ready/live parity | Apps Script atomic client + Worker transaction + installed one-minute trigger verified; runtime parity needs reconfirm | PARTIAL — SOURCE/UI |
| D1-02 | V2.3 stable cache hit | no probe/fetch after auth | Version 143 source + historical runtime verified | PASS |
| D1-03 | V2.4 first auth hit | authoritative auth + safe cache populate | not deployed | NOT RUN |
| D1-04 | V2.4 cache hit | reduced auth latency, same authorization | not deployed | NOT RUN |
| D1-05 | auth invalidation | no stale authorization beyond approved rule | current login/logout/password/session/Active semantics mapped; V2.4 cache invalidation contract not yet verified | PENDING |
| D1-06 | D1/network failure | Sheets fallback works | source proves Orders + Dashboard fallback; forced runtime failure pending | PARTIAL — SOURCE |
| D1-07 | Worker promote transaction | Orders + Lines change together | all requested live-replacement + staging-cleanup statements run in one D1 `batch()` transaction | PASS — SOURCE + PLATFORM CONTRACT |
| D1-08 | promote succeeds but stats read fails | outcome is unambiguous/recoverable | Apps Script can report failure after possible successful promote; same-run replay then finds staging removed | PENDING — OBSERVABILITY GAP |

## E. Phase 1 GO/NO-GO gates

All must be green:

1. zero active duplicate Line IDs. **CURRENT BASELINE PASS; concurrency regression still pending.**
2. Ready Sweep produces no duplicate drafts. **FAIL — live duplicates exist.**
3. approved pricing maps correctly. **PENDING.**
4. finalized/closed orders do not return to draft queue. **FAIL — source contract allows regression.**
5. Press Source Queue = Press View Queue. **PENDING.**
6. Press Session tracking complete. **PENDING.**
7. Attendance/Cleaning idempotency passes. **FAIL — both Attendance and Cleaning have live duplicate state.**
8. Line IDs remain literal text. **PARTIAL live-read evidence; write regression pending.**
9. WhatsApp webhook/idempotent logical sends. **PENDING / known outbound gap.**
10. concurrency regression passes. **FAIL on current Attendance/Cleaning/Invoice source + live evidence.**
11. D1 Orders/Lines source snapshot consistency passes. **PENDING known lock gap.**
12. full E2E pack passes. **PENDING.**
13. zero open `CORE-P0` blockers. **FAIL — invoice, attendance, cleaning and source-snapshot gaps open.**
