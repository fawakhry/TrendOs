# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

الحالة: **VERIFIED PASS — CLOSED — FOUR VIEW MIRRORS FRESH — AUTHENTICATED PRINT CANARY PARITY PASS — FRONTEND OFF — SHEETS AUTHORITATIVE**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_VERIFIED_PASS_CLOSED.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SELF_CONTAINED_FINAL_CANDIDATE_PASS_MANUAL_IDE_GATE.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_APPROVED_PREBOUNDARY_PASS_DEPLOY_CHANNEL_BLOCKED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md`

## نتيجة 02CQ النهائية

1. المستخدم وافق صراحة على Apps Script الخاص بـ02CQ فقط.
2. تم تشغيل `runD1ScreenViewMirrorRefresh02CQOnce()` من مشروع Apps Script الإنتاجي.
3. الأربع D1 screen-view mirrors تم تحديثها بنجاح وبـ02CQ note.
4. الحالة الحالية للـmirrors:
   - خدمة العملاء: `270 × 19`
   - الطباعة: `9 × 18`
   - الليزر: `68 × 18`
   - المكبس: `8 × 18`
5. `rowCount == sourceLastRow` في الأربع mirrors.
6. `واجهة الطباعة` لم تعد header-only: `sourceLastRow=9` بدل `1`.
7. authenticated print canary نجح:
   - Apps Script rows = `8`
   - D1 rows = `8`
   - Order ID / Line ID / status parity = **PASS**
8. `__DEBT__` ما زال Apps Script fallback:
   - HTTP `409`
   - `apps-script-required`
9. final production boundary PASS:
   - Worker/database PASS
   - `pendingOutbox=0`
   - `cutover=false`
   - `sheetsAuthoritative=true`
   - 02CL OFF
   - generic drain OFF
   - unauthenticated orders endpoint `401`
10. لم يحدث Worker deploy أو frontend cutover أو authority transfer أو secret rotation.
11. post-refresh verification:
   - Run `34002138336`
   - Job `101402778075`
   - SUCCESS
12. temporary post-refresh workflow تم حذفه:
   - cleanup commit `0c8c297b4593783a7954b006e85374548b4e2ff7`

## Current production state

- Production Worker: `trendos-d1-api`
- Worker Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- pending outbox: `0`
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- 02CL: **OFF**
- frontend D1 orders read flag: **OFF**
- generic outbox drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**
- 02CQ: **VERIFIED PASS — CLOSED**

## checkpoints سابقة

- `PERF-CF-02CO` — **AUTH PASS — stale mirror blocker resolved by 02CQ**
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_VERIFIED_PASS_CLOSED.md`.
3. اعتبر 02CQ مغلقًا ولا تعيد refresh/canary إلا إذا تغير المصدر ماديًا.
4. لا تعيد Inventory أو discovery بلا سبب مادي جديد.
5. لا تستخدم generic outbox drain.
6. لا تدوّر `EDGE_SESSION_SECRET`.
7. لا تفتح 02CL gates.
8. حافظ على Sheets / Apps Script كـauthoritative source.
9. لا تفعل frontend D1 read أو cutover أو authority transfer ضمن 02CQ؛ أي خطوة من ذلك تحتاج checkpoint مستقل وموافقة صريحة.
10. احتفظ بأصول 02CQ:
   - `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs`
   - `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs`
   - `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml`
