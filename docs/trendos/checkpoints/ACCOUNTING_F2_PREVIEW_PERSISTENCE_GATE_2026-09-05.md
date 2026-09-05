# TrendOS Accounting F2 — Preview/Test Persistence Composition Gate

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Resume point
Continued from `ACCOUNTING_F2_D1_ADAPTER_PREPARED_CI_PASS_2026-09-05.md`.

## Safe implementation
Added `accounting/persistence-composition-v1.js` as the composition boundary in front of the prepared D1 adapter.

The default is `ZERO_WRITE`. D1 commit capability is exposed only when all four conditions are true:
1. stage is exactly `preview` or `test`;
2. capability `ACCOUNTING_D1_WRITE_PREVIEW` is explicitly present;
3. `allowWrite === true` is explicitly supplied;
4. a D1-like handle is injected by the caller.

`production` is not an allowed stage. The module performs no environment discovery, no binding lookup, no migration, and no remote operation by itself.

Added `accounting/persistence-composition-v1.test.js` proving default denial, production hard denial, missing-capability denial, missing-opt-in denial, missing-DB denial, and the exact preview/test gate shape.

Updated `.github/workflows/trendos-accounting-native-ci.yml` to syntax-check the composition module and run its safety suite.

## Safety boundary
No Production Cloud Write was enabled. No production D1 binding or migration was created/changed. No cutover was performed. This slice changes repository code/tests only.

## Verification state
CI is expected to run from the workflow-wiring commit. Do not mark this slice CI-proven until the GitHub Actions result is observed.

## Next safe continuation
After CI success, record the proof in checkpoint + blackbox. Further safe work may integrate the composition into a preview-only caller without creating production bindings or activating migrations.
