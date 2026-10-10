# ACC-169 — G3 financial opening balance source candidate, metadata-only discovery
Date: 2026-10-10 | Branch: `audit/acc169-opening-source-provenance-20261010`
Status: **DISCOVERED / SOURCE_AUTHORITY_NOT_APPROVED / G3_NOT_ACCEPTED**.

## What was actually verified
- The current TrendOS master book already names the operating Google workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY` and its existing ID; this is not a newly invented source.
- The connected Drive account could **read its current metadata**. Workbook title matched, metadata modification time was `2026-10-09T15:20:03.619Z`, and native Sheets metadata contained **91 tabs**.
- The visible titles include **21 `حسابات - ...` accounting tabs** (including the invoice drafts/archive). A small header-only A1:AF1 read across selected financial tabs confirmed column names; no rows containing financial amounts, customer records or employee personal information were collected for this checkpoint.
- This operating workbook is a **potential historical source candidate only**, not an owner-approved authoritative ledger, bank statement or opening balance snapshot. The fact that an accounting tab has a header is not evidence of its transaction count, balances or transaction completeness.

## Proposed private source-to-target mapping to validate (not accepted yet)
| Target category from ACC-166 comparator | Candidate Google tab | Visible source columns / reconciliation question |
|---|---|---|
| Supplier payable | `حسابات - الموردين` | `ID`, `رصيد افتتاحي`, `مديونية`, `الرصيد الحالي`; ascertain aging/payable sign and uniqueness |
| Customer receivable | `حسابات - كشف العملاء والموردين` plus `حسابات - حركة الحسابات` | `نوع الطرف`, `كود الطرف`, `الرصيد بعد`, `partyType`, `balance`; avoid duplicate running ledger entries; require a signed as-of cutoff |
| Inventory quantity | `حسابات - الخامات` + `حسابات - حركة المخزون` | `ID`, `رصيد المخزن`, `balance`, `inQty`, `outQty`; stock snapshot vs movement trail |
| Inventory value | `حسابات - الخامات` | `سعر الوحدة`, `تكلفة محسوبة`, `رصيد المخزن`; valuation method and cost basis are not yet approved |
| Cashbox | `حسابات - الخزنة` | `نوع الحركة`, `المبلغ`, `الخزنة`, `رقم المرجع`; a movement log alone is not proof of opening cash float |
| Custody | `حسابات - عهد مشتريات الأقسام`, `حسابات - تقفيل العهد` | `الموظف`, `القسم`, `نوع الحركة`, `المبلغ`, `الحالة`, `معرف التقفيل`; calculate only outstanding authorized custody with audited closings |

## Source authority / acceptance blockers
1. Finance owner must nominate the *authoritative* books/physical records and financial cutover date, deciding whether this operating workbook is current/historical or only a partial mirror. The earlier sampled 21 tabs/60 rows are not sufficient evidence; **that sampling was not repeated**.
2. Freeze/export a private, dated source snapshot with owner signature and a separate **D1 SELECT-only** target snapshot after confirming query safety. Never publish actual balances or names in the public GitHub repository.
3. Validate per-entity IDs, signs, opening vs moving balances, missing entities, duplicates, inventory valuation, cash opening float and custody; only then run the already-merged `scripts/easystore_acc166_opening_reconcile.mjs` on **private local files**.
4. Migration is conditional: no N/A/no-migration or zero-opening ledger claim until finance owner signs source-to-target evidence. Any import or D1 mutation needs separate exact authorization and backup proof.

## G1 checkpoint and safety
- The real A2.13 manual financial workflow's published UI bootstrap gate was installed and **merged in PR #49**, commit `84a893841c7711bd36488c0d910cf252cab47156`. [ACC-168 read-only CI 38068601486](https://github.com/fawakhry/TrendOs/actions/runs/38068601486) passed `ACC165_MANUAL_WORKFLOW_BOOT_GATE=INSTALLED` while explicitly keeping `FINANCIAL_LAUNCH=NO_GO`.
- ACC-169 is **metadata/header READ-ONLY** only: no balance reads, employee permissions, D1 queries/writes, frontend deployment, financial workflow dispatch or financial pilot.
- G1 actual accepted custody close is still missing. G2 owner-approved permission matrix, G3 signed historical balances, G4 integrated finance transactions and G5 handoff are still open. Exactly **five** acceptance gates remain; a new metadata candidate does not constitute an accepted source.
