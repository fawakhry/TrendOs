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
   - this rules out the PRAGMA statement alone as sufficient to reproduce 7500.
8. Diagnostic A2 — Wrangler migration-apply path on isolated TEST D1:
   - diagnostic branch commit `5fa140f18fbc0f22788fc233e207e925c5a19c0a`
   - run `36335316076`, job `108664941237`
   - dedicated migration directory contained only `9001_diag_pragma_only.sql` with `PRAGMA foreign_keys = ON;`.
   - `wrangler d1 migrations apply trendos-t12-synthetic-test --remote` failed with the same Cloudflare code `7500` on the TEST DB query endpoint.
   - therefore the failure is not specific to migration 0005's business statements and is reproducible on a separate TEST D1 via Wrangler migration apply.
9. Diagnostic A3 — persistent direct DDL on isolated TEST D1:
   - diagnostic branch commit `3f36620507fbc3f89fd0d67ca01472a31c698551`
   - run `36335470930`, job `108665363223`
   - preflight confirmed the uniquely named diagnostic table absent (`n=0`).
   - direct `wrangler d1 execute` attempted a real `CREATE TABLE`; the command exited non-zero.
   - independent reconcile read confirmed the table still absent (`n=0`), so no residual schema change exists.
   - exact Cloudflare error code was not captured in this run because stderr/stdout were redirected to a temp file and the shell exited before `cat`; do not overclaim A3 as an independently observed 7500.
10. Diagnostic A4 — persistent direct DDL error captured on isolated TEST D1:
   - diagnostic branch commit `e184df1314bee2fd0481f51050da83aac8cccae4`
   - run `36335688279`, job `108665980369`
   - preflight table count `n=0`; direct persistent `CREATE TABLE` returned Wrangler RC=1.
   - exact Cloudflare response: `You do not have permission to perform this operation. [code: 7500]` on the TEST D1 `/query` endpoint.
   - independent post-attempt read returned `n=0`; no residual schema change.
   - therefore real persistent D1 writes are denied through the current GitHub Actions credential even outside migrations apply.
11. Diagnostic A5 — GitHub Cloudflare credential type/status read-only:
   - diagnostic branch commit `2536856335fdb093e28cf4bc13122b392b844e7e`
   - run `36335828533`, job `108666372827` = SUCCESS
   - `GET /user/tokens/verify` returned HTTP 200 / success=true / status=active / token ID `659ab8957571c4b35f019d6e8701af20`.
   - account-token verify returned HTTP 401, proving the repository credential is a User API Token rather than an Account API Token.
   - UI token ID equality and exact policy/permission set remain unproven.
12. Diagnostic A6 — token details self-inspection read-only:
   - diagnostic branch commit `516a76dbdeb70cb85dba8a565a94816c97e6f9a5`
   - run `36335918963`, job `108666619714`
   - `GET /user/tokens/659ab8957571c4b35f019d6e8701af20` returned HTTP 403 / Cloudflare code 9109.
   - current Cloudflare docs require API Tokens Read or Write for this endpoint, so the verified GitHub token cannot self-inspect its own policy set.
   - D1 Write presence on the actual GitHub token therefore still needs an independent authorized comparison; no token/secret change has been made.

## Current diagnosis
Do NOT continue with the old assumption “GitHub token has no D1 access.” Current evidence proves account discovery, D1 discovery/info, and reads work from the GitHub secret. It also proves no-op DML/DDL SQL shapes are accepted. Yet the migration apply path still reproducibly gets 7500. Therefore:
```
BLOCKER=WRANGLER_D1_MIGRATION_APPLY_SPECIFIC_7500
ROOT_CAUSE=UNKNOWN
TOKEN_ROTATION_REQUIRED=NOT_PROVEN
```

Direct `PRAGMA foreign_keys = ON` passes on the isolated TEST D1, while a PRAGMA-only `wrangler d1 migrations apply` fails with 7500. A4 now independently proves that a real persistent direct `CREATE TABLE` outside migrations apply also returns Cloudflare code 7500 and leaves no schema change. The blocker is therefore an actual persistent D1 write authorization/credential-context failure, not migration 0005 content or migration bookkeeping specifically. The exact identity/permission context of the GitHub-stored credential is still not proven.

## Next step for the new chat
Next single diagnostic step: use an independent authorized Cloudflare context, if available, to compare verified GitHub token ID `659ab8957571c4b35f019d6e8701af20` with the dashboard token and inspect that exact token's D1 permission/resource scope. Do not rotate/change the token or GitHub Secret before that comparison, and do not apply migration 0005 to production.

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
Canonical large journal remains at Entries 412–417 to avoid rereading/replacing the full 1MB+ file during this compact continuation. Diagnostic A1 is recorded as **Entry 418 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A1_PRAGMA_2026-09-27.md`, commit `ca6fd5b3fc4b20176f891d755ee7e8176730ad1c`. Diagnostic A2 is recorded as **Entry 419 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A2_MIGRATION_BOOKKEEPING_2026-09-27.md`, commit `61e3ba4d3104275e1870f2ed27abacfef355c546`. Diagnostic A3 is recorded as **Entry 420 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A3_PERSISTENT_DDL_2026-09-27.md`, commit `455bbb2bf4cb24d146a1183d28fe7b69b1b6fa33`. Diagnostic A4 is recorded as **Entry 421 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A4_PERSISTENT_DDL_7500_2026-09-27.md`, commit `e34e9f951963fcaa710b4c81a23b91e3f86010a8`. Diagnostic A5 is recorded as **Entry 422 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A5_TOKEN_TYPE_VERIFY_2026-09-27.md`, commit `fe1f893556576c2b4f6e2c2eb364bbbb2554c7e1`. Diagnostic A6 is recorded as **Entry 423 RESULT** in `TRENDOS_T12_D1_7500_DIAGNOSTIC_A6_TOKEN_DETAILS_READONLY_2026-09-27.md`, commit `33c06dbcdedf22312e310b9891d300e3fa2f7bd5`. Static review completion before these diagnostics is commit `c66f2b4ac1473436249451f56c0ecc75ac7fad61`. This handoff is the preferred compact entry point for the next chat.

## A7 latest authorization conclusion
- Cloudflare current D1 API docs show the D1 query endpoint accepts D1 Read or D1 Write credentials, while D1 Write is the mutation permission.
- Executed evidence now proves reads/no-op operations succeed but a real persistent `CREATE TABLE` returns Cloudflare code `7500` on isolated TEST D1.
- Latest blocker classification: `D1_EFFECTIVE_WRITE_AUTHORIZATION_MISSING_7500`.
- GitHub credential is active User API Token ID `659ab8957571c4b35f019d6e8701af20`.
- Exact policy set cannot be self-read: Token Details returned HTTP 403 / code 9109.
- Prior available dashboard context does not contain a token ID, so equality between the reviewed dashboard token and the GitHub token is not proven.
- No token, GitHub Secret, production schema, Worker, canary, order, trigger, or Apps Script property has been changed.
- Entry 424 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A7_EFFECTIVE_WRITE_AUTH_2026-09-27.md`, commit `c302948b283342db232c1d9f5868a8012ff63a56`.

Next required evidence before any production retry: independently compare the dashboard token identity/scope with verified GitHub token ID above. Production migration 0005 remains blocked.

## A8 dashboard token-list evidence
- Owner screenshot shows dashboard token `trendos-github-actions-cloudflare-preview` is Active.
- Visible permissions include `D1 Write` and `Workers Scripts Write` plus two additional hidden permissions.
- The screenshot does not show token ID or D1 resource/account scope, so equality with verified GitHub User API Token ID `659ab8957571c4b35f019d6e8701af20` remains unproven.
- Entry 425 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A8_DASHBOARD_TOKEN_LIST_2026-09-27.md`, commit `77599fff2f0e15653284564bbc8c89abf00ba1e9`.
- Next step: view token details only and capture Token ID + D1 resource/account scope; no Edit/Roll/Delete/Create/save.

## A9 dashboard token resource-scope evidence
- Owner screenshot of Token Summary confirms `trendos-github-actions-cloudflare-preview` has `D1 Write` and `Workers Scripts Write` on the **entire** account `aeadb43110dbb950f8b1ed7683ad9ce0`.
- The account ID exactly matches the account ID validated by GitHub diagnostics.
- IP filtering says `All IP addresses allowed`.
- Therefore account scope/IP filtering do not explain the 7500 for this dashboard token.
- Dashboard token ID is still not visible, while GitHub Secret credential ID is `659ab8957571c4b35f019d6e8701af20`.
- Credential identity mismatch is now strongly suspected but not yet proven.
- Entry 426 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A9_DASHBOARD_TOKEN_SCOPE_2026-09-27.md`, commit `284e59b46399e174c5582abf9536fde78beae4a2`.
- Next step: obtain the dashboard token ID read-only, preferably from the current page URL, and compare it to the GitHub token ID. No token/secret change yet.

## A10 token identity mismatch proven
- Owner-provided Cloudflare Token Summary route exposes dashboard token ID `46244467c1de37daa419a38f6fb39921`.
- GitHub Actions credential was independently verified as active User API Token ID `659ab8957571c4b35f019d6e8701af20`.
- The IDs differ. `TOKEN_IDENTITY_MATCH=NO` is now proven.
- The dashboard token is the one whose Token Summary shows D1 Write over the entire expected account; GitHub Actions is using a different token.
- Root cause classification: `GITHUB_SECRET_POINTS_TO_DIFFERENT_CLOUDFLARE_TOKEN`.
- No token, GitHub Secret, production D1 schema, Worker, canary, order, trigger, or Apps Script property was changed.
- Entry 427 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A10_TOKEN_ID_MISMATCH_PROVEN_2026-09-27.md`, commit `cf782757cfbd1e48a97f79f9b1761c6dea43939e`.
- Next: correct repository credential to an intended D1-Write credential, then qualify a real persistent write on `trendos-t12-synthetic-test` before any production `install-disabled` retry. `arm-one` remains forbidden.

## A11 GitHub-only workflow preparation — Entry 428
- Working branch matched documented HEAD `1f0c02c46855129c7d67ff84df874ab393780d35` before edits.
- Manual-only workflow added: `.github/workflows/trendos-t12-synthetic-d1-persistent-write-qualification.yml`, commit `b87aa14342e42cc05e3616e1bfe983d7ebe90aa9`. It gates all D1 queries on successful active User Token verification and exact ID `46244467c1de37daa419a38f6fb39921`; exact TEST name/UUID and account identity are checked; production name/UUID are excluded. It will CREATE, read sqlite_master, DROP, and read again for a unique diagnostic table on TEST only, without blind mutation retry.
- Existing A5 read-only verification rerun: run `36335828533`, job `108679776910`, success, 2026-09-27 18:25 UTC. Current GitHub Secret token remains active User Token ID `659ab8957571c4b35f019d6e8701af20`, so `TOKEN_ID_MATCH=NO`.
- The new workflow was **not run**; no D1 query/write, Secret change, Cloudflare dashboard action, production migration/deploy/arm/order action occurred. `WORKFLOW_SOURCE=READY_WAITING_FOR_SECRET_UPDATE`. Entry 428 RESULT is `TRENDOS_T12_D1_7500_DIAGNOSTIC_A11_SYNTHETIC_WRITE_WORKFLOW_READY_2026-09-27.md`, commit `71246858db0ec0c4f65f1489f6df10ed7911df98`.
- `MIGRATION_0005=NOT_APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO`, `CANARY_ARMED=NO`, `ORDER_4322_CREATED=NO`, `GENERAL_CREATE_CUTOVER=NO`. No merge to diagnostic branch or main. GitHub may require default-branch registration to expose a new branch-only workflow in Actions.
- Next: credential value must be updated manually by an authorized operator. Verify the ID first; only then run the TEST qualification workflow and confirm its cleanup. Production remains blocked.

## A12 token identity gate reread — Entry 429
- GitHub branch matched documented HEAD `5de45b606a71fae4aa442e75a5306900c5d6d336` before this step.
- Only the existing A5 read-only verification job was rerun: run `36335828533`, job `108682842677`, success. At 2026-09-27 18:43:02 UTC, `GET /user/tokens/verify` returned HTTP 200, success=true, status=active, token ID `659ab8957571c4b35f019d6e8701af20`.
- Required ID remains `46244467c1de37daa419a38f6fb39921`; `TOKEN_ID_MATCH=NO`. Synthetic qualification was not dispatched; `SYNTHETIC_PERSISTENT_D1_WRITE=NOT_RUN`, `SYNTHETIC_CLEANUP=NOT_RUN`, `PRODUCTION_TOUCHED=NO`.
- `READY_WAITING_FOR_SECRET_UPDATE`. Production baseline remains `MIGRATION_0005=NOT_APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO`, `CANARY_ARMED=NO`, `ORDER_4322_CREATED=NO`, `GENERAL_CREATE_CUTOVER=NO`.
- Entry 429 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A12_TOKEN_GATE_STILL_BLOCKED_2026-09-27.md`, commit `292d735bf1889d39f0700f3f0b9a03c8c172b890`.

## A13 Account Token gate correction — Entry 430 PREPARATION
- The intended token is a Cloudflare **Account API Token**, ID `46244467c1de37daa419a38f6fb39921`. Prior User Token diagnostics described the old GitHub Secret credential (`659ab8957571c4b35f019d6e8701af20`), not the intended token. `EXPECTED_CREDENTIAL_TYPE=ACCOUNT_API_TOKEN`.
- Synthetic TEST workflow now verifies `GET /accounts/aeadb43110dbb950f8b1ed7683ad9ce0/tokens/verify` with HTTP 200, success=true, active status and exact ID before any D1 query. Corrective commit `ce55089e7eef92fd9963ecf3baee7f23730060a0` on working branch only; TEST and production-exclusion guards unchanged.
- Entry 430 PREPARATION: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A13_ACCOUNT_TOKEN_GATE_CORRECTION_2026-09-27.md`, commit `6204001ed9396165fa992579b4772bcdc9511d51`.
- GitHub `CLOUDFLARE_API_TOKEN` update form is open for direct owner entry and submission. No Secret update or workflow dispatch was performed yet; `SYNTHETIC_PERSISTENT_D1_WRITE=NOT_RUN`, `PRODUCTION_TOUCHED=NO`. Production baseline remains unchanged. After owner submission, verify the Account Token ID read-only before TEST qualification; do not run production install-disabled in this task.

## A14 Account Token verified; synthetic dispatch blocked — Entry 431
- Owner manually updated GitHub `CLOUDFLARE_API_TOKEN`; its value was not read or retained. A5 read-only verification rerun `36335828533`, job `108686504906`, returned Account Token verify HTTP 200, success=true, status=active, ID `46244467c1de37daa419a38f6fb39921` at 2026-09-27 19:03:59 UTC. `TOKEN_ID_MATCH=YES`; `EXPECTED_CREDENTIAL_TYPE=ACCOUNT_API_TOKEN`.
- The branch-only synthetic qualification workflow's Actions page says “This workflow does not exist”; no Run workflow control or registered run exists. No synthetic TEST D1 query/write was dispatched. `TEST_DB_IDENTITY=NOT_RUN`, `SYNTHETIC_PERSISTENT_D1_WRITE=NOT_RUN`, `SYNTHETIC_CLEANUP=NOT_RUN`, `PRODUCTION_TOUCHED=NO`.
- `BLOCKER=BRANCH_ONLY_WORKFLOW_NOT_REGISTERED_IN_GITHUB_ACTIONS`; production retry remains blocked. No merge or `main` change. Production baseline unchanged: `MIGRATION_0005=NOT_APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO`, `CANARY_ARMED=NO`, `ORDER_4322_CREATED=NO`, `GENERAL_CREATE_CUTOVER=NO`.
- Entry 431 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A14_ACCOUNT_TOKEN_VERIFIED_WORKFLOW_UNREGISTERED_2026-09-27.md`, commit `e950164432500cfb8e740482ab97140f7fd673e0`. Next: establish an authorized Actions dispatch path for TEST qualification; no production install-disabled in this task.

## A15 synthetic persistent TEST D1 write qualified — Entry 432
- Diagnostic branch `diagnostic/t12-synthetic-d1-write-qualification-a15-20260927` started at `2ae40939150eb0372ee49808c3482760c702eb9d`. Its only new commit `da6fd1801bca9032cdbf636e8e11f966d51e6be8` added path-filtered push workflow `.github/workflows/trendos-t12-synthetic-d1-write-qualification-a15.yml`; no further diagnostic push or rerun.
- Run `36343574693`, job `108688230630` succeeded. Logs: `TOKEN_VERIFY=PASS`, `TOKEN_ID_MATCH=YES`, `EXPECTED_CREDENTIAL_TYPE=ACCOUNT_API_TOKEN`, `TEST_DB_IDENTITY=PASS`, `SYNTHETIC_PERSISTENT_D1_WRITE=PASS`, `SYNTHETIC_CLEANUP=PASS`, `PRODUCTION_TOUCHED=NO`. TEST D1 `trendos-t12-synthetic-test` / `54a3c05e-cde9-4979-814f-d40f941edcd5` only; preflight absent, CREATE present, DROP absent, no blind retry.
- `SYNTHETIC_D1_WRITE_QUALIFIED=YES`; `READY_FOR_PRODUCTION_INSTALL_DISABLED_RETRY=YES`. Production install-disabled was not run; separate authorization is required. Production baseline stays `MIGRATION_0005=NOT_APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO`, `CANARY_ARMED=NO`, `ORDER_4322_CREATED=NO`, `GENERAL_CREATE_CUTOVER=NO`.
- Entry 432 RESULT: `TRENDOS_T12_D1_7500_DIAGNOSTIC_A15_SYNTHETIC_WRITE_QUALIFIED_2026-09-27.md`, commit `9865f27032c15df15eaa5dd8ca9b8e4d61982e97`.

## A16 production install-disabled succeeded — Entry 433
- Owner explicitly authorized `install-disabled` after A15 TEST qualification.
- Reused controlled workflow run `36272464176`; attempt 3, job `108689776320`, same workflow source SHA `00abf19fb321e31a8246329369b32c688ce0406c` and exact inputs `action=install-disabled`, `confirmation=CONTROL_T12_PROD_CREATE_CANARY_4322`.
- Job conclusion: SUCCESS. Exact guards PASS; isolated qualification PASS; migration `0005_t12_production_create_canary.sql` applied successfully; Worker deploy succeeded.
- Post-install health: `schemaReady=true`, `enabled=false`, `nextOrderNumber=4322`, `canaryRemaining=0`, `generalCutover=false`, policy epoch `owner_fresh_start_20260926`.
- `arm-one` was skipped. No order create action was executed by this run. Production is installed but disabled.
- New state: `MIGRATION_0005=APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=YES`, `CANARY_ARMED=NO`, `ORDER_4322_CREATED_BY_THIS_RUN=NO`, `GENERAL_CREATE_CUTOVER=NO`, `INSTALL_DISABLED_QUALIFIED=YES`.
- Entry 433 RESULT: `TRENDOS_T12_PRODUCTION_INSTALL_DISABLED_SUCCESS_A16_2026-09-27.md`, commit `fa6a3ce7f9ad21e258064c1165939d94c0f6085a`.
- STOP. `arm-one` still requires separate explicit owner authorization.

## A17 production arm-one succeeded — Entry 434
- Owner explicitly authorized `arm-one`. Controlled workflow run `36344812039`, job `108691756394`, source `69e607cf730f678a6eefd0088adccb80a4833d18`, inputs `action=arm-one` and `confirmation=CONTROL_T12_PROD_CREATE_CANARY_4322`, conclusion success. Exact guards and isolated qualification succeeded; migration and disable skipped; Arm exactly one unique create, Deploy exact Worker state, and Verify health succeeded; Emergency disarm skipped.
- Arm reconciliation: `next_order_number=4322`, `canary_remaining=1`, `existing_4322=0`. Run health: `schemaReady=true`, `enabled=true`, `nextOrderNumber=4322`, `canaryRemaining=1`, `generalCutover=false`. No CREATE request was sent by this task.
- Snapshot state: `MIGRATION_0005=APPLIED`, `WORKER_DEPLOY_FROM_INSTALL_DISABLED=YES`, `INSTALL_DISABLED_QUALIFIED=YES`, `CANARY_ARMED=YES`, `CANARY_REMAINING=1`, `NEXT_ORDER_NUMBER=4322`, `ORDER_4322_CREATED_BY_THIS_RUN=NO`, `GENERAL_CREATE_CUTOVER=NO`. This is run evidence; live state may change afterward.
- Entry 434 RESULT: `TRENDOS_T12_PRODUCTION_ARM_ONE_SUCCESS_A17_2026-09-27.md`, commit `5a4bc3c3ec73b55649ea0cd42ea8bfdee220458e`. Stop; any single CREATE needs fresh owner authorization and state check.

## A18 authorized CREATE attempt blocked before request — Entry 435
- Owner explicitly authorized one production canary CREATE for Order 4322.
- Diagnostic branch `diagnostic/t12-production-create-4322-a18-20260927`, workflow commit `f9d58d22c412438284341e6e51de31449f0e99be`.
- Run `36345137476`, job `108692679804` failed closed immediately with `EDGE_SESSION_SECRET=UNAVAILABLE_NO_CREATE`.
- Because the required admin edge-signing secret is not available to GitHub Actions, the workflow stopped before token verification/live health/D1 preflight and before any CREATE POST.
- `CREATE_REQUEST_SENT_ONCE=NO`, `ORDER_4322_CREATED_BY_A18=NO`; no production mutation, Worker deploy, or canary budget change occurred from A18.
- Repository workflow search found only `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` references; no existing GitHub Actions path for `EDGE_SESSION_SECRET`.
- Do not rotate/add the production edge-session secret under the CREATE authorization. Safe next path: use an already-authenticated TrendOS admin browser session to exchange its employee session for an edge token and issue the single canary POST with live-state checks and no retry.
- Entry 435 RESULT: `TRENDOS_T12_PRODUCTION_CREATE_4322_A18_BLOCKED_NO_CREATE_2026-09-27.md`, commit `ec30fff31289d22ea146409dc3d367a0eba85cba`.

## A19 production canary CREATE 4322 succeeded — Entry 436
- Owner explicitly authorized one CREATE for Order `4322`.
- Execution was performed from the already-authenticated TrendOS Admin browser session; no password/session/Edge token was shared in chat.
- Live precheck before POST: `schemaReady=true`, `enabled=true`, `nextOrderNumber=4322`, `canaryRemaining=1`, `generalCutover=false`.
- Exactly one CREATE POST was sent. HTTP `201`.
- Readback returned HTTP `200` and `orderId=4322`.
- Final script success markers: `ORDER_4322_CREATED=YES`, `CANARY_BUDGET_CONSUMED=YES`, `NO_RETRY_PERFORMED=YES`.
- Those final markers were emitted only after verifying `nextOrderNumber=4323`, `canaryRemaining=0`, `schemaReady=true`, and `generalCutover=false`.
- Current snapshot: `MIGRATION_0005=APPLIED`, `INSTALL_DISABLED_QUALIFIED=YES`, `ORDER_4322_CREATED=YES`, `NEXT_ORDER_NUMBER=4323`, `CANARY_REMAINING=0`, `GENERAL_CREATE_CUTOVER=NO`.
- No general CREATE cutover, historical Orders/Order Lines backfill, or Apps Script authority change occurred.
- Entry 436 RESULT: `TRENDOS_T12_PRODUCTION_CREATE_4322_SUCCESS_A19_2026-09-27.md`, commit `948cade322af0a8b3625f23444c763760c5d3664`.
- STOP. Any further arm/canary/general cutover requires fresh explicit owner authorization.

## A20/A21 canary disabled; Order 4322 integrity verified — Entry 437
- Owner authorized `disable` plus read-only inspection of Order `4322`.
- A20 diagnostic branch `diagnostic/t12-order-4322-readonly-a20-20260927`, workflow commit `8c0c77d9e2a7f63d24b1b93755516f30026516e0`, run `36345780694`, job `108694511272`.
- A20 guards passed; pre-disable D1 state was `nextOrderNumber=4323`, `canaryRemaining=0`, Order `4322` count=1. D1 disable UPDATE succeeded and Worker deployed with `TRENDOS_T12_PROD_CREATE_CANARY_ENABLED="false"` (version `6c8b5e2b-b1be-47de-b49f-ceb701dad705`). Immediate Python health read failed to obtain a response; no mutation/deploy retry was performed.
- A21 independent read-only branch `diagnostic/t12-order-4322-post-disable-readonly-a21-20260927`, workflow commit `a479c0267c5460b5e58645526c647b198aa2cd19`, run `36345863553`, job `108694741595`, SUCCESS.
- A21 health HTTP 200: `schemaReady=true`, `enabled=false`, `nextOrderNumber=4323`, `canaryRemaining=0`, `generalCutover=false`; `DISABLE_HEALTH=PASS`.
- Order integrity: `ORDER_ROWS=1`, `LINE_ROWS=1`, `FIRST_LINE_ID=4322-01`, `LEDGER_ROWS=1`, `LEDGER_STATUS=COMMITTED`, `EVENT_ROWS=1`, `EVENT_TYPES=order-create-canary`, `ORDER_4322_INTEGRITY=PASS`.
- Downstream snapshot: `OUTBOX_ROWS=1`, `OUTBOX_PENDING=1`, `OUTBOX_DONE=0`, `OUTBOX_FAILED=0`, `MIRROR_4322_MATCH_COUNT=0`. Order `4322` is not in the current `sheet_rows` mirror.
- Current state: `ORDER_4322_CREATED=YES`, `ORDER_4322_INTEGRITY=PASS`, `NEXT_ORDER_NUMBER=4323`, `CANARY_REMAINING=0`, `CANARY_ENABLED=false`, `GENERAL_CREATE_CUTOVER=NO`.
- Entry 437 RESULT: `TRENDOS_T12_DISABLE_AND_4322_READONLY_VERIFIED_A20_A21_2026-09-27.md`, commit `ea479d8279715098dc2ea4c836337cb151b91149`.
- No new create, re-arm, general cutover, historical Orders/Order Lines backfill, or Apps Script change occurred.

## T12 Read Overlay deployed — Entry 438
- Owner approved a read overlay combining qualified Sheets-mirror rows with Cloud-native T12 rows.
- Working implementation adds `cloudflare-d1/src/t12-read-overlay.mjs`, integrates it into `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs`, and adds `tests/t12_read_overlay.test.mjs`.
- Cloud-native rows are mapped into the existing operational row shape, deduplicated by `lineId`, preferred over a future duplicate mirror copy, and marked `cloudNative=true`, `readOnly=true`, `writeAuthority=cloudflare-t12`.
- A23 qualification run `36354963557`, job `108720759812`: SUCCESS. `OVERLAY_UNIT_TEST=PASS`, `PROD_OVERLAY_SHAPE=PASS`, `ORDER_4322_READY_FOR_OVERLAY=YES`, `MIRROR_4322_MATCH_COUNT=0`, `PRODUCTION_MUTATION=NO`.
- A24 production deploy run `36355018666`, job `108720919540`: SUCCESS. Worker Version ID `cd283820-11e2-4eec-a6ca-2723a70df77a`.
- Post-deploy safety: `CANARY_ENABLED=false`, `NEXT_ORDER_NUMBER=4323`, `CANARY_REMAINING=0`, `GENERAL_CREATE_CUTOVER=NO`.
- State: `T12_READ_OVERLAY_IMPLEMENTED=YES`, `T12_READ_OVERLAY_DEPLOYED=YES`, `ORDER_4322_CREATED=YES`, `ORDER_4322_INTEGRITY=PASS`, no historical Orders/Order Lines backfill.
- Entry 438 RESULT: `TRENDOS_T12_READ_OVERLAY_ENTRY_438_2026-09-28.md`, commit `c754ea1b8f0436bc7cd07f3e371d697657149dd7`.
- Next: authenticated UI verification that Order `4322` appears on the print screen. No further mutation is authorized by this entry.

## UI fallback root cause after Read Overlay — Entry 439
- User reported Order 4322 still absent from print UI after Entry 438 Worker overlay deploy.
- A25 read-only diagnostic: run `36357416138`, job `108727789423`, branch `diagnostic/t12-overlay-fallback-cause-a25-20260928`, workflow commit `cc7f9592f214b0885732e0808b7381fd48fe0318`.
- Mirror ages: Orders + Order Lines ~102651s; Customers + debt restrictions ~714173s. All structurally ready/parity, but far beyond the 02CR freshness budget.
- Therefore 02CR fails closed and the frontend wrapper falls back to Apps Script only.
- Cloud-native state remained correct: `order4322=1`, `line4322=1`, `mirror4322=0`, `nextOrderNumber=4323`, `canaryRemaining=0`.
- Main frontend still uses `/v1/edge/orders/02cr/page` and explicitly falls back to the original Apps Script function. Main JS version `EDGE_ORDERS_READ_T11_SERVICE_20260914`.
- Root cause: stale-mirror safety bypasses the deployed Worker overlay at the live UI layer.
- Safe fix requires a frontend hybrid fallback on GitHub Pages: Apps Script legacy rows + independent T12 Cloud-native overlay rows. This requires explicit authorization to modify `main`.
- Entry 439 RESULT: `TRENDOS_T12_READ_OVERLAY_UI_FALLBACK_ENTRY_439_2026-09-28.md`, commit `0ad27b479dcb57ad9f515f8e63e8dbe1f40dddfa`.
- No main change was made.

## Hybrid Read Overlay live on main — Entry 440
- Owner explicitly authorized modifying `main` for the Hybrid Read Overlay.
- Worker prerequisite: A26 run `36400323114` SUCCESS; A27 run `36400429148` SUCCESS; authenticated SELECT-only endpoint `/v1/t12/orders/read-overlay` is live. Worker Version ID `f5416139-da80-4bd1-9042-e2482e7fd4ef`.
- Worker safety after deploy: unauthenticated overlay request HTTP 401; CREATE remains `enabled=false`, `nextOrderNumber=4323`, `canaryRemaining=0`, `generalCutover=false`.
- Main commit `cdf127629c8bdea1210d304bb8bc460487beca74` (`Merge T12 hybrid read overlay`) is live. Frontend version `EDGE_ORDERS_READ_T12_HYBRID_20260928`; cache-bust `trendos-edge-orders-read-v1.js?v=20260928-t12-hybrid-overlay1`.
- Behavior: fresh qualified Edge reads stay first choice. On stale-mirror fallback, Apps Script supplies legacy rows and the frontend independently fetches authenticated T12 Cloud-native rows and merges them. Cloud-native identities are read-only and `updateLine` is blocked with `T12_CLOUD_NATIVE_READ_ONLY` before Apps Script.
- A28 run `36400838856` did not test runtime because its shallow diff check had no merge base after main moved concurrently; this was a qualification harness failure, not a hybrid runtime failure.
- A29 post-merge qualification was based directly on exact main SHA `cdf127629c8bdea1210d304bb8bc460487beca74`: run `36407399736`, job `108879316894`, SUCCESS. `T12 hybrid frontend fallback isolated PASS`, `POST_MERGE_FRONTEND_QUALIFICATION=PASS`.
- GitHub Pages build/deployment run `36401207356` for exact main SHA `cdf127629c8bdea1210d304bb8bc460487beca74`: SUCCESS.
- Current state: `HYBRID_READ_OVERLAY_MAIN=LIVE`, `ORDER_4322_CREATED=YES`, `ORDER_4322_INTEGRITY=PASS`, `CANARY_ENABLED=false`, `CANARY_REMAINING=0`, `NEXT_ORDER_NUMBER=4323`, `GENERAL_CREATE_CUTOVER=NO`.
- Entry 440 RESULT: `TRENDOS_T12_HYBRID_READ_OVERLAY_MAIN_LIVE_ENTRY_440_2026-09-28.md`, commit `6f9df5b03100ff926bf48a3a87ac4e64df515f30`.
- Next: user-visible verification after hard refresh that Order `4322` appears in the print screen.
