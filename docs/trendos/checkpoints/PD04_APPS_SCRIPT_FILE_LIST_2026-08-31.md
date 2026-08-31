# PD-04 Apps Script Editor File List — 2026-08-31

Status: **PASS — VISIBLE FILE-LIST COLLISION CHECK**

User-provided Apps Script Editor sidebar screenshot shows these visible files:

1. `appsscript.json`
2. `Code.gs`
3. `AI_Webhook.gs.gs`
4. `OpenAI_Setup.gs`
5. `D1_Migration.gs`
6. `D1_Full_Migration.gs`
7. `D1_Orders_Live_Sync.gs`
8. `D1_Orders_Primary_Read.g...` — editor label truncated in screenshot.
9. `D1_Dashboard_Primary_Re...` — editor label truncated in screenshot.
10. `D1_Orders_Fast_V2.gs.gs`
11. `Set_D1_URL.gs.gs`

## Reconciliation

- no `trendos-integrity-*` file is visible in the current project.
- no `D1_Orders_Fast_V2_4.gs` is visible.
- no old standalone V1932 Customer Manager / Attendance / Cleaning / Press overlay files are visible.
- `Code.gs` remains the consolidated nucleus and must not be replaced from GitHub.
- the Integrity V1 Core filenames are uniquely namespaced against the visible project list.

## Caveat

Two long D1 filenames are visually truncated by the Apps Script UI. Their full editor names are intentionally not invented in this checkpoint.

## Decision

Proceed to **PD-05 controlled installation** one file at a time with all feature flags absent/OFF.

First file only:

`trendos-integrity-v1.gs`

Do not Deploy and do not edit `Code.gs` during this step.

Production impact of PD-04: **READ-ONLY / NONE**.
