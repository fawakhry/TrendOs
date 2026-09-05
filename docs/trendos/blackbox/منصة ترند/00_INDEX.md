# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`

الحالة: **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CN_ORDERS_READ_HOTPATH_CANDIDATE_CI_PASS.md`

## checkpoints سابقة مغلقة

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

الحالة: **READ-ONLY PREFLIGHT PASS — CLOSED**

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## 02CN evidence sequence

1. 02CN started after reading `00_INDEX.md`, `01_CURRENT_STATE.md`, and the latest 02CM PASS record.
2. 02CM had shown Worker/D1 health was good while Apps Script blank ping was slowest.
3. Inspected live read hot paths: `getRows`, `getDashboard`, `getRowsPageV1931`.
4. Confirmed `getRowsPageV1931_()` currently calls `getRows_()`, reads `بنود الأوردرات`, builds rows and dashboard through Apps Script/Sheets.
5. Confirmed existing frontend wrapper `trendos-edge-orders-read-v1.js` only intercepts `getRowsPageV1931` if enabled.
6. Confirmed `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`, so the wrapper remains dormant/default-OFF.
7. Confirmed debt filter `__DEBT__` remains Apps Script fallback.
8. Identified missing Edge payload: D1 `/v1/edge/orders/page` returned `dashboard: null` before 02CN.
9. Updated `cloudflare-d1/src/edge-orders-read-v1.mjs` in commit `8844ab6ccd86765ea9012a042078584a738578d1`.
10. Added `buildDashboardFromRows(rows, screen, now)`.
11. D1 Orders page now returns dashboard from D1 rows instead of `null`.
12. Added tests in `tests/cloudflare_edge_orders_dashboard_02cn.test.mjs` commit `8a7af0109fa7f51c8257706d6bd7531c0ebb230b`.
13. Added 02CN CI workflow commit `5ef76b6a9992e5ba97df591f79d8e2f646264cff`.
14. Cleaned the CI static safety guard commit `7f00d3c7a02ade0cbe2aa2fb527a06b0e9ac214a`.
15. Final 02CN CI Run `33998245346` / Job `101392419518` passed.
16. Final CI markers: `PERF_CF_02CN_STATIC_SAFETY_BOUNDARY_PASS` and `PERF_CF_02CN_EDGE_ORDERS_DASHBOARD_TEST_PASS`.
17. TrendOS Integrity V1 Run `33998245337` / Job `101392418999` passed.
18. No Worker deploy, no Apps Script live deploy, no D1 migration, no secret mutation, no property mutation, no reconciliation, no outbox drain, and no cutover occurred.
19. Candidate remains default-OFF and inactive for users.

## Current production state

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write pending outbox: last verified `0` in 02CM
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- exact 02CL target: `CW-PROD-QUAL-33975124471`
- exact target outbox status: `synced`
- exact event status: `reconciled`
- exact sheets status: `synced`
- exact attempts: `1`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- frontend D1 orders read flag: **OFF**
- generic outbox drain: **not exposed / not used**
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث 02CN record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CN_ORDERS_READ_HOTPATH_CANDIDATE_CI_PASS.md`
3. اعتبر 02CK و02CL و02CM مغلقين ولا تعيدهم إلا إذا تغير المصدر ماديًا.
4. اعتبر 02CN مرشحًا جاهزًا فقط، وليس cutover.
5. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
6. لا تستخدم generic outbox drain.
7. لا تدوّر `EDGE_SESSION_SECRET`.
8. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
9. حافظ على Sheets / Apps Script كـauthoritative source حتى cutover مستقل.
10. الخطوة التالية الموصى بها:
    `PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`.
11. في 02CO: نفذ مقارنة authenticated canary للقراءة من D1 مقابل Apps Script، مع إبقاء `__DEBT__` على fallback، وقبل أي broad enablement.
