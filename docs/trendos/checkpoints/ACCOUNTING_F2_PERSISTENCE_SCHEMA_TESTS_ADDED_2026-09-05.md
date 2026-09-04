# TrendOS Accounting F2 — Prepared Schema Tests Added

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Action
Added in-memory SQLite test:
`tests/cloudflare_accounting_f2_schema_prep_v1.test.mjs`

Commit:
`bfa46c5450cc4c490fd5f9a953198417e59c72d7`

## Test contract
The prepared SQL is executed only against `DatabaseSync(':memory:')` using Node experimental SQLite.

The test proves or is designed to prove:
- schema file is explicitly PREPARED ONLY;
- no Accounting finance migration exists in active `cloudflare-d1/migrations`;
- required tables/triggers are created;
- Chart of Accounts seed matches F2 semantic roles;
- stable Treasury identity is separate from account code;
- sample customer collection journal stores exact integer piastres;
- Party/Treasury/Order/Line/Department/Profit Center dimensions survive storage;
- duplicate idempotency key is rejected;
- completed idempotency decision requires a journal;
- ambiguous decision may reserve key without inventing a journal;
- UPDATE/DELETE attempts on journals, entries, idempotency and audit rows are rejected by append-only triggers;
- reversal is a new journal referencing the original; original remains posted;
- no profit-sharing percentage column exists.

## Safety
No D1 binding is used by this test. No migration is applied anywhere.

## Exact next step
Wire the test into Accounting Native CI with `node --experimental-sqlite`, observe result, and correct schema/test only if CI exposes a real preparation defect.

**Status: TEST AUTHORED — CI execution pending.**
