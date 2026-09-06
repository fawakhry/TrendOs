# PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**IN PROGRESS — DIAGNOSIS COMPLETE — CANDIDATE PATCH PENDING**

## User request

1. عدادات شاشة القسم لا تعد الصفحة الحالية فقط؛ المطلوب إجمالي الحالات الجارية عبر كل صفحات الشيت.
2. الفلتر الافتراضي دائمًا: `الحالات الجارية فقط` + `كل الأولويات`.
3. `متابعة المكبس` تعرض إجمالي أوردرات المكبس، وليس عدد أوردرات قائمة جزئية.

## Confirmed diagnosis

### Page counters

Production `renderStats(rows)` counts only the array passed from `applyFiltersAndRender()`. Under server paging, `state.rows` contains only the current page, so a six-row active queue split across pageSize=5 appears as 5 on page 1 and 1 on page 2.

### Default priority filter

- `statusFilter` already defaults to `__ACTIVE__` / `الحالات الجارية فقط`.
- `priorityFilter` HTML currently selects `__ACTIVE__` / `العاجل والعادي فقط`.
- `applyFiltersAndRender()` also uses `$("priorityFilter").value || "__ACTIVE__"`, so an intentional blank `كل الأولويات` is coerced back to `__ACTIVE__`.

### Press monitor

`pressQueue_()` scans the full Orders Lines sheet but returns only `items.slice(0,12)` and does not return a unique full-queue `orderCount`. `press-control-v1.js` prefers the unique order IDs calculated from the returned items, so the displayed order total can undercount the whole queue.

## Bounded fix design

No Apps Script Production deployment is required.

1. D1 Orders Worker computes an `activeSummaryCounts` object from the entire screen-scoped active queue **before pagination** and independent of current page/search/priority/press filters.
2. Summary preserves existing row-count semantics for the top chips and additionally exposes unique `heatPressOrders` for the press monitor.
3. Frontend stores `activeSummaryCounts` and uses it for top stats whenever server paging is active; the current page remains the only table payload.
4. Default priority becomes blank / `كل الأولويات`; JavaScript no longer coerces blank to `__ACTIVE__`.
5. Press monitor prefers `activeSummaryCounts.heatPressOrders`; legacy backend queue data remains a fallback.
6. Existing authority remains unchanged: Orders writes Apps Script / Sheets; D1 remains read-only for this path.

## Safety invariants

- No Apps Script Production deploy.
- No D1 business-data write/migration.
- No secret rotation / no `EDGE_SESSION_SECRET` change.
- Worker code-only deploy may occur only after candidate/Integrity PASS.
- Sheets / Apps Script write authority retained.
- 02CL/reconcile OFF; generic drain OFF.
- 02CV remains CLOSED.

## Production baseline at checkpoint open

- main: `3934fa363b113a4bd494ec501fb5f289f2c48ec1`
- Worker: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%
- Apps Script deployment for 02CW: **NO**
