# PERF-CF-02BZ — Production Shadow Wrapper Safely Deployed with Shadow OFF

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED PASS — PRODUCTION WRAPPER DEPLOYED, SHADOW OFF, CLOUD WRITE OFF**

## Authorization

User explicitly authorized the safe Production deployment on 2026-09-05.

Because the connected GitHub tool did not expose workflow-dispatch creation directly, a one-commit authorization path was temporarily added to the existing controlled deployment workflow. It was cryptographically bounded operationally by an exact commit message and scoped only to the workflow file itself.

Authorized deployment commit:

- `e6433cea22f9eeacc723c59015c2f1ec0ef7f5f4`
- exact message: `AUTHORIZED PROD SHADOW OFF DEPLOY 2026-09-05`

The temporary push trigger was removed immediately after successful deployment.

Manual-only restoration commit:

- `849a7e1e169bbca157991a23769f2f1049fad978`

## Controlled Production deployment run

Workflow:

`TrendOS Production Shadow Controlled Deploy`

Run:

- `33958889631`

Job:

- `101287109118`

Result:

- **SUCCESS**

## Pre-deploy gates — PASS

The controlled workflow verified before deployment:

- Cloudflare API token present.
- Cloudflare account ID present.
- Worker name = `trendos-d1-api`.
- Production entrypoint = `production-shadow/index.js`.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`.
- no D1 migration apply command in the controlled workflow.
- no Worker secret rotation command in the controlled workflow.
- Production Shadow contract tests PASS.
- Production Shadow observer tests PASS.
- Edge Orders read tests PASS.
- Orders freshness gate tests PASS.
- idle heartbeat tests PASS.
- dual-signal idle freshness integration tests PASS.
- D1 low-usage heartbeat helper tests PASS.
- Edge idle verifier tests PASS.
- Edge gateway tests PASS.
- mirror safety tests PASS.
- Wrangler dry-run PASS.
- live Production GET-only preflight PASS.

## Deployment result

Wrangler version:

- `4.33.2`

Worker:

- `trendos-d1-api`

Production URL:

- `https://trendos-d1-api.trendmall-contact.workers.dev`

Cloudflare deployment output:

- uploaded successfully.
- Worker startup time: `5 ms`.
- deployed triggers successfully.
- **Current Version ID: `f4bcdc6b-5071-46f4-94ae-98641e8a984e`**.

Bindings confirmed during deployment:

- D1 binding: `trendos-main`.
- Apps Script upstream configured.
- `EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS = "600"`.
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"`.

No D1 migration command was executed.
No Worker secret rotation was executed.

## Post-deploy health — PASS

`/v1/edge/health` returned healthy runtime state:

- `success=true`.
- `database=true`.
- `authConfigured=true`.
- `upstreamConfigured=true`.
- `cutover=false`.

Anonymous Orders access remained protected with HTTP `401`.

### Existing normalized-data freshness note

The general normalized Edge health payload still reports the older normalized entities (`customers`, normalized `orders`, `messages`, `conversations`) as stale under the separate 180-second normalized freshness policy. This is pre-existing and is not the Orders dual-signal mirror path qualified in PERF-CF-02BY/BZ. `cutover=false` remains in effect, so this does not authorize normalized-data cutover.

## Post-deploy Shadow boundary — PASS

Production Shadow route now exists through the deployed wrapper but remains disabled by configuration.

GET `/v1/cloud/write/v2/production-shadow` returned the expected disabled boundary:

- HTTP `404`.
- `code=production-shadow-disabled`.
- `observerOnly=true`.
- `readOnly=true`.
- `mutationFree=true`.
- `d1Read=false`.
- `d1Written=false`.
- `appsScriptCalled=false`.
- `sheetsWritten=false`.
- `mutationCount=0`.
- `productionWriteEnabled=false`.
- `productionCutover=false`.

Result: **Production wrapper is installed, but Shadow observation is still OFF.**

## Post-deploy Cloud Write boundary — PASS

`/v1/cloud/write/health` confirmed:

- `success=true`.
- `enabled=false`.
- `writesAccepted=false`.
- `schemaMutationFree=true`.
- `cutover=false`.
- `sheetsAuthoritative=true`.

Result: **Cloud Write remains OFF and Google Sheets remain authoritative.**

## Post-deploy Orders / Lines mirror parity — PASS

Orders:

- `rowCount=274`.
- `sourceLastRow=274`.
- `syncedAt=2026-09-05 09:43:50`.
- note = `TrendOS orders live sync V2 quota-aware`.
- parity = PASS.

Order Lines:

- `rowCount=315`.
- `sourceLastRow=315`.
- `syncedAt=2026-09-05 09:43:50`.
- note = `TrendOS orders live sync V2 quota-aware`.
- parity = PASS.

## Rollback status

Automatic rollback step was available but was **not invoked**, because every post-deploy verification passed.

## Temporary authorization cleanup

After the successful Production deployment, the one-commit push authorization was removed.

The controlled deployment workflow is again:

- `workflow_dispatch` only.
- no push trigger.
- explicit manual confirmation required.

Restoration commit:

- `849a7e1e169bbca157991a23769f2f1049fad978`

Integrity after restoration:

- run `33958941363` — **SUCCESS**.

## Safety state at stop

- Production wrapper: **DEPLOYED**.
- Production Worker version: `f4bcdc6b-5071-46f4-94ae-98641e8a984e`.
- Production Shadow: **OFF**.
- Production Cloud Write: **OFF**.
- Google Sheets authoritative: **YES**.
- D1 migration in this checkpoint: **NONE**.
- D1 business write in this checkpoint: **NONE**.
- Apps Script write in this checkpoint: **NONE**.
- Google Sheet write in this checkpoint: **NONE**.
- Worker secret rotation: **NONE**.
- frontend cutover: **NONE**.
- rollback: **NOT NEEDED**.

## Decision

**PERF-CF-02BZ = VERIFIED PASS.**

The Production wrapper is now safely installed while all mutation and cutover capabilities remain disabled.

## Next safe boundary

1. Do not enable Cloud Write.
2. Keep Sheets authoritative.
3. If continuing the Production Shadow plan, the next separate gate is to design and authorize a controlled **read-only Production Shadow observation enablement** only.
4. Before enabling Shadow, rerun live Production preflight and reconfirm Cloud Write OFF.
5. Shadow observation must remain mutation-free, synthetic/deterministic, and must not read or write authoritative business data unless a later checkpoint explicitly changes that contract.
6. Cloud Write enablement remains a distinct later project gate and is not implied by successful wrapper deployment.
