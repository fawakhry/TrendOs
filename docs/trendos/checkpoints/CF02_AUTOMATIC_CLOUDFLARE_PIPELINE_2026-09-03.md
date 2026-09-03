# CF-02 — Automatic Cloudflare Pipeline Checkpoint

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`

## User instruction

The user requested Cloudflare execution to be fully automatic through the assistant, without requiring manual Cloudflare dashboard work or manual workflow dispatch for every step.

## Capability boundary verified

A direct Cloudflare connector/plugin is not available in this chat session. The safe automation path is therefore GitHub-driven:

1. The assistant commits code and workflow changes to GitHub.
2. GitHub Actions runs tests and Wrangler commands.
3. Cloudflare is reached through repository secrets.
4. Production cutover remains guarded by feature flags and explicit source rules.

This means the assistant can operate the migration through GitHub commits and Actions, provided the required GitHub Secrets are already configured.

## Implemented change

Updated workflow:

`.github/workflows/trendos-cloudflare-edge-preview.yml`

Renamed workflow title:

`TrendOS Cloudflare Auto Preview`

Added automatic trigger:

- On push to `agent/go-live-2026-09-01-integrity`.
- Only when Cloudflare/D1 related paths change:
  - `cloudflare-d1/**`
  - `tests/cloudflare_*`
  - `.github/workflows/trendos-cloudflare-edge-preview.yml`
  - `trendos-edge-read-v1.js`
  - `config.js`

Manual `workflow_dispatch` remains available as a fallback.

## Automatic pipeline behavior

On matching push, the workflow now:

1. Checks out the repository.
2. Runs Cloudflare safety tests:
   - `tests/cloudflare_edge_gateway_v1.test.mjs`
   - `tests/cloudflare_cloud_write_v1.test.mjs`
3. Verifies required secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `TRENDOS_EDGE_SESSION_SECRET_PREVIEW`
4. Applies D1 migrations to the configured database with Wrangler.
5. Installs the preview `EDGE_SESSION_SECRET`.
6. Deploys the isolated preview Worker:
   - `trendos-edge-gateway-preview`
7. Verifies `/v1/edge/health`.
8. Verifies anonymous protected-route rejection.
9. Verifies `/v1/cloud/write/health` safety markers:
   - `cutover=false`
   - `sheetsAuthoritative=true`

## Safety preserved

This checkpoint does not change:

- Apps Script production deployment.
- Google Sheets source data.
- GitHub Pages/config frontend cutover.
- Production write authority.
- Integrity family flags.

Cloud Write acceptance remains controlled by:

`TRENDOS_CLOUD_WRITE_V1_ENABLED`

## Production impact

GitHub workflow automation only.

No production Apps Script, Sheet, trigger, or frontend traffic cutover was performed by this checkpoint.

## Exact commit

Workflow automation commit:

`fae80c6b25428b257b9eacb0567de753dec4e47c`

## Next execution step

Pushes that touch Cloudflare/D1 files on the working branch should now automatically execute the Cloudflare Preview deployment pipeline.

After a run exists, inspect GitHub Actions result:

- If PASS: record run ID and preview health result.
- If FAIL due to missing secrets: user/account setup is required once, then future runs can be fully assistant-driven.
- If FAIL due to Wrangler/API error: fix workflow/code and push again.
