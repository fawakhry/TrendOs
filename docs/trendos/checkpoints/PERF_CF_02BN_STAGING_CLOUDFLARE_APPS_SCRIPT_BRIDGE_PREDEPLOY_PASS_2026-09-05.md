# PERF-CF-02BN — Staging Cloudflare → Apps Script Bridge Predeploy PASS

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED — CODE/CI ONLY, NOT REMOTELY DEPLOYED**

## Scope
Prepared and CI-qualified a Staging-only Cloudflare V2 → Staging Apps Script canonical bridge.

## Architecture
- Cloudflare Staging uses its existing `EDGE_SESSION_SECRET` to mint a 60-second signed bridge token with subject `cloud-write-v2-bridge`.
- Apps Script does not know or store the Edge secret.
- Apps Script validates the short-lived token by callback to the fixed Staging Worker validation endpoint.
- No bridge shared secret is copied into Apps Script, GitHub, or chat.
- The bridge qualification contract is fixed synthetic only.
- Business Order ID remains Apps Script-owned via `createManualOrder_`.

## Added sources
- `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs`
- `cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs`
- `tests/cloud_write_order_v2_staging_bridge.test.mjs`
- `tests/apps_script_cloud_write_order_v2_staging_bridge_v1.test.mjs`

## CI proof
Initial bridge contract gate:
- run `33924710459` — SUCCESS.

After wiring only into the Staging entrypoint:
- V2 gate run `33924781419` — SUCCESS.
- Integrity run `33924781438` — SUCCESS.
- head commit `50ba66e315e7914ca0f6488ca607765fbcf850ab`.

Production boundary assertions passed:
- Production `src/index_v2.js` does not import the staging bridge.
- Production Cloud Write V1 remains OFF.
- Production Apps Script `Code.gs` does not contain the V2 staging bridge marker.

## Staging entrypoint
`cloudflare-d1/staging/index.js` now routes the three Staging bridge paths ahead of the normal Staging routes, but the commit intentionally used `[no-staging-deploy]`.

Therefore **no remote Staging Worker deploy has occurred yet**.

## Required manual boundary
The dedicated Staging Apps Script project must now:
1. add `CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs`;
2. add the two-line `trendosV2StagingBridgeTryRoute_` hook to its `doPost` only;
3. create a new Staging Web App deployment and provide its `/exec` URL.

Only after the Staging Web App URL is known may `APPS_SCRIPT_API_URL` be set in the Staging Worker configuration and an isolated `[staging-d1]` deployment be triggered.

## Safety
- Production Cloud Write OFF.
- Production spreadsheet remains Orders=274 / Lines=315.
- Staging first canonical write remains verified at Orders=275 / Lines=316.
- No remote bridge route is active yet.