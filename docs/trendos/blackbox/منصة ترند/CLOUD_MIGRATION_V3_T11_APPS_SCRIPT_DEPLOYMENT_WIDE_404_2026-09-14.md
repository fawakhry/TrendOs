# Cloud Migration V3 — T11 Apps Script Deployment-Wide 404 — 2026-09-14

## Correction to the earlier direct-verify diagnosis
The earlier run `34836406769` showed `verifyEmployeeSession` returning HTTP 404 after ~35 seconds, but a follow-up comparison proved the fault is not isolated to that action.

## Follow-up evidence
- workflow: `TrendOS T11 Direct Session Verify Diagnostic`
- run: `34844935959`
- job: `103978474854`
- workflow commit: `e466c87a40369a9635ca8cae832bdb8709fc37c5`

Observed against the same production Apps Script Web App deployment:
- `POST ping` -> HTTP `404`, `37344 ms`, `Content-Type: text/html; charset=utf-8`
- immediately following `POST login` -> HTTP `404`, `12289 ms`, no token returned
- the run therefore could not continue to `verifyEmployeeSession` or `getRowsPageV1931`

## Interpretation
This is deployment-wide / transport-level evidence, not a `verifyEmployeeSession_` routing defect. The repository source still contains the generic `doPost -> doGet` forwarding path and the `verifyEmployeeSession` case, and `Code.gs` is byte-identical across the known baseline/T6B/current refs (`3496ef9b9370cced27eafaa7dbbb299616be933c`).

The current blocker is therefore the health/availability of the deployed Apps Script Web App (or its Google Apps Script execution environment) at qualification time. A source patch to `verifyEmployeeSession_` is not justified by the current evidence.

## Production safety state
- no Apps Script deployment/change
- no Worker deployment/change in this diagnostic
- stable Worker remains `3b819fd3-e73d-46f8-9150-f73c282706ab`
- T11 Service candidate remains branch-qualified but not retained in production
- frontend Service cutover remains OFF
- Sheets/Apps Script business-write authority unchanged
- no Task mutation
- no core secret change
- no Gaber gate change

## Next step
Run a lightweight production Web App health probe (`ping` only, no business mutation) with bounded retries. Do not resume the T11 Worker canary until Apps Script `ping` is reliably HTTP 200 again.
