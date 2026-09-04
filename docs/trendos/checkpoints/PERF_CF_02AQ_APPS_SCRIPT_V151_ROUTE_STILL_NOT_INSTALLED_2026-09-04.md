# PERF-CF-02AQ — Apps Script V151 route still not installed

Date: 2026-09-04

## Observed deployment
User confirmed the existing Apps Script Web App deployment was updated successfully to Version 151 on Sep 4, 2026 at 10:01 PM, using the same deployment ID previously used by TrendOS.

## Live probe
A read-only GitHub Actions rerun tested:

`?action=cloudWriteReconcileDryRunV1&dryRun=true&_probe=github-readonly-v150`

Result:
- HTTP 200
- response: `{\"success\":false,\"message\":\"Action غير معروف.\"}`
- `V150_ROUTE_STATE=NOT_INSTALLED`

The probe sent no reconciliation secret and performed no Sheet writes, Script Property mutation, D1 writes, or Production Cloud Write changes.

## Conclusion
The Web App deployment itself is updating, but the deployed source still does not expose `cloudWriteReconcileDryRunV1`. This points to the V150/V151 route/helper not being present in the Apps Script source that was actually deployed, or not being present in the effective `doGet` route chain.

## Next exact check
Inside live Apps Script `Code.gs`, search for:

`cloudWriteReconcileDryRunV1`

Expected at minimum:

`else if (action === \"cloudWriteReconcileDryRunV1\") result = trendosCloudWriteReconcileDryRunV1_(e);`

If no match exists, update `Code.gs` with the qualified candidate before another deployment. Production Cloud Write remains OFF.
