# TrendOS Accounting F2 — Persistence Schema Prepared (NOT APPLIED)

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Action
Prepared future Accounting Finance persistence schema at:

`cloudflare-d1/schema-prep/accounting-finance-v1.sql`

Commit:
`67955e2fbab606d264382860c50429f9b7052495`

## Critical safety classification
This file is intentionally stored under `cloudflare-d1/schema-prep/`, **not** `cloudflare-d1/migrations/`.

It has NOT been applied to:
- D1 Preview;
- D1 Production;
- Apps Script;
- Google Sheets;
- any production database.

## Prepared tables
- `accounting_accounts`
- `accounting_treasuries`
- `accounting_journals`
- `accounting_journal_entries`
- `accounting_idempotency`
- `accounting_audit_events`

## Financial integrity in prepared schema
- money is stored as integer minor units (piastres);
- journals require equal total debit/credit;
- journal entries require exactly one positive debit or credit;
- journal source document + idempotency key + fingerprint are retained;
- reversal journals point to original journal and require reversal reason;
- Treasury identity is separate from account code;
- Party, Order, Line, Item, Department and Profit Center IDs remain external stable dimensions;
- no customer/supplier master duplication is introduced;
- no profit-sharing/partner/investor percentage columns exist.

## Append-only enforcement prepared
SQLite triggers abort UPDATE/DELETE on:
- `accounting_journals`;
- `accounting_journal_entries`;
- `accounting_idempotency`;
- `accounting_audit_events`.

Reversal is therefore modeled as a new journal, never mutation/deletion of the original financial fact.

## Prepared account seed
The SQL contains the same F2 semantic Chart of Accounts currently used by the posting planner (1010/1020/1100/1200/1300/2100/2200/3100/4100/5100/5200/5300).

## Exact next step
Execute this prepared SQL only against an in-memory SQLite database in CI. Verify table/index/trigger presence, balanced sample journal, idempotency uniqueness, append-only rejection, stable dimensions and absence of profit-sharing columns. Do not apply any D1 migration.

**Status: SCHEMA PREPARED — NOT APPLIED.**
