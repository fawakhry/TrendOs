# Accounting F2-A — Pre-Wire Finance Core Hardening

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Observation
The F2 Finance Core source is already present on the working branch as `accounting-finance-core-v1.mjs`, so it must be hardened rather than recreated.

Two correctness gaps were found before exposing any Preview route:

1. **Command vocabulary mismatch**
   - Finance Core supports `treasury.transfer` and `journal.reverse`.
   - F1 `validateIdempotencyEnvelope` did not recognize those exact command types.
   - Result: those valid F2 plan types would fail idempotency validation even before persistence.

2. **Treasury identity gap**
   - Finance journal lines identify account 1010/1020 but do not retain a stable Cashbox/Treasury identity.
   - EasyStore historically had a cashbox field, and the new TrendOS design requires stable entity IDs rather than display/account names alone.
   - Multiple cashboxes/banks/wallets cannot safely share only a ledger account code.

## Hardening decision
Before wiring F2 routes:
- extend F1 command vocabulary compatibly for `treasury.transfer` and `journal.reverse` while retaining existing commands;
- add stable `treasuryId` journal dimension (accepting `cashboxId` as compatibility input);
- require Treasury ID on cash/bank journal legs;
- require `fromTreasuryId` and `toTreasuryId` for treasury transfers;
- require Party ID on AR/AP journal legs at generic journal-validation level, not only in plan builders;
- preserve all behavior as posting-plan-only with `persisted=false` / `authoritativeWrites=false`.

## Production impact
NONE. Source/validation hardening only; no financial persistence or production cutover.

**Status: gap confirmed; hardening next.**
