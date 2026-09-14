# CLOUD MIGRATION V3 — T11 Service D1 route candidate built

Date: 2026-09-14

## Candidate commits
- Service route module: `9144cdc4a9bb9b189c128da56589a0124cbfb372`
- Worker routing integration: `1a08fa9e54580c87ea5e79c1c3cc321b6ef7c1ab`

## Candidate scope
- New exact path: `/v1/edge/orders/service/page`
- Source: D1 mirror `الأوردرات` only.
- Service remains order-level; existing Print/Laser/Press 02CR line-level route is unchanged.
- Nine owner-approved `طلب جديد` rows are excluded using SHA-256 order-identity fingerprints only.
- Raw excluded order IDs are not committed.
- Debt filter remains Apps-Script-only.
- Writes remain Apps Script/Sheets.

## Production state
- Candidate is branch-only at this checkpoint.
- No Worker production deployment performed.
- Frontend Service routing unchanged; still Apps Script.
- No Task mutation, secret rotation, or write-authority change.

## Next step
Run live parity of the Service candidate against deployed Apps Script Service. Production deployment is allowed only if parity passes.
