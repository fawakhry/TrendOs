# TrendOS Accounting F2 — Persistence Preparation Plan

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCOUNTING_F2_FINANCE_PLANNING_PASS_2026-09-05.md`

## Scope
Prepare, test and review the future Accounting persistence schema **without applying it to D1 or production**.

## Prepared persistence principles
- journal-first double-entry storage;
- integer minor units (piastres), never floating-point authority;
- append-only journals and journal entries;
- append-only idempotency decisions and audit events;
- Treasury/Cashbox identity is separate from ledger account code;
- Party/Order/Line/Item/Department/Profit Center references remain stable external IDs, not duplicated master records;
- no foreign key from Accounting to mirrored Operations tables because those are separate authority domains;
- original journal cannot be mutated by reversal; reversal points to original journal;
- same idempotency key cannot be reused for a different command fingerprint;
- no partner/investor profit-share percentage columns.

## Prepared tables
1. `accounting_accounts`
2. `accounting_treasuries`
3. `accounting_journals`
4. `accounting_journal_entries`
5. `accounting_idempotency`
6. `accounting_audit_events`

Optional read indexes will support:
- source document lookup;
- Order ID + Line ID lookup;
- Party subledger lookup;
- Treasury statement lookup;
- Profit Center reporting;
- journal reversal lookup.

## Append-only enforcement
Schema preparation will include SQLite triggers that abort UPDATE/DELETE on:
- journals;
- journal entries;
- idempotency ledger;
- audit events.

Treasury/account master metadata may be mutable later under a separate controlled admin workflow; financial facts remain immutable.

## Validation strategy
A Node `--experimental-sqlite` test will:
- apply the prepared SQL only to an in-memory database;
- verify required tables/indexes/triggers;
- insert a balanced sample journal;
- prove duplicate idempotency key is rejected;
- prove UPDATE/DELETE of financial facts is rejected;
- prove Party/Treasury/Order/Line/Profit Center dimensions persist intact;
- verify schema contains no profit-sharing percentage columns.

## Hard safety boundary
The prepared SQL will live under a dedicated `schema-prep` path, **not** the active `migrations` directory. No workflow is authorized to apply it.

**Status: PLAN PASS — implementation next.**
