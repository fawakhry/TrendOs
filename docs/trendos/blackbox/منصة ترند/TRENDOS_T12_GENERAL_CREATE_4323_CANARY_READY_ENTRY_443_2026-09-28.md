# TrendOS T12 General CREATE ready for 4323 canary — Entry 443

Date: 2026-09-28 Cairo

Owner requested accelerated completion so the platform can return to work.

## General CREATE backend
Added on working branch:
- `cloudflare-d1/migrations/0007_t12_general_create_control.sql`
- `cloudflare-d1/src/t12-general-create.mjs`
- `cloudflare-d1/src/t12-general-create-handler.mjs`
- route integration in `cloudflare-d1/src/index_v2.js`
- `tests/t12_general_create.test.mjs`

The general CREATE gate has DB modes `OFF | CANARY | GENERAL` and defaults OFF. It reuses the existing Cloud-native order number sequence and request ledger, enforces Cloud request keys, idempotent replay, atomic D1 batch writes, no blind retry, and preserves the old canary budget at zero.

A32 run `36409710404` stopped before Production because the isolated test exposed an idempotent-replay ordering defect. No migration/deploy occurred in A32.
A33 run `36409844052` confirmed the failing assertion was replay after the one-shot canary budget had been consumed.
The core was corrected so a previously committed identical request is reconciled from the ledger before checking the one-shot budget.

A34:
- Run `36410012546`
- Job `108887739387`
- Conclusion: SUCCESS
- `T12 general CREATE isolated PASS`
- `GENERAL_CREATE_ISOLATED=PASS`
- Migration 0007 applied successfully.
- `GENERAL_CREATE_OFF_PRESTATE=PASS`
- Worker deployed; Version ID `23d5aac9-d4ef-4df4-b77d-3d869adcdd06`
- Live health:
  - mode=OFF
  - nextOrderNumber=4323
  - canaryRemaining=0
  - legacyCanaryRemaining=0
  - generalCutover=false
  - Order 4323 absent.

## Frontend CREATE routing
Main candidate routes `createManualOrder` to `/v1/t12/orders/create` and never falls back to Apps Script CREATE.
It:
- converts the legacy `co_...` request ID deterministically to a `cld1_...` Cloud key;
- sends only the qualified safe CREATE fields;
- strips username/token, assignedTo, customerType and forceCreate from the Cloud payload;
- uses the health mode to attach the exact canary confirmation only in CANARY mode;
- persists an ambiguous pending key in sessionStorage so a manual retry with the same business data reconciles under the same idempotency key;
- never automatically retries an ambiguous CREATE.

A35:
- Run `36410411145`
- Job `108889010604`
- Conclusion: SUCCESS
- `T12 general CREATE frontend routing PASS`
- `GENERAL_CREATE_FRONTEND_QUALIFICATION=PASS`

Main:
- `trendos-edge-orders-read-v1.js` commit `861e940a4c40191a2bf170e3ba7de94be01739cd`
- `config.js` commit / main HEAD `9f134cefcc18dc805032fd83f67087cd1bee50c1`
- Frontend version `EDGE_ORDERS_T12_GENERAL_CREATE_20260928`
- GitHub Pages run `36410502340`: SUCCESS.

## 4323 canary armed
A36:
- Run `36410572176`
- Job `108889529250`
- Conclusion: SUCCESS
- `TOKEN_GUARD=PASS`
- `GENERAL_CANARY_PREFLIGHT=PASS`
- `GENERAL_CANARY_ARM=PASS`

Current state:
```
GENERAL_CREATE_MODE=CANARY
GENERAL_CREATE_CANARY_REMAINING=1
NEXT_ORDER_NUMBER=4323
ORDER_4323_CREATED=NO
LEGACY_CANARY_REMAINING=0
GENERAL_CREATE_CUTOVER=NO
T12_OPERATIONAL_RUNTIME=LIVE
HYBRID_READ_OVERLAY_MAIN=LIVE
```

Next required proof is one authenticated Admin CREATE from the normal TrendOS Add Order UI, expected Order ID 4323. After successful 4323 reconciliation, the intended next controlled action is switching the general-create gate from CANARY to GENERAL.
