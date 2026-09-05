# PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification

Date: 2026-09-05
Status: **CANDIDATE PREPARED — CI PASS — NOT DEPLOYED — NO PRODUCTION MUTATION**

## Why this checkpoint exists

`PERF-CF-02CK` closed PASS after creating exactly one bounded synthetic Production Cloud Write order:

`CW-PROD-QUAL-33975124471`

That order intentionally left exactly one `upsert_order_to_sheets` outbox item pending. Sheets / Apps Script remained authoritative and `cutover=false`.

02CL is the next bounded qualification needed before any generic outbox forwarding or authority transfer can be considered.

## Production safety boundary for 02CL

02CL is hard-bounded to the single 02CK synthetic order only:

- Order ID: `CW-PROD-QUAL-33975124471`
- operation: `upsert_order_to_sheets`
- confirmation literal: `QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471`
- no generic outbox drain
- no wildcard / prefix target
- no frontend cutover
- no normalized-data cutover
- no `EDGE_SESSION_SECRET` rotation
- Sheets / Apps Script remain authoritative

## Candidate implementation prepared

### Apps Script candidate

Created:

`apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs`

Creation commit:

`0708351b043f982a98a3ce05107faa7397bb0cba`

Contract:

- PREPARED / NOT ROUTED / DEFAULT-OFF
- requires `TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_ENABLED = 1`
- requires dedicated Script Property `TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET`
- exact target only
- exact 02CK synthetic payload identity only
- mandatory payload SHA-256 verification
- requires ScriptLock
- duplicate Order IDs fail closed
- one identical existing row is idempotent no-op success
- conflicting existing row fails closed
- zero matches permits one `appendRow` only
- post-write row is re-read and verified before success is returned
- no header creation
- no existing-row update
- no delete
- no Script Property mutation

The candidate depends on reconciliation mapping/hash helpers already defined by `CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs`; this dependency must be proven in the actual deployed Apps Script lineage before live routing.

### Worker candidate

Created:

`cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs`

Creation commit:

`ee2c999fd18ce6f0ea5b0cb1a2e4fbc90083eed6`

Contract:

- PREPARED / NOT WIRED INTO PRODUCTION ENTRYPOINT
- dedicated flag: `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED`
- dedicated secret: `TRENDOS_PROD_RECONCILE_QUALIFY_SECRET`
- Edge bearer session required for execution
- exact confirmation + exact Order ID required
- Apps Script transport accepts success only when:
  - `success === true`
  - qualification markers are true
  - persisted row proof is true
  - `existingMatchesAfter === 1`
  - exact entity identity matches
  - exact payload SHA-256 matches
  - `productionCutover === false`
  - `sheetsAuthoritative === true`
- replay-proof path is designed to require an already-synced exact target and an Apps Script idempotent zero-mutation ACK.

The candidate is intentionally not imported by Production `src/index_v2.js` yet.

## Reconciliation core hardening

Updated:

`cloudflare-d1/src/cloud-write-reconcile-core.mjs`

Commit:

`22fb13e085e6f1d9a6ff616d1aef18c2c5ab9c49`

Change:

- existing generic behavior remains unchanged when no target options are supplied;
- optional exact selectors were added:
  - `targetEntityType`
  - `targetEntityId`
  - `targetOperation`
- selection remains parameter-bound SQL;
- 02CL candidate supplies all three exact selectors.

This prevents the 02CL path from consuming an older unrelated due outbox row.

## Tests added

- `tests/cloudflare_cloud_write_reconcile_exact_target_v1.test.mjs`
  - commit `43b639e64dbaa26f99c7f3e3f5d9c5055540646a`
  - proves an older decoy pending row remains pending while the exact target is selected/claimed/synced.

- `tests/cloudflare_production_reconcile_qualification_v1.test.mjs`
  - commit `9140aec34e096073ac1023bd58b58a758c98aca8`
  - isolated SQLite + fake Apps Script ACK.
  - proves default-OFF behavior, explicit confirmation, exact target, strict ACK, synced D1 state, replay-noop proof, and decoy untouched.
  - also proves Production `index_v2.js` does not yet route the candidate.

- `tests/apps_script_cloud_write_production_reconcile_qualification_v1.test.mjs`
  - commit `2b4ae8ecf4c26f318769ae8298bb8308895791ec`
  - static safety checks for exact target, secret/flag, lock, single append mutation site, replay no-op, duplicate/conflict refusal, no update/delete/header/property mutations.

## CI gate

Created:

`.github/workflows/trendos-production-outbox-sheets-reconcile-qualification-candidate.yml`

Commit:

`9cb9b4f691d212ccd9a0b7688089f8c78ed60b1b`

Candidate CI:

- Run ID: `33983980229`
- Job ID: `101354064165`
- conclusion: **SUCCESS**

Passing steps included:

1. existing reconciliation regression test
2. exact-target selector / decoy untouched
3. isolated 02CL Worker candidate with fake Apps Script ACK
4. Apps Script one-record writer safety contract
5. explicit proof that candidate remains unwired from Production

Integrity CI on the same head:

- Workflow: `TrendOS Integrity V1`
- Run ID: `33983980205`
- Job ID: `101354064040`
- conclusion: **SUCCESS**

## Production mutations in this checkpoint

NONE.

Specifically:

- Production outbox item consumed: **NO**
- Production D1 business write: **NO**
- Production D1 outbox/event mutation: **NO**
- Google Sheets write: **NO**
- Apps Script deployment: **NO**
- Production Worker deployment: **NO**
- Worker route integration: **NO**
- Worker secret mutation: **NO**
- `EDGE_SESSION_SECRET` rotation: **NO**
- Production cutover: **NO**
- frontend authority transfer: **NO**

## Current exact state

`PERF-CF-02CK` remains the latest fully closed Production checkpoint.

`PERF-CF-02CL` is now **candidate-prepared / CI-pass**, but is NOT yet live-qualified and must not be marked closed.

The single 02CK synthetic outbox item is still expected to remain pending until a later explicitly authorized live 02CL execution.

## Required next safe step

Before any live 02CL mutation:

1. establish the actual deployed Apps Script lineage and safe route/deployment mechanism; do not overwrite Production with repository `Code.gs`;
2. prove the required reconciliation helper functions are present in that live lineage or include them safely in an append-only deployment package;
3. prepare a read-only live preflight for the exact target;
4. provision a dedicated reconciliation qualification secret on both sides without disclosing it and without reusing `EDGE_SESSION_SECRET`;
5. wire the Worker candidate default-OFF only after CI/deployment contract is explicit;
6. verify exact target outbox count/state and exact target absence/presence in Sheets before the write;
7. acquire a fresh authorized Edge session for the bounded execution; the temporary 02CK `wael` employee remains disabled and its old token is stale;
8. only then execute exactly one reconciliation call and one replay-noop proof;
9. verify no other outbox item changed, `cutover=false`, Production Shadow unchanged, and Sheets remain authoritative.

Do not enable a generic reconciler or authority transfer as part of 02CL.
