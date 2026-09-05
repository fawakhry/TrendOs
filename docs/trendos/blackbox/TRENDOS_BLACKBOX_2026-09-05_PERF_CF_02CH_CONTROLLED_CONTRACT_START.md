# TRENDOS BLACKBOX — PERF-CF-02CH CONTROLLED CONTRACT STEP

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `PERF-CF-02CH START`
Status: **IN PROGRESS / CONTRACT ONLY / NO PRODUCTION MUTATION**

## Candidate proof already passed
Run `33966604201`, job `101307725996` proved:
- live `d1_migrations` DDL is exactly compatible with:
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `name TEXT UNIQUE`
  - `applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`;
- isolated reconciliation of exactly `0001_init.sql`, `0002_full_sheet_mirror.sql`, and `0003_cloud_write_lane.sql` succeeds;
- replay is idempotent;
- application schema is unchanged;
- sentinel application rows are unchanged;
- Cloud Write tables remain empty;
- live Production health is unchanged and Cloud Write remains OFF.

Integrity run `33966604203` is PASS.

## This step
Prepare a reusable **manual-only** Production reconciliation workflow and a CI-only static contract verifier.

The manual workflow must:
1. require `workflow_dispatch` plus the exact confirmation phrase `RECONCILE_PRODUCTION_D1_MIGRATION_LEDGER_ONLY`;
2. pin Production DB ID and migration file hashes;
3. require Cloud Write OFF, schemaReady=true, pendingOutbox=0, cutover=false, Sheets authoritative=true;
4. require `d1_migrations` to exist with the proven three-column contract and to be empty before mutation;
5. require repository migration list to be exactly 0001/0002/0003;
6. reconcile only those three ledger names using a D1 batch transaction against `d1_migrations`;
7. verify exactly those three rows exist afterward;
8. verify Wrangler then sees no unapplied migrations;
9. re-check health, write-lane refusal, Production Shadow fingerprint, and Orders/Lines mirror parity;
10. perform no application-table DML/DDL, no Worker deploy, no flag change, and no frontend cutover.

## Critical rule
This checkpoint authorizes creation/testing of the workflow contract only. **Do not dispatch or execute the Production ledger mutation in PERF-CF-02CH.**

Actual Production ledger reconciliation is the next separate mutation boundary after this contract passes.
