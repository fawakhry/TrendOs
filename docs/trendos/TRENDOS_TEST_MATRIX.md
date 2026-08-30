# TrendOS Test Matrix

> Every implementation test must record: **Expected / Actual / PASS|FAIL**.
> Do not mark a feature verified because a file exists or a deployment action succeeded.

## A. Already verified / historical evidence

| Test | Expected | Actual | Result | Notes |
|---|---|---|---|---|
| GitHub working branch exists | branch available | `agent/go-live-2026-09-01-integrity` exists | PASS | current working branch |
| D1 full mirror | all sheets ready | newer project snapshot: 87 sheets / 31,176 rows / 87 ready / 0 pending | PASS | newer state outranks older 31,149 snapshot |
| D1 stable cache V2.3 | cache path used | `D1_FAST_STABLE_CACHE_V23` observed | PASS | historical runtime showed ~20ms cache lookup |
| Fast Auth V2.4 | installed and cache-hit verified | file prepared only | NOT RUN | must not claim deployed |
| WhatsApp knowledge import in Matbagy AI | document/chunks saved | `document_id:15`, `chunks:195` | PASS | module test, not Core |
| Matbagy AI manual memory save | one memory doc saved | `document_id:29`, `chunks:1` | PASS | module test |
| Matbagy AI v0.5.8 exact memory | direct answer without Ollama | not user-tested | UNKNOWN | AI-P0 |
| Lead Hunter V2 cancel/delete/toggle | fixes work in latest package | package generated, no user retest | UNKNOWN | LEAD-P0 |

## B. Phase 0 inventory tests

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| INV-01 | enumerate Order/Line create/update entry points | complete current-source list | documented in `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`; repo source inventoried | PASS — REPO SOURCE |
| INV-02 | enumerate active Apps Script triggers | function + cadence | PENDING | PENDING |
| INV-03 | map invoice sweep/finalize paths | all entry points documented | PENDING | PENDING |
| INV-04 | map Attendance/Clock-in paths | all entry points documented | PENDING | PENDING |
| INV-05 | map Cleaning paths | all entry points documented | PENDING | PENDING |
| INV-06 | map Press queue/session paths | all entry points documented | PENDING | PENDING |
| INV-07 | map WhatsApp webhook/send paths | all entry points documented | PENDING | PENDING |
| INV-08 | map Handover/OPS paths | all entry points documented | PENDING | PENDING |
| INV-09 | map D1 sync/read/auth paths | all current paths documented | Version 143 router targets verified; `getRowsPageD1PrimaryV1_()` behavior documented in `inventory/D1_READ_PATH_INVENTORY.md`; actual `getRowsPageD1FastV2_()` body still pending | PARTIAL |
| INV-09A | inspect D1 primary helper safety/fallback | D1 source + fallback + auth path known | `getRowsPageD1PrimaryV1_()` uses feature flag, `authorize_()`, D1 snapshot safety checks, cache, and automatic `getRowsPageV1931_()` fallback | PASS — SOURCE |
| INV-10 | verify exact production source/version manifest | active deployment + source composition known | Version 143, live runtime identity, and Version 143 top-level D1 route snapshot verified; complete Version 143 file/source composition still pending | PARTIAL |
| INV-10A | confirm active deployment version | current active Version known | Manage deployments shows Version 143 on Aug 29, 2026 11:37 PM | PASS |
| INV-10B | confirm deployment ID matches frontend config | configured/live deployment same | visible deployment ID prefix matches configured production deployment | PASS — PREFIX |
| INV-10C | confirm deployed runtime identity | live endpoint returns expected backend/spreadsheet/version | `success:true`; `V1932_FULL_GO_LIVE_20260824`; correct main spreadsheet; Users/Orders/Lines present; Orders rows 152; Lines rows 180; 87 sheets returned | PASS |
| INV-10D | verify Version 143 D1 route snapshot | deployed source shows actual `getDashboard` and `getRowsPageV1931` targets | Version 143 shows `getDashboardD1PrimaryV1_(e)` and `getRowsPageD1FastV2_(e)` | PASS — SOURCE SNAPSHOT |

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

## D. D1 performance lane — after correctness gates

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| D1-01 | current atomic Orders+Lines sync health | atomic ready/live parity | PENDING RECONFIRM | PENDING |
| D1-02 | V2.3 stable cache hit | no unnecessary probe/fetch | historical PASS | PASS HISTORICAL |
| D1-03 | V2.4 first auth hit | authoritative auth, safe cache populate | PENDING | PENDING |
| D1-04 | V2.4 cache hit | reduced auth latency, same authorization result | PENDING | PENDING |
| D1-05 | auth expiry/deactivation/logout invalidation | no stale authorization beyond approved rule | PENDING | PENDING |
| D1-06 | D1/network failure | Sheets fallback works | source proves fallback exists in `getRowsPageD1PrimaryV1_()`; forced runtime failure test still pending | PARTIAL — SOURCE |

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
11. full E2E pack passes.
12. zero open `CORE-P0` blockers.

## F. Future-phase acceptance placeholders

### Customer / Communication
- one customer identity across Orders/Messages/Payments/Designs.
- no duplicate inbound message processing.
- sensitive replies require review/live facts.

### Matbagy AI
- exact memory works.
- model health visible.
- live facts come from TrendOS connector.
- tenant isolation passes.

### Smart Designer
- Order/Line context preserved.
- proof approval versioned.
- print-ready output tied to approved version.
- archive reusable.

### Lead Hunter
- source -> lead -> customer -> order conversion traceable.
- latest V2 source-management fixes verified before reuse.
