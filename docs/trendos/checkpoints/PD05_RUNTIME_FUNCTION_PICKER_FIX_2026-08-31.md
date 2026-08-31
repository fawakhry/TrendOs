# PD-05 — Apps Script runtime function-picker correction

Date: 2026-08-31 13:41 Africa/Cairo

## Context

The first Core file `trendos-integrity-v1.gs` was manually added to the live Apps Script project **HEAD source** and saved. No Web App deployment was created/updated and no Integrity Script Property/feature flag was enabled.

The Apps Script editor then displayed `No functions` even though the file visibly contained `trendosIntegritySelfTestV1_()`.

## Root cause

All implementation functions in the Integrity foundation intentionally end with `_` to keep them private. Google Apps Script treats function names ending with `_` as private. Private functions are not suitable as manual public editor entry points and are hidden from external/public invocation surfaces.

This was therefore a **deployment ergonomics/test-entry defect**, not a syntax defect and not missing Integrity business logic.

The supplied 94-line file contains the complete private self-test implementation at the end of the file.

## Correction

Created a dedicated public wrapper file:

`trendos-integrity-runtime-tools-v1.gs`

Public functions:

- `trendosIntegritySelfTestV1()` -> calls private `trendosIntegritySelfTestV1_()`.
- `trendosIntegrityDependencyHealthV1()` -> calls private router health after router installation, otherwise returns a descriptive not-ready object.

Implementation/private functions remain private with trailing underscores.

## GitHub evidence

- Runtime tools creation commit: `511a83522a10816ab338d62ed7e3816ef79e9afc`.
- Package update commit: `775fe4f85ff1ca6155645e2e71a5d5df4257fed7`.
- Runtime wrapper test commit: `1a701f84e77ac0db4b4dbee113eed0385c7cb4ac`.
- CI workflow update commit / new working HEAD: `8fa18915cef6b1ce01d5933e46c7fc347ab3ff29`.
- GitHub Actions run `33383518554` = **SUCCESS**.

The package now contains 11 Core Apps Script files including the runtime-tools wrapper file.

## Candidate freeze

Old frozen candidate remains unchanged for audit:

`release/integrity-v1-predeploy-2026-08-30` @ `e72d873603841bc8e41bd8c228e3240f2feb2a29`.

It is superseded for controlled installation by:

`release/integrity-v1-predeploy-2026-08-31-r2` @ `8fa18915cef6b1ce01d5933e46c7fc347ab3ff29`.

Do not move either frozen branch silently.

## Production / runtime impact

Current impact:

- Apps Script HEAD source: **WRITE** — `trendos-integrity-v1.gs` added manually.
- Web App Version 143: **UNCHANGED / NOT DEPLOYED**.
- Integrity router: **NOT INSTALLED/WIRED**.
- Integrity flags: **NOT ENABLED**.
- Sheet data: no Integrity write operation intentionally executed.

Because installed triggers execute from HEAD, trigger/runtime health must still be rechecked during the flags-OFF smoke gate even though the foundation file has no top-level write side effect.

## Status

- Foundation source save: `INSTALLED TO HEAD / VERIFIED SAVE BY USER`.
- Public manual test entry point: `FIXED IN R2 / CI PASS / NOT YET INSTALLED TO APPS SCRIPT`.
- Foundation runtime self-test: `PENDING`.

## Exact next step

1. Add `trendos-integrity-runtime-tools-v1.gs` from frozen candidate R2 to the Apps Script project.
2. Save only; do not deploy and do not set Script Properties.
3. Confirm `trendosIntegritySelfTestV1` appears in the function selector.
4. Run only `trendosIntegritySelfTestV1`.
5. Expected result: Completed; returned object has `success:true`.
6. If PASS, record runtime foundation PASS and proceed to the next Core source file.
7. If FAIL, stop installation and capture exact error before adding further files.
