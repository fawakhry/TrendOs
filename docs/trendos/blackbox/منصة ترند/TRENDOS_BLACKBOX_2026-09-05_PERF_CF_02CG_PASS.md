# TRENDOS BLACKBOX — PERF-CF-02CG PASS

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `PERF-CF-02CF — VERIFIED PASS`
Status: **VERIFIED PASS / READ-ONLY FORENSICS**

## Executable evidence
Workflow: `TrendOS Production Migration Ledger Forensics Read-Only`
Run: `33966491671`
Job: `101307426019`
Head SHA: `99d056f1dae3583bea37d78c5500fe16a2f6a1c1`
Conclusion: **SUCCESS**.

Integrity workflow for the same revision:
- Run `33966491634`
- Conclusion: **SUCCESS**.

## Production baseline
Before and after the forensics probe:
- `schemaReady=true`
- `enabled=false`
- `writesAccepted=false`
- `pendingOutbox=0`
- `cutover=false`
- `sheetsAuthoritative=true`
- state unchanged = true

## D1 migration-ledger finding
The D1 system table `d1_migrations` **exists**.

Read-only query result:
- `d1_migrations` row count = `0`
- ledger rows = `[]`

This explains why Wrangler reports all repository migrations as unapplied: the migration ledger has no historical applied-migration rows.

## Historical schema equivalence finding
An isolated SQLite reference was built from the exact pinned migration blobs:
- `0001_init.sql` blob `49c58dd275f8364d0632fabd669ef48b562ea895`
- `0002_full_sheet_mirror.sql` blob `1857534062b93eb24adbacdf7d3234bcaae69384`

The live Production schema was inspected using D1 schema/system metadata only:
- `PRAGMA table_info`
- `PRAGMA index_list`
- `PRAGMA index_info`
- `PRAGMA foreign_key_list`
- `sqlite_master` only for the migration-ledger table

No business rows were read.

Compared historical objects included 8 tables and 14 explicit indexes.

Result:
- `migration0001And0002StructurallySatisfied=true`
- `mismatchCount=0`
- `mismatches=[]`

Therefore 0001 and 0002 are structurally satisfied in Production. The remaining issue is **migration-ledger historical drift**, not schema drift.

## Important interpretation
Production has two truths that must not be conflated:
1. **Runtime/schema truth** — 0001/0002 schema is structurally present; 0003 Cloud Write schema is installed and runtime health is `schemaReady=true`.
2. **Wrangler ledger truth** — `d1_migrations` is empty, therefore Wrangler still lists 0001/0002/0003 as unapplied.

Do not run generic `wrangler d1 migrations apply` while this drift remains because it would attempt migrations whose schema already exists.

## Production impact
**NONE in PERF-CF-02CG.**
- no D1 DDL/DML;
- no ledger mutation;
- no migration apply;
- no exact-file execute;
- no Worker deploy;
- no Cloud Write enablement;
- no Apps Script/Sheets write;
- no frontend cutover.

## Current stop point
`PERF-CF-02CG — VERIFIED PASS`

Historical schema equivalence is proven and the ledger root cause is proven: `d1_migrations` exists but is empty.

## Next safe boundary
Prepare and test a migration-ledger reconciliation contract in isolation/dry-run only. The contract must pin the exact D1 migration-ledger schema and exact filenames, prove that inserting the historical applied-migration records does not touch application tables, and include pre/post runtime invariants. Do not mutate Production `d1_migrations` until that separate mutation boundary is explicitly qualified/authorized.
