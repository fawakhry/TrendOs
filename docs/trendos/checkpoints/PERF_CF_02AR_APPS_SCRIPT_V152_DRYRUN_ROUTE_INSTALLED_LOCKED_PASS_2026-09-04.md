# PERF-CF-02AR — Apps Script V152 Dry-Run Route Installed + Locked PASS

Date: 2026-09-04
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Scope

Verify the newly deployed Google Apps Script Web App Version 152 exposes the read-only Cloud Write reconciliation dry-run route while remaining locked before secret configuration, and verify the previously deployed D1 Orders low-usage heartbeat route still works.

## Live dry-run route probe

Workflow run: `33907692490`
Job: `101144466812`

Observed:

- HTTP 200
- `V150_ROUTE_STATE=INSTALLED_LOCKED`
- response code: `dry-run-secret-not-configured`
- `sheetsWritten=false`
- `mutationCount=0`

This is the expected pre-secret state. The handler rejects before any Sheet schema read/write path.

## Heartbeat regression probe

Workflow run: `33900510467`
Job: `101144641469`

Observed:

- HTTP 200
- `HEARTBEAT_ROUTE_STATE=INSTALLED`
- `success=true`
- `lowUsage=true`
- `lightweightIdleDetection=true`
- `enabled=true`
- `intervalMinutes=5`
- `lowUsageTriggerCount=1`
- `legacyV1TriggerCount=0`
- `directV2TriggerCount=0`
- `lastErrorPresent=false`
- `consecutiveErrors=0`
- idle mode: `unchanged-light-fingerprint-no-d1-request`
- `sourceChanged=false`
- `d1RequestMade=false`
- `d1WriteMade=false`
- sourceCount=2

## Safety state

- No Sheet write was executed by either probe.
- No Script Property was changed.
- No D1 write was executed.
- No Cloudflare deployment/config change was performed in this verification.
- Production Cloud Write was not enabled by this step.

## Decision

PASS.

Apps Script V152 is now qualified for the next phase: configure a reconciliation dry-run secret and execute authenticated staging-only dry-run reconciliation. Production Cloud Write remains outside scope and must remain OFF.
