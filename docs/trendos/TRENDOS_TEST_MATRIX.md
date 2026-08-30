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
| INV-02 | enumerate active Apps Script triggers | function + cadence | source intends 1-minute D1 trigger, but installed trigger not yet inspected | PENDING |
| INV-03 | map invoice sweep/finalize paths | all entry points documented | PENDING | PENDING |
| INV-04 | map Attendance/Clock-in paths | all entry points documented | PENDING | PENDING |
| INV-05 | map Cleaning paths | all entry points documented | PENDING | PENDING |
| INV-06 | map Press queue/session paths | all entry points documented | PENDING | PENDING |
| INV-07 | map WhatsApp webhook/send paths | all entry points documented | PENDING | PENDING |
| INV-08 | map Handover/OPS paths | all entry points documented | PENDING | PENDING |
| INV-09 | map D1 sync/read/auth paths | all current paths documented | Orders Fast V2/V2.3, Dashboard, Apps Script atomic sync and Worker promote mapped; trigger inventory + full auth/Worker contract remain | PARTIAL |
| INV-09A | inspect D1 primary helper safety/fallback | source + fallback + auth known | Primary V1 uses feature flag, `authorize_()`, safety snapshot, cache, Sheets fallback | PASS — SOURCE |
| INV-09B | inspect production Orders Fast V2/V2.3 | exact sequence known | auth -> V2.3 stable cache -> probe -> V2.2 cache -> D1 build -> Sheets fallback | PASS — VERSION 143 SOURCE |
| INV-09C | determine Fast Auth V2.4 presence | exact auth known | Version 143 uses legacy `authorize_()` before cache | PASS — NOT DEPLOYED IN THIS PATH |
| INV-09D | inspect Dashboard D1 path | auth/safety/result/fallback known | D1-primary with shared safety snapshot and automatic Sheets fallback | PASS — VERSION 143 SOURCE |
| INV-09E | inspect Apps Script atomic/live sync | lock/stage/promote/cadence/error behavior known | `d1OrdersLiveSyncTick()` mapped; stages Orders+Lines in 80-row batches, requests one promote, uses ScriptLock, source intends 1-minute trigger | PASS — SOURCE |
| INV-09F | verify Worker-side atomic promote | both sheets switch together transactionally | `promoteStagedSheets()` validates all staged sheets, builds one statement list for all requested sheets, and executes one `env.DB.batch(statements)`; D1 docs define batch as transactional/rollback-on-failure | PASS — SOURCE + PLATFORM CONTRACT |
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
| REG-03 | concurrent Order/Line create triggers | no duplicate/partial active state | PENDING | PENDING |
| REG-04 | Line ID `3637-02` write/read | remains literal string | PENDING | PENDING |
| REG-05 | Line ID `3647-01` write/read | remains literal string | PENDING | PENDING |
| REG-06 | Line ID `3651-02` write/read | remains literal string | PENDING | PENDING |
| REG-07 | Clock-in x2 | one operational session | PENDING | PENDING |
| REG-08 | fallback after Clock-in | no second session | PENDING | PENDING |
| REG-09 | resume x5 rapidly | one logical resume event | PENDING | PENDING |
| REG-10 | activity before Clock-in | alert only, no invented start time | PENDING | PENDING |
| REG-11 | day rollover | prior session not inherited | PENDING | PENDING |
| REG-12 | Friday without Special Schedule | no attendance/cleaning failure | PENDING | PENDING |
| REG-13 | Friday with active Special Schedule | normal configured rules apply | PENDING | PENDING |
| REG-14 | Cleaning submit x2 | one logical cleaning record | PENDING | PENDING |
| REG-15 | create press-required line | appears once in Press View | PENDING | PENDING |
| REG-16 | Press source/view counts | equal | PENDING | PENDING |
| REG-17 | Press Start x2 | one open session | PENDING | PENDING |
| REG-18 | Press Close x2 | same close result, no second mutation | PENDING | PENDING |
| REG-19 | completed press line without session | integrity alert only | PENDING | PENDING |
| REG-20 | Ready Sweep x10, no data change | draft count unchanged | PENDING | PENDING |
| REG-21 | invoice generation x10 | one draft/order/version | PENDING | PENDING |
| REG-22 | delivered/closed order + sweep | no new draft | PENDING | PENDING |
| REG-23 | approved-priced order | exact approved total | PENDING | PENDING |
| REG-24 | unpriced order | explicit needs pricing/approval | PENDING | PENDING |
| REG-25 | same WhatsApp webhook x5 | one inbound logical event/action | PENDING | PENDING |
| REG-26 | repeated outbound retry | no duplicate logical send/action | PENDING | PENDING |
| REG-27 | duplicate handover event | one Line ID + shift/businessDate event | PENDING | PENDING |
| REG-28 | repeated OPS follow-up without new state | no duplicate coach event | PENDING | PENDING |
| REG-29 | two concurrent automation triggers | no duplicated business mutation | PENDING | PENDING |
| REG-30 | D1 unsafe/partial state | fallback/reject rather than unsafe data | PENDING | PENDING |
| REG-31 | Line mutation while Orders+Lines stage | promoted D1 pair represents one consistent logical source state | current `updateLine_()` does not honor the D1 tick ScriptLock | PENDING — KNOWN GAP |

## D. D1 performance / integrity lane

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| D1-01 | current atomic Orders+Lines sync health | atomic ready/live parity | Apps Script atomic client + Worker transaction design verified; runtime parity needs reconfirm | PARTIAL — SOURCE |
| D1-02 | V2.3 stable cache hit | no probe/fetch after auth | Version 143 source + historical runtime verified | PASS |
| D1-03 | V2.4 first auth hit | authoritative auth + safe cache populate | not deployed | NOT RUN |
| D1-04 | V2.4 cache hit | reduced auth latency, same authorization | not deployed | NOT RUN |
| D1-05 | auth invalidation | no stale authorization beyond approved rule | design not installed/verified | PENDING |
| D1-06 | D1/network failure | Sheets fallback works | source proves Orders + Dashboard fallback; forced runtime failure pending | PARTIAL — SOURCE |
| D1-07 | Worker promote transaction | Orders + Lines change together | all requested live-replacement + staging-cleanup statements run in one D1 `batch()` transaction | PASS — SOURCE + PLATFORM CONTRACT |
| D1-08 | promote succeeds but stats read fails | outcome is unambiguous/recoverable | Apps Script can report failure after possible successful promote; same-run promote replay then finds staging removed | PENDING — OBSERVABILITY GAP |

## E. Phase 1 GO/NO-GO gates

All must be green:

1. zero active duplicate Line IDs.
2. Ready Sweep produces no duplicate drafts.
3. approved pricing maps correctly.
4. closed/delivered orders do not return to draft queue.
5. Press Source Queue = Press View Queue.
6. Press Session tracking complete.
7. Attendance/Cleaning idempotency passes.
8. Line IDs remain literal text.
9. WhatsApp webhook idempotent.
10. concurrency regression passes.
11. D1 Orders/Lines source snapshot consistency passes.
12. full E2E pack passes.
13. zero open `CORE-P0` blockers.
