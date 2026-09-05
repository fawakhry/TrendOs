# PERF-CF-02CD — Production Cloud Write Schema Migration Gate Prepared

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED PASS — PRODUCTION SCHEMA APPLY GATE PREPARED, NOT EXECUTED**

## Resume point

Resumed from `PERF-CF-02CC`, which proved read-only that Production D1 `trendos-main` is missing the Cloud Write schema objects from migration `0003_cloud_write_lane.sql` while Cloud Write remains OFF.

Scope is TrendOS main platform -> Cloudflare only.

## Migration pinned

Migration:

`cloudflare-d1/migrations/0003_cloud_write_lane.sql`

Git blob SHA:

`b4c81348f9b1e79519130033b5b1dffcc86eaa0b`

Expected schema objects only:

Tables:
- `cloud_write_events`
- `cloud_write_outbox`

Indexes:
- `idx_cloud_write_events_entity`
- `idx_cloud_write_events_sheets_status`
- `idx_cloud_write_outbox_event_unique`
- `idx_cloud_write_outbox_pending`

The migration uses additive `CREATE ... IF NOT EXISTS` statements and `PRAGMA foreign_keys = ON`; it contains no business-row DML and no DROP/ALTER operation.

## CI-only migration candidate gate

Workflow:

`.github/workflows/trendos-production-cloud-write-schema-migration-candidate.yml`

Initial implementation commit:

`9fa0223396b59398ccfebded279c8755949e1ab3`

First run:

`33964679844` — FAILED CLOSED before isolated apply because the static scanner incorrectly treated the foreign-key clause `ON DELETE CASCADE` as a DELETE statement.

No Production D1 mutation occurred.

Corrected candidate commit:

`d315c9a2f4a77057a9ec9021c60e5b4da515de74`

Candidate run:

`33964748781` — **SUCCESS**

Integrity for corrected candidate:

`33964748782` — **SUCCESS**

Verified by the successful candidate:

- exact migration blob pin PASS;
- exact two-table/four-index static allow-list PASS;
- protected business-table create references rejected;
- first isolated SQLite apply PASS;
- second isolated apply PASS / idempotent;
- sentinel `customers` and `orders` rows unchanged;
- Cloud Write event/outbox tables empty after isolated applies;
- Wrangler `4.33.2 d1 execute` supports `--file`, `--remote`, and `--config` command shape;
- live Production pre-migration health still:
  - database=true
  - enabled=false
  - writesAccepted=false
  - schemaReady=false
  - pendingOutbox=null
  - cutover=false
  - sheetsAuthoritative=true.

## Manual-only Production schema apply gate

Prepared workflow:

`.github/workflows/trendos-production-cloud-write-schema-controlled-apply.yml`

Preparation/hardening commits:

- `c3eb372dc21e5ab227954c936fe6bf6c5a4a3c65`
- `598fb6f562626a9282b1b19019d01f0ce4263247`
- `9b2cbd9ce01a0d3e46e66af551eed8252c5f4f87`

The workflow has **workflow_dispatch only** and no push trigger.

Required exact confirmation:

`APPLY_PRODUCTION_CLOUD_WRITE_SCHEMA_ONLY`

Pinned Production identity:

- Worker: `trendos-d1-api`
- D1 name: `trendos-main`
- D1 ID: `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`
- migration blob: `b4c81348f9b1e79519130033b5b1dffcc86eaa0b`

Hard preconditions before any DDL:

- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`
- live health must be exactly unready/OFF:
  - enabled=false
  - writesAccepted=false
  - schemaReady=false
  - pendingOutbox=null
  - cutover=false
  - Sheets authoritative=true
- Production Shadow must retain the deterministic read-only fingerprint and zero-mutation invariants.

The only intended Production schema command is exact-file execution of migration `0003` using pinned Wrangler 4.33.2 against `trendos-main` with `--remote`, `--file`, and the current config.

The workflow does **not** run `wrangler deploy`, `wrangler d1 migrations apply`, or Worker secret mutation.

Required post-apply checks are already encoded but were NOT executed in this checkpoint:

- health becomes `schemaReady=true` while enabled=false and writesAccepted=false;
- pendingOutbox=0;
- direct SELECT-only `sqlite_master` check proves exactly the two tables and four indexes;
- POST Cloud Write remains HTTP 423;
- outbox route remains HTTP 423;
- Orders/Lines mirror parity remains valid;
- Production Shadow fingerprint/read-only invariants remain valid;
- no frontend cutover.

## Controlled workflow contract CI

Contract workflow:

`.github/workflows/trendos-production-cloud-write-schema-controlled-contract.yml`

Initial contract run:

`33964854881` — FAILED CLOSED because its scanner incorrectly interpreted the negative assertion `! grep ... true` as Cloud Write enablement.

No Production mutation occurred.

Corrected contract commit:

`084c02269df7a6b5a304057021303d4441bf83e0`

Contract run:

`33964892720` — **SUCCESS**

Integrity on the same final contract head:

`33964892728` — **SUCCESS**

The successful contract proves:

- controlled apply remains manual-only;
- exact confirmation is present;
- DB name/ID and migration blob are pinned;
- Cloud Write OFF assertions are present;
- no workflow-level Cloud Write override exists;
- no flag rewrite path exists;
- no Wrangler deploy/migrations-apply/secret mutation path exists;
- exactly one D1 execute path exists;
- exact pre-migration `schemaReady=false` / `pendingOutbox=null` baseline is required;
- post-migration `schemaReady=true` checks are defined;
- write/outbox routes must still fail closed;
- current live Production baseline remains OFF and unready.

## Production mutation statement

**Migration 0003 was NOT executed on Production in PERF-CF-02CD.**

This checkpoint performed:

- no Production D1 DDL;
- no Production D1 business write;
- no Worker deploy;
- no Apps Script write;
- no Google Sheet write;
- no Worker secret rotation;
- no Cloud Write enablement;
- no frontend cutover;
- no normalized-data cutover.

## Closed state

- Production Shadow: ON, fixed-synthetic read-only observer only.
- Production Cloud Write: OFF.
- Production Cloud Write schema: still NOT READY.
- Sheets authoritative: YES.
- Production cutover: NO.
- Frontend cutover: NO.
- Schema-only Production apply gate: PREPARED + CI/contract qualified, MANUAL-ONLY, NOT EXECUTED.

## Next boundary

The next material step is a real Production D1 schema mutation: applying exactly migration `0003_cloud_write_lane.sql` while Cloud Write remains OFF.

That action is outside this preparation checkpoint and requires a separate explicit Production schema-migration authorization.

After such authorization, execute only the prepared controlled schema-only gate, verify `schemaReady=true` with Cloud Write still OFF, record a new checkpoint, and do not enable Cloud Write or frontend cutover in the same gate.
