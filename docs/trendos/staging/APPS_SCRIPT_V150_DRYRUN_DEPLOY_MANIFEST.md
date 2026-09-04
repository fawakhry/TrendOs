# Apps Script V150 Dry-Run Deployment Manifest

Date: 2026-09-04
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Deployment purpose

Deploy the already-tested read-only Cloud Write reconciliation dry-run route into the existing TrendOS Google Apps Script Web App **without enabling any Sheets write path or Production Cloud Write**.

## Qualified source

The `Code.gs` integration was produced and verified by PERF-CF-02AO.

Canonical candidate integration commit:

`47c12e4a121f996d568bec224742b3a3f2ff71b0`

The current working branch contains that candidate plus subsequent CI/probe/checkpoint documentation. No later step intentionally changed the V150 route/helper logic.

Expected route in `doGet`:

```javascript
else if (action === "cloudWriteReconcileDryRunV1") result = trendosCloudWriteReconcileDryRunV1_(e);
```

Expected helper marker at the end of `Code.gs`:

`PERF-CF-02AO / APPS SCRIPT V150 DRY-RUN ONLY`

## Pre-deploy gates already passed

- Apps Script dry-run static mutation guard: PASS.
- Apps Script dry-run runtime mock: PASS.
- staging-only ID guard: PASS.
- secret gate: PASS.
- payload identity and SHA-256 fingerprint guards: PASS.
- Orders schema validator: PASS.
- duplicate Order ID guard: PASS.
- integrated `Code.gs` route exactly once: PASS.
- helper appended exactly once: PASS.
- `doPost -> doGet` fallback preserved: PASS.
- only `Code.gs` changed in the integration commit: PASS.
- live baseline before deployment: `V150_ROUTE_STATE=NOT_INSTALLED`.

## Deployment boundary

There is no supported Apps Script deployment connector or `clasp` configuration available in this repository/chat environment. Use the existing project deployment process:

1. Open the existing TrendOS Google Apps Script project that currently serves Web App Version 149.
2. Update the project `Code.gs` to the qualified current repository `Code.gs` candidate. Do not alter unrelated `.gs` project files.
3. Save.
4. Do **not** add or change the reconciliation secret yet if the goal is to prove route installation in a locked state first.
5. Go to `Deploy -> Manage deployments`.
6. Edit the existing Web App deployment.
7. Select `New version`.
8. Deploy.
9. Preserve the existing Web App access/execution settings; do not create a different public endpoint unless explicitly required.

If Google assigns the sequential next version, this should become Version 150. Treat the actual version number shown by Apps Script as authoritative.

## Immediate post-deploy gate — before any secret

Run GitHub workflow:

`TrendOS Apps Script V150 Live Dry-Run Route Probe`

Expected result:

- `V150_ROUTE_STATE=INSTALLED_LOCKED`
- response code: `dry-run-secret-not-configured` (preferred before property setup) or `unauthorized`
- `sheetsWritten=false`
- `mutationCount=0`

If the probe still reports `NOT_INSTALLED`, stop. Do not configure reconciliation transport and do not enable Production Cloud Write.

## Secret configuration — only after route-install gate PASS

Create a strong random secret inside the Apps Script project's Script Properties:

`TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET`

Rules:

- never commit the secret to GitHub;
- never place it in `Code.gs`;
- never send it in a public URL;
- use it only for authenticated dry-run reconciliation requests;
- secret configuration does not authorize actual Sheets writes.

A matching secure CI secret may later be configured for an authenticated staging dry-run probe. That is a separate step and is not currently provisioned by this repository lane.

## Explicitly forbidden in this deployment

- enabling `TRENDOS_CLOUD_WRITE_V1_ENABLED` in Production;
- creating a Production reconciliation route;
- adding `setValue`, `setValues`, `appendRow`, header-creation, or any Sheet mutation to the dry-run helper;
- changing production D1 migrations;
- changing the production D1 database binding;
- marking any outbox row as Sheets-synced based only on the dry-run response;
- claiming `sheetsWritten=true`.

## Rollback

If any legacy Apps Script route fails after deployment:

1. In `Manage deployments`, immediately edit the Web App deployment back to the previous known-good Version 149.
2. Confirm legacy `ping/login` behavior.
3. Rerun the V150 live probe; it should return `NOT_INSTALLED` after rollback.
4. Leave Production Cloud Write OFF.

## Go/no-go after deployment

GO to authenticated dry-run only when all are true:

- legacy Apps Script routes remain healthy;
- V150 live probe reports `INSTALLED_LOCKED` before secret or `unauthorized` after secret;
- no Sheet mutation is observed;
- Production Cloud Write remains OFF.

Anything else is NO-GO.
