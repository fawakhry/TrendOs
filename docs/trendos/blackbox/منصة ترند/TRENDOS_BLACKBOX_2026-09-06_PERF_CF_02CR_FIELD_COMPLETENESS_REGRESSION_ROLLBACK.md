# TrendOS Blackbox — PERF-CF-02CR Field Completeness Regression / Safe Rollback

Date: 2026-09-06
Checkpoint: `PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **MITIGATION PASS — PRODUCTION FRONTEND D1 READ ROLLED BACK — APPS SCRIPT RESTORED — D1 DATA RETAINED — FIELD COMPLETENESS FIX PENDING**

## Trigger

User reported that production order cards were appearing incomplete after the D1 mirror work.

The screenshot showed the order rows themselves were present, but some operational details were missing/blank.

## Critical production discovery

The production `main` branch was not actually in the same frontend-read state documented by the 02CQ working checkpoint.

`main` contained commit:

- `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`
- message: `Enable Production Orders Edge-first read with Apps Script fallback`

That commit changed only `config.js` and:

1. set `window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`,
2. loaded `trendos-edge-orders-read-v1.js`.

Therefore the live GitHub Pages frontend could read `getRowsPageV1931` from D1 even though the 02CQ working-branch boundary kept the frontend flag OFF.

## Root cause

The refreshed D1 mirrors themselves were fresh and identity-correct, but the current screen-view mirror schema is not field-complete relative to the Apps Script operational row contract.

Current `واجهة الطباعة` source header is exactly 18 columns:

1. رقم الأوردر
2. كود الأوردر
3. اسم الشات / المكتب
4. اسم المسؤول
5. القسم
6. رقم البند
7. اسم البند / نوع الشغل
8. الكمية
9. مسؤول القسم
10. الأولوية
11. الحالة
12. جاهز؟
13. آخر تحديث
14. ملاحظات
15. مركز الربح (لاحقًا)
16. الكيان المنفذ (لاحقًا)
17. رقم العميل
18. مكبس حراري

The D1 mapper additionally tries to expose fields such as:

- source / customer source
- external customer id / customer mode
- fly/quick print
- debt fields
- notification fields
- WhatsApp audit fields
- received date
- expected delivery date/text
- registration sent

Those fields are not present in the current 18-column print mirror, so the mapper resolves them to empty values. This is sufficient for identity parity but not for full UI field parity.

This explains why the earlier 02CQ canary passed Order ID / Line ID / status parity while production cards could still be incomplete.

## Read-only probe note

A temporary 02CR field-parity workflow was created to compare only field names/non-empty counts without logging customer values.

- commit: `1fdea0ced9012962b2e7955fe185eecd03ecbe1f`
- workflow run: `34002436429`

The probe stopped before comparison because the Apps Script qualified request returned `success != true` during that run. No production mutation occurred.

The temporary workflow was removed:

- cleanup commit: `a631c027e0d47ab2a1b785a878ca58d81aa51575`

The schema mismatch was independently confirmed from the authoritative Google Sheet header and the deployed D1 mapper source.

## Immediate production mitigation

Because the defect affects visible order completeness, the safest reversible action was to remove the Edge-first frontend read and restore the original Apps Script read path.

The exact production Edge-enable commit changed only `config.js`, so it was reverted atomically by creating a new commit using the parent tree and the Edge-enable commit as parent.

Rollback commit:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`
- message: `Rollback Orders Edge-first read after incomplete field regression`

`main` was fast-forwarded to that new rollback commit.

Post-rollback `main/config.js` verification confirms:

- no `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`,
- no production loader call for `trendos-edge-orders-read-v1.js`,
- existing Apps Script URL and all unrelated production configuration remain unchanged.

## What was NOT rolled back

The D1 data work remains intact:

- the four 02CQ mirrors remain in D1,
- the 02CQ Apps Script refresh module remains available,
- no D1 rows were deleted,
- no Worker deploy was performed,
- no secret was rotated,
- no authority transfer occurred,
- Sheets / Apps Script remain authoritative.

Only the frontend D1 read activation was rolled back.

## Current production decision

Until field completeness reaches Apps Script parity, production order cards must read from Apps Script.

D1 may continue to be used for qualification/canary work only.

Before any future D1 frontend re-enable, the next checkpoint must require **field completeness parity**, not only identity parity. At minimum, every UI-consumed field must either:

1. exist in the D1 mirror source and map correctly, or
2. be deliberately synthesized from a qualified D1 source with tested parity.

The re-enable gate must compare the complete operational row contract for all four screens without logging customer PII.

## Safety conclusion

**Production mitigation PASS.** The user-visible incomplete-order regression was isolated to the Edge-first D1 frontend read path and that path was rolled back. Apps Script/Sheets are restored as the production read source while D1 mirror data is preserved for the next bounded fix.
