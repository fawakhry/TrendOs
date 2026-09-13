# Cloud Migration V3 — T11 Service Exclusion Rule V2 Checkpoint

Date: 2026-09-13
Branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
Workflow: `TrendOS T11 Service Exclusion Rule V2`
Run: `34777774053`
Workflow commit: `359a5f5b8e2420014b378981c92834b71a721993`
Result: **SUCCESS / READ-ONLY**

## Scope
Refine the Service exclusion rule only within the 10 `طلب جديد` Orders rows whose `مصدر الطلب` is blank.

## Result
- Blank-source request-new subset: 10
- Included by deployed Service: 1
- Excluded by deployed Service: 9
- No identities exposed.
- No production mutation.

## Pure operational split found
The one included row is:
- `القسم الرئيسي = طباعة`
- `عدد البنود = 1`

The nine excluded rows split as:
- 8 rows: `القسم الرئيسي = مكبس`, `عدد البنود = 1`
- 1 row: `القسم الرئيسي = طباعة`, `عدد البنود = 0`

This is a perfect split for the current data, but it may still be a symptom rather than the true historical boundary.

## Stronger hypothesis requiring proof
The old `واجهة خدمة العملاء` formula captured earlier is bounded to `الأوردرات!A2:S270`. The next probe tests whether all 26 included request-new rows are at or below Orders row 270 and all 9 excluded request-new rows are above 270.

## Next step
Run `T11 Service Row 270 Boundary Proof`. If PASS, treat the nine rows as outside the deployed Service view boundary rather than inventing a business-rule predicate.
