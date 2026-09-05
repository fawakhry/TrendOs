# PERF-CF-02CL — Isolated Worker Wrapper Default-OFF Wiring CI PASS

Date: 2026-09-05
Status: **CODE WIRED / DEFAULT-OFF / CI PASS / NOT DEPLOYED / NO PRODUCTION MUTATION**

## Starting point

02CL candidate CI and live read-only preflight were already PASS.

Live target remains:

`CW-PROD-QUAL-33975124471`

Current live state before this code-only step:

- authoritative Orders-sheet target rows: 0
- exact D1 outbox rows: 1
- target outbox status: pending
- attempts: 0
- Production pendingOutbox: 1
- cutover=false
- Sheets authoritative

## Code-only Worker wiring

The bounded 02CL module remains:

`cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs`

It was intentionally **not** added to generic `cloudflare-d1/src/index_v2.js`.

Instead, the actual Production wrapper:

`cloudflare-d1/production-shadow/index.js`

now recognizes only the isolated qualification prefix and delegates it to the bounded handler before falling through to Shadow/core routes.

Wiring commit:

`a12f5ad33d171be00c78456c6ddb795fb53f0635`

This keeps the temporary qualification lane isolated and removable without expanding the generic Cloud Write core.

## Tracked default-OFF flag

`cloudflare-d1/wrangler.toml` now explicitly contains:

`TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"`

Commit:

`ba3d71a68bf992a74c837dedb2ecd712972767d5`

No reconciliation secret is committed as a plain Wrangler variable.

## Wiring safety test

Added:

`tests/cloudflare_production_reconcile_qualification_wiring_default_off_v1.test.mjs`

Commit:

`4111c612715b6fadb0c634a62adb8abd79dff858`

The runtime test imports the actual Production wrapper and sends the exact qualification POST with:

- no DB binding
- no Edge secret
- no Apps Script config
- qualification flag false

Required result:

- HTTP 423
- `code=qualification-disabled`
- `qualificationOnly=true`
- `genericDrainEnabled=false`
- `productionCutover=false`
- `sheetsAuthoritative=true`

This proves the default-OFF gate rejects before DB/auth/Apps Script access.

## CI advancement

Updated candidate workflow:

`.github/workflows/trendos-production-outbox-sheets-reconcile-qualification-candidate.yml`

Workflow update commit:

`0c784aaaf90993f7d12d49e5087ef7da6a6337ee`

Candidate CI:

- Run ID: `33984943262`
- Job ID: `101356624792`
- conclusion: **SUCCESS**

All steps passed, including:

- existing reconciliation state-machine regression
- exact-target/decoy isolation
- bounded 02CL Worker + fake Apps Script ACK
- Apps Script one-record static safety
- actual Production wrapper default-OFF pre-DB/pre-auth rejection
- core-entrypoint isolation

Integrity CI on the same head:

- Run ID: `33984943269`
- Job ID: `101356624897`
- conclusion: **SUCCESS**

## Deployment state

This step changed repository code only.

It did **not** deploy the Production Worker.

It did **not** install the new Apps Script handler.

It did **not** enable the qualification gate.

It did **not** consume the target outbox.

## Safety result

- Production Worker deployment: **NONE**
- D1 mutation: **NONE**
- outbox mutation: **NONE**
- Sheet write: **NONE**
- Apps Script deployment: **NONE**
- Apps Script property mutation: **NONE**
- Worker secret mutation: **NONE**
- `EDGE_SESSION_SECRET` rotation: **NONE**
- cutover: **OFF / unchanged**
- Sheets authority: **UNCHANGED**

## Exact safe resume point

The remaining blocker before default-OFF live deployment validation is Apps Script source installation.

Use:

`docs/trendos/staging/APPS_SCRIPT_02CL_PRODUCTION_RECONCILE_DEPLOY_MANIFEST.md`

Install the exact handler as an additional Apps Script file plus the single router line, deploy a new version using the existing Web App deployment ID, and keep the qualification property OFF/absent.

After that manual deployment:

1. run a no-secret Apps Script probe and require `qualification-disabled` / zero mutation;
2. only then deploy the Worker code while its tracked flag remains false;
3. probe Worker `/health` and POST default-OFF behavior;
4. configure a dedicated 02CL secret on both sides without exposing it;
5. acquire a fresh temporary Edge session only immediately before the one-record execution;
6. execute target once + replay-noop proof;
7. verify no unrelated row changed and keep cutover=false / Sheets authoritative.
