# TrendOS T12 — Canary disabled and Order 4322 integrity verified
Date: 2026-09-27 Cairo

## Entry 437 RESULT — DISABLE-COMPLETE-AND-4322-READONLY-VERIFIED

Owner explicitly authorized `disable` plus read-only inspection of Order `4322`.

### A20 disable execution
- Diagnostic branch: `diagnostic/t12-order-4322-readonly-a20-20260927`.
- Workflow commit: `8c0c77d9e2a7f63d24b1b93755516f30026516e0`.
- Run `36345780694`, job `108694511272`.
- Exact/token/pre-disable guards passed.
- Pre-disable D1 state passed: `nextOrderNumber=4323`, `canaryRemaining=0`, Order `4322` count = 1.
- D1 disable UPDATE succeeded with one row changed.
- Worker deploy succeeded with `TRENDOS_T12_PROD_CREATE_CANARY_ENABLED="false"`; deployed version ID `6c8b5e2b-b1be-47de-b49f-ceb701dad705`.
- The run itself concluded failure only because the immediate Python health read did not obtain a response; therefore no mutation/deploy retry was performed.

### A21 independent read-only verification
- Diagnostic branch: `diagnostic/t12-order-4322-post-disable-readonly-a21-20260927`.
- Workflow commit: `a479c0267c5460b5e58645526c647b198aa2cd19`.
- Run `36345863553`, job `108694741595`: SUCCESS.
- Health HTTP 200.
- `DISABLE_HEALTH=PASS`.
- Health state:
  - `schemaReady=true`
  - `enabled=false`
  - `nextOrderNumber=4323`
  - `canaryRemaining=0`
  - `generalCutover=false`

### Order 4322 read-only integrity
```
ORDER_4322_INTEGRITY=PASS
ORDER_ROWS=1
LINE_ROWS=1
FIRST_LINE_ID=4322-01
LEDGER_ROWS=1
LEDGER_STATUS=COMMITTED
EVENT_ROWS=1
EVENT_TYPES=order-create-canary
OUTBOX_ROWS=1
OUTBOX_PENDING=1
OUTBOX_DONE=0
OUTBOX_FAILED=0
MIRROR_4322_MATCH_COUNT=0
READ_ONLY_INSPECTION=PASS
```

Interpretation of observed state:
- The Cloud-native order exists exactly once and its core relational integrity is intact.
- The canary route is now disabled and its one-shot budget remains exhausted.
- Order `4322` is not present in the current `sheet_rows` mirror (`MIRROR_4322_MATCH_COUNT=0`).
- Its T12 outbox entry still has `status=pending`; no claim is made here about downstream processing beyond that observed database state.

Current snapshot:
```
MIGRATION_0005=APPLIED
INSTALL_DISABLED_QUALIFIED=YES
ORDER_4322_CREATED=YES
ORDER_4322_INTEGRITY=PASS
NEXT_ORDER_NUMBER=4323
CANARY_REMAINING=0
CANARY_ENABLED=false
GENERAL_CREATE_CUTOVER=NO
MIRROR_4322_MATCH_COUNT=0
OUTBOX_PENDING=1
```

No new order was created. No `arm-one`, general CREATE cutover, historical Orders/Order Lines backfill, or Apps Script change occurred.
