# PD-04 — Apps Script Runtime Execution Baseline

> Evidence captured from user-supplied Apps Script **Executions** screenshots on 2026-08-31 around 12:34–12:38 PM local time.
> This is a read-only pre-deploy checkpoint. No source edit, flag change, deployment, or production data mutation occurred.

## What the screenshots prove

1. Production Web App traffic is still executing against **Version 143** for `doGet` and `doPost`.
2. Multiple `doGet` and `doPost` executions completed successfully during the captured window.
3. `d1OrdersLiveSyncTick` is executing from **Head** as a **Time-Driven** function and completed successfully in the captured rows.
4. `onOpen` executed from **Head** as a **Simple Trigger** and completed successfully in the captured row.
5. One `doGet` execution was still `Running` in the screenshot at approximately **81.852 s**. This is recorded as a performance observation only; the screenshot does not prove its final outcome.
6. No execution row in the supplied screenshots shows a failed status.

## Important limitation

These screenshots show the **Executions** view, not the Apps Script source-file list. They do not establish the exact current editor file composition.

## Status

- Runtime baseline: **PASS / READ-ONLY EVIDENCE**.
- Exact current Apps Script file-list reconciliation: **PENDING**.
- Integrity V1 production state: **NOT DEPLOYED**.
- Master/family feature flags: **NOT ACTIVATED**.

## Exact next step

Open Apps Script **Editor** (`<>` code icon), expand the **Files** section in the left sidebar, and capture one screenshot that shows the complete current source-file list. Do not edit code, create files, change properties, or deploy.

After that screenshot:
1. compare existing source files against the frozen Integrity V1 package;
2. detect file/global-name collisions;
3. mark PD-04 file-list reconciliation PASS/FAIL;
4. only on PASS proceed to controlled source installation with all flags OFF.
