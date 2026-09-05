# TrendOS Black Box — PERF-CF-02CC

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Scope: TrendOS main platform -> Cloudflare only
Status: **VERIFIED PASS — Production Cloud Write schema blocker identified read-only**

## Event

After `PERF-CF-02CB` Shadow stability PASS, investigated why live Production Cloud Write health reports `schemaReady=false` without enabling writes or mutating Production.

## Static contract finding

`cloudflare-d1/src/cloud-write-gate.mjs` computes `schemaReady` by SELECT-only inspection of `sqlite_master` and requires both tables:

- `cloud_write_events`
- `cloud_write_outbox`

While `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`, the fail-closed gate does not delegate to the legacy Cloud Write implementation that contains schema-creation DDL.

Existing migration `cloudflare-d1/migrations/0003_cloud_write_lane.sql` defines the exact two tables and four supporting indexes.

## Production D1 identity

Verified deployed/current Production binding:

- `trendos-main`
- `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`

This identity matches the 02BZ deployment config and 02CA Shadow-enable config.

## Direct SELECT-only Production D1 probe

Workflow:
`.github/workflows/trendos-production-cloud-write-schema-readonly.yml`

Final commit:
`e7405ba607836b2a478be71ccc33b5519265dd07`

Run:
- `33964567447`
- job `101302281779`
- result **SUCCESS**

Observed:

- core `customers` table: present
- core `orders` table: present
- `cloud_write_events`: absent
- `cloud_write_outbox`: absent
- all four `idx_cloud_write_*` indexes from migration 0003: absent
- `schemaReady=false`
- `fullMigrationShapeReady=false`

Worker boundary stayed unchanged before/after query:

- Cloud Write OFF
- writesAccepted=false
- pendingOutbox=null
- cutover=false
- Sheets authoritative=true

No business rows were read; only sqlite schema metadata was queried.

Integrity:
- run `33964567560`
- result **SUCCESS**

## Failed-closed attempts

Two earlier diagnostic attempts stopped before D1 access:

- `33964494759`: safety guard matched its own regex definition.
- `33964526089`: expected DB ID was stale/incorrect.

Both failed closed and caused no Production read/write.

## Current exact state

- Production Shadow: ON, fixed-synthetic read-only observer.
- Production Cloud Write: OFF.
- Production Cloud Write schema: NOT READY.
- Exact missing structures: migration 0003 tables/indexes.
- Sheets authoritative: YES.
- Production cutover: NO.
- Frontend cutover: NO.

## Next exact safe action

Prepare and CI-qualify a **manual-only Production schema-only migration gate** for exactly `0003_cloud_write_lane.sql`.

The gate must:

1. require Cloud Write OFF before migration;
2. pin database name and database ID;
3. prove the migration contains only the expected Cloud Write tables/indexes and does not alter/drop existing business tables;
4. run local/isolated migration verification before any Production command;
5. use exact explicit confirmation for Production schema application;
6. verify after application that `schemaReady=true` while Cloud Write remains OFF and write routes still refuse mutation;
7. never enable Cloud Write or frontend cutover.

Preparation is allowed next. Actual Production D1 migration requires separate explicit authorization.

Canonical checkpoint:
`docs/trendos/checkpoints/PERF_CF_02CC_PRODUCTION_CLOUD_WRITE_SCHEMA_READONLY_2026-09-05.md`
