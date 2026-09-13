# Operator Task V2 — Cloudflare Preview

- Branch: `preview/operator-task-v2-20260913`
- Purpose: isolated Cloudflare preview qualification before production activation.
- Source checkpoint: `7e6e615fb844f60fb67c20f33b2fb08b6778171e`
- Operator Task production runtime remains OFF.
- No Apps Script production deploy, Script Property change, D1 write enablement, employee rollout, or PR merge has occurred.

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

## Apps Script publication preflight

Read-only probes against the current production Web App returned:

- `action=operatorTaskV2&op=status` => `{"success":false,"message":"Action غير معروف."}`
- `action=operatorTaskEdgeProxyV2` with a deliberately invalid assertion => `{"success":false,"message":"Action غير معروف."}`

Conclusion: the current production Apps Script Web App has not yet published the Operator Task V2 route or the Edge HMAC proxy route. No business mutation occurred during these probes.

## Current gate / owner decision required

The next step crosses the production Apps Script publication boundary:

1. install/publish `operator-task-workflow-v2.gs`;
2. install/publish `operator-task-edge-proxy-v2.gs`;
3. publish the corresponding `v1932-router.gs` route additions;
4. keep `TRENDOS_OPERATOR_TASK_V2_ENABLED` OFF;
5. keep Gaber material-control flag OFF unless separately approved;
6. do not enable frontend rollout yet;
7. after deployment, rerun read-only publication qualification before any Task mutation or employee rollout.

This publication step requires explicit owner approval because it changes the production Apps Script deployment, even though the Operator Task runtime remains OFF.
