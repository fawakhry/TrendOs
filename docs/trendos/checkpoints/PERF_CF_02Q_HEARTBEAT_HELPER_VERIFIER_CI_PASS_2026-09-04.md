# PERF-CF-02Q — Heartbeat Helper / Verifier CI PASS — 2026-09-04

## Trigger
`PERF-CF-02P` wired the sanitized Apps Script helper and default-off Edge verifier regressions into the main Integrity CI.

## Verified run
Workflow: `TrendOS Integrity V1`

Run:
- ID: `33898491110`
- Run number: `447`
- Head SHA: `475c3975205b1ed76199675a313585b80618c44b`
- Event: `push`
- Job: `integrity-foundation`
- Job ID: `101106717955`
- Final job status: `completed`
- Final conclusion: `success`

## New steps — PASS
- Cloudflare Edge Orders freshness gate tests
- Cloudflare Edge Orders idle heartbeat tests
- Cloudflare Edge Orders idle freshness integration tests
- D1 Orders low-usage heartbeat helper safety tests
- Cloudflare Edge Orders idle verifier tests

## Existing regression suite — PASS
The same job completed successfully through all existing Integrity/Core/Press/Invoice/WhatsApp/OPS/Auth/composition/pre-deploy gates.

## Qualified contract
The following is now GitHub-CI qualified:
- Apps Script heartbeat helper is read-only and sanitized;
- raw source display hashes are not exposed;
- Edge verifier uses HTTPS GET only;
- verifier requires an explicit enable flag;
- Preview config currently has no enable flag;
- Preview Cloud Write remains OFF;
- stale D1 still fails closed by default;
- valid idle heartbeat can only qualify stale-by-age when explicitly injected;
- invalid/stale/error heartbeat fails closed;
- parity/status/live-note failures cannot be overridden.

## Production impact
**NONE.**
- No Apps Script helper/route installed live.
- No Production deployment changed.
- No Production Cloudflare read cutover.
- No D1 data mutation/import.
- No Cloud Write authority change.
- Sheets + Apps Script remain authoritative for writes.
- CORE-P0 remains paused.

## Exact next gate
Verify the automatic Cloudflare Preview deployment for the current source lineage while the heartbeat feature remains OFF. Require Preview safety/health to stay PASS. After that, the next boundary is a controlled Apps Script Head install of the read-only helper + exact one-line route, which is a separate Production-source approval step.
