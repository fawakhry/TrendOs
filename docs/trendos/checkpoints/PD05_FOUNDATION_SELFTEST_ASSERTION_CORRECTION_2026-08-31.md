# PD-05 Foundation Self-Test Assertion Correction — 2026-08-31

## Why this correction exists
The Apps Script screenshot showed `trendosIntegritySelfTestV1` execution reached `Execution completed` with no runtime exception.

That evidence proves:
- the foundation file parsed.
- the public runtime wrapper parsed.
- the wrapper executed without a runtime exception.

However, the initial public wrapper simply returned the private self-test object. The private self-test reports failures via `result.success=false`; it does not throw. Therefore `Execution completed` alone did **not** prove every internal assertion passed.

The previous checkpoint that labeled the self-test fully PASS is superseded by this correction.

## Fix
Updated `trendos-integrity-runtime-tools-v1.gs` so `trendosIntegritySelfTestV1()` now:
1. executes `trendosIntegritySelfTestV1_()`.
2. logs the returned result.
3. throws `TrendOS Integrity self-test failed: ...` if `result.success !== true`.
4. returns normally only when every self-test check passes.

A negative unit test was added proving a forced `success:false` result causes the public wrapper to throw.

## CI evidence
- fix commit: `6ab47b39a240243020377ccf6bb72dec3be0c7bc`
- test commit: `ee03adab4c733aec909511b23dd80f42ad3b927e`
- GitHub Actions run `33384689012` = **SUCCESS**

## Frozen candidate
New frozen candidate branch:

`release/integrity-v1-predeploy-2026-08-31-r3`

Pinned SHA:

`ee03adab4c733aec909511b23dd80f42ad3b927e`

R1/R2 remain historical and must not be silently moved.

## Current evidence state
- foundation installed in Apps Script Head: **YES**
- runtime-tools initial version installed in Apps Script Head: **YES**
- parse/runtime execution with initial wrapper: **PASS**
- asserted internal self-test: **PENDING RE-RUN WITH R3 WRAPPER**
- Web App Version 143 changed: **NO**
- Deploy: **NO**
- flags enabled: **NO**

## Exact next step
Replace only the contents of `trendos-integrity-runtime-tools-v1.gs` in Apps Script Head with the R3 version, Save, then manually run `trendosIntegritySelfTestV1` again.

Expected outcome for full PASS: Apps Script Execution log ends `Execution completed`. With R3, any failed internal check will instead throw and mark the execution failed.
