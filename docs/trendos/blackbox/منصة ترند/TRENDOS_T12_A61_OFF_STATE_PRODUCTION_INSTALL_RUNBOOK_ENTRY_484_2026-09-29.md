# TrendOS T12 — A61 OFF-State Production Installation Runbook — Entry 484

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Purpose
Install the already-qualified A61 employee-auth foundation into Production **without enabling native employee login**.

This runbook deliberately separates:
- source readiness;
- Production installation;
- runtime enablement.

The first Production installation must leave every A61 switch OFF.

## Current source checkpoints

### Current main
- Frontend dispatcher merged:
  `86bb83bb57d0d967c8c8c46b4703244d2e12c51a`
- Current-main Apps Script bridge merged:
  `12dd9d31bcd36db736f0c06191812bdcc5167bad`

### Cloud working branch
- Native employee auth foundation merged:
  `549809bd770c97d619c40f903accc369fd0166fc`
- Legacy auth compatibility bridge merged:
  `18ed4404a35a835f54912c819f4d0dcc83325b8e`
- Action+op policy hardening merged:
  `49c4ba4bfeb9741fff1989d2a4ab837beab4239e`

## Mandatory OFF-state
Before and after the installation:

```ini
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
```

Frontend `main/config.js` must also remain:

```js
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = [];
```

D1 control must remain:

```ini
marker=T12_EMPLOYEE_AUTH_V1
mode=OFF
```

## Phase A — Apps Script source installation

Use the current `main` source only.

The existing Production manifest remains authoritative:
`APPS_SCRIPT_DEPLOY_V1940.md`

Important:
do not use an old Apps Script sheet/export as the source.

### Single-file reconciliation — current main

The current `main/Code.gs` is a **single-file build**. It already embeds the runtime functions that older modular deployment documentation lists as separate `.gs` files.

Verified inside current `main/Code.gs`:
- `trendosV1932TryRoute_`
- `customerManagerV1_`
- `customerFeedbackV1_`
- `attendanceV1_`
- `attendanceClockinV1_`
- `hrV1_`
- `cleaningV1_`
- `pressControlV1_`
- `goLiveAutopilotV1_`

Therefore, **absence of separate files such as `v1932-router.gs`, `attendance-backend-v1.gs`, or `hr-backend-v1.gs` inside the live Apps Script project is not by itself a deployment blocker** when the current single-file `Code.gs` contains these functions.

Do not add duplicate modular files on top of the single-file build just to satisfy the older file-list wording.

Production project identity must instead be verified by both:
1. the deployed Web App `/exec` URL / Deployment ID matching current `main/config.js`; and
2. the currently opened project's code containing the expected production functions/routes.

Current expected Production Web App deployment from `main/config.js`:
`https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec`

If the opened Apps Script project's active deployment does not match that exact deployment, stop before editing or deploying.

### Required Apps Script files
Keep the complete current Production set, including:
- `Code.gs`
- `v1932-router.gs`
- `customer-manager-backend-v1932.gs`
- `customer-feedback-backend-v1.gs`
- `attendance-backend-v1.gs`
- `attendance-clockin-backend-v1.gs`
- `hr-backend-v1.gs`
- `cleaning-backend-v1.gs`
- `press-control-backend-v1.gs`
- `go-live-autopilot-backend-v1.gs`
- existing health/deployment modules already required by the current manifest.

The A61 bridge is now inside the current-main `Code.gs`.

### Add Script Properties
Create:

```text
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_SECRET_V1=<fresh secret generated outside GitHub>
```

Rules:
- use a new random secret with at least 32 characters/bytes of entropy;
- never paste the secret into GitHub, chat documentation, source code, screenshots, or commits;
- the same secret must later be stored as a Cloudflare Worker secret.

### Deploy Apps Script
Use the current process:

`Deploy → Manage deployments → Edit → New version → Deploy`

Keep the same Web App access model and confirm the deployed `/exec` URL remains the expected Production endpoint.

### Apps Script OFF-state validation
After deployment:
1. existing employee login still works through Apps Script;
2. current Orders/customer/accounting runtime still works;
3. no A61 frontend flag has been enabled;
4. the bridge property remains `false`.

Do **not** test the bridge by temporarily setting it true during this phase.

## Phase B — D1 additive migration

Use the Cloud working branch containing:
`cloudflare-d1/migrations/0009_employee_auth_native_v1.sql`

Owner-run command:

```bash
npx --yes wrangler@4 d1 migrations apply trendos-main --remote --config cloudflare-d1/wrangler.toml
```

Then verify only:

```bash
npx --yes wrangler@4 d1 execute trendos-main --remote --config cloudflare-d1/wrangler.toml --command "SELECT singleton,marker,mode,policy_epoch FROM employee_auth_control_v1 WHERE singleton=1;"
```

Required result:
- one control row;
- marker = `T12_EMPLOYEE_AUTH_V1`;
- mode = `OFF`.

Also inspect counts without changing data:

```bash
npx --yes wrangler@4 d1 execute trendos-main --remote --config cloudflare-d1/wrangler.toml --command "SELECT (SELECT COUNT(*) FROM employee_auth_users_v1) AS users,(SELECT COUNT(*) FROM employee_auth_sessions_v1) AS sessions;"
```

Initial counts may be zero. That is expected before employee bootstrap/migration.

## Phase C — Cloudflare secret

From the same qualified Cloud branch:

```bash
npx --yes wrangler@4 secret put EMPLOYEE_LEGACY_BRIDGE_SECRET_V1 --config cloudflare-d1/wrangler.toml
```

Enter the exact same fresh secret stored in Apps Script Script Properties.

Do not add the value to `wrangler.toml`.

## Phase D — Cloudflare Worker deployment with every A61 flag OFF

Before deploy, verify:

```bash
grep -Fx 'TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"' cloudflare-d1/wrangler.toml
grep -Fx 'TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED = "false"' cloudflare-d1/wrangler.toml
grep -Fx 'TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"' cloudflare-d1/wrangler.toml
grep -Fx 'TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"' cloudflare-d1/wrangler.toml
grep -Fx 'EMPLOYEE_LEGACY_BRIDGE_ACTIONS = ""' cloudflare-d1/wrangler.toml
```

Then owner-run:

```bash
npx --yes wrangler@4 deploy --config cloudflare-d1/wrangler.toml
```

## Phase E — OFF-state health verification

Production API base:
`https://trendos-d1-api.trendmall-contact.workers.dev`

Read-only GET checks:

```text
GET /v1/employee/auth/health
GET /v1/employee/legacy-action/health
```

Required native-auth health:
- `success=true`
- `schemaReady=true`
- `mode=OFF`
- `envEnabled=false`
- `legacyBootstrapEnabled=false`
- `nativeOnly=false`
- `plaintextStored=false`

Required bridge health:
- `success=true`
- `enabled=false`
- `upstreamConfigured=true`
- `secretConfigured=true`
- `allowedPolicyCount=0`
- `rawNativeTokenForwarded=false`
- `plaintextPasswordForwarded=false`
- `authAuthority=d1-native-employee-v1`

The health endpoints being present does **not** mean native login is enabled.

## Phase F — Frontend

The qualified dispatcher is merged into `main`, but the frontend must remain OFF:

```js
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = [];
```

A Cloudflare frontend redeploy may be performed only to publish this default-OFF foundation. It must not change those values.

After redeploy:
- ordinary Apps Script employee login must still work;
- Cloud customer/order authority must remain as before;
- no browser D1 employee token should exist because native login is still OFF.

## Stop conditions
Stop immediately and do not enable A61 if any of the following occurs:
- existing Apps Script login fails;
- native auth health shows mode other than OFF;
- any A61 Worker flag is true;
- bridge health shows enabled=true;
- bridge allowlist is non-empty unexpectedly;
- D1 migration changed unrelated business tables;
- frontend flags are not all false;
- existing Orders/customer/accounting behavior regresses.

## Rollback while still OFF
Because this phase installs additive/default-OFF foundations only:
- keep the frontend flags false;
- keep Worker A61 flags false;
- keep D1 control mode OFF;
- Apps Script bridge stays inert when its Script Property is false.

Do not delete the additive D1 tables as a rollback action unless a separate incident procedure explicitly requires it.

## What comes after OFF-state installation
Only after all OFF-state checks pass:
1. qualify employee bootstrap/migration;
2. choose one canary employee;
3. enable TRANSITIONAL mode under a narrow gate;
4. start with the read-only bridge policy set or a smaller canary subset;
5. validate login/session/business reads;
6. qualify writes separately;
7. remove Apps Script bridge actions as their business routes move to Cloudflare;
8. finally move control from TRANSITIONAL to NATIVE and remove Google auth fallback.

No step in this Entry authorizes the enablement phase.
