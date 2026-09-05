# TRENDOS BLACKBOX — PERF-CF-02CH START

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `PERF-CF-02CG — VERIFIED PASS`
Status: **STARTED / CANDIDATE ONLY / NO PRODUCTION MUTATION**

## Proven predecessor facts
- Production Cloud Write schema is ready.
- Cloud Write remains OFF and Sheets remain authoritative.
- `d1_migrations` exists and contains zero rows.
- 0001 and 0002 are structurally satisfied in Production with zero mismatches.
- 0003 schema is already installed by the authorized exact-file execution from PERF-CF-02CE.
- Wrangler still lists 0001/0002/0003 as unapplied only because the ledger is empty.

## 02CH goal
Qualify a safe migration-ledger reconciliation candidate without mutating Production.

## Candidate proof requirements
1. Read the exact live `d1_migrations` DDL/column contract using schema metadata only.
2. Pin exact migration filenames and file hashes for 0001/0002/0003.
3. Build an isolated SQLite database containing:
   - application schema from pinned 0001 + 0002 + 0003;
   - a ledger table matching the live Production `d1_migrations` schema.
4. Snapshot all application schema objects and sentinel business rows before reconciliation simulation.
5. Simulate only the exact migration-ledger records required for 0001/0002/0003.
6. Prove:
   - exactly three ledger records result;
   - no application table/index/schema changes;
   - no sentinel business-row changes;
   - repeating the reconciliation is deterministic/idempotent or fails safely by the ledger's unique constraints;
   - Cloud Write runtime invariants remain OFF/read-only on live Production before and after all read-only observations.
7. Produce a separate manual-only Production reconciliation contract, but do not execute it in 02CH.

## Explicit prohibitions
- no Production INSERT/UPDATE/DELETE/DDL;
- no modification of Production `d1_migrations`;
- no migration apply or SQL file execution on Production;
- no Cloud Write enablement;
- no Worker deploy;
- no Apps Script/Sheets mutation;
- no frontend cutover.

## Stop rule
02CH may end with a qualified reconciliation candidate and manual-only contract. Actual Production ledger reconciliation is a separate mutation boundary and must not happen inside 02CH.
