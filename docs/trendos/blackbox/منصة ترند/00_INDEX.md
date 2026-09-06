# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Operational Parity Repair / Enrichment Deployment`

الحالة: **USER APPROVED — PREDEPLOY BOUNDARY PASS — INTEGRITY PASS — APPS SCRIPT DEPLOYMENT NOT EXECUTED — SYNC NOT EXECUTED — MANUAL IDE EXECUTION REQUIRED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`

السجل الجذري للـregression والإصلاح:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## نتيجة 02CR الحالية

1. تم عزل Regression كروت الأوردرات الناقصة إلى Edge-first read المحدود، وتم rollback `main` إلى Apps Script:
   - `f7c3af17b3a28858d1be9d5c57455d54b4256126`
2. Production orders page كان يمر عبر 02CO screen-view canary المحدود بدل operational `بنود الأوردرات` contract الكامل.
3. duplicate-header semantics في D1 mapper اتصلحت لتطابق Apps Script last-write-wins:
   - `c6b362b4d4223e7f890af44d2067a5440224e42a`
4. Existing Orders Live Sync V2 يظل المالك الوحيد لـ:
   - `الأوردرات`
   - `بنود الأوردرات`
   - note: `TrendOS orders live sync V2 quota-aware`
5. تم تجهيز independent quota-aware enrichment sync فقط لـ:
   - `العملاء`
   - `عملاء منع التسليم بالمديونية`
   - file: `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`
   - note: `PERF-CF-02CR enrichment live sync V1`
6. تم تجهيز isolated D1 canary:
   - `/v1/edge/orders/02cr/page`
   - لا تستخدمه الواجهة الإنتاجية.
7. آخر durable 02CR CI:
   - Run `34003887916`
   - Job `101407500641`
   - **SUCCESS**
8. آخر qualification Integrity قبل الموافقة:
   - Run `34003887933`
   - Job `101407500688`
   - **SUCCESS**
9. Preview pre-sync fail-closed proof:
   - Run `34003873139`
   - Job `101407459524`
   - HTTP `503`
   - fallback `apps-script`
   - failed mirrors فقط: `العملاء` + `عملاء منع التسليم بالمديونية`
10. المستخدم أعطى موافقة صريحة جديدة:
    - `موافق على نشر وتشغيل Apps Script الخاص بـ02CR فقط وكمل`
11. بعد الموافقة تم تنفيذ predeploy boundary قراءة فقط:
    - Run `34004332089`
    - Job `101408685296`
    - **SUCCESS**
    - `cutover=false`
    - `sheetsAuthoritative=true`
    - 02CL OFF
    - generic drain OFF
    - `pendingOutbox=0`
    - unauth Orders route = `401`
    - frontend production ما زال Apps Script
12. Same-head Integrity:
    - Run `34004332081`
    - Job `101408685329`
    - **SUCCESS**
13. Temporary predeploy workflow تم حذفه بعد PASS:
    - cleanup `259280613d21a6d957a9306ccaf8ae13d8fdb1d4`
14. لا يوجد في tool surface الحالي Apps Script source-write/function-execution connector، ومسار المشروع الرسمي موثق كنشر/تشغيل يدوي من Apps Script IDE.
15. لذلك **النشر لم يُنفذ والمزامنة لم تُنفذ بعد**. لا يجوز الادعاء بعكس ذلك.

## Current production state

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- `pendingOutbox`: **0** at latest predeploy boundary
- Sheets / Apps Script authority: **YES**
- frontend D1 orders read on `main`: **OFF / rolled back**
- production order-card read source: **Apps Script / Sheets**
- existing Orders Live Sync V2: **ACTIVE / UNCHANGED**
- 02CR enrichment sync: **APPROVED BUT NOT DEPLOYED / NOT STARTED**
- 02CR Preview route: **QUALIFIED / PRE-SYNC FAIL-CLOSED**
- 02CL: **OFF**
- generic outbox drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة الوقوف الدقيقة

الخطوة الوحيدة المطلوبة الآن يدويًا داخل **نفس مشروع Apps Script الحي**:

1. إضافة ملف جديد من محتوى:
   - `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`
2. Save.
3. تشغيل read-only status:
   - `getD1OperationalEnrichmentLiveSync02CRStatus()`
4. التأكد أن:
   - `config.hasD1ApiUrl=true`
   - `config.hasD1MigrationSecret=true`
   - `enabled=false`
   - المتوقع `triggerCount=0`
5. تشغيل:
   - `startD1OperationalEnrichmentLiveSync02CR()`

لا تُرسل أي secret في الشات ولا تعدل Script Properties يدويًا.

بعد تأكيد التنفيذ يدويًا، يبدأ فورًا post-sync verification على D1 + Preview ثم final boundary. **لا production frontend re-enable ولا Worker production deploy ضمن هذه الموافقة.**

## checkpoints سابقة

- `PERF-CF-02CQ` — **VERIFIED PASS — CLOSED; freshness + identity parity**
- `PERF-CF-02CO` — **AUTH PASS; stale mirror blocker resolved by 02CQ**
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md` ثم أحدث سجل 02CR.
2. لا تعيد تفعيل D1 على production frontend قبل full field/paging/filter parity.
3. لا تلمس Orders Live Sync V2 ownership لـ`الأوردرات + بنود الأوردرات`.
4. المستخدم وافق بالفعل على نشر وتشغيل 02CR enrichment فقط؛ لا تطلب موافقة جديدة لنفس الفعل.
5. لا تدّعي أن Apps Script deployment تم: التنفيذ اليدوي ما زال مطلوبًا.
6. بعد التنفيذ اليدوي اختبر Preview أولًا؛ production frontend يظل Apps Script.
7. حافظ على Sheets / Apps Script كـauthoritative source.
8. لا تستخدم generic outbox drain.
9. لا تدوّر `EDGE_SESSION_SECRET`.
10. لا تفتح 02CL gates.
