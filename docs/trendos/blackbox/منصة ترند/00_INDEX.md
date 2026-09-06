# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback`

الحالة: **MITIGATION PASS — PRODUCTION FRONTEND D1 READ ROLLED BACK — APPS SCRIPT RESTORED — D1 DATA RETAINED — FIELD COMPLETENESS FIX PENDING**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## نتيجة 02CR الحالية

1. المستخدم أبلغ أن كروت الأوردرات في الإنتاج تظهر ناقصة بعد مسار D1.
2. تم اكتشاف أن `main` كان يحتوي تفعيل Edge-first للقراءة في commit:
   - `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`
3. هذا التفعيل كان على `main` رغم أن checkpoint 02CQ في working branch وثّق frontend OFF.
4. `واجهة الطباعة` الحالية في Google/D1 تحتوي 18 عمودًا فقط، بينما D1 mapper يحاول إرجاع حقول تشغيلية إضافية غير موجودة في هذا الـmirror، فتظهر فارغة.
5. لذلك نجاح 02CQ في Order ID / Line ID / status parity لم يكن كافيًا لضمان اكتمال كل حقول الواجهة.
6. تم تنفيذ rollback آمن وقابل للرجوع لمسار القراءة فقط على `main`:
   - rollback commit `f7c3af17b3a28858d1be9d5c57455d54b4256126`
7. `main/config.js` بعد rollback لا يفعّل D1 Orders read ولا يحمل Edge Orders loader.
8. شاشة الأوردرات ترجع إلى Apps Script / Sheets كمصدر قراءة الإنتاج.
9. بيانات D1 نفسها لم تُحذف ولم يتم rollback للـmirrors.
10. لا Worker deploy، لا secret rotation، لا 02CL reopen، ولا authority transfer.
11. أي إعادة تفعيل D1 للواجهة ممنوعة حتى ينجح **full field completeness parity** لكل الحقول التي تستخدمها الواجهة، وليس identity parity فقط.

## آخر checkpoint مغلق قبل 02CR

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

الحالة: **VERIFIED PASS — CLOSED — FOUR VIEW MIRRORS FRESH — AUTHENTICATED PRINT CANARY IDENTITY PARITY PASS**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_VERIFIED_PASS_CLOSED.md`

02CQ أثبت freshness + identity parity، لكنه لا يُعتبر إثبات field completeness بعد اكتشاف 02CR.

## Current production state

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Sheets / Apps Script authority: **YES**
- frontend D1 orders read on `main`: **ROLLED BACK / OFF**
- order-card production read source: **Apps Script / Sheets**
- D1 four-view mirrors: **RETAINED**
- 02CL: **OFF**
- generic outbox drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## checkpoints سابقة

- `PERF-CF-02CQ` — **VERIFIED PASS — CLOSED; freshness + identity parity**
- `PERF-CF-02CO` — **AUTH PASS; stale mirror blocker resolved by 02CQ**
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث سجل 02CR.
3. لا تعيد تفعيل `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` على `main` قبل full field-completeness qualification.
4. لا تعتبر Order ID / Line ID / status parity وحده كافيًا للـfrontend cutover.
5. حافظ على Apps Script / Sheets كـauthoritative production read/write source حاليًا.
6. احتفظ ببيانات وموديولات D1 للتأهيل ولا تحذفها.
7. لا تستخدم generic outbox drain.
8. لا تدوّر `EDGE_SESSION_SECRET`.
9. لا تفتح 02CL gates.
10. الخطوة التالية: بناء واختبار D1 operational row contract كامل لكل حقول الواجهة، ثم canary جديد قبل أي re-enable.
