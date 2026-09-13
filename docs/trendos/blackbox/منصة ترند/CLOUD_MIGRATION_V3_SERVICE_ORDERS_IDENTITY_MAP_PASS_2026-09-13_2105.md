# TrendOS Cloud Migration V3 — Service Orders Identity Map PASS

Date: 2026-09-13 21:05 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Correlated every live Production Service row to the fresh D1 `الأوردرات` mirror by order identity entirely in memory. Logs contained only response field names, aggregate source-column matches, and aggregate status/priority counts; no raw IDs, phones, names, or customer data were emitted.

- workflow: `TrendOS T11 Service Orders Identity Map`
- run: `34776578232`
- job: `103775673207`
- workflow commit: `63b2004691b4976f77ff4677d4f8779282995635`
- result: PASS / read-only diagnostic
- Production business mutation: NO

## Identity join

- live Service rows: 35
- mapped to unique Orders source row: **35 / 35**
- ambiguous mappings: 0
- unmapped: 0
- nonblank Orders source rows: 513
- Orders mirror syncedAt: `2026-09-13 18:38:19`
- Apps Script Service read: ~5961 ms

## Live Service response field set

`assignedTo, customer, customerPhone, debtAmount, debtHold, debtNotes, department, expectedDeliveryAt, expectedDeliveryText, flyPrint, heatPress, hotfixSource, itemName, lineId, notes, orderCode, orderId, priority, qty, quickPrint, ready, receivedAt, rowNumber, status, updatedAt`

## Proven deployed field origins from Orders

For the 35 uniquely mapped rows:
- `orderId` -> Orders col 1 `رقم الأوردر`: 35/35 exact
- `orderCode` -> Orders col 1 `رقم الأوردر`: 35/35 exact (col 2 matches 34 but col 1 is the exact deployed response behavior)
- `lineId` -> Orders col 6 `رقم العميل`: 34/34 nonempty exact
- `customerPhone` -> Orders col 6 `رقم العميل`: 34/34 nonempty exact
- `customer` -> Orders col 4 `اسم الشات / المكتب`: 35/35 exact
- `department` -> Orders col 9 `القسم الرئيسي`: 35/35 exact
- `assignedTo` -> Orders col 9 `القسم الرئيسي`: 35/35 exact
- `itemName` -> Orders col 10 `وصف مختصر`: 34/35 exact (one blank/nonexact case)
- `qty` -> Orders col 14 `عدد البنود`: 34/35 exact
- `priority` -> Orders col 11 `الأولوية`: 35/35 exact
- `status` -> Orders col 12 `الحالة العامة`: 35/35 exact
- `ready` -> Orders col 15 `بنود جاهزة`: 34/35 exact

This confirms the deployed Service contract is an order-level A:S projection, not a line-level projection.

## Active-set evidence

Included by live `statusFilter=__ACTIVE__`:
- طلب جديد: 26
- تسليم جزئي: 3
- متوقف: 2
- تحت التنفيذ: 3
- cloud-qualification: 1

Excluded Orders-source rows by status:
- طلب جديد: 9
- تم التسليم: 393
- مكرر: 9
- جاهز للاستلام: 65
- ملغى: 2

Included priority distribution:
- عادي: 33
- عاجل: 1
- qualification: 1

## Remaining blocker

Status alone does not explain `__ACTIVE__`: nine source rows with `الحالة العامة = طلب جديد` are excluded while 26 others with the same status are included. Therefore the deployed `__ACTIVE__` contract has an additional condition or the Service view itself excludes those nine rows.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Read-only filter-semantics probe on live Service: compare pagination/status totals for `__ACTIVE__`, exact `طلب جديد`, exact hidden statuses, and no status filter. This will determine whether the nine `طلب جديد` rows are absent from the underlying Service view or specifically excluded by `__ACTIVE__`. Then encode only the proven rule in the D1 candidate and run exact parity.
