# PERF-CF-02AE — Production preflight blocked by obsolete Worker URL — 2026-09-04

## Result
The read-only Production Orders Preflight was triggered after Dual-Signal Preview PASS.

The first health probe targeted:
`https://trendos.trendmall-contact.workers.dev/v1/edge/health`

Runtime response:
`{"success":false,"message":"Not found"}`

The job stopped before mirror or Orders-route checks, so this is not evidence of a D1, heartbeat, parity, auth, or Orders-read failure.

## Diagnosis
Current TrendOS production Cloudflare workflows and `cloudflare-d1/wrangler.toml` identify the D1 Worker as `trendos-d1-api`, and the existing production freshness-guard workflow uses:
`https://trendos-d1-api.trendmall-contact.workers.dev`

Therefore the Preflight `PROD_URL=https://trendos.trendmall-contact.workers.dev` is obsolete for the D1 API health contract.

## Safety state
- No Worker code deployment was performed by this Preflight.
- No D1 write/migration was performed.
- No traffic cutover was performed.
- Cloud Write remains OFF.

## Next action
Update only the read-only Preflight target URL to `https://trendos-d1-api.trendmall-contact.workers.dev` and rerun Production health + mirror contract + current Orders route state.
