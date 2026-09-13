# Cloud Migration V3 — T8 Print Global D1 Read PASS

Date: 2026-09-13

## Production result

Status: **PASS — Print Orders reads are now D1-first globally.**

Authoritative GitHub Actions evidence:

- Run: `34771634432`
- Job: `103762167920`
- Production `main` commit: `56e586a56c3b7dd91020a0eb074584c9444cd032`
- Commit message: `prod: move print orders reads globally to qualified D1`

Live qualification evidence:

- `T8_PRINT_CANONICAL_PARITY=PASS`
- Compared active Print rows: `22`
- D1 read latency: `1619 ms`
- Apps Script authoritative read latency: `12404 ms`
- Orders Edge session latency in this run: `12863 ms`
- Apps Script date-serialized Line IDs were canonicalized using the already-qualified frontend Line-ID repair contract before parity comparison.
- Required mirrors were ready and row-parity qualified:
  - `بنود الأوردرات`
  - `العملاء`
  - `عملاء منع التسليم بالمديونية`

Published frontend state:

- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`
- `MATBAGY_EDGE_ORDERS_CANARY_ONLY = false`
- `MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS = ['print']`
- Edge reader version: `EDGE_ORDERS_READ_T8_PRINT_GLOBAL_20260913`
- Qualified read path: `/v1/edge/orders/02cr/page`

## Safety boundary retained

- Print `getRowsPageV1931` eligible reads: D1-first.
- Service / Laser / Press: Apps Script.
- `__DEBT__`: Apps Script.
- Any Edge error, stale mirror, unready mirror, or post-write consistency barrier: Apps Script fallback.
- All business writes: Apps Script / Sheets authoritative.
- No Worker deployment in T8.
- No D1 migration in T8.
- No Task mutation.
- No Gaber Material rollout.
- No secret rotation/change.
- Automatic rollback was armed but not needed because Pages publication and post-cutover authority checks passed.

## Next gate

Qualify Laser independently with live canonical parity. Promote Laser to D1-first only if the qualification identity is authorized for the Laser screen and the parity/freshness gate passes. Press follows independently. Service remains last because its current row identity contract differs from the departmental contract and must not be globally cut over until reconciled.
