# Cloud Migration V3 — T11 Service Exclusion Rule V1 Checkpoint

Date: 2026-09-13
Branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
Workflow: `TrendOS T11 Service Exclusion Rule`
Run: `34777724577`
Workflow commit: `2b9d5e448c2551f92801197f6ca13ac221f4a1b6`
Result: **SUCCESS / READ-ONLY**

## Purpose
Identify a reusable non-PII operational rule that explains why 9 `طلب جديد` Orders rows are excluded from the deployed Service `__ACTIVE__` result while 26 are included.

## Confirmed counts
- Deployed Service active rows: 35
- D1 Orders rows with status `طلب جديد`: 35
- Included `طلب جديد`: 26
- Excluded `طلب جديد`: 9
- No production mutation.
- No business identities exposed in logs.

## Key finding
All 9 excluded rows have `مصدر الطلب` blank. However, exactly 1 included Service row also has `مصدر الطلب` blank, so a blanket `مصدر الطلب is blank => exclude` predicate is unsafe and would incorrectly remove one valid Service row.

Other observed operational distributions:
- Excluded department: 8 `مكبس`, 1 `طباعة`.
- Included department: 18 `طباعة`, 7 `ليزر`, 1 `متعدد الأقسام`.
- Excluded `بنود جاهزة`: all 0.
- Excluded `تسليم جزئي؟`: all `لا`.
- Excluded `مصدر الطلب`: all blank.

## Decision
Do not hard-code Order IDs and do not exclude all blank-source rows. Refine the predicate against the 10 blank-source request-new rows (1 included + 9 excluded) using only operational fields.

## Next step
Run `T11 Service Exclusion Rule V2` to find a stable composite operational split, then checkpoint it before implementing the Service D1 candidate.
