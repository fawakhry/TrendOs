# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

الحالة: **USER APPROVED APPS SCRIPT 02CQ — PRE-BOUNDARY PASS — ONE-SHOT CANDIDATE CI/INTEGRITY PASS — DEPLOY CHANNEL BLOCKED — NO PRODUCTION REFRESH YET**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_APPROVED_PREBOUNDARY_PASS_DEPLOY_CHANNEL_BLOCKED.md`

السجل السابق التفصيلي للتحضير والاكتشاف:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md`

## نتيجة 02CQ الحالية

1. الأربع D1 screen-view mirrors ما زالت header-only؛ `واجهة الطباعة sourceLastRow=1` بينما Apps Script يرجع `8` صفوف live.
2. المستخدم وافق صراحة على نشر Apps Script الخاص بـ02CQ فقط.
3. pre-deploy production boundary نجح:
   - Run `34001402434`
   - Job `101400810358`
   - `pendingOutbox=0`
   - `cutover=false`
   - `sheetsAuthoritative=true`
   - 02CL OFF
   - generic drain OFF
   - unauthenticated orders endpoint `401`
4. candidate تم تقويته بـ one-shot runner: `runD1ScreenViewMirrorRefresh02CQOnce()`، يفتح gate للاستدعاء فقط ويغلقه حتميًا في `finally`.
5. final one-shot Safety CI نجح:
   - Run `34001505178`
   - Job `101401079366`
6. final TrendOS Integrity نجح:
   - Run `34001505193`
   - Job `101401079394`
7. لا يوجد في الـrepo `clasp` أو Apps Script API deployment workflow/credential أو scriptId contract.
8. Connected Drive لا يعرض live Apps Script project كـ writable `application/vnd.google-apps.script` resource.
9. لذلك Apps Script deployment نفسه **لم يحدث**؛ لا يجوز اعتبار الموافقة تنفيذًا.
10. لا D1 production refresh ولا post-refresh canary تم حتى الآن.

## Current production state

- Production Worker: `trendos-d1-api`
- Worker Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write pending outbox: `0` at latest pre-boundary
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
2. اقرأ أحدث سجل 02CQ deployment continuation المذكور أعلاه.
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
10. أول continuation حقيقي يحتاج قناة authorized تستطيع كتابة/نشر live Apps Script project. عند توفرها:
    - deploy module 02CQ فقط،
    - اتركه default-OFF،
    - شغّل `runD1ScreenViewMirrorRefresh02CQOnce()` مرة واحدة،
    - تحقق من freshness/parity،
    - أعد authenticated D1-vs-Apps-Script canary،
    - حافظ على `__DEBT__` Apps Script fallback،
    - نفذ final boundary وسجل الإغلاق.
