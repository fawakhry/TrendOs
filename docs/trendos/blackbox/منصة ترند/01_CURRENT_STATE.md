# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Latest checkpoint

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback`

Status: **MITIGATION PASS — PRODUCTION FRONTEND D1 READ ROLLED BACK — APPS SCRIPT RESTORED — D1 DATA RETAINED — FIELD COMPLETENESS FIX PENDING**

Latest record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## Current factual production state

The production `main` branch had an older Edge-first Orders activation that was not aligned with the 02CQ working-branch frontend-OFF boundary.

Activation commit:

- `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`
- `Enable Production Orders Edge-first read with Apps Script fallback`

That commit changed only `config.js` by enabling the Edge Orders flag and loading the Edge wrapper.

After the user reported incomplete order cards, the activation was rolled back atomically.

Rollback commit on `main`:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`
- `Rollback Orders Edge-first read after incomplete field regression`

Verified current `main/config.js`:

- no `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`
- no `trendos-edge-orders-read-v1.js` production loader call
- Apps Script URL unchanged
- unrelated frontend configuration unchanged

Therefore the production order-card read path is restored to **Apps Script / Sheets**.

## Why D1 produced incomplete cards

The 02CQ refresh successfully made the mirrors fresh and matched Order ID / Line ID / status, but the current view schema is not a full operational-row contract.

Current `واجهة الطباعة` header has 18 columns only:

- رقم الأوردر
- كود الأوردر
- اسم الشات / المكتب
- اسم المسؤول
- القسم
- رقم البند
- اسم البند / نوع الشغل
- الكمية
- مسؤول القسم
- الأولوية
- الحالة
- جاهز؟
- آخر تحديث
- ملاحظات
- مركز الربح (لاحقًا)
- الكيان المنفذ (لاحقًا)
- رقم العميل
- مكبس حراري

The D1 mapper also exposes fields not present in this mirror, including expected delivery, received date, customer source/mode, notification/WhatsApp audit fields, debt-related fields, and other operational attributes. Those map to empty values when sourced from the current 18-column mirror.

This means:

- identity parity = PASS
- field completeness parity = NOT QUALIFIED

The next D1 frontend attempt must explicitly test the entire UI-consumed field contract.

## D1 state retained

02CQ itself remains valid for mirror freshness:

- `واجهة خدمة العملاء`: `270 × 19`
- `واجهة الطباعة`: `9 × 18`
- `واجهة الليزر`: `68 × 18`
- `واجهة المكبس`: `8 × 18`

The D1 data was not deleted or rolled back.

The 02CQ Apps Script refresh module and D1 worker qualification assets remain available for future canary work.

## Temporary 02CR probe

A read-only field parity workflow was created with no customer-value logging:

- commit `1fdea0ced9012962b2e7955fe185eecd03ecbe1f`
- run `34002436429`

It stopped before field comparison because the qualified Apps Script request returned `success != true` in that run. No mutation occurred.

The temporary workflow was removed:

- cleanup commit `a631c027e0d47ab2a1b785a878ca58d81aa51575`

The field-completeness defect was independently established from the authoritative Google Sheet header and D1 mapper source.

## Current production boundary

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Cloud Write: **ON**
- Sheets / Apps Script authority: **YES**
- production order-card read source: **Apps Script / Sheets**
- frontend D1 Orders read: **OFF / rolled back on main**
- D1 mirrors: **retained for qualification**
- 02CL reconciliation: **OFF**
- generic drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer: **NO**
- Worker deploy during 02CR: **NONE**
- secret rotation during 02CR: **NONE**

## Next safe work

Do not re-enable D1 frontend reads yet.

The next bounded checkpoint should:

1. inventory only the UI-consumed order-row field contract, not the whole system,
2. choose a D1 source/model that contains every required operational field,
3. map/synthesize fields without PII logging,
4. compare Apps Script vs D1 for row count + identity + per-field non-empty/value parity,
5. test all four screens,
6. keep `__DEBT__` on Apps Script unless separately qualified,
7. re-enable D1 only after full field-completeness PASS.

## Previously closed/prepared checkpoints

- `PERF-CF-02CQ` — **VERIFIED PASS — CLOSED for freshness + identity parity**
- `PERF-CF-02CO` — auth pass; stale mirror blocker resolved by 02CQ
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**
