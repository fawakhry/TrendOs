# TrendOS Accounting F2 Finance Core — Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCOUNTING_F1_FOUNDATION_PASS_2026-09-05.md`

## F2-START — PASS

F2 starts the canonical financial engine for TrendOS Accounting while preserving EasyStore business behavior and keeping all new financial persistence disabled.

## Goal
Replace scattered primitive accounting side effects with deterministic, auditable, balanced financial posting plans.

## Scope
1. Chart of Accounts V1.
2. Double-entry JournalEntry / JournalLine planning model.
3. Integer-minor-unit money arithmetic to avoid floating-point imbalance.
4. Posting plans for:
   - Sales Invoice / Accounts Receivable
   - Customer Collection / Treasury
   - Purchase Invoice / Accounts Payable
   - Supplier Payment / Treasury
   - Expense cash posting
   - Expense on account
   - Treasury transfer
   - Reversal
5. Party/customer/supplier subledger references on journal lines.
6. Order ID / Line ID / Department ID / Profit Center ID dimensions on relevant lines.
7. Idempotency key carried by every posting plan.
8. Balanced-journal validator.
9. Preview API that plans/validates postings only (`persisted=false`).
10. Tests for balance, dimensions, replay identity and reversal.

## Accounting rules
- Sales invoice: Dr Accounts Receivable / Cr Sales Revenue.
- Customer collection: Dr Cash/Bank / Cr Accounts Receivable.
- Purchase invoice for stocked material: Dr Inventory / Cr Accounts Payable.
- Purchase invoice for direct expense: Dr Expense / Cr Accounts Payable.
- Supplier payment: Dr Accounts Payable / Cr Cash/Bank.
- Paid expense: Dr Expense / Cr Cash/Bank.
- Expense on account: Dr Expense / Cr Accounts Payable.
- Treasury transfer: Dr destination treasury / Cr source treasury.
- Reversal: exact debit/credit swap linked to the original journal plan.

COGS and stock consumption remain F3/F4 concerns; F2 must not invent stock cost recognition.

## Safety
- No D1 migration is applied.
- No D1 financial write.
- No Google Sheet financial mutation.
- No Apps Script production change.
- No Cloud Write enablement.
- Preview only generates deterministic financial posting plans.

## Exact next step
Implement pure `accounting-finance-core-v1.mjs` and its tests, then expose a read-only metadata route plus a validation/planning POST route that explicitly returns `persisted=false`.
