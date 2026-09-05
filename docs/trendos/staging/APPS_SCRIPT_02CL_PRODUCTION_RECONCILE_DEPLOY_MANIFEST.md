# PERF-CF-02CL — Apps Script Production Reconcile Qualification Deploy Manifest

Date: 2026-09-05
Status: **PREPARED FOR MANUAL DEFAULT-OFF DEPLOYMENT — DO NOT ENABLE EXECUTION YET**

## Goal

Install only the bounded Apps Script half of PERF-CF-02CL while keeping execution disabled.

Exact target remains:

`CW-PROD-QUAL-33975124471`

No generic reconciliation route is authorized.

## Proven live baseline

The 2026-09-05 live read-only preflight proved:

- existing `cloudWriteReconcileDryRunV1` route is live;
- route reaches the reconciliation secret gate and returns `unauthorized` with zero mutation;
- therefore the required dry-run helper lineage is present;
- target order is absent from authoritative `الأوردرات`;
- exact D1 outbox target exists once, pending, attempts=0;
- `cutover=false` and Sheets remain authoritative.

Evidence:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md`

## Source to install

Create one additional Apps Script source file in the existing live TrendOS Apps Script project.

Recommended file name:

`CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1`

Source must be copied exactly from repository file:

`apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs`

Do not copy repository `Code.gs` over the live `Code.gs`.

## Exact router change

In live `Code.gs`, locate the already-installed line:

```javascript
else if (action === "cloudWriteReconcileDryRunV1") result = trendosCloudWriteReconcileDryRunV1_(e);
```

Immediately after it, add exactly one line:

```javascript
else if (action === "cloudWriteReconcileProductionQualificationV1") result = trendosCloudWriteReconcileProductionQualificationV1_(e);
```

Do not change surrounding routes.

`doPost` already forwards unhandled POST actions into `doGet(..., __returnRawV1922: true)`, so no separate `doPost` route is required.

## Keep qualification disabled during installation

Before and after this deployment, do **not** set the enable property to `1` yet.

Allowed pre-execution states:

- `TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_ENABLED` absent, empty, or `0`.
- `TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET` may remain absent during route-install verification.

Do not reuse `EDGE_SESSION_SECRET` for reconciliation.

## Deploy method

Use the existing Apps Script Web App deployment and preserve its deployment ID:

1. Save the new script file and the one-line router addition.
2. `Deploy` → `Manage deployments`.
3. Edit the existing TrendOS Web App deployment.
4. Select `New version`.
5. Deploy.

Do not create a replacement Web App URL unless explicitly required by a separate recovery decision.

## Required immediate post-deploy probe

Before any Script Property enablement, call the live action without a secret:

`action=cloudWriteReconcileProductionQualificationV1`

Expected safe result:

- HTTP 200
- `success=false`
- `code=qualification-disabled`
- `persisted=false`
- `sheetsWritten=false`
- `mutationCount=0`
- `productionCutover=false`
- `sheetsAuthoritative=true`

Any other response blocks 02CL execution.

## Explicitly forbidden during this deployment gate

- no target outbox claim/consume;
- no Sheet append/update/delete;
- no generic outbox drain;
- no Worker qualification route enablement;
- no frontend cutover;
- no normalized-data cutover;
- no authority transfer;
- no `EDGE_SESSION_SECRET` rotation;
- no reuse of employee-session tokens as reconciliation secrets.

## Next gate after installed/default-OFF probe PASS

Only after the route returns the expected `qualification-disabled` response may the project proceed to:

1. prepare the bounded Worker route wiring;
2. configure a dedicated 02CL reconciliation secret on Apps Script + Worker without exposing its value;
3. keep the Worker execution flag default-OFF during deployment;
4. verify both default-OFF health surfaces;
5. acquire a fresh temporary authorized employee session;
6. explicitly enable the one-record qualification immediately before execution;
7. execute target once + replay-noop proof;
8. verify target synced, exactly one Orders row, decoys untouched, Shadow mutation-free, cutover=false, Sheets authoritative;
9. disable/clear qualification credentials after PASS.
