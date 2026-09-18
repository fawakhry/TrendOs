# TrendOS Tasks V3 — T2 latency smoke blocked by private function execution surface — 2026-09-18

## Timestamp
2026-09-18 12:57 EEST

## Preconditions
- saved Head static verification: PASS
- Google Sheets API / Sheets v4 Advanced Service: enabled in isolated T2 only
- no Deploy/version created after remediation
- T3 locked

## STEP
Attempted the owner-authorized small read-only latency smoke by selecting and executing:
`tasksV3ProductionProjection_`

TinyFish run:
`eac1762c-e9a5-45be-97be-f297100f2692`

Requested:
- run only `tasksV3ProductionProjection_`;
- exactly 3 executions;
- no returned business-data inspection/logging;
- no source edit;
- no Deploy/version;
- no Services/Properties/settings changes;
- stop on new OAuth consent.

## RESULT / BLOCKER
No smoke execution occurred.

Apps Script's function dropdown exposed only `doPost`; `tasksV3ProductionProjection_` was not selectable from that execution surface.

TinyFish therefore stopped without running another function.

No new authorization/consent screen appeared.

## IMPORTANT INTERPRETATION
The saved source has already been independently captured through Google Docs API and proven to contain:
`function tasksV3ProductionProjection_()`.

Therefore dropdown absence is not accepted as proof that the source function is absent. The function name ends with an underscore and is an internal/private helper in the reviewed source.

## DECISION / NEXT ACTION
Before considering any source mutation or deployment, verify whether Apps Script provides a no-mutation way to execute the latest saved Head for a web app/private helper path (for example a Head/test-development execution surface).

If no safe no-mutation execution path exists, stop at an Owner decision between:
1. authorizing a temporary read-only public smoke wrapper in Head, followed by exact source restoration; or
2. authorizing a new isolated deployment/version for runtime qualification.

Do not choose either mutation path implicitly.

## SAFETY
No function executed.
No source edit/Save.
No Deploy/version.
No Properties/Secrets.
No business-data access/write.
No Task mutation.
No T1/V4/V5/Worker/T3 change.
