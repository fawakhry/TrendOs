# TrendOS T12 — Entry502 — Entry499 no-Wrangler direct-upload tool ready — 2026-09-30

## Scope
Repo-only tooling and packaging. No Cloudflare mutation by assistant. No Wrangler. No D1 migration/mutation. No Secrets/Variables/Bindings change. No Order/Customer mutation.

## Production observation before Entry502
Entry498 API version was manually promoted by the owner. The browser then still showed the frontend-side stale D1 rejection and Press/session-ended behavior, matching the exact Entry499 scope.

## Tool added
Files:
- `tools/trendos-entry499-direct-upload.mjs`
- `tools/trendos-entry499-direct-upload.ps1`
- `tools/trendos-entry499-direct-upload.cmd`
- `tools/TRENDOS_ENTRY499_DIRECT_UPLOAD_README.txt`

Behavior:
- validates Entry499 markers locally first;
- targets Worker `trendos-ui` only;
- uses Cloudflare Workers Static Assets direct-upload APIs;
- uses no Wrangler;
- uploads qualified frontend assets;
- creates a new Worker VERSION only;
- keeps ASSETS binding in the new version metadata;
- does not create a deployment;
- does not promote traffic;
- does not change `trendos-d1-api`;
- token is provided locally by the owner and is not written to repo/files/log output by the launcher.

## Qualification artifact
Workflow:
`.github/workflows/trendos-t12-entry500-manual-deploy-artifacts.yml`

Run:
`36756070409` = SUCCESS

Artifact:
`trendos-entry499-frontend-direct-upload-entry502`

Artifact ID:
`11116687510`

Artifact digest:
`sha256:a81b6c8feed168b0508acfbef90b5ba36fc7c30f7652b1ba2b4b25942b531987`

Expires:
`2026-12-29T18:05:25Z`

Dry-run inside CI:
`PASS`

## Owner manual step
1. Download the Entry502 artifact from GitHub Actions run `36756070409`.
2. Extract it.
3. Double-click `RUN_ENTRY499_UPLOAD.cmd`.
4. Enter Cloudflare Account ID.
5. Enter a locally-created API Token with `Workers Scripts Write`. Do not paste the token into chat.
6. Type exactly `CREATE`.
7. The tool must end with:
   - `ENTRY499_VERSION_CREATED=YES`
   - `TRAFFIC_CHANGED=NO`
   - `DEPLOYMENT_CREATED=NO`
   - `VERSION_ID=...`
8. Stop and return to Cloudflare Dashboard > `trendos-ui` > Deployments.
9. Confirm that exact Version ID, then manually promote it to 100%.

## Post-promote verification
- hard refresh;
- login once;
- session stays open on data-service 5xx;
- Orders render;
- `/v1/edge/orders/session` works;
- `/v1/edge/orders/02cr/page` returns 200;
- no `script.google.com` in browser console;
- no qualified `Required D1 mirror is stale: بنود الأوردرات`;
- Press does not poll without employee token.

After that:
`NEXT_ENGINEERING_TASK=CLOUD_NATIVE_DUPLICATE_ORDER_GUARD`.
