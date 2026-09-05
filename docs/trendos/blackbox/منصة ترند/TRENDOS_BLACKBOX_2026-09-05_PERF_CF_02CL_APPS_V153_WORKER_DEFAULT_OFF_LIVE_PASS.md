# PERF-CF-02CL — Apps Script V153 + Worker Default-OFF Live PASS

Date: 2026-09-05
Status: **APPS SCRIPT V153 LIVE PASS + WORKER DEFAULT-OFF LIVE PASS — NO RECONCILIATION EXECUTED**

## Scope

Advance the bounded `PERF-CF-02CL` Production outbox → Sheets reconciliation qualification only far enough to install both live route halves in a fail-closed/default-OFF state.

Exact qualification target remains:

- Order ID: `CW-PROD-QUAL-33975124471`
- operation: `upsert_order_to_sheets`
- confirmation: `QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471`
- generic outbox drain: forbidden

Sheets / Apps Script remain authoritative and `cutover=false`.

## Apps Script live deployment

The user updated the existing TrendOS Apps Script Web App deployment using the same deployment ID and a new version.

Observed deployment:

- Web App Version: **153**
- deployment date shown by Apps Script UI: 2026-09-05
- existing deployment ID preserved
- no replacement Web App URL was created

The live installation contained:

- new source file from `apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs`
- one `doGet` router line for `cloudWriteReconcileProductionQualificationV1`
- qualification enable property kept OFF/absent during deployment

## Apps Script V153 default-OFF live probe

Temporary workflow:

`.github/workflows/trendos-02cl-apps-script-v153-default-off-probe-temp.yml`

- trigger commit: `9eeb32689ade24682fe94a5e7c1bb8bb0d496a6e`
- Run ID: `33986293821`
- Job ID: `101360293029`
- conclusion: **SUCCESS**

Exact live response contract:

- HTTP `200`
- `success=false`
- `code=qualification-disabled`
- `persisted=false`
- `sheetsWritten=false`
- `mutationCount=0`
- `productionCutover=false`
- `sheetsAuthoritative=true`

No secret was sent.

Probe cleanup commit:

`640f10a10c21aa6465a7fd50d9f4bce44b1db4c3`

## Worker controlled default-OFF deployment

The bounded 02CL Worker route was deployed through a temporary controlled workflow with hard gates requiring:

- Production Worker identity `trendos-d1-api`
- Production wrapper `production-shadow/index.js`
- existing Production Cloud Write remains ON
- existing Production Shadow remains ON
- `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"`
- 02CL module remains outside generic `src/index_v2.js`
- no D1 migration command
- no Worker secret mutation command

Temporary deployment workflow:

`.github/workflows/trendos-02cl-worker-default-off-controlled-deploy-temp.yml`

- trigger commit: `caccf329e0caadb271403aa851b6c8dace69185a`
- Run ID: `33986406106`
- Job ID: `101360642665`
- conclusion: **SUCCESS**
- deployed Worker Version ID: `434247f4-b899-4241-822b-022834983112`

Pre-deploy live boundary:

- `pendingOutbox=1`
- Cloud Write ON / writes accepted
- Production Shadow mutation-free
- `cutover=false`
- Sheets authoritative
- 02CL Worker route before deploy: HTTP `404`

Post-deploy core boundary:

- Edge health PASS
- Cloud Write health PASS
- `pendingOutbox=1`
- Production Shadow PASS / mutation-free
- `cutover=false`
- Sheets authoritative

Post-deploy 02CL Worker health:

- route live: HTTP `200`
- `enabled=false`
- exact target rows: `1`
- exact target outbox status: `pending`
- attempts: `0`
- `reconcileSecretConfigured=false`
- `productionCutover=false`
- `sheetsAuthoritative=true`
- `genericDrainEnabled=false`

Fail-closed POST proof:

- exact qualification POST while OFF: HTTP `423`
- code: `qualification-disabled`
- no auth/DB mutation/reconciliation execution occurred

Apps Script V153 was re-probed after Worker deployment and still returned the default-OFF zero-mutation contract.

Deployment workflow cleanup commit:

`47706bb1a3b6fec12a9aa404fb801ae1b09f07d3`

## Production mutations performed in this checkpoint

Worker code deployment: **YES — default-OFF qualification route only**.

Business/reconciliation mutations: **NONE**.

Specifically:

- target outbox consumed/claimed: **NO**
- target outbox attempts incremented: **NO** (`attempts=0`)
- target outbox status changed: **NO** (`pending`)
- Google Sheets target row appended: **NO**
- Google Sheets existing row updated/deleted: **NO**
- D1 business order mutation: **NO**
- D1 reconciliation status mutation: **NO**
- Worker reconciliation secret configured: **NO**
- Apps Script reconciliation secret disclosed to chat/repo: **NO**
- `EDGE_SESSION_SECRET` rotation/replacement: **NO**
- Production cutover: **NO**
- frontend authority transfer: **NO**

## Current exact state

Both 02CL live route halves are now installed but fail closed:

- Apps Script V153 route: live, qualification disabled
- Worker 02CL route: live, qualification disabled
- Worker dedicated reconciliation secret: not yet configured
- exact target outbox: one row, pending, attempts=0
- target Orders-sheet row: expected absent from prior preflight; no write occurred in this checkpoint
- Production Cloud Write: ON
- Production Shadow: ON / mutation-free
- Production cutover: OFF
- Sheets / Apps Script: authoritative

02CL is **NOT closed**.

## Required next safe step

Provision one dedicated 02CL reconciliation secret on both sides without disclosing the value:

1. Apps Script Script Property:
   `TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET`
2. GitHub Actions repository secret using the same value:
   `TRENDOS_PROD_RECONCILE_QUALIFY_SECRET`
3. Keep Apps Script enable property absent/empty/`0` during secret provisioning.
4. Keep Worker tracked flag `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"`.
5. Do not paste the secret in chat or commit it to the repository.
6. After user confirms both secret stores are provisioned, configure the Worker secret through a controlled workflow while keeping the Worker flag OFF.
7. Verify Worker health reports `reconcileSecretConfigured=true`, target still pending/attempts=0, and core Production boundaries unchanged.
8. Only after secret readiness should a fresh authorized employee/Edge session be prepared for the bounded execution.
9. Do not enable either execution gate or consume the outbox before the pre-execution authorization checkpoint.
