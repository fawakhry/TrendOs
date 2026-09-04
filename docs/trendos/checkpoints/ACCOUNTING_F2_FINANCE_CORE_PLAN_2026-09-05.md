# TrendOS Accounting F2 — Finance Core Execution Plan

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCOUNTING_F1_FOUNDATION_PASS_2026-09-05.md`

## Scope
Implement the first canonical double-entry Finance Core for TrendOS Accounting while keeping all new financial persistence OFF.

## F2-A deliverable
Pure deterministic planning/validation engine for:
- Chart of Accounts metadata;
- balanced Journal + JournalEntry model;
- Customer Receivable invoice posting;
- Customer Collection posting;
- Supplier Payable purchase posting;
- Supplier Payment posting;
- Treasury/Cashbox legs;
- Expense posting;
- append-only reversal planning;
- idempotency/fingerprint metadata;
- Order ID / Line ID / Department ID / Profit Center ID context retention.

## Initial canonical accounts
V1 planning chart uses semantic account IDs rather than Sheet row numbers:
- `ASSET:CASH`
- `ASSET:RECEIVABLES`
- `ASSET:INVENTORY`
- `LIABILITY:PAYABLES`
- `EQUITY:OPENING`
- `REVENUE:SALES`
- `EXPENSE:COGS`
- `EXPENSE:OPERATING`
- `EXPENSE:WASTE`

These are domain IDs, not final statutory account numbers. Mapping to display/account numbers can evolve without changing journal identity contracts.

## Double-entry rules
- every journal has >=2 entries;
- every entry has exactly one positive debit or credit;
- no negative amount;
- total debit must equal total credit to 0.01 EGP;
- V1 currency = EGP;
- Party ID is required for receivable/payable legs;
- Cashbox ID is required for treasury legs;
- sourceDocumentId and idempotencyKey are mandatory;
- generated plan is deterministic for the same normalized command;
- changing the command while reusing the same idempotency key changes the fingerprint and must be treated as a future conflict by persistence layer;
- reversal plans swap original debit/credit legs and never delete/rewrite the original journal.

## EasyStore behavior being preserved
F2 preserves the accounting intent already present in EasyStore:
- sales invoice creates customer debt;
- customer payment reduces customer debt and increases cash;
- purchase invoice creates supplier payable and inventory/expense value;
- supplier payment reduces payable and cash;
- cashbox leg is linked to the same source/reference and request identity;
- duplicate/retry protection is mandatory;
- reversals are additive, not destructive.

## Safety boundary
F2-A will be pure source + tests first. It will not:
- create D1 tables;
- write D1 rows;
- call Apps Script;
- mutate Google Sheets;
- enable Cloud Write;
- alter production traffic;
- apply profit-sharing percentages.

## Execution sequence
1. implement `accounting-finance-core-v1.mjs`;
2. checkpoint implementation;
3. add finance-core unit tests;
4. checkpoint tests;
5. wire Preview-only finance metadata + posting-plan routes;
6. add zero-persistence/runtime gates;
7. only after PASS move to F2-B persistence-schema preparation (prepare only, not apply).

**Status: APPROVED BY AUTONOMOUS EXECUTION POLICY — implementation starts now.**
