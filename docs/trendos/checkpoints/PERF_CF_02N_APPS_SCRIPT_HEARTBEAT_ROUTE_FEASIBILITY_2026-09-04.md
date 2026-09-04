# PERF-CF-02N — Apps Script Heartbeat Route Feasibility — 2026-09-04

## Trigger
After `PERF-CF-02M` qualified the GitHub-only dual-signal freshness model, the next question was whether the required low-usage heartbeat could be exposed later without replacing Production `Code.gs`.

## Read-only source inspection
Inspected the working-branch reference `Code.gs` only as routing evidence, not as an assumed exact Version-148 source snapshot.

Observed `doGet(e)` structure:
1. `trendosV1932TryRoute_(e, null)`
2. `trendosV1900TryRoute_(e, null)`
3. `trendosV1898TryRoute_(e, null)`
4. explicit legacy `action` chain

The explicit legacy chain contains read-only actions such as:
- `ping` -> `healthCheck_()`
- `health` -> `healthCheck_()`

Unknown actions eventually return `Action غير معروف.`.

## Feasibility conclusion
There is no repository-proven dynamic action dispatch that would allow a newly installed standalone `.gs` helper to become reachable from the Web App automatically.

Therefore a future deployed heartbeat requires **two bounded pieces**:
1. a standalone read-only helper function that returns a sanitized low-usage heartbeat;
2. one explicit surgical route entry in the persisted `doGet` routing chain (or an exact verified equivalent router in the actual Version-148 Head composition).

This does **not** justify replacing the whole `Code.gs` file.

## Safe patch design
Prepare a GitHub-only helper/patch candidate with:
- no source Sheet writes;
- no D1/Cloudflare writes;
- no secrets in output;
- no business row values in output;
- only controller/trigger/error/timestamp/source-shape state needed by the Edge validator;
- source display hashes reduced to presence markers rather than raw hash values;
- exact one-line route insertion documented separately.

The route should remain read-only and should not enable any business family or Cloud Write authority.

## Production boundary
The repository `Code.gs` is not treated as exact Version-148 Runtime truth. Before any live route insertion, the actual persisted routing location must be visually/exactly reconciled in Apps Script Head, and the change requires the normal controlled Production approval.

## Status
**ROUTE FEASIBILITY CONFIRMED / PATCH NOT YET DEPLOYED / PRODUCTION UNCHANGED.**

## Next step
Create and test the sanitized heartbeat helper plus a Preview-gated Edge upstream verifier. Keep the Edge verifier disabled by default until the Apps Script heartbeat route is installed and runtime-qualified.
