# Cloud Migration V3 — T11 Direct Session Verify Regression — 2026-09-14

## Scope
Read-only production diagnostic to isolate the blocker preventing the T11 Service D1-read production qualification.

## Evidence
- Workflow: `TrendOS T11 Direct Session Verify Diagnostic`
- Run: `34836406769`
- Job: `103951124042`
- Candidate branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
- Diagnostic commit: `248bc43ec15c3e7a05afaf5686a7ce456493b3b5`

## Direct Apps Script results
- Production login POST: HTTP `200`, `5278 ms`, success `true`.
- Direct POST `verifyEmployeeSession`: HTTP `404`, `35035 ms`, success `false`.
- No user object was returned.
- No useful application message was returned.
- Qualification token was masked and was not persisted to GitHub.

## Production safety state
- No Worker deployment was performed by this diagnostic.
- Production Worker remains the stable rollback target/version: `3b819fd3-e73d-46f8-9150-f73c282706ab`.
- T11 Service candidate remains branch-qualified (35/35 exact parity, 9 owner-approved exclusions) but is **not** retained in production.
- Frontend Service cutover remains OFF.
- Sheets/Apps Script remains authoritative for business writes.
- No Task mutation.
- No core secret change.
- No Gaber gate change.
- Only the already-approved normal qualification login session renewal occurred; no business-data mutation occurred.

## Conclusion
The T11 Service route itself is not the current blocker. Production qualification is blocked by a regression/mismatch in the deployed Apps Script session-verification path: POST `verifyEmployeeSession` now returns HTTP 404 after ~35 seconds. Increasing the Worker bridge timeout would not be a valid fix because the upstream request is returning 404 rather than a late successful verification.

## Next technical step
Inspect `doPost`, the V1932/V1900/V1898 pre-routers, and `verifyEmployeeSession_` in source; compare the current branch against the known production/T6B baselines; then add a branch-only routing regression test. Do not patch or deploy production Apps Script without a separate owner decision.
