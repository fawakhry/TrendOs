# TrendOS Phase 0 — Heat Press Inventory

> Scope: read-only source + live Google Sheets inventory. No press session, queue, setting, operational Line, or Apps Script code was modified.

## Status

`INV-06 — map Press queue/session paths`: **PASS — SOURCE + LIVE DATA MAPPED**.

Press correctness/session traceability is **NOT green**.

## 1. Routes and current source

V1932 route:
- `pressControlV1` -> `pressControlV1_(e)`

Main helpers:
- `pressEnsure_()`
- `pressSettings_()`
- `pressAllowed_()`
- `pressQueue_()`
- `pressOpen_()`
- `pressStatus_()`

Sheets:
- operational source: `بنود الأوردرات`
- sessions: `تشغيل - جلسات المكبس`
- settings: `تشغيل - إعدادات المكبس`
- legacy/view sheet: `واجهة المكبس`

## 2. Current queue contract

`pressQueue_()` reads all operational Lines and includes a line when:
- department contains `مكبس`, OR
- `مكبس حراري` is one of `نعم`, `1`, `true`, `yes`, `مكبس`.

It excludes status:
- `تم التسليم`
- `ملغى`
- `مكرر`
- `جاهز للاستلام`
- `تم التنفيذ`

It then deduplicates by **Order ID**, not Line ID.

Urgent count is also by Order ID when priority is `عاجل` or `VIP`.

Important consequence:
- queue count is orders requiring press, not individual press Line count.
- the helper returns Order IDs only; it does not return Line IDs.

## 3. Current live source queue

Direct live inspection of `بنود الأوردرات` using the same source criteria yields **8 unique current press orders** and **0 urgent**:

1. `TM2606150097`
2. `TM2606150098`
3. `TM2606150105`
4. `TM2606160146`
5. `3758`
6. `3764`
7. `3770`
8. `3774`

The first four are department `مكبس`; the last four are print Lines with `مكبس حراري = نعم` and active `طلب جديد` state.

Press-flagged Lines currently in ready/delivered/duplicate states are correctly excluded by the source helper.

## 4. Legacy `واجهة المكبس` is not the V1932 queue source

Direct read of `واجهة المكبس` shows only the header row and **zero data rows**.

Current V1932 `pressStatus_()` does not read this sheet; it recomputes the queue directly from `بنود الأوردرات` through `pressQueue_()`.

Therefore:
- legacy sheet view count = 0.
- V1932 source queue count by current data = 8.

If the Phase-1 gate `Press Source Queue = Press View Queue` refers to the legacy `واجهة المكبس` sheet, current live parity fails 8 vs 0.

If the actual frontend view is already driven by `pressControlV1 status`, runtime UI parity still needs explicit verification before marking `REG-16` green.

## 5. Start-session race

`pressControlV1 op=start` performs:

```text
pressOpen_()
 -> if an open session exists, reject
 -> calculate queue/settings
 -> append new PRESS-<date>-<uuid8> session
```

There is **no ScriptLock** and no durable start request/event key around `open? -> append`.

Two concurrent Start requests can both observe no open session and both append an open session.

`REG-17 = FAIL — SOURCE CONCURRENCY CONTRACT` until shared locking/idempotency is added and runtime regression passes.

## 6. `pressOpen_()` behavior

`pressOpen_()` scans newest to oldest and returns the latest row with:
- non-empty `وقت التشغيل`
- empty `وقت القفل`

It does **not** scope by business date.

A stale historical open session can therefore block every future press Start until manually/reliably closed.

This may be a safety behavior, but it requires stale-session reconciliation/alerting to avoid permanent operational lockout.

## 7. Stop/close idempotency gap

`pressControlV1 op=stop`:
1. finds current open session.
2. computes duration and queue.
3. writes close time and metrics cell-by-cell.
4. returns status.

There is no lock/request key/idempotent close result.

Consequences:
- concurrent Stop calls can both select the same open session before either write is visible and overwrite close metrics with different times/counts.
- a sequential second Stop after the row is closed returns `لا توجد جلسة مكبس مفتوحة.` rather than replaying the original close result.

`REG-18 = FAIL — SOURCE CONTRACT`.

## 8. Session traceability gap — no Order/Line IDs

The V1932 Press session schema stores:
- session ID/date/start/close
- operator/support
- queue counts
- urgent queue count
- number of pressed orders
- duration/electricity metrics
- notes

It stores **neither specific Order IDs nor Line IDs** for the work completed during the session.

`stop` accepts only `ordersPressed` as a number.

Therefore the backend cannot answer reliably:
- which exact orders/lines were pressed in a session.
- whether a completed press-required Line had a matching Press session.
- whether the same Line was counted twice.

There is no source integrity alert for “completed press Line without session”.

`REG-19 = FAIL — SOURCE CONTRACT`.

## 9. Current live session baseline

`تشغيل - جلسات المكبس` currently contains one historical data row for 2026-08-24.

The newer V1932 columns show approximately:
- session ID `PRESS-20260824-800c0607`
- queue at start = 9
- urgent at start = 1
- duration = 0.5 minute
- close time present

Existing exact legacy columns also show:
- queue at close = 9
- orders pressed = 0

No specific Order IDs/Line IDs are recorded.

This row is closed, so there is no currently observed stale open Press session in the inspected live baseline.

## 10. Press schema drift

The session sheet contains legacy headers plus V1932 exact-name additions.

Examples:
- legacy `Session ID` vs V1932 `ID الجلسة`
- legacy `بداية فعلية` vs V1932 `وقت التشغيل`
- legacy `قفل فعلي` vs V1932 `وقت القفل`
- legacy `الداعم` vs V1932 `المتابع`
- legacy `Queue عند البداية` vs V1932 `Queue عند التشغيل`
- legacy `مدة التشغيل - دقيقة` vs V1932 `مدة التشغيل بالدقائق`
- legacy estimated electricity columns vs V1932 non-estimated exact names

Some exact column names are shared and therefore reused; others were appended by `v1932EnsureSheet_()`.

This produces split old/new storage semantics similar to the Invoice/Cleaning schema drift.

## 11. Press settings drift

Live `تشغيل - إعدادات المكبس` contains both legacy and V1932 keys:

Legacy-like:
- `PRESS_FIXED_START`
- `PRESS_START_GRACE_MINUTES`
- `PRESS_PRIMARY`
- `PRESS_SUPPORT`
- `PRESS_BATCH_MODE`
- `PRESS_URGENT_OVERRIDE`
- `PRESS_STRICT_MONITOR`

V1932 keys used by current source:
- `PRESS_BATCH_START = 17:00`
- `PRESS_GRACE_MINUTES = 15`
- `PRESS_PRIMARY_OPERATOR = ريفان`
- `PRESS_SUPPORT_OPERATOR = وائل`

Power/rate settings are blank/disabled in the current sheet, so current source resolves them to zero and does not invent electricity cost.

`pressEnsure_()` itself can append missing V1932 defaults during a status/start/stop path; read/status therefore can mutate config schema if defaults are missing.

## 12. Required implementation contract

Press integrity needs:
1. shared lock around `find open session -> create`.
2. durable start event/request key.
3. one-open-session invariant with stale-session reconciliation.
4. idempotent Stop with replay of the same close result.
5. persist exact Order IDs and Line IDs assigned/completed in each session.
6. line-level completion linkage rather than only `ordersPressed` count.
7. integrity alert for press-required completed Line without Press session evidence.
8. define one canonical Press View source; retire or explicitly mark the empty legacy `واجهة المكبس` sheet.
9. normalize legacy/V1932 session and setting schemas without deleting history.
10. preserve no-invented electricity values.

## Test implications

- `INV-06`: **PASS — SOURCE + LIVE DATA MAPPED**.
- `REG-15` create press-required Line -> appears once in Press View: **PENDING RUNTIME**; source eligibility mapped.
- `REG-16` Press Source/View counts equal: **PENDING / CURRENT LEGACY VIEW MISMATCH** (source queue 8 vs legacy sheet 0; actual API-driven frontend needs verification).
- `REG-17` Press Start x2: **FAIL — SOURCE CONCURRENCY CONTRACT**.
- `REG-18` Press Close x2: **FAIL — SOURCE CONTRACT**.
- `REG-19` completed press Line without session -> integrity alert: **FAIL — SOURCE CONTRACT**.

No production mutation was performed.
