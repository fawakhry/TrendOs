# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

الحالة: **USER APPROVED — PRE-BOUNDARY PASS — FINAL SELF-CONTAINED CANDIDATE CI/INTEGRITY PASS — MANUAL APPS SCRIPT IDE GATE — PRODUCTION UNCHANGED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SELF_CONTAINED_FINAL_CANDIDATE_PASS_MANUAL_IDE_GATE.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_APPROVED_PREBOUNDARY_PASS_DEPLOY_CHANNEL_BLOCKED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md`

## نتيجة 02CQ الحالية

1. الأربع D1 screen-view mirrors ما زالت header-only؛ `واجهة الطباعة sourceLastRow=1` بينما Apps Script يرجع `8` صفوف live.
2. المستخدم وافق صراحة على Apps Script الخاص بـ02CQ فقط.
3. pre-deploy production boundary نجح:
   - Run `34001402434`
   - Job `101400810358`
   - `pendingOutbox=0`
   - `cutover=false`
   - `sheetsAuthoritative=true`
   - 02CL OFF
   - generic drain OFF
   - unauthenticated orders endpoint `401`
4. final candidate أصبح self-contained في ملف واحد فقط ومقفول على Spreadsheet ID الحالي والأربع واجهات.
5. preferred runner هو `runD1ScreenViewMirrorRefresh02CQOnce()`؛ يفتح gate للاستدعاء فقط ويغلقه حتميًا في `finally`.
6. الـmigration secret يظل local داخل authenticated POST ولا يتم إرجاعه أو تسجيله.
7. final Safety CI PASS:
   - Run `34001722179`
   - Job `101401658258`
8. final TrendOS Integrity PASS:
   - Run `34001722197`
   - Job `101401658423`
9. لا يوجد في البيئة الحالية Apps Script write/deploy API أو `clasp` أو writable Apps Script project عبر Drive.
10. لذلك Apps Script project write والتنفيذ اليدوي للـone-shot **لم يحدثا بعد**.
11. لا D1 production refresh ولا post-refresh canary تم حتى الآن.

## Current production state

- Production Worker: `trendos-d1-api`
- Worker Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- latest checked pending outbox: `0`
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- frontend D1 orders read flag: **OFF**
- generic outbox drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**
- 02CQ production D1 mirror refresh: **NOT EXECUTED YET**

## checkpoints سابقة

- `PERF-CF-02CO` — **AUTH PASS — D1 VIEW-MIRROR STALE BLOCKED — FRONTEND OFF — BOUNDARY PASS**
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث سجل 02CQ final self-contained المذكور أعلاه.
3. لا تعيد discovery أو Inventory طالما المصدر لم يتغير ماديًا.
4. لا تستخدم generic outbox drain.
5. لا تدوّر `EDGE_SESSION_SECRET`.
6. لا تفتح 02CL gates.
7. لا تفعل frontend cutover أو authority transfer.
8. حافظ على Sheets / Apps Script كـauthoritative source.
9. retained 02CQ assets:
   - `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs`
   - `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs`
   - `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml`
10. أول continuation حقيقي:
    - أضف ملف 02CQ الواحد إلى live Apps Script project،
    - شغّل `runD1ScreenViewMirrorRefresh02CQOnce()` مرة واحدة،
    - بعدها تحقق من freshness/parity،
    - أعد authenticated D1-vs-Apps-Script canary،
    - حافظ على `__DEBT__` Apps Script fallback،
    - نفذ final boundary وسجل الإغلاق.
