# TRENDOS BLACKBOX — PERF-CF-02CF START

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `PERF-CF-02CE — VERIFIED PASS`
Status: **STARTED / READ-ONLY**

## Verified predecessor state
Production migration file `0003_cloud_write_lane.sql` has been installed by exact-file execution against pinned D1 `trendos-main` (`5c4b92bf-e043-4f6e-bd6d-d514a92cd825`).

Runtime state after 02CE:
- Cloud Write schema ready = true;
- Cloud Write enabled = false;
- writesAccepted = false;
- pendingOutbox = 0;
- cutover = false;
- Sheets authoritative = true;
- Production Shadow remains read-only/mutation-free with fingerprint `66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`;
- Orders mirror parity = 285/285;
- Lines mirror parity = 327/327;
- business write route remains HTTP 423;
- outbox route remains HTTP 423 while Cloud Write is OFF.

Wrangler migration ledger remains historically drifted and still reports `0001_init.sql`, `0002_full_sheet_mirror.sql`, and `0003_cloud_write_lane.sql` as pending because 0003 was executed as an exact SQL file without ledger mutation.

## PERF-CF-02CF scope
Read-only post-installation stability observation and migration-ledger observation/design only.

The executable probe must sample the live Production state repeatedly and prove:
1. `/v1/cloud/write/health` remains stable with schemaReady=true, enabled=false, writesAccepted=false, pendingOutbox=0, cutover=false, Sheets authoritative=true;
2. `/v1/cloud/write/v2/production-shadow` remains read-only/mutation-free with the pinned shadow fingerprint;
3. Orders and Lines mirror parity remains exact;
4. write-facing routes remain fail-closed while Cloud Write is OFF;
5. `wrangler d1 migrations list --remote` is observation-only and the exact ledger state is recorded;
6. no D1 DDL/DML, migration apply, Worker deployment, secret mutation, Apps Script/Sheets write, frontend cutover, or Cloud Write enablement occurs in 02CF.

## Explicit prohibitions
- no `TRENDOS_CLOUD_WRITE_V1_ENABLED=true`;
- no Cloud Write business mutation;
- no `wrangler d1 migrations apply`;
- no `wrangler d1 execute --file`;
- no direct D1 write query;
- no migration ledger mutation;
- no Production Worker deploy;
- no frontend cutover;
- no Apps Script or Google Sheets business-data mutation.

## Exact next step
Add a dedicated read-only GitHub Actions runtime probe for multiple post-0003 stability samples plus a remote migration-list observation, then capture executable evidence before any subsequent boundary is opened.
