# PERF-CF-02AN — Apps Script Reconciliation Dry-Run Contract CI PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`

## Objective

Create and qualify a Google Apps Script reconciliation contract that can inspect the live `الأوردرات` schema and prepare a deterministic Cloud Write -> Sheets mapping **without writing to Google Sheets**.

## Implemented

- `apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs`
- `tests/apps_script_cloud_write_reconcile_dryrun_v1.test.mjs`
- `.github/workflows/trendos-apps-script-cloud-write-dryrun.yml`

## Contract guards

The helper requires all of the following before it can inspect the Orders sheet:

1. `dryRun=true`.
2. configured Script Property `TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET`.
3. supplied secret matching the configured secret.
4. staging entity only: `CW-STAGE-*`.
5. supported entity type and operation.
6. payload/entity identity match.
7. optional SHA-256 payload fingerprint match when supplied.
8. compatible Orders sheet schema.
9. duplicate Order ID detection before any future write can be considered.

## Mutation-free proof

Static and runtime tests reject the patch if it contains or calls mutation primitives including:

- `setValue`, `setValues`, `appendRow`
- clear/delete/insert row APIs
- formula/number-format writes
- `SpreadsheetApp.flush`
- `ensureHeader_`, `appendByHeaders_`, `updateByHeaders_`
- `UrlFetchApp`
- `DriveApp`

The runtime mock exposes mutation methods that throw immediately if called. Tested paths include valid insert planning, unauthorized access, missing dryRun, non-staging ID, duplicate ID, incompatible schema, and fingerprint mismatch.

Expected response invariants remain:

- `sheetsWritten=false`
- `mutationCount=0`

## CI result

Workflow job: `apps-script-dryrun-readonly-gate`

Result: **PASS**.

Pass message:

`Apps Script Cloud Write Reconcile Dry-Run V1: READ-ONLY + AUTH + STAGING-ONLY + SCHEMA + DUPLICATE GUARDS PASS`

## Safety conclusion

- Google Sheets business rows written: **0**
- Apps Script deployment performed: **NO**
- Script Properties changed: **NO**
- Production Cloud Write enabled: **NO**
- Production cutover authorized: **NO**

02AN qualifies the contract only. It does not authorize a Sheets write path or Apps Script deployment.
