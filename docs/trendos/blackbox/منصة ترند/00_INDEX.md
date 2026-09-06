# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback + Operational Parity Repair`

الحالة: **MITIGATION PASS — PRODUCTION FRONTEND ON APPS SCRIPT — 02CR CANDIDATE QUALIFIED — PREVIEW FAIL-CLOSED PASS — ENRICHMENT APPS SCRIPT DEPLOYMENT APPROVAL GATE**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## نتيجة 02CR الحالية

1. تم عزل Regression ظهور كروت الأوردرات الناقصة إلى Edge-first read المحدود، وتم rollback القراءة على `main` إلى Apps Script:
   - `f7c3af17b3a28858d1be9d5c57455d54b4256126`
2. اتضح أن production orders page كان يمر عبر 02CO screen-view canary المحدود، لا عبر operational `بنود الأوردرات` contract الكامل.
3. تم إصلاح duplicate-header semantics في D1 mapper لتطابق Apps Script last-write-wins:
   - `c6b362b4d4223e7f890af44d2067a5440224e42a`
4. Existing Orders Live Sync V2 يبقى المالك الوحيد لـ:
   - `الأوردرات`
   - `بنود الأوردرات`
   - note: `TrendOS orders live sync V2 quota-aware`
5. read-only D1 catalog أثبت أن `العملاء` وقائمة منع التسليم ما زالا على full-mirror قديم من 2026-08-29.
6. تم تجهيز independent quota-aware enrichment live-sync candidate فقط لـ:
   - `العملاء`
   - `عملاء منع التسليم بالمديونية`
   - file: `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`
   - note: `PERF-CF-02CR enrichment live sync V1`
7. تم تجهيز isolated D1 operational canary:
   - `/v1/edge/orders/02cr/page`
   - لا تستخدمه الواجهة الإنتاجية.
8. الـcanary يطابق Apps Script في enrichment + search/status/priority/heat filters + pagination + status counts، مع `__DEBT__` Apps Script fallback.
9. 02CR CI:
   - Run `34003887916`
   - Job `101407500641`
   - **SUCCESS**
10. Integrity:
   - Run `34003887933`
   - Job `101407500688`
   - **SUCCESS**
11. Preview pre-sync fail-closed proof:
   - Run `34003873139`
   - Job `101407459524`
   - HTTP `503`
   - `02cr-operational-mirror-not-qualified`
   - fallback `apps-script`
   - failed mirrors فقط: `العملاء` + `عملاء منع التسليم بالمديونية`
12. لا يوجد production Worker deploy، لا frontend re-enable، لا secret rotation، لا authority transfer.
13. نقطة الوقوف: **موافقة Apps Script جديدة مطلوبة لنشر وتشغيل 02CR enrichment sync فقط**. موافقة 02CQ القديمة لا تُستخدم.

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
- existing Orders Live Sync V2: **ACTIVE OWNER OF ORDERS + LINES; UNCHANGED**
- 02CR enrichment sync: **QUALIFIED CANDIDATE / NOT DEPLOYED**
- 02CR isolated Preview route: **QUALIFIED / FAIL-CLOSED BEFORE ENRICHMENT SYNC**
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

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md` ثم أحدث سجل 02CR.
2. لا تعيد تفعيل D1 على production frontend قبل full field/paging/filter parity.
3. لا تلمس Orders Live Sync V2 ownership لـ`الأوردرات + بنود الأوردرات`.
4. الخطوة التالية المسموحة بعد موافقة صريحة: نشر `D1_Operational_Enrichment_Live_Sync_02CR.gs` فقط وتشغيل `startD1OperationalEnrichmentLiveSync02CR()`.
5. بعد ذلك اختبر `/v1/edge/orders/02cr/page` على Preview أولًا؛ production frontend يظل Apps Script.
6. حافظ على Sheets / Apps Script كـauthoritative source.
7. لا تستخدم generic outbox drain.
8. لا تدوّر `EDGE_SESSION_SECRET`.
9. لا تفتح 02CL gates.
