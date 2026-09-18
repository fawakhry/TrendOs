# TrendOS Tasks V3 — T2 latency smoke decision point — 2026-09-18

## Timestamp
2026-09-18 12:59 EEST

## Current verified state
- authoritative saved Head static verification: PASS
- saved Head matches commit `31565dfdbf7b63744b32b02e5042a5f6b0664249` after line-leading whitespace normalization of the diagnostic capture
- all nine required batchGet / UTF-8 markers present
- all forbidden executable mutation paths absent
- Google Sheets API / Sheets v4 Advanced Service enabled in isolated T2 only
- no new deployment/version
- no T3

## LATENCY SMOKE ATTEMPT
TinyFish run:
`eac1762c-e9a5-45be-97be-f297100f2692`

Requested direct editor execution of:
`tasksV3ProductionProjection_`

Result:
- zero smoke executions occurred;
- Apps Script execution dropdown exposed only `doPost`;
- private helper `tasksV3ProductionProjection_` was not selectable;
- no OAuth prompt;
- no business-data read occurred from the failed smoke attempt.

## DOCUMENTED PLATFORM BEHAVIOR
Google Apps Script documentation states that server functions whose names end with an underscore are considered private and are not exposed to client execution surfaces.

Reference:
https://developers.google.com/apps-script/guides/html/communication

Google's web-app documentation also states that a test-deployment URL ending in `/dev` always runs the most recently saved code, but is accessible only to users with edit access to the script.

Reference:
https://developers.google.com/apps-script/guides/web

Therefore the existing private helper cannot be selected directly from the editor Run dropdown, and a `/dev` URL alone does not provide the existing Cloudflare server-side signed request path without an authenticated editor browser session.

## DECISION BOUNDARY
No safe no-source-mutation direct editor path has been established to time `tasksV3ProductionProjection_`.

The minimal reversible next option is:
1. temporarily add one public read-only smoke wrapper function to Head that only calls `tasksV3ProductionProjection_()`;
2. Save Head;
3. execute exactly 3 smoke runs;
4. record only success/failure and duration, not business-data contents;
5. immediately restore `Code.gs` exactly from the authoritative source/staging;
6. independently verify restored Head again;
7. no Deploy/version, no Properties/Secrets, no production route, no T3.

This temporarily changes Head and therefore is NOT performed without fresh Owner authorization.

Alternative deployment/API-executable approaches are more invasive and are not selected implicitly.

## SAFETY STATE
No smoke function executed.
No business-data access/write.
No source mutation after authoritative reconciliation.
No Deploy/version.
No Properties/Secrets.
No Task mutation.
No T1/V4/V5/Worker/T3 change.
