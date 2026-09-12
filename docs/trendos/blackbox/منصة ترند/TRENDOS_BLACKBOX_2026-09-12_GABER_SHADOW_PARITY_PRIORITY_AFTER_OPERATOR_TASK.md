# TrendOS Blackbox — Gaber Shadow/Parity Priority Immediately After Operator Task V2

Date: 2026-09-12
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **OWNER PRIORITY LOCK — EXECUTE IMMEDIATELY AFTER OPERATOR TASK V2, BEFORE RP-08**

## Owner instruction

The owner explicitly reprioritized the roadmap so that the Gaber Material Control shadow/parity stock-impact work starts as soon as possible immediately after Operator Task V2.

## Authoritative roadmap order

Effective immediately, the owner-priority order is:

`RP-07 -> Operator Task V2 -> Gaber Material Shadow/Parity -> RP-08`

This supersedes the prior shorter roadmap notation `RP-07 -> Operator Task V2 -> RP-08` only by inserting the Gaber Shadow/Parity gate between Operator Task V2 and RP-08.

## Scope of the inserted Gaber gate

The immediate post-Task work is the previously identified shadow/parity stock-impact layer for Gaber Material Control. It must prove no double decrement across:

- EasyStore purchase stock receipt;
- `TASK_ISSUE` custody/audit movement;
- `PRODUCTION_CONSUMED` good Order Out;
- `WASTE_SCRAP`;
- `RETURNED_TO_STOCK`;
- `REUSABLE_OFFCUT_RETURN`.

Critical invariant retained from Checkpoint 05:

`TASK_ISSUE` is custody/audit only and must NOT independently reduce daily physical stock when final physical decrement is already recognized through `PRODUCTION_CONSUMED` + `WASTE_SCRAP`.

## Safety boundary

This priority lock does not authorize live activation now.

- RP-07 remains the current blocking track until explicit PASS/CLOSED.
- Operator Task V2 remains the immediate next production implementation track after RP-07 closes.
- Gaber Material Shadow/Parity begins immediately after Operator Task V2 reaches its approved completion/activation gate.
- RP-08 must not start before the Gaber Shadow/Parity gate is completed or the owner explicitly reprioritizes again.
- Gaber Material Control remains Candidate / not production-activated until its own later explicit activation boundary.

## Reference

Prior Gaber owner-status lock:

`TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_CONTROL_OWNER_STATUS_LOCK_AFTER_CHECKPOINT_05.md`

Checkpoint 05 remains authoritative for the 40/39/1 scenario and CI qualification.