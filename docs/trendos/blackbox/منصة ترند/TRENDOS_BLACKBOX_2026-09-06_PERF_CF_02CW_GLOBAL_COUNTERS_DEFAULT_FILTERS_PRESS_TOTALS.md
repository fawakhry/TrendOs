# PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals

Date opened: 2026-09-06
Last updated: 2026-09-07
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

02CW is technically deployed but is not recorded as User-Visible PASS until the user explicitly validates the final hotfixed UI behavior.

## User request

1. عدادات شاشة القسم لا تعد الصفحة الحالية فقط؛ المطلوب إجمالي الحالات الجارية عبر كل صفحات الشيت.
2. الفلتر الافتراضي دائمًا: `الحالات الجارية فقط` + `كل الأولويات`.
3. `متابعة المكبس` تعرض إجمالي أوردرات المكبس، وليس عدد أوردرات قائمة جزئية.

## Confirmed diagnosis

### Page counters

Production `renderStats(rows)` counted only `state.rows`. Under server paging, `state.rows` contained only the current page, so a six-row active queue split across pageSize=5 appeared as 5 on page 1 and 1 on page 2.

### Default priority filter

- `statusFilter` already defaulted to `__ACTIVE__` / `الحالات الجارية فقط`.
- `priorityFilter` selected `__ACTIVE__` / `العاجل والعادي فقط`.
- local filtering used `$("priorityFilter").value || "__ACTIVE__"`, so intentional blank `كل الأولويات` was coerced back to `__ACTIVE__`.

### Press monitor

The legacy press endpoint could return a truncated item list. The frontend derived unique order IDs from that list, so the displayed order total could undercount the full queue.

## Implemented bounded fix

### Worker

The qualified D1 Orders read path now calculates `activeSummaryCounts` from the full screen-scoped active queue **before pagination**. The summary is independent of the current page and includes the existing top-counter row semantics plus unique `heatPressOrders`.

Worker qualification proof:

- Preview Run `34050430147` — **SUCCESS**.
- Qualification example: `total=28` while `pageRows=5`.
- Press qualification example: `heatPress=7`, `heatPressOrders=7`.
- Exact preview-qualified Worker version: `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb`.
- Production promotion Run `34050523165` — **SUCCESS**.
- Worker version promoted @100%: `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb`.

The deployment was code-only. It did not rotate secrets, write D1 business data, run a migration, or change write authority.

### Frontend

Frontend changes:

- `state.activeSummaryCounts` stores the server summary;
- top stats use that summary while server paging is active;
- table rendering remains current-page only;
- priority blank remains blank, so `كل الأولويات` works as intended;
- HTML default is `الحالات الجارية فقط` + `كل الأولويات`;
- Press Monitor prefers `activeSummaryCounts.heatPressOrders` and retains legacy data as fallback.

Initial Production frontend commit:

`40bced5e9a952f15689f45ce3ef18271c9dd2c63`

GitHub Pages Run for that commit:

`34050751436` — **SUCCESS**

## Production frontend regression and bounded hotfix

After the initial frontend promotion, the user reported:

`WORK_PROBLEM_STATUS is not defined`

Root cause:

- the 02CW frontend patcher generated a local fallback branch in `renderStats()` using `WORK_PROBLEM_STATUS` and `normalizeStatus()`;
- those symbols do not exist in Production `app.js`;
- the server-provided global summary itself was not the cause.

Hotfix:

- restored the exact pre-existing safe fallback semantics for problem/overdue/debt/press/cancelled local counts;
- retained the new server `activeSummaryCounts` path;
- changed `app.js` cache-bust to `trendos-02cw-globalcounts-hotfix-20260906e`.

Current Production main:

`2eee80b87a3aeccb5569055bc0544a43b22adcb7`

Evidence:

- Hotfix workflow Run `34051629854` — **SUCCESS**;
- GitHub Pages Run `34051642802` — **SUCCESS**;
- Production `app.js` no longer contains `WORK_PROBLEM_STATUS`;
- Production loader uses `app.js?v=trendos-02cw-globalcounts-hotfix-20260906e`.

## Durable regression / working-branch parity

The reusable patcher was also corrected so a future 02CW rebuild cannot reintroduce the undefined symbols.

- patcher: `tools/patch_02cw_global_counters.py`;
- durable patcher correction Run `34051798736` — **SUCCESS**;
- correction commit: `9b607159aaded1ae00e69bb4365e12f6e1082389`;
- latest normal Integrity immediately before that bot-only commit: Run `34051798718` — **SUCCESS** on parent `a577bdc3a92187a4b16d73f4188a46d79487071e`.

A later documentation/cleanup commit must be followed by a fresh normal Integrity run before the roadmap stop point is recorded.

## Safety invariants retained

- No Apps Script Production deploy.
- No D1 business-data write/migration.
- No secret rotation / no `EDGE_SESSION_SECRET` change.
- Sheets / Apps Script write authority retained.
- eligible Orders reads remain D1-first with fail-open Apps Script fallback.
- `__DEBT__` remains Apps Script.
- 02CL/reconcile OFF.
- generic drain OFF.
- 02CV remains CLOSED.

## Remaining close condition

User-visible validation remains pending. The user's later instruction `تكملة خارطة الطريق` / `كمل` means continue execution and is **not** recorded as a synthetic validation of the counters, default filters, or Press Monitor.
