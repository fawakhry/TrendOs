# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## PERF-CF-02CU — Stability / Freshness / Resume Guards

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

تأكيد المستخدم النهائي بعد Production promotion:

`ثبت`

### سجلات 02CU

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_USER_VISIBLE_PASS.md`

### Production baseline at close

- main: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- Worker: `trendos-d1-api`
- Worker version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @ **100%**
- D1: `trendos-main`
- eligible Orders reads: D1-first via `/v1/edge/orders/02cr/page`
- Apps Script fallback: retained
- `__DEBT__`: Apps Script
- writes: Apps Script / Sheets
- Sheets / Apps Script authority: retained
- 02CL / reconcile: OFF
- generic drain: OFF
- no secret rotation / no `EDGE_SESSION_SECRET` change

### Closed 02CU behavior

- Navigation/Return no-refresh: **CLOSED — USER-VISIBLE PASS** (`تمام ثبت`).
- Low-Usage heartbeat: live/healthy; unchanged source may legitimately produce zero D1 writes.
- physically stale `بنود الأوردرات` may stay D1-readable only with bounded `verified-idle-source-unchanged` proof.
- Customers and Debt Restrictions remain physically freshness-gated.
- any invalid/stale/missing proof, source change, shape mismatch, stale enrichment, auth/Worker/JSON failure falls back to Apps Script.
- no fake `syncedAt` write was introduced.

### Evidence

- stale-path Preview: Run `34031601605` — SUCCESS
- Worker Preview requalification: Run `34033006309` — SUCCESS
- Worker Production promotion: Run `34033058006` — SUCCESS
- frontend Production promotion: Run `34034029239` — SUCCESS
- GitHub Pages: Run `34034051695` — SUCCESS
- final documented Integrity before user close: Run `34034284641` — SUCCESS
- final user-visible confirmation: `ثبت` — PASS

**Exact close point:**

`PERF-CF-02CU CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS — MAIN eab0dd342085df45ac8cd9dc02b1c21e7dc76820 — WORKER 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — D1-FIRST QUALIFIED ORDERS READS — APPS SCRIPT FALLBACK + __DEBT__ + SHEETS AUTHORITY RETAINED — 02CL OFF — GENERIC DRAIN OFF — NO SECRET ROTATION`

---

## Trend Master V1931 — مسار منفصل

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate commit: `03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

- Trend Master V1931 Resilience CI Run `34006722152` — SUCCESS
- TrendOS Integrity V1 Run `34006722115` — SUCCESS

Apps Script panel endpoint يحتاج موافقة Production منفصلة قبل أي نشر.

---

## D1 / Cloudflare checkpoints السابقة

- `PERF-CF-02CU` — **CLOSED / TECHNICAL + PRODUCTION + USER-VISIBLE PASS**
- `PERF-CF-02CT` — CLOSED / production frontend D1 read ON / qualified `/02cr` / fallback retained
- `PERF-CF-02CS` — Production Worker route verified PASS
- `PERF-CF-02CR` — full field / identity / filtering qualification
- `PERF-CF-02CQ` — screen-view mirror freshness + identity PASS
- `PERF-CF-02CO` — auth pass / stale view blocker
- `PERF-CF-02CN` — candidate / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed

## ثوابت الأمان المشتركة

- Sheets / Apps Script authoritative.
- eligible Orders reads D1-first مع fail-open إلى Apps Script.
- all writes Apps Script / Sheets unless a later separately approved checkpoint explicitly changes authority.
- `__DEBT__` Apps Script.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- أي Apps Script Production deploy يحتاج موافقة منفصلة.
