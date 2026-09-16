# TrendOS Tasks V3 T1.5 — Canonical Service Binding + Cloudflare Reconcile Ready — 2026-09-16

## Scope
Isolated Tasks V3 preview only. No production mutation, no production D1, no main Apps Script deployment, no secret rotation/change, no T2/T3 action.

## Repository cleanup / canonicalization
The T1.5 path is now canonicalized to a single service-binding architecture:

`T1.5 scheduled -> TASKS_V3_T1_SERVICE -> isolated T1 Worker -> standalone Apps Script -> preview Sheets`

Synchronous read path remains:

`Client -> isolated T1.5 Worker -> isolated preview D1 snapshot`

Canonical T1.5 configuration now contains:
- Worker: `trendos-tasks-v3-t15-preview-20260915`
- D1 binding: `TASKS_V3_PREVIEW_DB`
- D1 database: `trendos-tasks-v3-t15-preview-20260915`
- D1 database id: `4c4d48f2-8c5d-45f2-9d41-c426c17ed93c`
- Service binding: `TASKS_V3_T1_SERVICE`
- Service target: `trendos-tasks-v3-t1-preview-20260914`
- Max snapshot age: `180`
- Cron: `* * * * *`
- Obsolete `TASKS_V3_T1_SOURCE_URL`: removed from canonical source/config.

The canonical refresh uses one successful `status` call (one retry only on failure), derives health from the status payload, and atomically upserts the D1 snapshot.

## Contract
GitHub Actions run `35102887060` completed SUCCESS.
The contract verifies:
- service binding is required,
- public source URL is absent,
- synchronous read path has zero upstream call,
- D1 is isolated from production,
- WAEL-only read operations remain bounded,
- no `claimNext` / `completeTask`,
- no legacy V2 fallback symbols.

## Cloudflare automation
Added manual workflow:
`.github/workflows/trendos-tasks-v3-t15-cloudflare-reconcile.yml`

Modes:
- `audit`: read deployment state only.
- `apply`: requires exact confirmation `T15_PREVIEW_ONLY`.

Apply is hard-scoped to two isolated Workers only:
1. `trendos-tasks-v3-t1-preview-20260914`
2. `trendos-tasks-v3-t15-preview-20260915`

Apply behavior:
- deploy canonical isolated T1 source while using `--keep-vars` so dashboard runtime vars remain and existing secrets are preserved,
- deploy canonical T1.5 config so obsolete non-secret vars/bindings are reconciled to the file,
- preserve existing secrets (Wrangler deployments do not delete omitted secrets),
- set only the isolated D1 binding, T1 service binding, 180-second max age, and one every-minute Cron from canonical config.

The workflow contains explicit guards against the production D1 id, `trendos-main` as target, task mutation symbols, and legacy production task-proxy symbols.

## Authentication blocker
Remote Cloudflare apply is intentionally not run until GitHub repository secrets exist:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The Cloudflare dashboard automation attempt was blocked by Cloudflare verification/login, so no remote Cloudflare changes were made during preparation.

## Next step
Owner creates a least-privilege Cloudflare API token and stores the token + account id directly as GitHub repository secrets. Do not paste the token in chat. Then run the reconcile workflow first in `audit`, inspect output, and only then `apply` with confirmation `T15_PREVIEW_ONLY`.
