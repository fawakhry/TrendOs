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

## Current gate

The next step is GET-only read-only qualification against production Web App Version 156.

Required probes:

1. `action=operatorTaskV2&op=status` with no username/token.
2. `action=operatorTaskEdgeProxyV2` using a deliberately invalid protocol/signature assertion.

Pass criteria:

- Neither route returns `Action غير معروف.`.
- Edge Proxy rejects fail-closed with a route-level code such as `EDGE_PROXY_PROTOCOL_INVALID`.
- No mutation operation is called.

Until this read-only gate passes:

- do not run `claimNext`;
- do not run `completeTask`;
- do not enable Operator Task backend/frontend flags;
- do not enable Gaber material-control;
- do not enable Cloudflare production Operator Task Edge authority;
- do not start employee rollout.

## Next owner decision boundary

If Version 156 read-only qualification passes, the inert publication stage is complete. Any actual Operator Task activation for Wael/Gaber remains a separate explicit owner decision.
