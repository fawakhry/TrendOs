# Operator Task V2 — Cloudflare Preview / Apps Script Publication Checkpoint

- Branch: `preview/operator-task-v2-20260913`
- Purpose: qualify Operator Task V2 safely before production activation.
- Source checkpoint: `7e6e615fb844f60fb67c20f33b2fb08b6778171e`
- Operator Task production runtime remains OFF.
- Employee rollout remains OFF.
- No D1 Task write authority or Cloudflare production Operator Task cutover has been enabled.

## Cloudflare isolated preview result

- Dedicated Worker: `trendos-operator-task-v2-preview`
- Dedicated preview config: `cloudflare-d1/preview/wrangler.operator-task-v2.toml`
- `TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED = false`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = false`
- No `migrations_dir` is declared in the Operator Task preview config.
- Operator Task contract/Edge/Gaber integration tests: PASS.
- Cloudflare deploy credentials: PASS.
- Dedicated Worker deployment: PASS.
- Preview `EDGE_SESSION_SECRET` binding: PASS.
- `/v1/edge/health`: PASS with database/auth configured and `cutover=false`.
- `/v1/operator/tasks/status`: PASS fail-closed with `OPERATOR_TASK_EDGE_DISABLED` while preview Edge flag is OFF.
- Cloud Write health: PASS and writes remain disabled.
- Qualification workflow run: `34732407997` => SUCCESS.

The separate Cloudflare GitHub App check named `Workers Builds: trendos` is not the qualification lane for this isolated preview and has a pre-existing failure history. The dedicated GitHub Actions/Wrangler preview lane above is the accepted evidence for this stage.

## Apps Script publication history

### Pre-publication read-only probe

Before publication, GET-only probes against the production Web App returned:

- `action=operatorTaskV2&op=status` => `{"success":false,"message":"Action غير معروف."}`
- `action=operatorTaskEdgeProxyV2` with a deliberately invalid assertion => `{"success":false,"message":"Action غير معروف."}`

This established that the routes were not yet published at that point. No business mutation occurred during those probes.

### Owner-approved inert publication — completed

The owner explicitly approved inert Apps Script publication with runtime activation still OFF. The following manual steps were completed in the production Apps Script project `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`:

1. Created and saved `operator-task-workflow-v2` from the approved GitHub candidate.
2. Created and saved `operator-task-edge-proxy-v2` from the approved GitHub candidate.
3. Patched the live `trendosV1932TryRoute_` owner in `Code.gs` with the two Operator Task route blocks.
4. Confirmed `ROUTER_OWNER = Code.gs` and `DUPLICATE_ROUTER = NO`.
5. Updated the existing production Web App deployment to a new version.

Publication result:

- `DEPLOYED = YES`
- `VERSION = 156`
- `DEPLOYMENT_UPDATED_EXISTING = YES`
- `WEB_APP_URL_CHANGED = NO`

Safety boundary retained during publication:

- `TRENDOS_OPERATOR_TASK_V2_ENABLED` was not changed.
- `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` was not changed.
- No Script Properties were changed.
- No Triggers were changed.
- No Business Data was changed.
- No `claimNext` or `completeTask` operation was executed.
- No employee rollout was enabled.

## Version 156 production route qualification — PASS

GET-only read-only qualification was completed against the existing production Web App after Version 156 publication.

Observed results:

- `OPERATOR_TASK_ROUTE = REACHABLE`
- `OPERATOR_TASK_RESPONSE = {"success":false,"message":"انتهت الجلسة. سجل الدخول مرة أخرى."}`
- `EDGE_PROXY_ROUTE = REACHABLE`
- `EDGE_PROXY_RESPONSE = {"success":false,"code":"EDGE_PROXY_PROTOCOL_INVALID","message":"تم رفض Edge assertion."}`
- `ACTION_UNKNOWN_PRESENT = NO`
- `READY_FOR_NEXT_GATE = YES`

Qualification conclusion:

- `operatorTaskV2` is now published and reachable through the production Web App router.
- The unauthenticated status probe is rejected by the existing session/auth layer rather than falling through to `Action غير معروف.`.
- `operatorTaskEdgeProxyV2` is now published and reachable.
- Edge proxy rejects the deliberately invalid assertion fail-closed with `EDGE_PROXY_PROTOCOL_INVALID`.
- No mutation operation was used during qualification.

## Production activation approval and pre-activation diagnostics

The owner explicitly approved proceeding with actual Operator Task activation/integration for Wael and Gaber and linking the Production Cloudflare Edge path.

A dedicated activation branch was created:

- `operator-task-v2-production-activation-20260913`

Pre-activation diagnostic workflow:

- Run: `34734702528` => SUCCESS
- Production Apps Script proxy route is reachable anonymously from the Worker/GitHub runner.
- Exact proxy diagnostic response with the correct protocol was `{"success":false,"code":"EDGE_PROXY_SECRET_NOT_CONFIGURED","message":"تم رفض Edge assertion."}`.
- At that checkpoint `TRENDOS_OPERATOR_TASK_PROXY_SECRET` was missing in production Apps Script.
- Existing `/v1/edge/session` bridge reached Apps Script and correctly rejected deliberately invalid employee credentials with HTTP 401 / `{"success":false,"message":"المستخدم غير موجود."}`.
- No Business Data, Script Properties, triggers, claim or completion mutation occurred during diagnostics.

## Production Worker Operator Task route — code deployed, gate still OFF — PASS

The approved Operator Task route code was deployed to the existing Production Worker while retaining the dedicated Operator Task Edge gate as explicit OFF.

Controlled deployment workflow:

- Run: `34734759490` => SUCCESS
- Production Worker URL unchanged: `https://trendos-d1-api.trendmall-contact.workers.dev`
- Cloudflare Worker Version ID: `bd869238-1743-4389-90c3-8e544fa3766f`
- `TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED = false`
- Operator Task contract/Edge/Gaber integration tests: PASS.
- Wrangler dry-run: PASS.
- Pre- and post-deploy Production core health: PASS.
- Existing Cloud Write state was preserved (`enabled=true`, `writesAccepted=true`, `cutover=false`, `sheetsAuthoritative=true`).
- No D1 migration was applied.
- No Worker secret was changed in this deployment.
- Production `EDGE_SESSION_SECRET` was not changed or rotated.
- No Task mutation was executed.

Post-deploy production route result:

- `GET /v1/operator/tasks/status` => HTTP 503
- Body: `{"success":false,"code":"OPERATOR_TASK_EDGE_DISABLED"}`

This proves the Production Worker now contains the Operator Task Edge route code and remains fail-closed until the explicit Operator Task Edge enable gate is changed.

## Shared Operator Task proxy secret — bound and independently verified

Owner/Work reported:

- `APPS_SCRIPT_PROXY_SECRET_SET = YES`
- `CLOUDFLARE_PROXY_SECRET_SET = YES`
- `SAME_VALUE_CONFIRMED = YES`
- `OTHER_SETTINGS_CHANGED = NO`
- `TEMP_SETTER_REMOVED = YES`

Independent verification workflow:

- Run: `34737008317` => SUCCESS
- Apps Script proxy no longer reports `EDGE_PROXY_SECRET_NOT_CONFIGURED` when challenged with the correct protocol and an intentionally invalid assertion.
- Cloudflare Worker secret inventory contains the name `TRENDOS_OPERATOR_TASK_PROXY_SECRET`; the value is not readable or printed.
- Production Operator Task Edge gate remained OFF during verification and still returned `OPERATOR_TASK_EDGE_DISABLED`.
- No secret value was logged.
- No Operator Task flag was changed.
- No Task mutation occurred.

The user-confirmed same-value binding plus the two independent presence checks establish the shared HMAC secret prerequisite for the next gate without exposing the secret value.

## Current activation state

Completed:

- Apps Script Operator Task backend published on Web App Version 156.
- Apps Script route qualification PASS.
- Production Worker Operator Task route code deployed.
- Production Worker route qualification PASS while gate OFF.
- Shared `TRENDOS_OPERATOR_TASK_PROXY_SECRET` is bound on Apps Script and Cloudflare and verified present.
- Owner approval for Wael/Gaber Operator Task activation is recorded.

Still OFF / pending execution:

- Apps Script `TRENDOS_OPERATOR_TASK_V2_ENABLED` remains OFF.
- Production Worker `TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED` remains OFF.
- Frontend rollout remains OFF/not loaded in Production main.
- `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` remains OFF and is outside this activation approval.
- D1 Task write authority remains OFF/not authorized.
- No `claimNext` or `completeTask` production canary has been executed.

## Next execution gate

Enable Apps Script `TRENDOS_OPERATOR_TASK_V2_ENABLED=true` only, while leaving Production Edge and frontend rollout OFF. Then verify authenticated backend status through the Edge/HMAC path before enabling the Production Edge gate.

Do not change `EDGE_SESSION_SECRET`. Do not enable Gaber material-control. Do not grant D1 Task write authority.