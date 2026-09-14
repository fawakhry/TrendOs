# CLOUD MIGRATION V3 — T11 Service Worker canary attempt 1 rollback

Date: 2026-09-14
Run: `34835897267`
Job: `103949526553`
Workflow commit: `98d20b2f8e1f62343035da1769eaa354f21167cb`

## Pre-deploy gates
- Hard runtime scope gate: PASS
- Runtime contracts: PASS
- Production baseline: PASS
- Wrangler dry-run: PASS

## Temporary candidate deployment
- Candidate Worker Version ID: `a7e581b8-3efe-48a6-ba57-baf571243f16`
- Post-deploy production baseline: PASS

## Failure
The qualification failed before the new Service route was exercised.
The existing `/v1/edge/orders/session` exchange returned HTTP 502 during qualification.
Therefore this run does **not** prove a Service route defect.

## Automatic rollback
Rollback: PASS
Restored production Worker Version ID:
`3b819fd3-e73d-46f8-9150-f73c282706ab`

## Production state after rollback
- Worker restored to the previously stable production version.
- Service frontend remains Apps Script.
- Print/Laser/Press frontend routing unchanged.
- No D1 migration.
- No business write authority change.
- No Task mutation.
- No secret rotation.

## Next step
Acquire a short-lived Orders Edge token on the stable Worker **before** deploying the Service candidate. Because `EDGE_SESSION_SECRET` is unchanged, use that token only for the immediate post-deploy Service route qualification. Perform a separate fresh Apps Script login for authoritative parity. If route qualification fails, rollback again automatically.
