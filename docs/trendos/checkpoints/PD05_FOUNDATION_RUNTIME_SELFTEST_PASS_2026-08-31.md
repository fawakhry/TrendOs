# PD-05 Foundation Runtime Self-Test PASS — 2026-08-31

## Action
User installed and saved the first Integrity V1 foundation file in the live Apps Script **Head source**:

- `trendos-integrity-v1.gs`

The first attempt to manually execute the private helper `trendosIntegritySelfTestV1_()` exposed an Apps Script Editor usability defect: functions ending in `_` are private and are not shown in the Function picker, producing `No functions` despite successful parse.

A separate public runtime-tools file was prepared and CI-tested:

- `trendos-integrity-runtime-tools-v1.gs`
- public wrapper: `trendosIntegritySelfTestV1()`
- public wrapper: `trendosIntegrityDependencyHealthV1()`

GitHub CI run `33383518554` = **SUCCESS**.
R2 frozen candidate branch: `release/integrity-v1-predeploy-2026-08-31-r2` at SHA `8fa18915cef6b1ce01d5933e46c7fc347ab3ff29`.

## Runtime evidence
User added the runtime-tools file to Apps Script Head and manually ran:

`trendosIntegritySelfTestV1`

Apps Script Execution log showed:

- `Execution started`
- `Execution completed`
- no error

## Result

`PD-05A FOUNDATION INSTALL/PARSE/SELF-TEST = PASS`

Evidence state:
- foundation source installed in Apps Script Head: **YES**
- runtime tools installed in Apps Script Head: **YES**
- manual self-test execution: **PASS**
- Web App Version 143 changed: **NO**
- deployment performed: **NO**
- router wired: **NO**
- Integrity master/family flags enabled: **NO**
- production data mutation from this self-test: **NONE**

Important distinction: Apps Script **Head source has now been modified**, but active production Web App Version 143 remains unchanged until an explicit deployment/version update later.

## Exact next step
Install the second R2 Core file only:

`trendos-order-line-integrity-v1.gs`

Then save/parse. Do not deploy. Do not enable flags. Do not edit `Code.gs` yet.
