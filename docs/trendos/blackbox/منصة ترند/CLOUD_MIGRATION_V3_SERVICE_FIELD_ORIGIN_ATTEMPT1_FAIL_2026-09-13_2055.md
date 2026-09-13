# TrendOS Cloud Migration V3 — Service Field Origin Attempt 1 FAIL-CLOSED

Date: 2026-09-13 20:55 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Attempted safe read-only live mapping of current Production Service `lineId` back to the D1 Lines source columns.

- workflow: `TrendOS T11 Service Live Field Origin`
- run: `34775964534`
- job: `103774000279`
- workflow commit: `ddc0af1332cd5b292e8dba81e196ce89e0fa7739`
- result: FAIL before any network/data operation in the mapping script

## Failure cause

Node 22 rejected the inline script because it mixed CommonJS `require()` with top-level `await`:
- error: `ERR_AMBIGUOUS_MODULE_SYNTAX`

The failure occurred at script parse/startup, before the first Apps Script login or D1 mirror request.

Therefore:
- Production business mutation: NO
- Production login/session renewal from this run: NO
- business values exposed: NO
- Service cutover: NO

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Fix only the workflow runner syntax by wrapping the Node body in an async function / removing the CommonJS ambiguity, then rerun the same safe field-origin mapping. No change to the mapping scope or Production routing.
