# TrendOS T12 — New Chat Handoff after Cloudflare D1 7500 diagnostics
Date: 2026-09-27 Cairo
Repository: `fawakhry/TrendOs`
Active working branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Pre-handoff working HEAD: `c66f2b4ac1473436249451f56c0ecc75ac7fad61`

## Read this first
This is the compact continuation point. Do not read the entire Master Book or the full 1MB+ journal at chat start. Read this file, then the first page / active-state section of `TrendOS_MASTER_BOOK.md`, and only fetch the exact referenced code/workflow/log when needed.

## Owner decisions that control the migration
- Functional target: migrate ALL TrendOS functionality to Cloudflare eventually.
- Historical data backfill: CUSTOMERS ONLY.
- Historical Orders backfill: NO.
- Historical Order Lines backfill: NO.
- New Cloud order numbering must continue from `4322`.
- Historical one-shot full rebase is CLOSED / DO NOT RETRY.
- Current authorization: `install-disabled` was authorized; `arm-one` is NOT authorized and requires a separate explicit owner approval after a clean install-disabled success.

## Production CREATE canary baseline
Controlled workflow:
`.github/workflows/trendos-t12-production-create-canary-controlled.yml`

Exact approved inputs used:
```
branch=cloud-migration-v3-t12-order-create-ci-20260919
action=install-disabled
confirmation=CONTROL_T12_PROD_CREATE_CANARY_4322
```

Migration:
`cloudflare-d1/migrations/0005_t12_production_create_canary.sql`

Target:
- Worker: `trendos-d1-api`
- D1: `trendos-main`
- D1 ID: `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`
- canary flag in repo remains default OFF.
- expected post-install health, if/when install-disabled succeeds:
  `schemaReady=true`
  `nextOrderNumber=4322`
  `canaryRemaining=0`
  `enabled=false`

## Current real production state
```
MIGRATION_0005=NOT_APPLIED
WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO
CANARY_ARMED=NO
ORDER_4322_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
GOOGLE_APPS_SCRIPT_CREATE_AUTHORITY=YES
```

Department order screens currently read through mirror `sheet_catalog/sheet_rows`; successful CREATE tables alone will not automatically make new cloud-native orders visible in all operational screens. A later read integration/overlay is still required. Historical order/line parity is no longer a cutover goal.

## Exact run evidence
1. Original controlled install-disabled run: `36272464176` attempt 1 = FAIL at migration apply with Cloudflare code 7500; no deploy/arm/create.
2. Token UI review: existing token shown as `trendos-github-actions-cloudflare-preview`, Entire Account, with visible `D1 Write` and `Workers Scripts Write`. Owner cancelled the edit/create flow; no Cloudflare token change and no GitHub secret change were saved.
3. Isolated read-only probe:
   - diagnostic branch: `diagnostic/cloudflare-token-readonly-20260927`
   - commit `342ae33efbb26ec238d73c94361d7f9512b22150`
   - run `36330387663` SUCCESS
   - account ID matched; D1 GET 200; `trendos-main` identified; direct SELECT 200.
   - token verify endpoint returned 401, so exact token-ID equality with the UI token remains unproven.
4. Controlled install-disabled rerun:
   - run `36272464176` attempt 2, job `108654668249`
   - same original inputs and source SHA `00abf19fb321e31a8246329369b32c688ce0406c`
   - FAIL again at `wrangler d1 migrations apply` with code 7500.
   - no migration/deploy/arm/create.
5. No-op SQL diagnostic:
   - first run `36332593854` failed because diagnostic precheck SQL itself was invalid (HTTP 400); do not treat that as a permission result.
   - corrected commit `b6aaac4883e9c5738cc5590ff6dfb735fbe75b65`
   - run `36332643459` SUCCESS
   - `UPDATE ... WHERE 0` -> 200/success/changes=0
   - `CREATE INDEX IF NOT EXISTS` on an already existing index -> 200/success
   - persisted data changes: NONE; persisted schema changes: NONE.
   - because both were no-op, this is not conclusive proof that a real persistent D1 mutation is authorized.
6. Wrangler read-only diagnostic:
   - commit `58e4ced6ec7cb06c684fd7530ee37ce9f0ec346d`
   - run `36332810401` SUCCESS
   - Wrangler 4.142.0 whoami/list/info all succeeded.
   - remote `SELECT 1` succeeded with `changed_db=false`.
   - `wrangler d1 migrations list` succeeded and shows only `0005_t12_production_create_canary.sql` pending.
   - no mutations.
7. Diagnostic A1 — direct `PRAGMA foreign_keys = ON` on isolated TEST D1 only:
   - diagnostic branch commit `c139880bb935812d3515e92bcc4714e3f71b8ded`
   - run `36335043750`, job `108664175135` = SUCCESS
   - target identity guard confirmed `trendos-t12-synthetic-test` / `54a3c05e-cde9-4979-814f-d40f941edcd5`, explicitly excluding production DB name/UUID.
   - Wrangler 4.142.0 direct remote execute of `PRAGMA foreign_keys = ON;` succeeded with `changes=0`, `changed_db=false`, `rows_written=0`.
   - schema object count stayed `24 -> 24`.
   - this rules out the PRAGMA statement alone as sufficient to reproduce 7500; migration bookkeeping/transaction behavior is still untested.

## Current diagnosis
Do NOT continue with the old assumption “GitHub token has no D1 access.” Current evidence proves account discovery, D1 discovery/info, and reads work from the GitHub secret. It also proves no-op DML/DDL SQL shapes are accepted. Yet the migration apply path still reproducibly gets 7500. Therefore:
```
BLOCKER=WRANGLER_D1_MIGRATION_APPLY_SPECIFIC_7500
ROOT_CAUSE=UNKNOWN
TOKEN_ROTATION_REQUIRED=NOT_PROVEN
```

Direct `PRAGMA foreign_keys = ON` has now passed on the isolated TEST D1 and is no longer a leading standalone cause. Remaining hypotheses include Wrangler migration bookkeeping/transaction behavior, another statement or statement combination in migration 0005, a persistent-write permission distinction, or a migration API/path-specific restriction.

## Next step for the new chat
Next single diagnostic step: isolate Wrangler migration bookkeeping / migration-apply behavior on `trendos-t12-synthetic-test` using a dedicated TEST-only migration directory with a harmless PRAGMA-only migration. Any persistent migration ledger metadata must stay in TEST only. Do not apply migration 0005 to production again until the exact failure is understood or a safe corrected migration/workflow is qualified.

If a corrected production path is later ready, rerun `install-disabled` only with the exact approved inputs above. Success must independently verify:
```
schemaReady=true
nextOrderNumber=4322
canaryRemaining=0
enabled=false
```
Then STOP. Do not run `arm-one` without a new explicit owner approval.

## Safety boundaries
- No `arm-one`.
- No order 4322 creation.
- No general CREATE cutover.
- No historical order/line rebase/backfill.
- No Apps Script trigger/property/write changes unless separately authorized.
- Do not merge diagnostic branch automatically.
- Do not expose or request secret token values in chat.
- On any ambiguous remote write outcome: no blind retry; reconcile by read first.

## Documentation trail
Canonical large journal remains at Entries 412–417 to avoid rereading/replacing the full 1MB+ file during this compact continuation. Diagnostic A1 is recorded immediately as **Entry 418 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A1_PRAGMA_2026-09-27.md`, evidence commit `ca6fd5b3fc4b20176f891d755ee7e8176730ad1c`. Static review completion before these diagnostics is commit `c66f2b4ac1473436249451f56c0ecc75ac7fad61`. This handoff is the preferred compact entry point for the next chat.
