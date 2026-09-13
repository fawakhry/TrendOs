# TrendOS Cloud Migration V3 — Service View Formula Source PASS

Date: 2026-09-13 21:02 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Read-only inspection of the existing D1 mirror for `واجهة خدمة العملاء`, restricted to mirror metadata, headers, and formulas only. No business row values were logged.

- workflow: `TrendOS T11 Service View Formula Probe`
- run: `34776399396`
- job: `103775198288`
- workflow commit: `b194f4f23c905dd567d87ac9a7a986f6b35ef638`
- result: PASS / read-only
- production mutation: NO

## Decisive evidence

Existing Service-view mirror metadata:
- syncedAt: `2026-09-06 00:44:20`
- sourceLastRow: 270
- sourceLastCol: 19
- rowCount: 270
- status: ready
- note: `PERF-CF-02CQ bounded screen view atomic refresh`

Headers A:S:
1. رقم الأوردر
2. كود الأوردر
3. تاريخ الإنشاء
4. اسم الشات / المكتب
5. اسم المسؤول
6. رقم العميل
7. رقم عميل خارجي
8. نوع العميل
9. القسم الرئيسي
10. وصف مختصر
11. الأولوية
12. الحالة العامة
13. آخر تحديث
14. عدد البنود
15. بنود جاهزة
16. بنود غير جاهزة
17. تسليم جزئي؟
18. الكيان المنفذ الرئيسي
19. ملاحظات

Formula count in first 20 mirrored rows: 1.

Formula at row 2 / column A:
`=IFERROR(FILTER('الأوردرات'!A2:S270,'الأوردرات'!A2:A270<>""),"")`

## Conclusion

The Service/customer view is a direct filtered projection of the **Orders sheet A:S**, not the Order Lines sheet. This explains all prior evidence:
- deployed Service `lineId` matching customer phone;
- Service statuses such as `تسليم جزئي` that do not exist in the line-status column;
- rowNumber mismatch when compared against `بنود الأوردرات`;
- order-level rather than line-level semantics.

Therefore the Service Cloud candidate must be built from the fresh D1 `الأوردرات` mirror using the deployed A:S order-level contract. `بنود الأوردرات` remains the correct basis for Print/Laser/Press and must not be changed.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Perform safe rowNumber-based field-origin mapping between live Production Service output and the D1 `الأوردرات` mirror. Log only aggregate column-match counts. Then reconstruct the exact Service active/status/priority projection from Orders A:S and rerun exact live parity before any Service cutover.
