# PERF-CF-02AS — Apps Script V152 Secret Gate Auth Lock PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`

## Result

The Apps Script dry-run reconciliation secret was configured inside Script Properties using a one-time local project function. No secret value was printed or committed.

Live unauthenticated probe against the existing Web App deployment returned:

- HTTP 200
- `V150_ROUTE_STATE=INSTALLED_LOCKED`
- `V150_ROUTE_CODE=unauthorized`
- `sheetsWritten=false`
- `mutationCount=0`

This proves the V152 dry-run route remains installed and locked after secret configuration.

## Safety

- No reconciliation secret was sent by the probe.
- No Sheet writes were performed.
- No Script Property mutation was performed by the probe.
- No D1 writes were performed.
- Production Cloud Write remains OFF.

## Next boundary

Do not enable Production Cloud Write. Next step is authenticated staging-only dry-run qualification without exposing the configured Apps Script secret.
