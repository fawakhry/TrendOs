# Cloud Migration V3 — T11 Service Worker Canary Attempt 2 Rollback — 2026-09-14

## Context
This was the rerun of the fail-closed T11 Service Worker production canary after the Apps Script stability gate passed.

## Evidence
- workflow run: `34836159593`
- rerun job: `103980601371`
- workflow source commit: `e78bde99ca3fd56c47649d97410bd2c1d65e372e`
- preceding Apps Script stability gate: run `34845398493`, job `103979992208`, PASS with two consecutive healthy JSON pings in `12093 ms` and `4037 ms`.

## Pre-deploy qualification
- scope gate: PASS
- Service runtime contracts: PASS
- production baseline: PASS
- qualification login: HTTP 200 in `7154 ms`
- `/v1/edge/orders/session`: HTTP 200 in `5796 ms`, `authSource=apps-script-post`
- qualification Edge token acquisition: PASS on attempt 1
- Worker dry-run: PASS

## Temporary production deployment
- temporary Worker version: `a0a3954a-2219-4ff0-bd34-33f1c50ffe33`
- post-deploy production baseline: PASS

## Failure point
The live Service qualification reached the Service route and passed the route-level assertions before the authoritative Apps Script comparison. The workflow then attempted a second, unnecessary Apps Script `login` after deployment. That request hit the workflow's 30-second abort boundary and raised `This operation was aborted` at ~31 seconds, so the authoritative parity comparison could not complete.

No evidence in this attempt indicates a Service D1 route contract mismatch. The failure is in the qualification harness's redundant post-deploy login dependency.

## Automatic rollback
- automatic rollback: SUCCESS
- restored stable Worker version: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- ephemeral qualification tokens cleaned: YES

## Production state after rollback
- Service D1 route is not retained in production
- frontend Service cutover remains OFF
- Sheets/Apps Script remains business-write authority
- no D1 migration
- no Task mutation
- no core secret change
- no Gaber gate change

## Next step
Modify only the T11 canary qualification harness to reuse the already acquired pre-deploy employee token for the authoritative `getRowsPageV1931` read, with bounded read retries. Do not perform a second login after deployment. Then rerun the same narrow canary with automatic rollback intact.
