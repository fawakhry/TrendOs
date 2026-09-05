# TrendOS Black Box — PERF-CF-02CD

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Scope: TrendOS main platform -> Cloudflare only
Status: **VERIFIED PASS — Production schema migration gate prepared, NOT executed**

## Event

Continued from `PERF-CF-02CC` and prepared the exact next gate for the TrendOS platform Cloudflare migration without applying any Production schema change.

## Qualified migration

Migration:
`cloudflare-d1/migrations/0003_cloud_write_lane.sql`

Pinned Git blob:
`b4c81348f9b1e79519130033b5b1dffcc86eaa0b`

Only expected objects:
- tables `cloud_write_events`, `cloud_write_outbox`
- indexes `idx_cloud_write_events_entity`, `idx_cloud_write_events_sheets_status`, `idx_cloud_write_outbox_event_unique`, `idx_cloud_write_outbox_pending`.

No business-table DML, DROP, or ALTER is allowed by the candidate gate.

## CI candidate

Workflow:
`.github/workflows/trendos-production-cloud-write-schema-migration-candidate.yml`

Corrected candidate commit:
`d315c9a2f4a77057a9ec9021c60e5b4da515de74`

Run:
`33964748781` — **SUCCESS**

Integrity:
`33964748782` — **SUCCESS**

Proved:
- exact migration blob;
- exact schema-only allow-list;
- first isolated apply PASS;
- second isolated apply idempotent PASS;
- sentinel customers/orders unchanged;
- zero Cloud Write rows after isolated apply;
- Wrangler 4.33.2 exact execute command flags exist;
- live Production remains enabled=false, writesAccepted=false, schemaReady=false, pendingOutbox=null, cutover=false, Sheets authoritative.

Initial candidate run `33964679844` failed closed because the scanner matched `ON DELETE CASCADE`; no Production mutation occurred. Scanner was corrected to validate whole statement types instead.

## Manual-only controlled Production apply

Prepared workflow:
`.github/workflows/trendos-production-cloud-write-schema-controlled-apply.yml`

Final hardening commit:
`9b2cbd9ce01a0d3e46e66af551eed8252c5f4f87`

Trigger:
- `workflow_dispatch` only
- no push trigger

Exact required confirmation:
`APPLY_PRODUCTION_CLOUD_WRITE_SCHEMA_ONLY`

Pinned target:
- Worker `trendos-d1-api`
- DB `trendos-main`
- DB ID `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`
- migration blob `b4c81348f9b1e79519130033b5b1dffcc86eaa0b`

Required pre-apply state:
- Cloud Write flag false
- Shadow flag true
- live enabled=false
- writesAccepted=false
- schemaReady=false
- pendingOutbox=null
- cutover=false
- Sheets authoritative=true
- Shadow fixed-synthetic fingerprint unchanged and mutation-free.

Only schema action permitted by the workflow is exact-file `wrangler d1 execute` of migration 0003. It contains no Worker deploy, migrations-apply sweep, secret rotation, Cloud Write flag change, or frontend cutover.

Defined post-apply verification, for a future authorized run only:
- schemaReady=true
- pendingOutbox=0
- Cloud Write still OFF / writesAccepted=false
- exact six schema objects present through SELECT-only sqlite_master proof
- write and outbox routes still HTTP 423
- Orders/Lines mirror parity remains valid
- Shadow invariants remain unchanged.

## Controlled workflow contract

Contract workflow:
`.github/workflows/trendos-production-cloud-write-schema-controlled-contract.yml`

Corrected contract commit:
`084c02269df7a6b5a304057021303d4441bf83e0`

Run:
`33964892720` — **SUCCESS**

Integrity:
`33964892728` — **SUCCESS**

Initial contract run `33964854881` failed closed because the scanner interpreted the negative `! grep ... true` assertion as enablement. The contract test was corrected; no Production mutation occurred.

## Current Production state

- Production Shadow: ON, fixed-synthetic read-only observer only.
- Production Cloud Write: OFF.
- Production Cloud Write schema: NOT READY / migration 0003 still absent.
- Sheets authoritative: YES.
- Production cutover: NO.
- Frontend cutover: NO.

## Mutation statement

**No Production migration was executed in PERF-CF-02CD.**

No Production D1 DDL or business write, Worker deploy, Apps Script/Sheet write, secret rotation, Cloud Write enablement, or frontend cutover occurred.

## Exact stop / next action

We are now stopped directly before the first Production schema-only DDL gate.

Next action, only after separate explicit authorization, is to execute the prepared manual-only workflow with exact confirmation `APPLY_PRODUCTION_CLOUD_WRITE_SCHEMA_ONLY` to install migration 0003 while keeping Cloud Write OFF.

Do not enable Cloud Write or cut over the frontend in that same step.

Canonical detailed checkpoint:
`docs/trendos/checkpoints/PERF_CF_02CD_PRODUCTION_SCHEMA_MIGRATION_GATE_PREPARED_2026-09-05.md`
