# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Latest checkpoint

`PERF-CF-02CR — Orders Completeness / Operational D1 Parity / Legacy View Formula Repair`

Status: **ENRICHMENT SYNC PASS — PRODUCTION FRONTEND ON APPS SCRIPT — LEGACY VIEW RANGE CAP ROOT CAUSE PROVEN — FOUR VIEW FORMULAS FIXED LIVE — USER RECHECK PENDING — FULL D1 PARITY NOT CLOSED**

Latest record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md`

## Current production state

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Sheets / Apps Script authority: **YES**
- production order-card read source: **Apps Script / Sheets**
- frontend D1 Orders read: **OFF**
- production cutover: **NO**
- 02CL: **OFF**
- generic drain: **OFF**
- latest verified `pendingOutbox=0`
- unauthenticated Orders route: `401`
- no `EDGE_SESSION_SECRET` rotation

## Existing Orders Live Sync V2

Unchanged and still sole owner of:

- `الأوردرات`
- `بنود الأوردرات`

Exact note:

`TrendOS orders live sync V2 quota-aware`

Latest source size observed for `بنود الأوردرات`:

- row count reaches `355`

## 02CR enrichment sync

Live and verified for:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

No Orders/Lines ownership change.

## User-visible completeness incident — final root cause

The user clarified that the issue was not page size: the total set of visible orders was incomplete in print and laser.

Authoritative source inspection proved many active operational rows existed in `بنود الأوردرات`, including print and laser rows well beyond the visible legacy-view snapshots.

The decisive spreadsheet finding was in the formulas of the four legacy view tabs:

### `واجهة الطباعة!A2`

Old formula source bounds were hard-coded to row `311`:

- `بنود الأوردرات!A2:R311`
- `E2:E311`
- `K2:K311`

### `واجهة الليزر!A2`

Same hard-coded row-311 ceiling.

### `واجهة المكبس!A2`

Same hard-coded row-311 ceiling.

### `واجهة خدمة العملاء!A2`

Hard-coded source ceiling at row `270` in `الأوردرات`.

Therefore newly appended source rows could never appear in those views after the fixed limits were exceeded.

This exactly explains why print showed only the old three active cards while newer active print orders in `بنود الأوردرات` were absent.

## Live formula repair performed

Only cell `A2` in each of the four view sheets was changed.

The formulas now use open-ended source ranges:

- service: `الأوردرات!A2:S` / `A2:A`
- print: `بنود الأوردرات!A2:R`, `E2:E`, `K2:K`
- laser: same open-ended structure
- press: `A2:R`, `R2:R`, `K2:K`

No order/customer/source data row was edited.

## Post-fix verification

Readback confirmed all four formulas are now open-ended.

`واجهة الطباعة` immediately expanded and now includes newer source order IDs through `3920` in the current snapshot.

`واجهة الليزر` immediately expanded and now includes newer source order IDs through `3918` in the current snapshot.

This proves the legacy-view truncation was repaired at the data-view layer.

## Frontend cache recovery

A separate previous cache-bust remains deployed on production:

- commit `f82c76fc9421e5f8021b94bbd64244a5fde24061`
- cache tag `trendos-runtime-recovery-20260906a`
- GitHub Pages Run `34005021133` SUCCESS

## Exact next step

User-side refresh/reopen only:

1. refresh the platform,
2. open print and laser,
3. confirm newly added orders after the old caps are now visible.

If visible completeness is restored, record user-visible recovery PASS and continue 02CR Preview full field/paging/filter parity.

Do not re-enable D1 Orders on production frontend before that full parity completes.
