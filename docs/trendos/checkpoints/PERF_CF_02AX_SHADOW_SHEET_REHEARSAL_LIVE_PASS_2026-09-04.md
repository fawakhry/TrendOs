# PERF-CF-02AX — Shadow Sheet Rehearsal LIVE PASS — 2026-09-04

## Result
PASS at LIVE SHADOW-ONLY level. One controlled synthetic row was written to a dedicated hidden shadow sheet in the real TrendOS workbook. The live `الأوردرات` sheet was not modified.

## Operator authorization
The operator explicitly approved proceeding with the real Shadow Sheet Rehearsal after 02AW CI qualification.

## Live workbook
Workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.

Pre-write Orders metadata:
- sheet: `الأوردرات`
- grid rowCount: 274
- grid columnCount: 77
- actual populated header width used by runtime/D1 parity: 67 columns (`A:BO`)
- synthetic ID `CW-STAGE-33912472435`: 0 matches before rehearsal.

## Shadow sheet created
Created fixed target:
`__TRENDOS_CLOUD_WRITE_REHEARSAL`

Properties:
- hidden: true
- sheetId: `2026090402`
- rowCount: 20
- columnCount: 67
- frozenRowCount: 1

The first row was copied directly from `الأوردرات!A1:BO1` with normal paste so the 67 populated header cells and formatting match the live Orders header.

A post-copy value read confirmed the shadow header sequence is identical to the live `الأوردرات!A1:BO1` sequence.

## Controlled synthetic row write
Synthetic source identity:
- entity/order ID: `CW-STAGE-33912472435`
- customer name: `Staging Cloud Write Qualification`
- customer phone: `01001112233`
- status: `cloud-draft`
- Cloud receive/update timestamp: `2026-09-04T19:42:14.653Z`

These values are the same known synthetic Staging D1 qualification identity previously proven by 02AU/02AV.

One row was written to row 2 of the hidden shadow sheet only, using the same mapped production-header positions proven by the live dry-run:
- `رقم الأوردر`
- `اسم الشات / المكتب`
- `رقم العميل`
- `الحالة العامة`
- `آخر تحديث`

Other mapped optional fields remain blank because the synthetic source payload does not supply them.

## Post-write verification
Shadow search across `A1:BO20`:
- `CW-STAGE-33912472435` matched exactly 1 row.
- returned row = 2.

Live Orders search across `A1:BO274` after the shadow write:
- `CW-STAGE-33912472435` matched 0 rows.

Post-write workbook metadata:
- `الأوردرات` rowCount remains 274.
- `__TRENDOS_CLOUD_WRITE_REHEARSAL` remains hidden.
- shadow sheet remains 67 columns.

## Idempotency / replay control
The live shadow now contains exactly one copy of the synthetic entity ID. Any repeat rehearsal must first find this existing ID and must not append a second row unless a different explicit synthetic `CW-STAGE-*` identity is used.

This complements the 02AW CI proof that the prepared Apps Script rehearsal candidate returns replay no-op for identical payloads and fails closed for conflicting replay/duplicates.

## Safety state at close
- Live `الأوردرات` mutation: NONE.
- Live business Order ID created: NONE.
- Shadow-only Sheet mutation: YES, explicitly approved and limited to one synthetic row.
- Shadow target hidden: YES.
- Production Cloud Write flag: not changed by this step; remains outside this rehearsal.
- Google Sheets remains authoritative for production writes.
- No Apps Script deployment occurred.
- No D1 production write occurred.

## Qualification meaning
The project now has both:
1. live end-to-end Staging D1 -> Apps Script authenticated dry-run proof; and
2. live real-workbook shadow-sheet write proof with production Orders isolation.

This does NOT authorize writing a Cloud-originated order into live `الأوردرات` or enabling Production Cloud Write.

## Next exact gate
Before any production Orders write cutover, install/qualify the Apps Script rehearsal candidate against the already-created fixed shadow sheet and prove live replay/no-op behavior under its own default-OFF flag + separate rehearsal secret. Only after that should a separately approved production write preflight be designed.
