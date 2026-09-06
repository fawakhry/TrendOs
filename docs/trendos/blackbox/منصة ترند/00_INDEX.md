# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

الحالة: **CANDIDATE PREPARED — CI PASS — INTEGRITY PASS — PRODUCTION REFRESH NOT EXECUTED — APPS SCRIPT DEPLOYMENT APPROVAL GATE**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md`

## نتيجة 02CQ الحالية

1. تم قراءة الصندوق الأسود و02CO قبل أي تنفيذ.
2. تم فحص مسارات mirror الحالية في GitHub.
3. `cloudflare-d1/src/mirror.js` يحتوي atomic staging/promote آمن.
4. `D1_Orders_Live_Sync.gs` يحدّث فقط `الأوردرات` و`بنود الأوردرات`.
5. `D1_Full_Migration.gs` عام لكل الشيتات ولذلك لم يتم تشغيله.
6. `D1_Orders_Read_Cutover.gs` parity/probe فقط ولا يحتوي four-view refresh.
7. read-only source probe أثبت أن الأربع view mirrors في D1 كلها header-only.
8. Apps Script qualification account يقرأ `print=8` و`press=7`، لكنه غير مصرح له بـ`service` و`laser`، لذلك لم يُستخدم كمصدر ناقص للـrefresh.
9. Google Drive أكد الـauthoritative spreadsheet الحالي وأن الأربع tabs موجودة داخله.
10. لم يتم تغيير sharing ولم يتم نسخ row payloads إلى GitHub.
11. تم تجهيز bounded Apps Script candidate default-OFF يقرأ الأربع tabs فقط، يعمل atomic stage لكل واحدة ثم promote واحد للأربع معًا.
12. Candidate CI PASS:
    - Run `34001050365`
    - Job `101399861784`
13. TrendOS Integrity PASS:
    - Run `34001050376`
    - Job `101399861836`
14. temporary read-only source probe workflow تم حذفه بعد جمع evidence.
15. لم يحدث Apps Script deploy أو D1 production refresh لأن Apps Script deployment يحتاج موافقة صريحة حسب قواعد المشروع.

## checkpoints سابقة

`PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`

الحالة: **AUTH PASS — D1 VIEW-MIRROR STALE BLOCKED — FRONTEND OFF — BOUNDARY PASS**

`PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`

الحالة: **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

الحالة: **READ-ONLY PREFLIGHT PASS — CLOSED**

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

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
- 02CQ production D1 mirror refresh: **NOT EXECUTED YET**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث 02CQ record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md`
3. اعتبر 02CK و02CL و02CM مغلقين ولا تعيدهم إلا إذا تغير المصدر ماديًا.
4. اعتبر 02CN و02CO history/evidence ولا تعيد deploy/canary قبل استكمال 02CQ freshness prerequisite.
5. لا تستخدم generic outbox drain.
6. لا تدوّر `EDGE_SESSION_SECRET`.
7. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
8. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
9. حافظ على Sheets / Apps Script كـauthoritative source.
10. retained 02CQ candidate:
    - `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs`
    - `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs`
    - `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml`
11. الخطوة التالية لا تبدأ إلا بعد **موافقة صريحة على Apps Script deployment**:
    - deploy bounded 02CQ module فقط،
    - أبقِ gate OFF بعد deploy،
    - نفذ bounded one-shot refresh بعد boundary checks،
    - أعد gate OFF،
    - تحقق من D1 mirror freshness،
    - أعد authenticated D1-vs-Apps-Script canary،
    - حافظ على `__DEBT__` Apps Script fallback.
