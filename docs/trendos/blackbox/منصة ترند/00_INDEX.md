# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`

الحالة: **AUTH PASS — D1 VIEW-MIRROR STALE BLOCKED — FRONTEND OFF — BOUNDARY PASS**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_AUTH_PASS_VIEW_MIRROR_STALE_BLOCKED_BOUNDARY_PASS.md`

## checkpoints سابقة

`PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`

الحالة: **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

الحالة: **READ-ONLY PREFLIGHT PASS — CLOSED**

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## 02CO latest evidence sequence

1. 02CO started after reading `00_INDEX.md`, `01_CURRENT_STATE.md`, and the latest 02CN record.
2. Initial 02CO deployed 02CN dashboard-builder code to Worker while the frontend flag stayed OFF.
3. First canary attempt failed at Edge session HTTP `401`.
4. User refreshed the employee-token GitHub secret from a fresh normal TrendOS login.
5. Auth then succeeded and the canary reached row comparison.
6. D1 full `بنود الأوردرات` comparison returned `153` rows while Apps Script `getRowsPageV1931` returned `8` rows for `screen=print`.
7. A partial full-lines filter reduced D1 to `26` rows, still not equal to Apps Script `8` rows.
8. Diagnostics showed Apps Script is serving the current screen-view/hotfix-visible print list, not the raw full lines sheet.
9. Google Sheet inspection identified `واجهة الطباعة` as the live screen-view tab containing the same eight visible print rows.
10. A canary wrapper was added to map Edge Orders reads to screen-view mirror tabs:
    - `واجهة خدمة العملاء`
    - `واجهة الطباعة`
    - `واجهة الليزر`
    - `واجهة المكبس`
11. The wrapper candidate passed CI and general integrity.
12. Focused canary deployed the view-mirror wrapper Worker Version ID `0ec782a9-5943-4c9d-8820-51b7d0393210`.
13. Auth succeeded again, but D1 `واجهة الطباعة` mirror was stale/header-only:
    - `edgeTotalRows=0`
    - `appTotalRows=8`
    - `edgeMirror.sourceLastRow=1`
    - `edgeMirror.sourceLastCol=18`
    - `edgeMirror.syncedAt=2026-08-29 15:49:07`
    - `edgeMirror.note=TrendOS full mirror V1`
14. Latest post-failure boundary passed:
    - Run `33999848762`
    - Job `101396626997`
    - `pendingOutbox=0`
    - `cutover=false`
    - `sheetsAuthoritative=true`
    - 02CL reconcile OFF
    - generic drain OFF
    - unauthenticated orders read `401`
15. Temporary 02CO deploy/diagnostic workflows were cleaned after boundary proof.

## Current production state

- Production Worker: `trendos-d1-api`
- Worker Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write pending outbox: `0`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
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
2. اقرأ أحدث 02CO record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_AUTH_PASS_VIEW_MIRROR_STALE_BLOCKED_BOUNDARY_PASS.md`
3. اعتبر 02CK و02CL و02CM مغلقين ولا تعيدهم إلا إذا تغير المصدر ماديًا.
4. اعتبر 02CN جاهزًا كمرشح default-OFF.
5. اعتبر 02CO auth ناجح، لكن canary محجوز بسبب D1 screen-view mirror stale/header-only.
6. لا تستخدم generic outbox drain.
7. لا تدوّر `EDGE_SESSION_SECRET`.
8. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
9. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
10. حافظ على Sheets / Apps Script كـauthoritative source حتى cutover مستقل.
11. الخطوة التالية:
    `PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`.
12. في 02CQ: ابحث عن مسار mirror import/sync الحالي للـscreen-view tabs، ثم نفذ refresh/import محدود ومؤرخ، وبعدها أعد canary المقارنة.