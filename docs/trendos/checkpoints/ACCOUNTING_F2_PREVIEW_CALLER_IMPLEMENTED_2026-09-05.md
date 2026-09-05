# TrendOS Accounting F2 — Preview persistence caller implemented

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Completed
Added `accounting/preview-persistence-caller-v1.js` and regression suite `accounting/preview-persistence-caller-v1.test.js`.

The caller is deliberately orchestration-only. It accepts an already-built transaction plan and routes it through `persistence-composition-v1`.

Safety invariants:
- default returns `ZERO_WRITE` and does not call D1;
- production remains hard-denied by the composition gate;
- only exact preview/test + capability + explicit allowWrite + injected D1 handle can reach commit;
- no environment/binding discovery;
- no migration/deployment;
- no production D1/Sheets/cashbox/live-stock mutation.

## Verification status
Regression code is committed but executable CI proof is not yet recorded. Next material step must be recorded before wiring this suite into Accounting native CI / preview runtime verification.