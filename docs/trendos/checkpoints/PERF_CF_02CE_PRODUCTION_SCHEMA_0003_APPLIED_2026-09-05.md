# PERF-CF-02CE — Production Cloud Write Schema 0003 Applied

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED PASS — MIGRATION 0003 SCHEMA INSTALLED, CLOUD WRITE STILL OFF**

## Authorization

The user explicitly authorized Production execution of:

`Migration 0003`

Authorized migration file:

`cloudflare-d1/migrations/0003_cloud_write_lane.sql`

Pinned Git blob SHA:

`b4c81348f9b1e79519130033b5b1dffcc86eaa0b`

Pinned Production D1:

- name: `trendos-main`
- database id: `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`

Cloud Write was required to remain OFF before and after the schema installation.

## First authorized attempt — failed closed before DDL

One-shot authorization commit:

`a86339ab19249125534fecc42a0c7851a03c056c`

Run:

`33965723848`

Result: **FAILED CLOSED BEFORE DDL**

Reason:

Wrangler canonical migration ledger reported all three migrations as pending:

- `0001_init.sql`
- `0002_full_sheet_mirror.sql`
- `0003_cloud_write_lane.sql`

The prepared gate required only `0003` to be pending. Therefore it refused to run `wrangler d1 migrations apply` and skipped every mutation step.

No Production DDL occurred in this failed-closed attempt.

## Historical migration-ledger drift discovered

Production already contains the core schema created by earlier phases, while Wrangler's D1 migration ledger still reports historical migrations `0001` and `0002` as pending.

Running `wrangler d1 migrations apply` would therefore have attempted migrations outside the user's explicit `0003` authorization.

Decision:

- do NOT execute the canonical migration list;
- do NOT mutate or fabricate the migration ledger;
- execute only the pinned `0003_cloud_write_lane.sql` file directly;
- preserve the historical ledger drift for a separate future reconciliation checkpoint.

## Exact-file Production execution

Authorization commit:

`44936a73897363cbf42936ce7805ec79c7301369`

Workflow run:

`33965788149`

Job:

`101305562737`

Result: **SUCCESS**

Execution command shape:

`wrangler@4.33.2 d1 execute trendos-main --remote --file cloudflare-d1/migrations/0003_cloud_write_lane.sql --config cloudflare-d1/wrangler.toml`

The run re-pinned the exact migration blob immediately before execution.

Cloudflare D1 reported:

- remote database: `trendos-main`
- database id: `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`
- queries processed: 7
- rows read: 10
- rows written: 9
- execution success: true
- database size after execution: 37.25 MB
- bookmark: `00000215-00000006-000050dd-fc6d41625a7dabd2e7a48601844f57e1`

The writes are schema-metadata/schema-object changes from the authorized migration; no Cloud Write business write route was enabled.

## Pre-execution proof

Immediately before exact-file execution:

- Cloud Write enabled=false
- writesAccepted=false
- schemaReady=false
- pendingOutbox=null
- cutover=false
- Sheets authoritative=true
- exact Cloud Write schema object count=0
- Production Shadow fingerprint remained:
  `66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`
- Shadow remained read-only/mutation-free.

## Post-execution schema proof

After the migration:

Cloud Write health:

- enabled=false
- writesAccepted=false
- schemaReady=true
- pendingOutbox=0
- cutover=false
- Sheets authoritative=true

Exact Production schema objects verified by SELECT-only `sqlite_master` query:

Tables:

- `cloud_write_events`
- `cloud_write_outbox`

Indexes:

- `idx_cloud_write_events_entity`
- `idx_cloud_write_events_sheets_status`
- `idx_cloud_write_outbox_event_unique`
- `idx_cloud_write_outbox_pending`

All six expected objects were present and no extra object was accepted by the verifier.

## Write lane remained fail-closed

Post-schema write checks:

- POST `/v1/cloud/orders` -> HTTP 423
- GET `/v1/cloud/write/outbox?status=pending&limit=1` -> HTTP 423

Therefore schema installation did not enable Cloud Write.

## Mirror parity after schema installation

Orders mirror:

- rowCount: 285
- sourceLastRow: 285
- note: `TrendOS orders live sync V2 quota-aware`
- parity: PASS

Lines mirror:

- rowCount: 327
- sourceLastRow: 327
- note: `TrendOS orders live sync V2 quota-aware`
- parity: PASS

## Production Shadow after schema installation

Fingerprint remained exactly:

`66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`

Read-only/no-mutation invariants remained PASS.

## Migration ledger state — intentionally unchanged

After exact-file execution Wrangler still reports:

- `0001_init.sql` pending
- `0002_full_sheet_mirror.sql` pending
- `0003_cloud_write_lane.sql` pending

This is expected because exact-file execution intentionally did not alter the historical migration ledger.

Important:

**Do not run `wrangler d1 migrations apply` on Production until this ledger drift is separately reconciled and qualified.**

Schema state and ledger state are therefore different facts:

- Cloud Write schema 0003 objects: INSTALLED / READY
- Wrangler migration ledger: HISTORICALLY DRIFTED / NOT RECONCILED

## One-shot authorization cleanup

Temporary one-shot workflow was removed immediately after the successful run.

Cleanup commit:

`fbe15a2a2b4a46f2ef836616e28526bf7ca57153`

The original controlled/manual workflow remains separate; the temporary push authorization is gone.

## Production mutation statement

This checkpoint performed exactly one authorized Production schema mutation: execution of pinned migration file `0003_cloud_write_lane.sql`.

It did NOT perform:

- Cloud Write enablement;
- business-order writes through Cloud Write;
- Worker deploy;
- Worker secret rotation;
- Apps Script write;
- Google Sheets write;
- frontend cutover;
- normalized-data cutover;
- migration-ledger reconciliation;
- execution of migration 0001 or 0002.

## Closed state

- Production Cloud Write schema: **READY**
- `schemaReady`: **true**
- Production Cloud Write: **OFF**
- writesAccepted: **false**
- pendingOutbox: **0**
- Sheets authoritative: **YES**
- Production Shadow: **ON, fixed-synthetic read-only**
- Production cutover: **NO**
- Frontend cutover: **NO**
- Orders mirror parity: **285/285 PASS**
- Lines mirror parity: **327/327 PASS**
- Migration ledger: **DRIFTED / NOT RECONCILED**

## Next safe boundary

Next safe work should remain read-only:

1. Production Cloud Write schema stability observation (`schemaReady=true`, pendingOutbox=0, writes still 423).
2. Read-only investigation and reconciliation design for the historical D1 migration-ledger drift.
3. Do not enable Cloud Write in the same checkpoint.
4. Any future Cloud Write enablement requires a separate explicit gate after stability and ledger-risk review.
