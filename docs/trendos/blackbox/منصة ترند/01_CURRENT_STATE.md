# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Current active checkpoint — PERF-CF-02CW

`PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals`

Status: **IN PROGRESS — DIAGNOSIS COMPLETE — CANDIDATE PATCH PENDING**

### User request

- counters at the top of the department Orders table must show totals across the full active queue, not only the current server page;
- default filters must open as `الحالات الجارية فقط` + `كل الأولويات`;
- the Press Monitor must show the full unique active press-order total.

### Confirmed diagnosis

- `renderStats(rows)` currently counts only `state.rows`; under server paging that is the current page only.
- `statusFilter` already defaults to `__ACTIVE__`.
- `priorityFilter` currently defaults to `__ACTIVE__`, and JavaScript also converts blank `كل الأولويات` back to `__ACTIVE__` via `value || "__ACTIVE__"`.
- Press backend scans the full sheet but returns only `items.slice(0,12)` and does not return full unique `orderCount`; frontend therefore may count unique orders from the truncated list.

### Bounded fix direction

- D1 Orders Worker will compute `activeSummaryCounts` from the full screen-scoped active queue before pagination.
- Existing top chips keep their current row-count semantics but become page-independent.
- Summary adds unique `heatPressOrders` for the Press Monitor.
- Frontend uses the server summary when available and keeps current page payload for table rendering.
- Default priority becomes blank / all priorities; blank is no longer coerced to `__ACTIVE__`.
- Press Monitor prefers the global active unique press-order count and keeps legacy backend data as fallback.

### Production safety boundary

Production main baseline:

`3934fa363b113a4bd494ec501fb5f289f2c48ec1`

Worker baseline:

`9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%

- Apps Script Production deploy: **NO**
- D1 business-data write/migration: **NO**
- any Worker deployment must be code-only and must not rotate `EDGE_SESSION_SECRET`
- Orders writes remain Apps Script / Sheets
- eligible reads remain D1-first `/v1/edge/orders/02cr/page` with Apps Script fallback
- 02CL/reconcile OFF
- generic drain OFF

Record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md`

---

## Latest closed checkpoint — PERF-CF-02CV

`PERF-CF-02CV — Order Status Save / Read-After-Write Consistency`

Status: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

User closure instruction:

`مفيش عندى حاليا حاجة اجرب عليها اقفله ولو طلع فيه مشاكل فيما بعد نرجعله تانى`

02CV remains closed and is not reopened by 02CW.

Production at 02CV closure:

- main `3934fa363b113a4bd494ec501fb5f289f2c48ec1`
- Worker `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%
- no Apps Script deploy for 02CV
- durable Fly Print regression retained in normal Integrity.

---

## Previous closed checkpoint — PERF-CF-02CU

Status: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

User close confirmation: `ثبت`

---

## Trend Master V1931 — separate track

`TM-V1931-RESILIENCE — Trend Master Panel Resilience Candidate`

Status: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

Record:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`
